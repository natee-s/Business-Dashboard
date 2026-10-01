import * as XLSX from 'xlsx';
import { parseThaiDate } from './utils';

export interface TransactionRow {
  receipt_no: string;
  sale_date: string;
  sale_datetime: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  price_per_unit: number;
  total_price: number;
  total_cost: number;
  gross_profit: number;
}

// Map possible Thai column header names → standard field names
const COLUMN_MAP: Record<string, string> = {
  // Receipt number variants
  'เลขที่ใบเสร็จรับเงิน': 'receipt_no',
  'เลขที่ใบเสร็จ/วันที่เงิน': 'receipt_no',
  'เลขที่ใบเสร็จ': 'receipt_no',
  'เลขบิล': 'receipt_no',
  'เลขที่บิล': 'receipt_no',

  // Date column (standalone)
  'วันที่ขาย': 'sale_date_only',
  'วันที่': 'sale_date_only',
  'วันที่รับเงิน': 'sale_date_only',

  // Time column (standalone)
  'เวลา': 'sale_time_only',
  'เวลาขาย': 'sale_time_only',

  // Combined datetime (single column)
  'วัน/เวลา': 'datetime',
  'วันที่/เวลา': 'datetime',

  // Product code
  'รหัสสินค้า': 'product_code',
  'รหัส': 'product_code',

  // Product name
  'รายการสินค้า': 'product_name',
  'ชื่อสินค้า': 'product_name',
  'สินค้า': 'product_name',

  // Quantity
  'จำนวน': 'quantity',

  // Unit
  'หน่วย': 'unit',

  // Cost per unit
  'ราคาต้นทุน/หน่วย': 'cost_per_unit',
  'ราคาต้นทุนต่อหน่วย': 'cost_per_unit',
  'ต้นทุน/หน่วย': 'cost_per_unit',
  'ต้นทุนต่อหน่วย': 'cost_per_unit',

  // Price per unit
  'ราคาขาย/หน่วย': 'price_per_unit',
  'ราคาขายต่อหน่วย': 'price_per_unit',
  'ราคา/หน่วย': 'price_per_unit',

  // Total price (revenue)
  'ราคาขายรวม': 'total_price',
  'ราคารวม': 'total_price',
  'ยอดขายรวม': 'total_price',
  'มูลค่าขาย': 'total_price',

  // Total cost
  'ต้นทุนรวม': 'total_cost',
  'มูลค่าต้นทุน': 'total_cost',

  // Gross profit
  'กำไรรวม': 'gross_profit',
  'กำไร': 'gross_profit',
  'กำไรสุทธิ': 'gross_profit',
};

export interface ParseResult {
  rows: TransactionRow[];
  errors: string[];
  totalParsed: number;
}

