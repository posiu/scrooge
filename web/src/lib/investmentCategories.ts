export const INVESTMENT_CATEGORIES = [
  { value: 'stocks',           label: 'Akcje' },
  { value: 'treasury_bonds',   label: 'Obligacje skarbowe' },
  { value: 'corporate_bonds',  label: 'Obligacje korporacyjne' },
  { value: 'etf',              label: 'ETF' },
  { value: 'deposits',         label: 'Lokaty' },
  { value: 'mutual_funds',     label: 'Fundusze inwestycyjne' },
  { value: 'currencies',       label: 'Waluty' },
  { value: 'precious_metals',  label: 'Metale szlachetne' },
  { value: 'art',              label: 'Dzieła sztuki' },
  { value: 'cryptocurrencies', label: 'Kryptowaluty' },
  { value: 'company_shares',   label: 'Udziały w firmach' },
  { value: 'derivatives',      label: 'Instrumenty pochodne' },
  { value: 'other',            label: 'Inne' },
] as const;

export const INVESTMENT_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  INVESTMENT_CATEGORIES.map((c) => [c.value, c.label]),
);
