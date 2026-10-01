'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface ProductData {
  product_code: string;
  product_name: string;
  total_revenue: number;
  total_profit: number;
  total_qty: number;
  margin_pct: number;
  times_sold: number;
  last_sold_date?: string;
}

interface ProductChartsProps {
  topByRevenue: ProductData[];
  topByMargin: ProductData[];
  slowMovers: (ProductData & { last_sold_date: string })[];
  loading?: boolean;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#5b21b6', '#4c1d95', '#3730a3', '#312e81'];
const MARGIN_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857', '#065f46', '#064e3b', '#022c22', '#34d399', '#10b981'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ProductData }> }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-2xl border shadow-2xl p-3 text-sm" style={{ background: 'var(--tooltip-bg)', borderColor: 'var(--border)' }}>
      <div className="font-medium max-w-[200px] truncate mb-1" style={{ color: 'var(--text-primary)' }}>{d.product_name}</div>
      <div style={{ color: 'var(--text-muted)' }}>รหัส: {d.product_code}</div>
      <div className="text-indigo-500">ยอดขาย: ฿{formatCurrency(d.total_revenue)}</div>
      <div className="text-emerald-500">กำไร: ฿{formatCurrency(d.total_profit)}</div>
      <div className="text-amber-500">Margin: {formatPercent(d.margin_pct)}</div>
      <div style={{ color: 'var(--text-muted)' }}>ขายไป: {d.total_qty} หน่วย</div>
    </div>
  );
};

function truncateName(name: string, maxLen = 22): string {
  return name.length > maxLen ? name.substring(0, maxLen) + '…' : name;
}

export function ProductCharts({ topByRevenue, topByMargin, slowMovers, loading }: ProductChartsProps) {
  const [activeTab, setActiveTab] = useState<'revenue' | 'margin' | 'slow'>('revenue');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
        </CardContent>
      </Card>
    );
  }

  const top10Revenue = topByRevenue.slice(0, 10).map(d => ({ ...d, shortName: truncateName(d.product_name) }));
  const top10Margin = topByMargin.slice(0, 10).map(d => ({ ...d, shortName: truncateName(d.product_name) }));

  const tabs = [
    { key: 'revenue', label: 'ยอดขาย' },
    { key: 'margin', label: 'Margin' },
    { key: 'slow', label: 'ขายช้า' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>วิเคราะห์สินค้า</CardTitle>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="px-3 py-1.5 text-xs transition-all"
              style={{
                background: activeTab === tab.key ? '#4f46e5' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {activeTab === 'revenue' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top10Revenue} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `฿${formatCurrency(v)}`} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="shortName" tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-hover)' }} />
              <Bar dataKey="total_revenue" radius={[0, 6, 6, 0]}>
                {top10Revenue.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'margin' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top10Margin} layout="vertical" margin={{ left: 0, right: 55, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis type="category" dataKey="shortName" tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-hover)' }} />
              <Bar dataKey="margin_pct" radius={[0, 6, 6, 0]} label={{ position: 'right', formatter: (v: unknown) => `${(typeof v === 'number' ? v : 0).toFixed(1)}%`, fill: 'var(--text-muted)', fontSize: 10 }}>
                {top10Margin.map((_, index) => <Cell key={index} fill={MARGIN_COLORS[index % MARGIN_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'slow' && (
          <div className="overflow-auto max-h-72">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  <th className="text-left pb-2">สินค้า</th>
                  <th className="text-right pb-2">จำนวนขาย</th>
                  <th className="text-right pb-2">ยอดขาย</th>
                  <th className="text-right pb-2">ขายล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {slowMovers.slice(0, 15).map((item, i) => (
                  <tr key={i} className="border-b transition-colors" style={{ borderColor: 'var(--border)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="font-medium truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>{item.product_name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.product_code}</div>
                    </td>
                    <td className="text-right py-2.5" style={{ color: 'var(--text-secondary)' }}>{item.total_qty}</td>
                    <td className="text-right py-2.5" style={{ color: 'var(--text-secondary)' }}>฿{formatCurrency(item.total_revenue)}</td>
                    <td className="text-right py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>{item.last_sold_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