/** Convert Excel date serial or Thai date string to ISO parts */
function resolveDateTime(
  dateVal: unknown,
  timeVal: unknown
): { date: string; datetime: string } | null {
  // Case 1: numeric Excel serial date
  if (typeof dateVal === 'number') {
    // Excel serial: days since 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const msDate = excelEpoch.getTime() + Math.floor(dateVal) * 86400000;
    const d = new Date(msDate);
    const isoDate = d.toISOString().split('T')[0];

    // Time: either numeric fraction of day, or string "HH:MM"
    let timeStr = '00:00';
    if (typeof timeVal === 'number') {
      const totalSeconds = Math.round(timeVal * 86400);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else if (timeVal) {
      const ts = String(timeVal).trim();
      // Accept "HH:MM" or "H:MM"
      if (/^\d{1,2}:\d{2}/.test(ts)) timeStr = ts.substring(0, 5);
    }

    return { date: isoDate, datetime: `${isoDate}T${timeStr}:00` };
  }

  // Case 2: string date (Thai format "D/M/YYYY" or "DD/MM/YYYY")
  if (dateVal) {
    const dateStr = String(dateVal).trim();
    // Combine with time if available
    const timeStr = timeVal ? String(timeVal).trim() : '';
    const combined = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    return parseThaiDate(combined);
  }

  return null;
}

export function parseExcelBuffer(buffer: Buffer): ParseResult {
  const errors: string[] = [];
  const rows: TransactionRow[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, raw: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: true,
    }) as unknown[][];

    if (rawData.length < 2) {
      errors.push('ไฟล์ไม่มีข้อมูล หรือมีแค่ header');
      return { rows, errors, totalParsed: 0 };
    }

    // Map headers
    const headerRow = rawData[0] as string[];
    const headers: Record<number, string> = {};

    headerRow.forEach((cell, idx) => {
      const cellStr = String(cell || '').trim();
      if (COLUMN_MAP[cellStr]) {
        headers[idx] = COLUMN_MAP[cellStr];
      }
    });

    // Detect if we have split date+time vs combined datetime
    const foundFields = Object.values(headers);
    const hasSplitDate = foundFields.includes('sale_date_only');
    const hasCombinedDatetime = foundFields.includes('datetime');

    // Validate required fields
    const hasDate = hasSplitDate || hasCombinedDatetime;
    const requiredCheck: Record<string, string> = {
      receipt_no: 'เลขที่ใบเสร็จ',
      product_code: 'รหัสสินค้า',
      product_name: 'รายการสินค้า',
    };
    const missingRequired: string[] = [];
    Object.entries(requiredCheck).forEach(([field, label]) => {
      if (!foundFields.includes(field)) missingRequired.push(label);
    });
    if (!hasDate) missingRequired.push('วันที่ขาย/วัน/เวลา');

    if (missingRequired.length > 0) {
      errors.push(`ไม่พบ column ที่จำเป็น: ${missingRequired.join(', ')}`);
      errors.push(`Column ที่พบในไฟล์: ${headerRow.filter(h => h).join(', ')}`);
      // Still try to parse — maybe just naming is off
    }

    // Find index of date / time columns
    const dateColIdx = Object.entries(headers).find(([, v]) => v === 'sale_date_only')?.[0];
    const timeColIdx = Object.entries(headers).find(([, v]) => v === 'sale_time_only')?.[0];
    const datetimeColIdx = Object.entries(headers).find(([, v]) => v === 'datetime')?.[0];

    let parsedCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as unknown[];
      if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

      const mapped: Record<string, unknown> = {};
      Object.entries(headers).forEach(([colIdx, fieldName]) => {
        mapped[fieldName] = row[parseInt(colIdx)];
      });

      try {
        // Resolve date+time
        let parsedDate: { date: string; datetime: string } | null = null;

        if (hasCombinedDatetime && datetimeColIdx !== undefined) {
          const dtVal = row[parseInt(datetimeColIdx)];
          parsedDate = resolveDateTime(dtVal, null);
        } else if (hasSplitDate && dateColIdx !== undefined) {
          const dVal = row[parseInt(dateColIdx)];
          const tVal = timeColIdx !== undefined ? row[parseInt(timeColIdx)] : '';
          parsedDate = resolveDateTime(dVal, tVal);
        }

        if (!parsedDate) {
          if (i <= 10 || skippedCount < 5) {
            errors.push(`แถว ${i + 1}: ไม่สามารถแปลงวันที่ได้ ข้ามแถวนี้`);
          }
          skippedCount++;
          continue;
        }

        const receiptNo = String(mapped['receipt_no'] || '').trim();
        const productCode = String(mapped['product_code'] || '').trim();
        const productName = String(mapped['product_name'] || '').trim();

        if (!receiptNo || !productCode) {
          skippedCount++;
          continue;
        }

        const parseNum = (v: unknown) =>
          parseFloat(String(v || '0').replace(/,/g, '')) || 0;

        rows.push({
          receipt_no: receiptNo,
          sale_date: parsedDate.date,
          sale_datetime: parsedDate.datetime,
          product_code: productCode,
          product_name: productName,
          quantity: parseNum(mapped['quantity']),
          unit: String(mapped['unit'] || '').trim(),
          cost_per_unit: parseNum(mapped['cost_per_unit']),
          price_per_unit: parseNum(mapped['price_per_unit']),
          total_price: parseNum(mapped['total_price']),
          total_cost: parseNum(mapped['total_cost']),
          gross_profit: parseNum(mapped['gross_profit']),
        });
        parsedCount++;
      } catch (rowErr) {
        errors.push(`แถว ${i + 1}: เกิดข้อผิดพลาด - ${rowErr}`);
        skippedCount++;
      }
    }

    if (skippedCount > 10) {
      errors.push(`... และอีก ${skippedCount - 5} แถวที่ข้ามไป (แสดงแค่ 5 แรก)`);
    }

  } catch (err) {
    errors.push(`ไม่สามารถอ่านไฟล์ได้: ${err}`);
  }

  return { rows, errors, totalParsed: rows.length };
}
