import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    // Monthly summary for the last 12 months
    const monthly = db.prepare(`
      SELECT
        strftime('%Y-%m', sale_date) as month,
        SUM(total_price) as revenue,
        SUM(gross_profit) as profit,
        SUM(total_cost) as cost,
        COUNT(DISTINCT receipt_no) as orders,
        COUNT(*) as items_sold,
        CASE WHEN SUM(total_price) > 0 THEN (SUM(gross_profit) / SUM(total_price)) * 100 ELSE 0 END as margin_pct
      FROM transactions
      GROUP BY month
      ORDER BY month ASC
    `).all() as Array<{
      month: string;
      revenue: number;
      profit: number;
      cost: number;
      orders: number;
      items_sold: number;
      margin_pct: number;
    }>;

    // Add MOM (Month over Month) change
    const withMOM = monthly.map((row, idx) => {
      const prev = monthly[idx - 1];
      const revenueChange = prev && prev.revenue > 0
        ? ((row.revenue - prev.revenue) / prev.revenue) * 100
        : null;
      const profitChange = prev && prev.profit > 0
        ? ((row.profit - prev.profit) / prev.profit) * 100
        : null;

      return {
        ...row,
        prev_revenue: prev?.revenue || null,
        prev_profit: prev?.profit || null,
        revenue_mom: revenueChange,
        profit_mom: profitChange,
      };
    });

    // Quarterly summary
    const quarterly = db.prepare(`
      SELECT
        strftime('%Y', sale_date) || '-Q' ||
          CASE
            WHEN CAST(strftime('%m', sale_date) AS INTEGER) <= 3 THEN '1'
            WHEN CAST(strftime('%m', sale_date) AS INTEGER) <= 6 THEN '2'
            WHEN CAST(strftime('%m', sale_date) AS INTEGER) <= 9 THEN '3'
            ELSE '4'
          END as quarter,
        SUM(total_price) as revenue,
        SUM(gross_profit) as profit,
        COUNT(DISTINCT receipt_no) as orders
      FROM transactions
      GROUP BY quarter
      ORDER BY quarter ASC
    `).all();

    return NextResponse.json({ monthly: withMOM, quarterly });
  } catch (err) {
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
