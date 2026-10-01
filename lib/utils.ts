import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('th-TH').format(value);
}

/** Convert Thai Buddhist Era date string (DD/M/YYYY) to ISO date */
export function thaiDateToISO(thaiDate: string): string | null {
  try {
    // Handle formats: "01/1/2569", "1/10/2569", "1/1/2569 08:21" etc.
    const cleaned = thaiDate.toString().trim();
    const dateTimeParts = cleaned.split(' ');
    const datePart = dateTimeParts[0];
    const timePart = dateTimeParts[1] || '00:00';

    const parts = datePart.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // Convert Buddhist Era (BE) to Christian Era (CE)
    // BE year 2569 = CE year 2026
    if (year > 2400) {
      year = year - 543;
    }

    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isoDateTime = `${isoDate}T${timePart}:00`;

    return isoDateTime;
  } catch {
    return null;
  }
}

export function parseThaiDate(thaiDate: string): { date: string; datetime: string } | null {
  try {
    const cleaned = thaiDate.toString().trim();
    const dateTimeParts = cleaned.split(' ');
    const datePart = dateTimeParts[0];
    const timePart = dateTimeParts[1] || '00:00';

    const parts = datePart.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    if (year > 2400) year = year - 543;

    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isoDateTime = `${isoDate}T${timePart}:00`;

    return { date: isoDate, datetime: isoDateTime };
  } catch {
    return null;
  }
}

/** Parse Excel serial date number to JS Date */
export function excelSerialToDate(serial: number): Date {
  // Excel's epoch starts from Jan 1, 1900 (with a leap year bug)
  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  return date;
}

/** Format date to Thai Buddhist Era display */
export function toThaiDateDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const thaiYear = year + 543;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${thaiYear}`;
}

export function getMonthLabel(isoDate: string): string {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const [year, month] = isoDate.split('-').map(Number);
  const thaiYear = year + 543;
  return `${months[month - 1]} ${thaiYear}`;
}
