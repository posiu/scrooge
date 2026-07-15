import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { MarketingNav } from '@/components/landing/MarketingNav';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

interface PlanFeature {
  label: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '0 zł',
    description: 'Podstawowe śledzenie budżetu domowego.',
    cta: 'Zacznij za darmo',
    features: [
      { label: 'Transakcje i konta', included: true },
      { label: 'Budżet miesięczny', included: true },
      { label: 'Zobowiązania i cele oszczędnościowe', included: true },
      { label: 'AI Asystent finansowy', included: false },
      { label: 'Wykresy i raporty', included: false },
      { label: 'Analiza trendów', included: false },
      { label: 'Zajęcia egzekucyjne', included: false },
      { label: 'Zarządzanie inwestycjami', included: false },
      { label: 'Import danych z Excela', included: false },
    ],
  },
  {
    name: 'Basic',
    price: '99 zł',
    period: '/ miesiąc',
    description: 'Pełna kontrola budżetu z analizą i importem danych.',
    cta: 'Wybierz Basic',
    highlighted: true,
    features: [
      { label: 'Wszystko z planu Free', included: true },
      { label: 'Podatki', included: true },
      { label: 'Wykresy i raporty', included: true },
      { label: 'Analiza trendów', included: true },
      { label: 'Import danych z Excela', included: true },
      { label: 'Szablony budżetów', included: true },
      { label: 'AI Asystent finansowy', included: false },
      { label: 'Zajęcia egzekucyjne', included: false },
      { label: 'Zarządzanie inwestycjami', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '299 zł',
    period: '/ miesiąc',
    description: 'Wszystkie możliwości Scrooge, bez ograniczeń.',
    cta: 'Wybierz Pro',
    features: [
      { label: 'Wszystko z planu Basic', included: true },
      { label: 'AI Asystent finansowy', included: true },
      { label: 'Zajęcia egzekucyjne', included: true },
      { label: 'Zarządzanie inwestycjami', included: true },
      { label: 'Śledzenie portfela: akcje, obligacje, ETF, krypto i więcej', included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav variant="pricing" />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Cennik
          </h1>
          <p className="text-lg text-muted-foreground">
            Wybierz plan dopasowany do tego, jak dokładnie chcesz kontrolować
            swój domowy budżet.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col h-full ${
                plan.highlighted
                  ? 'border-[#01581E] bg-card shadow-xl shadow-[#01581E]/10 md:-translate-y-2'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#01581E] text-white text-xs font-medium">
                  Najpopularniejszy
                </div>
              )}

              <h2 className="text-xl font-semibold text-foreground mb-1">{plan.name}</h2>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2.5 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-[#01581E] shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/60'}>
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  plan.highlighted
                    ? 'bg-[#01581E] text-white hover:bg-[#01581E]/90'
                    : 'border border-border text-foreground hover:bg-muted'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Szczegóły planów płatnych oraz sposób rozliczenia zostaną doprecyzowane wkrótce.
        </p>
      </section>

      <MarketingFooter />
    </div>
  );
}
