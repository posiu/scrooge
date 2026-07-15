'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard, CalendarDays, HandCoins, LineChart, TrendingUp,
  TrendingDown, Wallet, Gavel, RefreshCw, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Screen {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
  render: () => React.ReactNode;
}

const statTile = (label: string, value: string, color: string, bg: string, Icon: React.ElementType) => (
  <div className="bg-card border border-border rounded-lg p-2.5">
    <div className="flex items-center justify-between mb-1.5">
      <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      <div className={cn('w-5 h-5 rounded-md flex items-center justify-center shrink-0', bg)}>
        <Icon className={cn('w-3 h-3', color)} />
      </div>
    </div>
    <p className={cn('text-xs sm:text-sm font-bold', color)}>{value}</p>
  </div>
);

function ProgressRow({ label, spent, total, remaining, pct, over }: { label: string; spent: string; total: string; remaining: string; pct: number; over?: boolean }) {
  return (
    <div className="px-3 py-2.5 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="text-foreground">{label}</span>
        <span>
          <span className={over ? 'text-destructive font-medium' : 'text-foreground'}>{spent}</span>
          <span className="text-muted-foreground"> / {total}</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', over ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-[#01581E]')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>{pct}%</span>
        {over ? <span className="text-destructive">Przekroczenie: {remaining}</span> : <span>Pozostało {remaining}</span>}
      </div>
    </div>
  );
}

const PIE_SEGMENTS = [
  { label: 'Jedzenie', pct: 35, color: 'hsl(var(--chart-1))' },
  { label: 'Transport', pct: 22, color: 'hsl(var(--chart-2))' },
  { label: 'Rozrywka', pct: 18, color: 'hsl(var(--chart-3))' },
  { label: 'Rachunki', pct: 15, color: 'hsl(var(--chart-5))' },
  { label: 'Inne', pct: 10, color: 'hsl(var(--chart-4))' },
];

