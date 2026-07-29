// Locale constants shared by server and client code — kept separate from
// request.ts because that file imports next/headers, which can't be pulled
// into a client bundle even transitively.
export const LOCALES = ['pl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pl';
export const LOCALE_COOKIE = 'locale';

export function resolveLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  // Legacy userSettings.locale values were stored as BCP-47 tags (e.g. 'pl-PL').
  const normalized = value.toLowerCase().split('-')[0];
  return (LOCALES as readonly string[]).includes(normalized) ? (normalized as Locale) : DEFAULT_LOCALE;
}
