// API routes return English error codes (e.g. 'Not found', 'Invalid account')
// instead of localized text. This looks the code up in the `ApiErrors`
// message namespace; codes with no translation (e.g. a raw Supabase error
// message) pass through unchanged.
type ErrorTranslator = { (key: string): string; has: (key: string) => boolean };

export function translateApiError(code: unknown, t: ErrorTranslator, fallback: string): string {
  if (typeof code !== 'string' || !code) return fallback;
  return t.has(code) ? t(code) : code;
}
