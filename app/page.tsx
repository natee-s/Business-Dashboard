'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, RefreshCw, Pill } from 'lucide-react';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { DateFilter, DateRange } from '@/components/dashboard/DateFilter';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ProductCharts } from '@/components/dashboard/ProductCharts';
import { TimePatternChart } from '@/components/dashboard/TimePatternChart';
import { ForecastChart } from '@/components/dashboard/ForecastChart';
import { MonthlyComparison } from '@/components/dashboard/MonthlyComparison';
import { UploadPanel } from '@/components/dashboard/UploadPanel';
import { Button } from '@/components/ui/button';

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
  dateRange: { min_date: string; max_date: string };
}

const ALL_DATE_RANGE: DateRange = { from: '', to: '', label: 'ทั้งหมด' };

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(ALL_DATE_RANGE);
  const [forecastDays, setForecastDays] = useState<30 | 60 | 90>(30);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [trendData, setTrendData] = useState<{ data: unknown[]; groupBy: 'day' | 'month' }>({ data: [], groupBy: 'day' });
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [productData, setProductData] = useState<{ topByRevenue: unknown[]; topByMargin: unknown[]; slowMovers: unknown[] }>({ topByRevenue: [], topByMargin: [], slowMovers: [] });
  const [timePattern, setTimePattern] = useState<{ byHour: unknown[]; byDayOfWeek: unknown[]; byPeriod: unknown[] }>({ byHour: [], byDayOfWeek: [], byPeriod: [] });
  const [forecastState, setForecastState] = useState<{ historicalData: unknown[]; forecastData: unknown[]; forecastDays: number }>({ historicalData: [], forecastData: [], forecastDays: 0 });
  const [monthlyData, setMonthlyData] = useState<{ monthly: unknown[]; quarterly: unknown[] }>({ monthly: [], quarterly: [] });

  const buildParams = useCallback((extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (dateRange.from) params.set('dateFrom', dateRange.from);
    if (dateRange.to) params.set('dateTo', dateRange.to);
    if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    return params.toString();
  }, [dateRange]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const forecastParams = buildParams({ forecastDays: String(forecastDays) });
      const [kpiRes, trendRes, productRes, timeRes, forecastRes, monthlyRes] = await Promise.all([
        fetch('/api/stats/kpi?' + buildParams()),
        fetch('/api/stats/trend?' + buildParams({ groupBy })),
        fetch('/api/stats/products?' + buildParams()),
        fetch('/api/stats/time-pattern?' + buildParams()),
        fetch('/api/stats/forecast?' + forecastParams),
        fetch('/api/stats/monthly'),
      ]);
      const [kpi, trend, product, time, forecast, monthly] = await Promise.all([
        kpiRes.json(), trendRes.json(), productRes.json(),
        timeRes.json(), forecastRes.json(), monthlyRes.json(),
      ]);
      setKpiData(kpi);
      setTrendData({ data: trend.data || [], groupBy: trend.groupBy || 'day' });
      setProductData({ topByRevenue: product.topByRevenue || [], topByMargin: product.topByMargin || [], slowMovers: product.slowMovers || [] });
      setTimePattern({ byHour: time.byHour || [], byDayOfWeek: time.byDayOfWeek || [], byPeriod: time.byPeriod || [] });
      setForecastState({ historicalData: forecast.historicalData || [], forecastData: forecast.forecastData || [], forecastDays: forecast.forecastDays || 0 });
      setMonthlyData({ monthly: monthly.monthly || [], quarterly: monthly.quarterly || [] });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [buildParams, groupBy, forecastDays]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const handleGroupByChange = (g: 'day' | 'month') => { setGroupBy(g); setRefreshKey(k => k + 1); };
  const handleDateChange = (range: DateRange) => { setDateRange(range); setRefreshKey(k => k + 1); };
  const handleForecastDaysChange = (days: 30 | 60 | 90) => { setForecastDays(days); setRefreshKey(k => k + 1); };
  const handleRefresh = () => setRefreshKey(k => k + 1);
  const handleUploadSuccess = () => setRefreshKey(k => k + 1);
  const isFiltered = !!(dateRange.from || dateRange.to);

  return (
    <div data-theme={darkMode ? 'dark' : 'light'} className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl" style={{ background: 'var(--blob-1)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: 'var(--blob-2)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl" style={{ background: 'var(--blob-3)' }} />
      </div>
      <div className="relative z-10">
        <header className="header-surface sticky top-0 z-20 border-b backdrop-blur-xl">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-base leading-tight text-base-primary">บ้านยาสุขใจ</div>
                <div className="text-xs text-base-muted">Business Dashboard</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DateFilter value={dateRange} onChange={handleDateChange} minDate={kpiData?.dateRange?.min_date} maxDate={kpiData?.dateRange?.max_date} />
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading} className="w-9 h-9 p-0">
                <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
              </Button>
              <button onClick={() => setDarkMode(!darkMode)} className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {isFiltered && (
          <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-9 flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>กรองข้อมูล:</span>
              <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
                {dateRange.label}{dateRange.from ? ' (' + dateRange.from + ' ถึง ' + dateRange.to + ')' : ''}
              </span>
              <button onClick={() => handleDateChange(ALL_DATE_RANGE)} className="text-xs ml-1 hover:text-indigo-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
                ✕ ดูทั้งหมด
              </button>
            </div>
          </div>
        )}

        <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-6">
          <KpiCards data={kpiData} loading={loading} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TrendChart data={trendData.data as Parameters<typeof TrendChart>[0]['data']} groupBy={groupBy} onGroupByChange={handleGroupByChange} loading={loading} />
            </div>
            <UploadPanel onUploadSuccess={handleUploadSuccess} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProductCharts topByRevenue={productData.topByRevenue as Parameters<typeof ProductCharts>[0]['topByRevenue']} topByMargin={productData.topByMargin as Parameters<typeof ProductCharts>[0]['topByMargin']} slowMovers={productData.slowMovers as Parameters<typeof ProductCharts>[0]['slowMovers']} loading={loading} />
            <TimePatternChart byHour={timePattern.byHour as Parameters<typeof TimePatternChart>[0]['byHour']} byDayOfWeek={timePattern.byDayOfWeek as Parameters<typeof TimePatternChart>[0]['byDayOfWeek']} byPeriod={timePattern.byPeriod as Parameters<typeof TimePatternChart>[0]['byPeriod']} loading={loading} />
          </div>
          <MonthlyComparison data={monthlyData.monthly as Parameters<typeof MonthlyComparison>[0]['data']} loading={loading} />
          <ForecastChart
            historicalData={forecastState.historicalData as Parameters<typeof ForecastChart>[0]['historicalData']}
            forecastData={forecastState.forecastData as Parameters<typeof ForecastChart>[0]['forecastData']}
            forecastDays={forecastState.forecastDays}
            selectedForecastDays={forecastDays}
            onForecastDaysChange={handleForecastDaysChange}
            loading={loading}
          />
          <footer className="text-center text-xs pb-4 text-base-faint">
            ร้านยาบ้านยาสุขใจ • Business Dashboard v1.0 • ข้อมูลจาก POS System
          </footer>
        </main>
      </div>
    </div>
  );
}
