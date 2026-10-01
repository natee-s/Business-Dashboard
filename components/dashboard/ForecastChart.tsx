'use client';

import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface ForecastPoint {
  period: string;
  revenue?: number;
  profit?: number;
  revenue_low?: number;
  revenue_high?: number;
  forecast_revenue?: number;
  forecast_profit?: number;
  isForecast?: boolean;
}

interface ForecastChartProps {
  historicalData: ForecastPoint[];
  forecastData: ForecastPoint[];
  forecastDays: number;
  selectedForecastDays: 30 | 60 | 90;
  onForecastDaysChange: (days: 30 | 60 | 90) => void;
  loading?: boolean;
}

export function ForecastChart({ historicalData, forecastData, forecastDays, selectedForecastDays, onForecastDaysChange, loading }: ForecastChartProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
        </CardContent>
      </Card>
    );
  }

  if (historicalData.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 flex flex-col items-center justify-center gap-3">
          <TrendingUp className="w-12 h-12" style={{ color: 'var(--text-faint)' }} />
          <div className="text-center">
            <div className="font-medium mb-1" style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูลสำหรับการคาดการณ์</div>
            <div className="text-sm" style={{ color: 'var(--text-faint)' }}>อัปโหลดข้อมูลการขายอย่างน้อย 7 วันเพื่อเริ่มต้น</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastHistDate = historicalData.length > 0 ? historicalData[historicalData.length - 1].period : '';

  const combinedData = [
    ...historicalData.map(d => ({ ...d, isForecast: false })),
    ...forecastData.map(d => ({
      period: d.period,
      forecast_revenue: d.revenue,
      forecast_profit: d.profit,
      revenue_high: d.revenue_high,
      revenue_low: d.revenue_low,
      isForecast: true,
    })),
  ];

  const formatXAxis = (tick: string) => {
    const parts = tick.split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1];
    return tick;
  };

  const totalForecastRevenue = forecastData.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalForecastProfit = forecastData.reduce((s, d) => s + (d.profit || 0), 0);

  const tooltipStyle = { background: 'var(--tooltip-bg)', border: '1px solid var(--border)', borderRadius: '12px' };
  const labelStyle = { color: 'var(--text-secondary)', fontSize: 11 };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              คาดการณ์ยอดขายและกำไร
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              เส้นประ = คาดการณ์ล่วงหน้า {forecastDays} วัน | พื้นที่สี = ช่วงความเชื่อมั่น
            </p>
          </div>
          <div className="flex items-center gap-3">
            {forecastDays > 0 && (
              <div className="flex gap-4 text-right mr-3">
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>คาดการณ์ยอดขาย</div>
                  <div className="text-lg font-bold text-indigo-500">฿{formatCurrency(totalForecastRevenue)}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>คาดการณ์กำไร</div>
                  <div className="text-lg font-bold text-emerald-500">฿{formatCurrency(totalForecastProfit)}</div>
                </div>
              </div>
            )}
            {/* Forecast horizon selector */}
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {([30, 60, 90] as const).map(d => (
                <button
                  key={d}
                  onClick={() => onForecastDaysChange(d)}
                  className="px-3 py-1.5 text-xs transition-all"
                  style={{
                    background: selectedForecastDays === d ? '#4f46e5' : 'transparent',
                    color: selectedForecastDays === d ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {d} วัน
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={combinedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="period" tickFormatter={formatXAxis} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={v => '฿' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={labelStyle}
              formatter={(value: unknown, name: unknown) => {
                const labels: Record<string, string> = { revenue: 'ยอดขาย (จริง)', profit: 'กำไร (จริง)', forecast_revenue: 'ยอดขาย (คาดการณ์)', forecast_profit: 'กำไร (คาดการณ์)' };
                const numVal = typeof value === 'number' ? value : 0;
                const strName = typeof name === 'string' ? name : String(name);
                return ['฿' + formatCurrency(numVal), labels[strName] || strName];
              }}
              labelFormatter={(label: unknown) => formatXAxis(String(label))}
            />
            <Area dataKey="revenue_high" fill="url(#forecastBand)" stroke="transparent" name="ขอบบน" legendType="none" />
            <Area dataKey="revenue_low" fill="white" fillOpacity={0} stroke="transparent" name="ขอบล่าง" legendType="none" />
            <Line dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="ยอดขาย (จริง)" connectNulls={false} />
            <Line dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} name="กำไร (จริง)" connectNulls={false} />
            <Line dataKey="forecast_revenue" stroke="#6366f1" strokeWidth={2} strokeDasharray="6 3" dot={false} name="ยอดขาย (คาดการณ์)" connectNulls={false} />
            <Line dataKey="forecast_profit" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" dot={false} name="กำไร (คาดการณ์)" connectNulls={false} />
            {lastHistDate && (
              <ReferenceLine x={lastHistDate} stroke="var(--text-faint)" strokeDasharray="4 4"
                label={{ value: 'ข้อมูลล่าสุด', fill: 'var(--text-muted)', fontSize: 10, position: 'top' }}
              />
            )}
            <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
