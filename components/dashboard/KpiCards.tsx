'use client';

import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, BarChart2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface KpiData {
  current: {
    total_revenue: number;
    total_profit: number;
    total_cost: number;
    total_orders: number;
    total_items: number;
    avg_order_value: number;
    gross_margin_pct: number;
  };
  changes: {
    revenue_change: number | null;
    profit_change: number | null;
    orders_change: number | null;
  };
}

interface KpiCardsProps {
  data: KpiData | null;
  loading?: boolean;
}

function ChangeIndicator({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>;
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

const CARDS = [
  {
    key: 'revenue',
    label: 'ยอดขายรวม',
    icon: DollarSign,
    color: 'from-indigo-500 to-purple-600',
    bgGlow: 'shadow-indigo-500/20',
    getValue: (d: KpiData) => `฿${formatCurrency(d.current.total_revenue)}`,
    getChange: (d: KpiData) => d.changes.revenue_change,
    getSub: (d: KpiData) => `เฉลี่ย ฿${formatCurrency(d.current.avg_order_value)} / ใบเสร็จ`,
  },
  {
    key: 'profit',
    label: 'กำไรรวม',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-600',
    bgGlow: 'shadow-emerald-500/20',
    getValue: (d: KpiData) => `฿${formatCurrency(d.current.total_profit)}`,
    getChange: (d: KpiData) => d.changes.profit_change,
    getSub: (d: KpiData) => `Gross Margin ${formatPercent(d.current.gross_margin_pct)}`,
  },
  {
    key: 'orders',
    label: 'จำนวนใบเสร็จ',
    icon: ShoppingCart,
    color: 'from-blue-500 to-cyan-600',
    bgGlow: 'shadow-blue-500/20',
    getValue: (d: KpiData) => `${formatCurrency(d.current.total_orders)}`,
    getChange: (d: KpiData) => d.changes.orders_change,
    getSub: (d: KpiData) => `${formatCurrency(d.current.total_items)} รายการทั้งหมด`,
  },
  {
    key: 'margin',
    label: 'Gross Margin %',
    icon: BarChart2,
    color: 'from-amber-500 to-orange-600',
    bgGlow: 'shadow-amber-500/20',
    getValue: (d: KpiData) => `${d.current.gross_margin_pct.toFixed(1)}%`,
    getChange: (_d: KpiData) => null,
    getSub: (d: KpiData) => `ต้นทุนรวม ฿${formatCurrency(d.current.total_cost)}`,
  },
];

export function KpiCards({ data, loading }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-4 rounded w-1/2 mb-3" style={{ background: 'var(--border)' }} />
              <div className="h-8 rounded w-3/4 mb-2" style={{ background: 'var(--border)' }} />
              <div className="h-3 rounded w-1/3" style={{ background: 'var(--border)' }} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(card => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className={`relative overflow-hidden shadow-xl ${card.bgGlow}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{card.label}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {data ? card.getValue(data) : '—'}
              </div>
              <div className="flex items-center gap-2">
                {data && <ChangeIndicator value={card.getChange(data)} />}
                <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {data ? card.getSub(data) : ''}
                </span>
              </div>
            </CardContent>
            {/* Decorative gradient blob */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-2xl`} />
          </Card>
        );
      })}
    </div>
  );
}
