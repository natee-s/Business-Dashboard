'use client';

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  minDate?: string;
  maxDate?: string;
  darkMode?: boolean;
}

function getPresets(maxDate?: string): DateRange[] {
  const today = maxDate ? new Date(maxDate) : new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const d7 = new Date(today); d7.setDate(today.getDate() - 7);
  const d30 = new Date(today); d30.setDate(today.getDate() - 30);
  const d90 = new Date(today); d90.setDate(today.getDate() - 90);
  const ytdStart = new Date(today.getFullYear(), 0, 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return [
    { from: fmt(d7), to: fmt(today), label: '7 วัน' },
    { from: fmt(d30), to: fmt(today), label: '30 วัน' },
    { from: fmt(d90), to: fmt(today), label: '90 วัน' },
    { from: fmt(monthStart), to: fmt(today), label: 'เดือนนี้' },
    { from: fmt(prevMonthStart), to: fmt(prevMonthEnd), label: 'เดือนก่อน' },
    { from: fmt(ytdStart), to: fmt(today), label: 'ปีนี้' },
    { from: '', to: '', label: 'ทั้งหมด' },
  ];
}

export function DateFilter({ value, onChange, minDate, maxDate }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const presets = getPresets(maxDate);

  const handlePreset = (preset: DateRange) => {
    onChange(preset);
    setCustomFrom(preset.from);
    setCustomTo(preset.to);
    setOpen(false);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange({ from: customFrom, to: customTo, label: 'กำหนดเอง' });
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-between gap-2 h-9 px-3 rounded-xl border text-sm font-medium transition-all min-w-[150px]"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
      >
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-indigo-500" />
          {value.label || 'เลือกช่วงเวลา'}
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="theme-panel absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border shadow-2xl p-4"
            style={{ background: 'var(--tooltip-bg)', borderColor: 'var(--border)' }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              ช่วงเวลาด่วน
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className={cn(
                    'text-sm px-3 py-2 rounded-xl text-left transition-all',
                    value.label === preset.label
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-indigo-50'
                  )}
                  style={value.label !== preset.label ? { color: 'var(--text-secondary)' } : {}}
                  onMouseEnter={e => {
                    if (value.label !== preset.label)
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={e => {
                    if (value.label !== preset.label)
                      (e.currentTarget as HTMLElement).style.background = '';
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              กำหนดเอง
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>วันเริ่มต้น</label>
                <input
                  type="date"
                  value={customFrom}
                  min={minDate}
                  max={customTo || maxDate}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="theme-input w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>วันสิ้นสุด</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || minDate}
                  max={maxDate}
                  onChange={e => setCustomTo(e.target.value)}
                  className="theme-input w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium mt-1 disabled:opacity-50"
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
              >
                ดูข้อมูล
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
