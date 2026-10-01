import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const db = getDb();

    const params: Record<string, string> = {};
    const whereParts: string[] = [];
    if (dateFrom) { whereParts.push('sale_date >= @dateFrom'); params.dateFrom = dateFrom; }
    if (dateTo) { whereParts.push('sale_date <= @dateTo'); params.dateTo = dateTo; }
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Sales by hour of day
    const byHour = db.prepare(`
      SELECT
        CAST(strftime('%H', sale_datetime) AS INTEGER) as hour,
        SUM(total_price) as revenue,
        SUM(gross_profit) as profit,
        COUNT(DISTINCT receipt_no) as orders
      FROM transactions ${where}
      GROUP BY hour
      ORDER BY hour ASC
    `).all(params);

    // Sales by day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    const byDayOfWeek = db.prepare(`
      SELECT
        CAST(strftime('%w', sale_date) AS INTEGER) as day_of_week,
        SUM(total_price) as revenue,
        SUM(gross_profit) as profit,
        COUNT(DISTINCT receipt_no) as orders
      FROM transactions ${where}
      GROUP BY day_of_week
      ORDER BY day_of_week ASC
    `).all(params);

    // Fill in missing hours
    const hourMap = new Map((byHour as Array<{hour: number; revenue: number; profit: number; orders: number}>).map(r => [r.hour, r]));
    const fullByHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      revenue: hourMap.get(h)?.revenue || 0,
      profit: hourMap.get(h)?.profit || 0,
      orders: hourMap.get(h)?.orders || 0,
    }));

    const thaiDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
    const dowMap = new Map((byDayOfWeek as Array<{day_of_week: number; revenue: number; profit: number; orders: number}>).map(r => [r.day_of_week, r]));
    const fullByDow = Array.from({ length: 7 }, (_, d) => ({
      day: d,
      label: thaiDayNames[d],
      revenue: dowMap.get(d)?.revenue || 0,
      profit: dowMap.get(d)?.profit || 0,
      orders: dowMap.get(d)?.orders || 0,
    }));

    // Time period buckets: เช้า (6-11), บ่าย (12-17), เย็น (18-23), กลางคืน (0-5)
    const periods = [
      { key: 'morning', label: 'เช้า (6-11)', min: 6, max: 11 },
      { key: 'afternoon', label: 'บ่าย (12-17)', min: 12, max: 17 },
      { key: 'evening', label: 'เย็น (18-23)', min: 18, max: 23 },
      { key: 'night', label: 'กลางคืน (0-5)', min: 0, max: 5 },
    ];

    const byPeriod = periods.map(p => {
      const periodData = fullByHour.filter(h => h.hour >= p.min && h.hour <= p.max);
      return {
        ...p,
        revenue: periodData.reduce((s, h) => s + h.revenue, 0),
        profit: periodData.reduce((s, h) => s + h.profit, 0),
        orders: periodData.reduce((s, h) => s + h.orders, 0),
      };
    });

    return NextResponse.json({
      byHour: fullByHour,
      byDayOfWeek: fullByDow,
      byPeriod,
    });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
