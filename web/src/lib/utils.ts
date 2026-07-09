import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string,
  currency = 'PLN',
  locale = 'pl-PL',
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string, fmt = 'd MMMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: pl });
}

export function formatMonth(month: string): string {
  // month = 'YYYY-MM'
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return format(date, 'LLLL yyyy', { locale: pl });
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getMonthsInYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return `${year}-${m}`;
  });
}

// Polish public holidays for a given year
export function getPolishHolidays(year: number): Record<string, string> {
  // Fixed holidays
  const fixed: Record<string, string> = {
    [`${year}-01-01`]: 'Nowy Rok',
    [`${year}-01-06`]: 'Trzech Króli',
    [`${year}-05-01`]: 'Święto Pracy',
    [`${year}-05-03`]: 'Święto Konstytucji 3 Maja',
    [`${year}-08-15`]: 'Wniebowzięcie NMP',
    [`${year}-11-01`]: 'Wszystkich Świętych',
    [`${year}-11-11`]: 'Święto Niepodległości',
    [`${year}-12-25`]: 'Boże Narodzenie (I dzień)',
    [`${year}-12-26`]: 'Boże Narodzenie (II dzień)',
  };

  // Easter-dependent holidays (calculate Easter using Anonymous Gregorian algorithm)
  const easter = calculateEaster(year);
  const easterStr = format(easter, 'yyyy-MM-dd');
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);
  const easterMondayStr = format(easterMonday, 'yyyy-MM-dd');

  // Pentecost (7th Sunday after Easter = +49 days)
  const pentecost = new Date(easter);
  pentecost.setDate(pentecost.getDate() + 49);
  const pentecostStr = format(pentecost, 'yyyy-MM-dd');

  // Corpus Christi (60 days after Easter)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(corpusChristi.getDate() + 60);
  const corpusChristiStr = format(corpusChristi, 'yyyy-MM-dd');

  return {
    ...fixed,
    [easterStr]: 'Wielkanoc',
    [easterMondayStr]: 'Poniedziałek Wielkanocny',
    [pentecostStr]: 'Zielone Świątki',
    [corpusChristiStr]: 'Boże Ciało',
  };
}

function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function generateImportHash(date: string, amount: string, description: string): string {
  const str = `${date}|${amount}|${description}`.toLowerCase().trim();
  // Simple hash — sufficient for dedup
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + str.length.toString(36);
}
