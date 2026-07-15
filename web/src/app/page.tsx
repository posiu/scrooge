import Link from 'next/link';
import {
  BarChart3,
  Brain,
  ShieldCheck,
  PieChart,
  Target,
  Gavel,
  Download,
  LineChart,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Zap,
  Tag,
} from 'lucide-react';
import { MarketingNav } from '@/components/landing/MarketingNav';
import { MarketingFooter } from '@/components/landing/MarketingFooter';
import { ScreensCarousel } from '@/components/landing/ScreensCarousel';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav variant="home" />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01581E]/10 text-[#01581E] text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Domowy controlling z AI asystentem
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Przestań zgadywać{' '}
            <span className="text-[#01581E]">co się dzieje</span>
            <br />z Twoimi pieniędzmi
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Scrooge to aplikacja do zarządzania domowym budżetem. Budżet vs.
            realizacja, zobowiązania, inwestycje, podatki, cele oszczędnościowe,
            AI asystent — wszystko w jednym miejscu, bezpieczne i prywatne.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#01581E] text-white font-medium hover:bg-[#01581E]/90 transition-all hover:shadow-lg hover:shadow-[#01581E]/20"
            >
              Zaloguj się do aplikacji
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
            >
              <Tag className="w-4 h-4" />
              Cennik
            </Link>
          </div>
        </div>
      </section>

      {/* Screens carousel */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Zobacz Scrooge w akcji
          </h2>
          <p className="text-muted-foreground">
            Jedna aplikacja, pełny obraz Twoich finansów — od budżetu miesięcznego po portfel inwestycyjny.
          </p>
        </div>
        <ScreensCarousel />
      </section>

      {/* Features */}
      <section id="funkcje" className="px-4 sm:px-6 lg:px-8 py-24 bg-muted/30 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Wszystko czego potrzebujesz
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Wiele lat prowadzenia arkuszy excel z budżetem domowym,
              przeprojektowane jako nowoczesna aplikacja webowa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-[#01581E]/5 transition-all hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#01581E]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-[#01581E]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Jak to działa?
            </h2>
          </div>

          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-6 items-start">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#01581E] text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 bg-[#01581E]">
        <div className="max-w-4xl mx-auto text-center">
          <ShieldCheck className="w-12 h-12 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Twoje dane są bezpieczne
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
            Logowanie bez hasła (OTP), szyfrowanie danych w Supabase, Row Level Security —
            nikt poza Tobą nie ma dostępu do Twoich finansów.
            Konwersacje z AI są przechowywane lokalnie na Twoim urządzeniu.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {securityPoints.map((point) => (
              <div key={point} className="flex items-center gap-2 text-white/90 text-sm">
                <CheckCircle2 className="w-4 h-4 text-white/60" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Gotowy na kontrolę finansów?
          </h2>
          <p className="text-muted-foreground mb-8">
            Zaloguj się i zacznij śledzić swój budżet już dziś.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#01581E] text-white font-medium text-lg hover:bg-[#01581E]/90 transition-all hover:shadow-xl hover:shadow-[#01581E]/25"
          >
            Zaloguj się
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

const features = [
  {
    icon: BarChart3,
    title: 'Budżet vs. Realizacja',
    description:
      'Planuj budżet miesięczny z szablonami i śledź realizację w czasie rzeczywistym. Natychmiastowe alerty przy przekroczeniu planu.',
  },
  {
    icon: Brain,
    title: 'AI Asystent Finansowy',
    description:
      'Pytaj o swoje finanse w naturalnym języku. Podpinasz dowolny model LLM — OpenAI, Anthropic, Google lub własny.',
  },
  {
    icon: Gavel,
    title: 'Zobowiązania, Podatki i Egzekucje',
    description:
      'Śledź kredyty, pożyczki, raty i subskrypcje, rozliczenia podatkowe oraz zajęcia egzekucyjne — wszystko w jednym miejscu.',
  },
  {
    icon: LineChart,
    title: 'Inwestycje',
    description:
      'Śledź portfel: akcje, obligacje, ETF-y, kryptowaluty, metale szlachetne, lokaty i więcej — z jedną, zagregowaną wartością.',
  },
  {
    icon: Target,
    title: 'Cele Oszczędnościowe',
    description:
      'Wyznaczaj cele finansowe i monitoruj postęp w ich realizacji na bieżąco.',
  },
  {
    icon: TrendingUp,
    title: 'Analiza Trendów',
    description:
      'Wykrywaj wzorce wydatków w skali miesięcy i lat. Prognozy oparte na rzeczywistych danych — do 10 lat historii.',
  },
  {
    icon: PieChart,
    title: 'Interaktywne Wykresy i Raporty',
    description:
      'Predefiniowane wykresy: struktura kosztów, przychody, przekroczenia. Eksport danych do dalszej analizy.',
  },
  {
    icon: Download,
    title: 'Import Danych z Excela',
    description:
      'Zaimportuj historię transakcji z arkusza Excel. Deduplikacja i podgląd przed zapisem do bazy.',
  },
  {
    icon: ShieldCheck,
    title: 'Bezpieczeństwo',
    description:
      'Logowanie bez hasła (OTP), Row Level Security w Supabase. Twoje dane są widoczne tylko dla Ciebie.',
  },
];

const steps = [
  {
    title: 'Zaloguj się emailem',
    description:
      'Wpisz adres email i otrzymaj jednorazowy kod. Żadnych haseł do zapamiętania.',
  },
  {
    title: 'Skonfiguruj kategorie i konta',
    description:
      'Ustaw hierarchię kategorii (Jedzenie > Restauracje), dodaj swoje konta bankowe, gotówkę, kryptowaluty i inwestycje.',
  },
  {
    title: 'Zaplanuj budżet',
    description:
      'Stwórz szablon budżetu i generuj na jego podstawie plany miesięczne. Zaimportuj historię z Excela.',
  },
  {
    title: 'Śledź i analizuj',
    description:
      'Dodawaj transakcje, przeglądaj wykresy, pytaj AI asystenta o swoje finanse. Bądź na bieżąco.',
  },
];

const securityPoints = [
  'Logowanie OTP bez hasła',
  'Row Level Security',
  'AI chat lokalnie na urządzeniu',
  'Szyfrowanie danych',
];
