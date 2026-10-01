import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const groupBy = searchParams.get('groupBy') || 'day'; // 'day' | 'month'

    const db = getDb();

    const params: Record<string, string> = {};
    const whereParts: string[] = [];
    if (dateFrom) { whereParts.push('sale_date >= @dateFrom'); params.dateFrom = dateFrom; }
    if (dateTo) { whereParts.push('sale_date <= @dateTo'); params.dateTo = dateTo; }
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    let groupExpr: string;
    if (groupBy === 'month') {
      groupExpr = "strftime('%Y-%m', sale_date)";
    } else {
      groupExpr = 'sale_date';
    }

    const rows = db.prepare(`
      SELECT
        ${groupExpr} as period,
        SUM(total_price) as revenue,
        SUM(gross_profit) as profit,
        SUM(total_cost) as cost,
        COUNT(DISTINCT receipt_no) as orders,
        CASE WHEN SUM(total_price) > 0 THEN (SUM(gross_profit) / SUM(total_price)) * 100 ELSE 0 END as margin_pct
      FROM transactions
      ${where}
      GROUP BY ${groupExpr}
      ORDER BY period ASC
    `).all(params);

    return NextResponse.json({ data: rows, groupBy });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
