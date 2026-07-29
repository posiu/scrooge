import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import type { Locale } from '@/i18n/config';

const DATE_FNS_LOCALES = { pl, en: enUS };

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

export function formatDate(date: Date | string, fmt = 'd MMMM yyyy', locale: Locale = 'pl'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: DATE_FNS_LOCALES[locale] });
}

export function formatMonth(month: string, locale: Locale = 'pl'): string {
  // month = 'YYYY-MM'
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return format(date, 'LLLL yyyy', { locale: DATE_FNS_LOCALES[locale] });
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

const HOLIDAY_NAMES = {
  pl: {
    newYear: 'Nowy Rok', epiphany: 'Trzech Króli', laborDay: 'Święto Pracy',
    constitutionDay: 'Święto Konstytucji 3 Maja', assumption: 'Wniebowzięcie NMP',
    allSaints: 'Wszystkich Świętych', independenceDay: 'Święto Niepodległości',
    christmas1: 'Boże Narodzenie (I dzień)', christmas2: 'Boże Narodzenie (II dzień)',
    easter: 'Wielkanoc', easterMonday: 'Poniedziałek Wielkanocny',
    pentecost: 'Zielone Świątki', corpusChristi: 'Boże Ciało',
  },
  en: {
    newYear: "New Year's Day", epiphany: 'Epiphany', laborDay: 'Labour Day',
    constitutionDay: 'Constitution Day', assumption: 'Assumption of Mary',
    allSaints: "All Saints' Day", independenceDay: 'Independence Day',
    christmas1: 'Christmas Day', christmas2: 'St. Stephen\'s Day',
    easter: 'Easter Sunday', easterMonday: 'Easter Monday',
    pentecost: 'Pentecost', corpusChristi: 'Corpus Christi',
  },
} as const;

// Polish public holidays for a given year — the calendar itself is Poland-specific
// regardless of UI language; only the displayed names are translated.
export function getPolishHolidays(year: number, locale: Locale = 'pl'): Record<string, string> {
  const n = HOLIDAY_NAMES[locale];

  // Fixed holidays
  const fixed: Record<string, string> = {
    [`${year}-01-01`]: n.newYear,
    [`${year}-01-06`]: n.epiphany,
    [`${year}-05-01`]: n.laborDay,
    [`${year}-05-03`]: n.constitutionDay,
    [`${year}-08-15`]: n.assumption,
    [`${year}-11-01`]: n.allSaints,
    [`${year}-11-11`]: n.independenceDay,
    [`${year}-12-25`]: n.christmas1,
    [`${year}-12-26`]: n.christmas2,
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
    [easterStr]: n.easter,
    [easterMondayStr]: n.easterMonday,
    [pentecostStr]: n.pentecost,
    [corpusChristiStr]: n.corpusChristi,
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