function pieGradient() {
  let acc = 0;
  const stops = PIE_SEGMENTS.map((s) => {
    const from = acc;
    acc += s.pct;
    return `${s.color} ${from}% ${acc}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

const BAR_MONTHS = [
  { m: 'Kw', income: 68, expense: 46 },
  { m: 'Maj', income: 54, expense: 50 },
  { m: 'Cze', income: 78, expense: 41 },
  { m: 'Lip', income: 64, expense: 57 },
];

const screens: Screen[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: 'app.usescrooge.com/dashboard',
    render: () => (
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-2">
          {statTile('Przych.', '8 200 zł', 'text-[#01581E]', 'bg-[#01581E]/10', TrendingUp)}
          {statTile('Wydatki', '5 430 zł', 'text-destructive', 'bg-destructive/10', TrendingDown)}
          {statTile('Oszcz.', '2 770 zł', 'text-blue-500', 'bg-blue-500/10', Wallet)}
          {statTile('Zobow.', '3 akt.', 'text-amber-500', 'bg-amber-500/10', HandCoins)}
          {statTile('Inwest.', '42 300 zł', 'text-indigo-500', 'bg-indigo-500/10', LineChart)}
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-foreground">Realizacja budżetu</p>
            <p className="text-[11px] text-muted-foreground">2 220 zł / 2 600 zł</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#01581E]" style={{ width: '72%' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-foreground mb-2">Przychody vs Wydatki</p>
            <div className="h-16 flex items-end gap-2">
              {BAR_MONTHS.map((b) => (
                <div key={b.m} className="flex-1 flex flex-col justify-end items-center gap-0.5">
                  <div className="w-full flex gap-0.5 items-end h-14">
                    <div className="flex-1 rounded-t-sm" style={{ height: `${b.income}%`, background: 'hsl(var(--chart-1))' }} />
                    <div className="flex-1 rounded-t-sm" style={{ height: `${b.expense}%`, background: 'hsl(var(--chart-4))' }} />
                  </div>
                  <span className="text-[7px] text-muted-foreground">{b.m}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-foreground mb-2">Struktura wydatków</p>
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0">
                <div className="w-14 h-14 rounded-full" style={{ background: pieGradient() }} />
                <div className="absolute inset-[26%] rounded-full bg-card" />
              </div>
              <div className="space-y-1 min-w-0">
                {PIE_SEGMENTS.slice(0, 3).map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[8px] text-muted-foreground truncate">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'budget',
    label: 'Budżet miesięczny',
    icon: CalendarDays,
    path: 'app.usescrooge.com/budget/2026/07',
    render: () => (
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Plan', value: '2 600 zł' },
            { label: 'Realizacja', value: '2 220 zł' },
            { label: 'Różnica', value: '+380 zł' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-2.5">
              <p className="text-[9px] text-muted-foreground mb-1">{s.label}</p>
              <p className="text-xs font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <ProgressRow label="Jedzenie" spent="850 zł" total="1 000 zł" remaining="150 zł" pct={85} />
          <ProgressRow label="Transport" spent="320 zł" total="400 zł" remaining="80 zł" pct={80} />
          <ProgressRow label="Rozrywka" spent="290 zł" total="300 zł" remaining="10 zł" pct={97} />
          <ProgressRow label="Rachunki" spent="660 zł" total="650 zł" remaining="10 zł" pct={100} over />
        </div>
      </div>
    ),
  },
  {
    key: 'liabilities',
    label: 'Zobowiązania',
    icon: Gavel,
    path: 'app.usescrooge.com/liabilities',
    render: () => (
      <div className="space-y-2.5">
        {[
          { icon: HandCoins, name: 'Kredyt hipoteczny', type: 'Kredyt', remaining: '245 000 zł', total: '320 000 zł', pct: 23, rate: '1 850 zł/mies.', color: 'text-red-500' },
          { icon: Landmark, name: 'Pożyczka bankowa', type: 'Pożyczka bankowa', remaining: '12 400 zł', total: '20 000 zł', pct: 38, rate: '620 zł/mies.', color: 'text-cyan-500' },
          { icon: CreditCard, name: 'Karta kredytowa', type: 'Karta', remaining: '2 100 zł', total: '5 000 zł', pct: 58, rate: '—', color: 'text-orange-500' },
          { icon: RefreshCw, name: 'Subskrypcje', type: 'Netflix, Spotify, Disney+', remaining: '87 zł', total: '87 zł', pct: 100, rate: '87 zł/mies.', color: 'text-blue-500' },
        ].map((l) => (
          <div key={l.name} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <l.icon className={cn('w-4 h-4', l.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{l.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{l.type}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-destructive">{l.remaining}</p>
                <p className="text-[9px] text-muted-foreground">z {l.total}</p>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
              <div className="h-full rounded-full bg-[#01581E]" style={{ width: `${l.pct}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>{l.pct}% spłacono</span>
              <span>Rata: {l.rate}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'investments',
    label: 'Inwestycje',
    icon: LineChart,
    path: 'app.usescrooge.com/investments',
    render: () => (
      <div className="space-y-2.5">
        <div className="bg-[#01581E] rounded-lg p-3.5 text-white">
          <p className="text-white/70 text-[10px] mb-1">Łączna wartość inwestycji</p>
          <p className="text-xl font-bold">42 300 zł</p>
          <p className="text-white/60 text-[10px] mt-1">4 pozycje</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { name: 'Akcje mWIG40', category: 'Akcje', value: '12 400 zł' },
            { name: 'ETF S&P 500', category: 'ETF', value: '15 800 zł' },
            { name: 'BTC / ETH', category: 'Kryptowaluty', value: '8 100 zł' },
            { name: 'Lokata roczna', category: 'Lokaty', value: '6 000 zł' },
          ].map((inv) => (
            <div key={inv.name} className="bg-card border border-border rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <LineChart className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{inv.name}</p>
                  <p className="text-[9px] text-muted-foreground">{inv.category}</p>
                </div>
              </div>
              <div className="pt-1.5 border-t border-border">
                <p className="text-xs font-bold text-foreground">{inv.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'trends',
    label: 'Trendy',
    icon: TrendingUp,
    path: 'app.usescrooge.com/trends',
    render: () => {
      const points = [
        { year: 2022, v: 82 }, { year: 2023, v: 68 }, { year: 2024, v: 58 },
        { year: 2025, v: 44 }, { year: 2026, v: 30 },
      ];
      const w = 300, h = 90, pad = 8;
      const step = (w - pad * 2) / (points.length - 1);
      const coords = points.map((p, i) => [pad + i * step, pad + (p.v / 100) * (h - pad * 2)] as const);
      const polyline = coords.map(([x, y]) => `${x},${y}`).join(' ');
      return (
        <div className="space-y-2.5">
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            {['Wydatki', 'Przychody', 'Oszczędności'].map((m, i) => (
              <span key={m} className={cn('px-2.5 py-1 rounded-md text-[10px] font-medium', i === 0 ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                {m}
              </span>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] font-semibold text-foreground mb-2">Wydatki 2022–2026</p>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
              <polyline points={polyline} fill="none" stroke="hsl(var(--chart-4))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {coords.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="hsl(var(--chart-4))" />
              ))}
            </svg>
            <div className="flex justify-between mt-1 px-1">
              {points.map((p) => (
                <span key={p.year} className="text-[8px] text-muted-foreground">{p.year}</span>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium py-1.5 px-3">Rok</th>
                  <th className="text-right font-medium py-1.5 px-3">Przychody</th>
                  <th className="text-right font-medium py-1.5 px-3">Wydatki</th>
                  <th className="text-right font-medium py-1.5 px-3">Zmiana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { year: 2025, income: '96 400 zł', expense: '68 200 zł', change: '−4,1%' },
                  { year: 2026, income: '98 900 zł', expense: '65 100 zł', change: '−4,5%' },
                ].map((r) => (
                  <tr key={r.year}>
                    <td className="py-1.5 px-3 font-medium text-foreground">{r.year}</td>
                    <td className="py-1.5 px-3 text-right text-[#01581E]">{r.income}</td>
                    <td className="py-1.5 px-3 text-right text-foreground">{r.expense}</td>
                    <td className="py-1.5 px-3 text-right text-[#01581E]">{r.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    },
  },
];

// small local icon (avoid pulling extra unused imports across the app)
function Landmark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 21 7 3 7" />
    </svg>
  );
}

export function ScreensCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % screens.length), 5000);
    return () => clearTimeout(id);
  }, [paused, active]);

  const current = screens[active];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {screens.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setActive(i)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
              i === active
                ? 'bg-[#01581E] text-white border-[#01581E]'
                : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/20',
            )}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Window */}
      <div
        className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4 bg-muted rounded-md px-3 py-1 text-xs text-muted-foreground truncate">
            {current.path}
          </div>
        </div>
        <div key={current.key} className="p-4 sm:p-6 bg-background min-h-[320px] sm:min-h-[360px] animate-fade-in">
          {current.render()}
        </div>
      </div>
    </div>
  );
}
