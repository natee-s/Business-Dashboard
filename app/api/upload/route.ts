import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseExcelBuffer } from '@/lib/excel-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 });
    }

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ .xls และ .xlsx เท่านั้น' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { rows, errors, totalParsed } = parseExcelBuffer(buffer);

    if (rows.length === 0) {
      return NextResponse.json({
        error: 'ไม่พบข้อมูลที่สามารถนำเข้าได้',
        parseErrors: errors,
      }, { status: 400 });
    }

    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO transactions 
        (receipt_no, sale_date, sale_datetime, product_code, product_name, 
         quantity, unit, cost_per_unit, price_per_unit, total_price, total_cost, gross_profit)
      VALUES 
        (@receipt_no, @sale_date, @sale_datetime, @product_code, @product_name,
         @quantity, @unit, @cost_per_unit, @price_per_unit, @total_price, @total_cost, @gross_profit)
    `);

    let inserted = 0;
    let skipped = 0;

    const insertMany = db.transaction((txRows: typeof rows) => {
      for (const row of txRows) {
        const result = insertStmt.run(row);
        if (result.changes > 0) {
          inserted++;
        } else {
          skipped++;
        }
      }
    });

    insertMany(rows);

    // Log the upload
    db.prepare(`
      INSERT INTO upload_log (filename, rows_inserted, rows_skipped, rows_total, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(file.name, inserted, skipped, totalParsed, 'success');

    return NextResponse.json({
      success: true,
      filename: file.name,
      totalParsed,
      inserted,
      skipped,
      parseErrors: errors.slice(0, 10), // Return first 10 errors only
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: `เกิดข้อผิดพลาด: ${err}` }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const logs = db.prepare(`
      SELECT * FROM upload_log ORDER BY uploaded_at DESC LIMIT 50
    `).all();
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
