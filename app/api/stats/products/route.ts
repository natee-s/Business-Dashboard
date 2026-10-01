import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const db = getDb();

    const params: Record<string, unknown> = {};
    const whereParts: string[] = [];
    if (dateFrom) { whereParts.push('sale_date >= @dateFrom'); params.dateFrom = dateFrom; }
    if (dateTo) { whereParts.push('sale_date <= @dateTo'); params.dateTo = dateTo; }
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Top products by revenue
    const topByRevenue = db.prepare(`
      SELECT
        product_code,
        product_name,
        SUM(total_price) as total_revenue,
        SUM(gross_profit) as total_profit,
        SUM(quantity) as total_qty,
        SUM(total_cost) as total_cost,
        CASE WHEN SUM(total_price) > 0 THEN (SUM(gross_profit) / SUM(total_price)) * 100 ELSE 0 END as margin_pct,
        COUNT(DISTINCT receipt_no) as times_sold
      FROM transactions ${where}
      GROUP BY product_code, product_name
      ORDER BY total_revenue DESC
      LIMIT @limit
    `).all({ ...params, limit });

    // Top products by profit margin (min 10 transactions)
    const topByMargin = db.prepare(`
      SELECT
        product_code,
        product_name,
        SUM(total_price) as total_revenue,
        SUM(gross_profit) as total_profit,
        SUM(quantity) as total_qty,
        CASE WHEN SUM(total_price) > 0 THEN (SUM(gross_profit) / SUM(total_price)) * 100 ELSE 0 END as margin_pct,
        COUNT(DISTINCT receipt_no) as times_sold
      FROM transactions ${where}
      GROUP BY product_code, product_name
      HAVING times_sold >= 5
      ORDER BY margin_pct DESC
      LIMIT @limit
    `).all({ ...params, limit });

    // Slow movers (sold least by qty in the period)
    const slowMovers = db.prepare(`
      SELECT
        product_code,
        product_name,
        SUM(total_price) as total_revenue,
        SUM(gross_profit) as total_profit,
        SUM(quantity) as total_qty,
        COUNT(DISTINCT receipt_no) as times_sold,
        MAX(sale_date) as last_sold_date
      FROM transactions ${where}
      GROUP BY product_code, product_name
      ORDER BY total_qty ASC, times_sold ASC
      LIMIT @limit
    `).all({ ...params, limit });

    // All products summary for table
    const allProducts = db.prepare(`
      SELECT
        product_code,
        product_name,
        SUM(total_price) as total_revenue,
        SUM(gross_profit) as total_profit,
        SUM(quantity) as total_qty,
        SUM(total_cost) as total_cost,
        CASE WHEN SUM(total_price) > 0 THEN (SUM(gross_profit) / SUM(total_price)) * 100 ELSE 0 END as margin_pct,
        COUNT(DISTINCT receipt_no) as times_sold,
        MAX(sale_date) as last_sold_date
      FROM transactions ${where}
      GROUP BY product_code, product_name
      ORDER BY total_revenue DESC
    `).all(params);

    return NextResponse.json({
      topByRevenue,
      topByMargin,
      slowMovers,
      allProducts,
    });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
