// Display labels live in messages/{locale}.json under "InvestmentCategories" —
// look them up via t(`InvestmentCategories.${value}`).
export const INVESTMENT_CATEGORIES = [
  'stocks',
  'treasury_bonds',
  'corporate_bonds',
  'etf',
  'deposits',
  'mutual_funds',
  'currencies',
  'precious_metals',
  'art',
  'cryptocurrencies',
  'company_shares',
  'derivatives',
  'other',
] as const;
