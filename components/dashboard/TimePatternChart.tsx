'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface HourData { hour: number; label: string; revenue: number; profit: number; orders: number; }
interface DowData { day: number; label: string; revenue: number; profit: number; orders: number; }
interface PeriodData { key: string; label: string; revenue: number; profit: number; orders: number; }

interface TimePatternChartProps {
  byHour: HourData[];
  byDayOfWeek: DowData[];
  byPeriod: PeriodData[];
  loading?: boolean;
}

const PERIOD_COLORS: Record<string, string> = {
  morning: '#f59e0b',
  afternoon: '#6366f1',
  evening: '#10b981',
  night: '#8b5cf6',
};

export function TimePatternChart({ byHour, byDayOfWeek, byPeriod, loading }: TimePatternChartProps) {
  const [activeTab, setActiveTab] = useState<'hour' | 'dow' | 'period'>('hour');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
        </CardContent>
      </Card>
    );
  }

  const peakHour = byHour.reduce((max, h) => h.revenue > (max?.revenue ?? 0) ? h : max, byHour[0]);
  const peakDay = byDayOfWeek.reduce((max, d) => d.revenue > (max?.revenue ?? 0) ? d : max, byDayOfWeek[0]);
  const maxHourRevenue = Math.max(...byHour.map(h => h.revenue), 0);
  const maxDowRevenue = Math.max(...byDayOfWeek.map(d => d.revenue), 0);

  const tooltipStyle = { background: 'var(--tooltip-bg)', border: '1px solid var(--border)', borderRadius: '12px' };
  const labelStyle = { color: 'var(--text-secondary)', fontSize: 11 };

  const tabs = [
    { key: 'hour', label: 'รายชั่วโมง' },
    { key: 'dow', label: 'รายวัน' },
    { key: 'period', label: 'ช่วงเวลา' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>รูปแบบการขายตามเวลา</CardTitle>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="px-3 py-1.5 text-xs transition-all"
              style={{ background: activeTab === tab.key ? '#4f46e5' : 'transparent', color: activeTab === tab.key ? '#fff' : 'var(--text-muted)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {/* Peak insights */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="text-xs mb-0.5" style={{ color: '#d97706' }}>ชั่วโมงขายดีที่สุด</div>
            <div className="text-lg font-bold" style={{ color: '#d97706' }}>{peakHour?.label || '—'}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>฿{formatCurrency(peakHour?.revenue || 0)}</div>
          </div>
          <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div className="text-xs mb-0.5" style={{ color: '#6366f1' }}>วันขายดีที่สุด</div>
            <div className="text-lg font-bold" style={{ color: '#6366f1' }}>{peakDay?.label || '—'}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>฿{formatCurrency(peakDay?.revenue || 0)}</div>
          </div>
        </div>

        {activeTab === 'hour' && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byHour} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--chart-text)', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: unknown) => [`฿${formatCurrency(typeof value === 'number' ? value : 0)}`, 'ยอดขาย']} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={{ color: '#a78bfa' }} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {byHour.map((entry, index) => (
                  <Cell key={index} fill={entry.revenue === maxHourRevenue && maxHourRevenue > 0 ? '#f59e0b' : '#6366f1'} opacity={entry.revenue === maxHourRevenue ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'dow' && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDayOfWeek} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: unknown) => [`฿${formatCurrency(typeof value === 'number' ? value : 0)}`, 'ยอดขาย']} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={{ color: '#6366f1' }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {byDayOfWeek.map((entry, index) => (
                  <Cell key={index} fill={entry.revenue === maxDowRevenue && maxDowRevenue > 0 ? '#10b981' : '#6366f1'} opacity={entry.revenue === maxDowRevenue ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'period' && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {byPeriod.map(period => {
              const total = byPeriod.reduce((s, p) => s + p.revenue, 0);
              const pct = total > 0 ? (period.revenue / total) * 100 : 0;
              const color = PERIOD_COLORS[period.key] || '#6366f1';
              return (
                <div key={period.key} className="rounded-xl p-4" style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                  <div className="text-xs mb-1 font-medium" style={{ color }}>{period.label}</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>฿{formatCurrency(period.revenue)}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(1)}% ของยอดขาย</div>
                  <div className="mt-2 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
