import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const productSearch = searchParams.get('product');

    const db = getDb();

    let whereClauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (dateFrom) {
      whereClauses.push('sale_date >= @dateFrom');
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      whereClauses.push('sale_date <= @dateTo');
      params.dateTo = dateTo;
    }
    if (productSearch) {
      whereClauses.push('(product_name LIKE @product OR product_code LIKE @product)');
      params.product = `%${productSearch}%`;
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM transactions ${whereStr}`).get(params) as { count: number }).count;
    const rows = db.prepare(`
      SELECT * FROM transactions ${whereStr}
      ORDER BY sale_datetime DESC
      LIMIT @limit OFFSET @offset
    `).all({ ...params, limit, offset });

    return NextResponse.json({ rows, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const all = searchParams.get('all');

    const db = getDb();

    if (all === 'true') {
      db.prepare('DELETE FROM transactions').run();
      db.prepare('DELETE FROM upload_log').run();
      return NextResponse.json({ success: true, message: 'ลบข้อมูลทั้งหมดแล้ว' });
    }

    if (id) {
      const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(parseInt(id, 10));
      return NextResponse.json({ success: true, deleted: result.changes });
    }

    if (dateFrom && dateTo) {
      const result = db.prepare('DELETE FROM transactions WHERE sale_date >= ? AND sale_date <= ?').run(dateFrom, dateTo);
      return NextResponse.json({ success: true, deleted: result.changes });
    }

    return NextResponse.json({ error: 'ระบุเงื่อนไขในการลบ' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
