'use client';

import { useState } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getMonthLabel, toThaiDateDisplay } from '@/lib/utils';

interface TrendDataPoint {
  period: string;
  revenue: number;
  profit: number;
  cost: number;
  orders: number;
  margin_pct: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  groupBy: 'day' | 'month';
  onGroupByChange: (v: 'day' | 'month') => void;
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label, groupBy }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  groupBy: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const displayLabel = groupBy === 'month' && label
    ? getMonthLabel(label + '-01')
    : label ? toThaiDateDisplay(label) : label;

  return (
    <div className="rounded-2xl border shadow-2xl p-4" style={{ background: 'var(--tooltip-bg)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{displayLabel}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {entry.name === 'Margin %' ? `${entry.value.toFixed(1)}%` : `฿${formatCurrency(entry.value)}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export function TrendChart({ data, groupBy, onGroupByChange, loading }: TrendChartProps) {
  const [showMargin, setShowMargin] = useState(false);

  const formatXAxis = (tick: string) => {
    if (groupBy === 'month') {
      const parts = tick.split('-');
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return `${thaiMonths[parseInt(parts[1]) - 1]}`;
    }
    const parts = tick.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="h-[280px] rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>แนวโน้มยอดขายและกำไร</CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMargin(!showMargin)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: showMargin ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: showMargin ? '#f59e0b' : 'var(--text-muted)',
            }}
          >
            Margin %
          </button>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            {(['day', 'month'] as const).map(g => (
              <button
                key={g}
                onClick={() => onGroupByChange(g)}
                className="px-3 py-1.5 text-xs transition-all"
                style={{
                  background: groupBy === g ? '#4f46e5' : 'transparent',
                  color: groupBy === g ? '#fff' : 'var(--text-muted)',
                }}
              >
                {g === 'day' ? 'รายวัน' : 'รายเดือน'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="period"
              tickFormatter={formatXAxis}
              tick={{ fill: 'var(--chart-text)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tickFormatter={v => `฿${formatCurrency(v)}`}
              tick={{ fill: 'var(--chart-text)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            {showMargin && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={v => `${v.toFixed(0)}%`}
                tick={{ fill: 'var(--chart-text)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
            )}
            <Tooltip content={<CustomTooltip groupBy={groupBy} />} />
            <Legend
              wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
              formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
            />
            <Area yAxisId="left" type="monotone" dataKey="revenue" name="ยอดขาย" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
            <Area yAxisId="left" type="monotone" dataKey="profit" name="กำไร" stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)" dot={false} />
            {showMargin && (
              <Line yAxisId="right" type="monotone" dataKey="margin_pct" name="Margin %" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
