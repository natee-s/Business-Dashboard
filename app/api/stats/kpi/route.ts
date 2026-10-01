import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const db = getDb();

    const buildWhere = (from: string, to: string) => {
      const parts: string[] = [];
      const params: Record<string, string> = {};
      if (from) { parts.push('sale_date >= @from'); params.from = from; }
      if (to) { parts.push('sale_date <= @to'); params.to = to; }
      return { where: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params };
    };

    // Current period
    const { where: curWhere, params: curParams } = buildWhere(dateFrom, dateTo);
    const current = db.prepare(`
      SELECT
        SUM(total_price) as total_revenue,
        SUM(gross_profit) as total_profit,
        SUM(total_cost) as total_cost,
        COUNT(DISTINCT receipt_no) as total_orders,
        COUNT(*) as total_items,
        AVG(total_price) as avg_order_value
      FROM transactions ${curWhere}
    `).get(curParams) as Record<string, number>;

    const grossMargin = current.total_revenue > 0
      ? (current.total_profit / current.total_revenue) * 100
      : 0;

    // Calculate previous period for MOM comparison
    let prevRevenue = 0, prevProfit = 0, prevOrders = 0;
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      const diffMs = toDate.getTime() - fromDate.getTime();
      const prevToDate = new Date(fromDate.getTime() - 1);
      const prevFromDate = new Date(prevToDate.getTime() - diffMs);
      const prevFrom = prevFromDate.toISOString().split('T')[0];
      const prevTo = prevToDate.toISOString().split('T')[0];

      const { where: prevWhere, params: prevParams } = buildWhere(prevFrom, prevTo);
      const prev = db.prepare(`
        SELECT
          SUM(total_price) as total_revenue,
          SUM(gross_profit) as total_profit,
          COUNT(DISTINCT receipt_no) as total_orders
        FROM transactions ${prevWhere}
      `).get(prevParams) as Record<string, number>;

      prevRevenue = prev.total_revenue || 0;
      prevProfit = prev.total_profit || 0;
      prevOrders = prev.total_orders || 0;
    }

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return null;
      return ((current - previous) / previous) * 100;
    };

    // Date range in DB
    const dateRange = db.prepare(`
      SELECT MIN(sale_date) as min_date, MAX(sale_date) as max_date
      FROM transactions
    `).get() as { min_date: string; max_date: string };

    return NextResponse.json({
      current: {
        total_revenue: current.total_revenue || 0,
        total_profit: current.total_profit || 0,
        total_cost: current.total_cost || 0,
        total_orders: current.total_orders || 0,
        total_items: current.total_items || 0,
        avg_order_value: current.avg_order_value || 0,
        gross_margin_pct: grossMargin,
      },
      changes: {
        revenue_change: calcChange(current.total_revenue || 0, prevRevenue),
        profit_change: calcChange(current.total_profit || 0, prevProfit),
        orders_change: calcChange(current.total_orders || 0, prevOrders),
      },
      dateRange,
    });
  } catch (err) {
    console.error('KPI error:', err);
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
