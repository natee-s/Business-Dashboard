'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyData {
  month: string;
  revenue: number;
  profit: number;
  orders: number;
  margin_pct: number;
  revenue_mom: number | null;
  profit_mom: number | null;
}

interface MonthlyComparisonProps {
  data: MonthlyData[];
  loading?: boolean;
}

const thaiMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function formatMonthLabel(month: string): string {
  const parts = month.split('-');
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[0], 10) + 543;
  return `${thaiMonths[m]} ${String(y).slice(2)}`;
}

export function MonthlyComparison({ data, loading }: MonthlyComparisonProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
        </CardContent>
      </Card>
    );
  }

  const displayData = data.slice(-12).map(d => ({ ...d, label: formatMonthLabel(d.month) }));
  const bestMonth = displayData.reduce((max, m) => m.revenue > (max?.revenue ?? 0) ? m : max, displayData[0]);
  const latestMOM = displayData.length > 0 ? displayData[displayData.length - 1].revenue_mom : null;

  const tooltipStyle = { background: 'var(--tooltip-bg)', border: '1px solid var(--border)', borderRadius: '12px' };
  const labelStyle = { color: 'var(--text-secondary)', fontSize: 11 };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>เปรียบเทียบรายเดือน</CardTitle>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>ยอดขายและกำไร 12 เดือนล่าสุด</p>
        </div>
        <div className="flex items-center gap-3">
          {latestMOM !== null && (
            <div className={`flex items-center gap-1 text-sm font-medium ${latestMOM >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {latestMOM >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              MOM {latestMOM >= 0 ? '+' : ''}{latestMOM.toFixed(1)}%
            </div>
          )}
          {bestMonth && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ดีที่สุด: <span className="text-amber-500 font-medium">{bestMonth.label}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={labelStyle}
              formatter={(value: unknown, name: unknown) => {
                const labels: Record<string, string> = { revenue: 'ยอดขาย', profit: 'กำไร' };
                const numVal = typeof value === 'number' ? value : 0;
                const strName = typeof name === 'string' ? name : String(name);
                return [`฿${formatCurrency(numVal)}`, labels[strName] || strName];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
            <Bar dataKey="revenue" name="ยอดขาย" radius={[4, 4, 0, 0]}>
              {displayData.map((entry, index) => (
                <Cell key={index} fill={entry.label === bestMonth?.label ? '#f59e0b' : '#6366f1'} opacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="profit" name="กำไร" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>

        {/* MOM Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                <th className="text-left py-2">เดือน</th>
                <th className="text-right py-2">ยอดขาย</th>
                <th className="text-right py-2">กำไร</th>
                <th className="text-right py-2">Margin</th>
                <th className="text-right py-2">MOM ยอดขาย</th>
                <th className="text-right py-2">MOM กำไร</th>
              </tr>
            </thead>
            <tbody>
              {displayData.slice(-6).reverse().map((row, i) => (
                <tr key={i} className="border-b transition-colors" style={{ borderColor: 'var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <td className="py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{row.label}</td>
                  <td className="text-right py-2" style={{ color: 'var(--text-secondary)' }}>฿{formatCurrency(row.revenue)}</td>
                  <td className="text-right py-2" style={{ color: 'var(--text-secondary)' }}>฿{formatCurrency(row.profit)}</td>
                  <td className="text-right py-2" style={{ color: 'var(--text-muted)' }}>{row.margin_pct.toFixed(1)}%</td>
                  <td className="text-right py-2">
                    {row.revenue_mom !== null
                      ? <span className={row.revenue_mom >= 0 ? 'text-emerald-500' : 'text-red-500'}>{row.revenue_mom >= 0 ? '+' : ''}{row.revenue_mom.toFixed(1)}%</span>
                      : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                  </td>
                  <td className="text-right py-2">
                    {row.profit_mom !== null
                      ? <span className={row.profit_mom >= 0 ? 'text-emerald-500' : 'text-red-500'}>{row.profit_mom >= 0 ? '+' : ''}{row.profit_mom.toFixed(1)}%</span>
                      : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
