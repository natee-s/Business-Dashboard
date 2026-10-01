import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface DailyData {
  period: string;
  revenue: number;
  profit: number;
  orders: number;
  margin_pct: number;
}

function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  const xs = Array.from({ length: n }, (_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * data[i], 0);
  const sumXX = xs.reduce((sum, x) => sum + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function weightedMovingAverage(data: number[], window: number): number {
  const recent = data.slice(-window);
  const n = recent.length;
  if (n === 0) return 0;
  // More recent days get higher weight
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < n; i++) {
    const weight = i + 1; // weight 1..n, newest = n
    weightedSum += recent[i] * weight;
    totalWeight += weight;
  }
  return weightedSum / totalWeight;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    // User-chosen forecast horizon (30, 60, 90 days)
    const requestedForecastDays = parseInt(searchParams.get('forecastDays') || '30', 10);

    const db = getDb();

    // Build WHERE clause — if date params given, filter historical training data
    const whereParts: string[] = [];
    const params: Record<string, string> = {};
    if (dateFrom) { whereParts.push('sale_date >= @dateFrom'); params.dateFrom = dateFrom; }
    if (dateTo) { whereParts.push('sale_date <= @dateTo'); params.dateTo = dateTo; }
    const where = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

    const dailyData = db.prepare(`
      SELECT
        sale_date as period,
        SUM(total_price) as revenue,
        SUM(gross_profit) as profit,
        COUNT(DISTINCT receipt_no) as orders,
        CASE WHEN SUM(total_price) > 0 THEN (SUM(gross_profit) / SUM(total_price)) * 100 ELSE 0 END as margin_pct
      FROM transactions
      ${where}
      GROUP BY sale_date
      ORDER BY sale_date ASC
    `).all(params) as DailyData[];

    if (dailyData.length < 7) {
      return NextResponse.json({
        message: 'ข้อมูลน้อยเกินไปสำหรับการคาดการณ์ (ต้องการอย่างน้อย 7 วัน)',
        historicalData: dailyData,
        forecastData: [],
        forecastDays: 0,
      });
    }

    const dataPoints = dailyData.length;

    // Validate requested forecast days (clamp to reasonable value)
    const forecastDays = [30, 60, 90].includes(requestedForecastDays)
      ? requestedForecastDays
      : 30;

    const revenues = dailyData.map(d => d.revenue);
    const profits = dailyData.map(d => d.profit);

    // Use recent data for regression — max 90 days to avoid old trends skewing prediction
    const regressionWindow = Math.min(90, dataPoints);
    const revenueSample = revenues.slice(-regressionWindow);
    const profitSample = profits.slice(-regressionWindow);

    const revRegression = linearRegression(revenueSample);
    const profRegression = linearRegression(profitSample);

    // Weighted moving average (recent days get more weight) — last 14 days
    const maWindow = Math.min(14, dataPoints);
    const revenueWMA = weightedMovingAverage(revenues, maWindow);
    const profitWMA = weightedMovingAverage(profits, maWindow);

    const lastDate = dailyData[dailyData.length - 1].period;
    const forecastData = [];

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = addDays(lastDate, i);
      const trendIdx = regressionWindow + i;

      // Blend: regression (70%) + WMA (30%)
      // WMA smooths short-term but regression captures trend direction
      const revTrend = revRegression.intercept + revRegression.slope * trendIdx;
      const profTrend = profRegression.intercept + profRegression.slope * trendIdx;

      const revForecast = Math.max(0, revTrend * 0.7 + revenueWMA * 0.3);
      const profForecast = Math.max(0, profTrend * 0.7 + profitWMA * 0.3);

      // Confidence band widens with forecast distance: ±10% at day1 → ±20% at day90
      const bandFactor = 0.10 + (i / forecastDays) * 0.10;

      forecastData.push({
        period: forecastDate,
        revenue: Math.round(revForecast),
        profit: Math.round(profForecast),
        revenue_low: Math.round(revForecast * (1 - bandFactor)),
        revenue_high: Math.round(revForecast * (1 + bandFactor)),
        profit_low: Math.round(profForecast * (1 - bandFactor)),
        profit_high: Math.round(profForecast * (1 + bandFactor)),
        isForecast: true,
      });
    }

    // Monthly aggregated forecast
    const monthlyForecast: Record<string, { month: string; revenue: number; profit: number; days: number }> = {};
    for (const f of forecastData) {
      const month = f.period.substring(0, 7);
      if (!monthlyForecast[month]) monthlyForecast[month] = { month, revenue: 0, profit: 0, days: 0 };
      monthlyForecast[month].revenue += f.revenue;
      monthlyForecast[month].profit += f.profit;
      monthlyForecast[month].days++;
    }

    // Show last 90 days of history regardless of filter (so chart has context)
    const historyDisplay = dailyData.slice(-90);

    return NextResponse.json({
      historicalData: historyDisplay,
      forecastData,
      forecastDays,
      monthlyForecast: Object.values(monthlyForecast),
      meta: { dataPoints, regressionWindow, maWindow, dateFrom, dateTo },
    });
  } catch (err) {
    console.error('Forecast error:', err);
    return NextResponse.json({ error: `${err}` }, { status: 500 });
  }
}
