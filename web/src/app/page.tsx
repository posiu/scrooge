import Link from 'next/link';
import {
  TrendingUp,
  BarChart3,
  Brain,
  ShieldCheck,
  Smartphone,
  PieChart,
  Calendar,
  Target,
  ArrowRight,
  CheckCircle2,
  Zap,
  GitBranch,
  MessageSquare,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#01581E] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-foreground">Scrooge</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/roadmap"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Roadmap
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors"
              >
                Zaloguj się
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
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
            Scrooge to aplikacja do zarządzania domowym budżetem zainspirowana metodą
            Michała Szafrańskiego. Budżet vs. realizacja, trendy, AI asystent —
            wszystko w jednym miejscu, bezpieczne i prywatne.
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
              href="/roadmap"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              Zobacz roadmapę
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard preview mockup */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 bg-muted rounded-md px-3 py-1 text-xs text-muted-foreground">
                app.scrooge.pl/dashboard
              </div>
            </div>
            {/* App preview */}
            <div className="flex h-64 sm:h-80">
              {/* Sidebar */}
              <div className="w-14 sm:w-48 bg-[#01581E] p-3 sm:p-4 shrink-0">
                <div className="space-y-1 mt-4">
                  {['Dashboard', 'Transakcje', 'Budżet', 'Konta', 'Wykresy', 'AI Chat'].map((item) => (
                    <div
                      key={item}
                      className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 text-xs hover:bg-white/10 cursor-pointer"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 p-4 sm:p-6 bg-background">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Przychody', value: '8 200 zł', color: 'text-[#01581E]' },
                    { label: 'Wydatki', value: '5 430 zł', color: 'text-destructive' },
                    { label: 'Oszczędności', value: '2 770 zł', color: 'text-blue-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-sm sm:text-base font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                {/* Chart placeholder */}
                <div className="h-24 sm:h-36 bg-muted/30 rounded-xl border border-border flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Wszystko czego potrzebujesz
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Zainspirowany arkuszem Michała Szafrańskiego, przeprojektowany
              jako nowoczesna aplikacja webowa.
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

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#01581E] rounded-md flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">Scrooge</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/roadmap" className="hover:text-foreground transition-colors">
              Roadmap
            </Link>
            <span>Domowy Controlling · {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: BarChart3,
    title: 'Budżet vs. Realizacja',
    description:
      'Planuj budżet miesięczny i śledź realizację w czasie rzeczywistym. Natychmiastowe alerty przy przekroczeniu planu.',
  },
  {
    icon: Brain,
    title: 'AI Asystent Finansowy',
    description:
      'Pytaj o swoje finanse w naturalnym języku. Podpinasz dowolny model LLM — OpenAI, Anthropic, Google lub własny.',
  },
  {
    icon: TrendingUp,
    title: 'Analiza Trendów',
    description:
      'Wykrywaj wzorce wydatków w skali miesięcy i lat. Prognozy oparte na rzeczywistych danych — do 10 lat historii.',
  },
  {
    icon: Calendar,
    title: 'Polskie Święta i Kalendarz',
    description:
      'Automatyczne oznaczanie świąt i dni wolnych. Planowanie budżetu uwzględniające specyfikę polskiego kalendarza.',
  },
  {
    icon: PieChart,
    title: 'Interaktywne Wykresy',
    description:
      'Predefiniowane wykresy: struktura kosztów, przychody, przekroczenia. Możliwość tworzenia własnych raportów.',
  },
  {
    icon: Target,
    title: 'Szablony Budżetów',
    description:
      'Twórz szablony i generuj na ich podstawie plany na kolejne miesiące i lata. Hierarchiczne kategorie.',
  },
  {
    icon: Smartphone,
    title: 'Działa Wszędzie',
    description:
      'Responsywny design — MacBook, iPhone, iPad. Jedno konto, dostęp z każdego urządzenia.',
  },
  {
    icon: ShieldCheck,
    title: 'Bezpieczeństwo',
    description:
      'Logowanie bez hasła (OTP), Row Level Security w Supabase. Twoje dane są widoczne tylko dla Ciebie.',
  },
  {
    icon: MessageSquare,
    title: 'Publiczne Roadmap',
    description:
      'Zgłaszaj pomysły, głosuj na funkcje innych użytkowników i śledź postęp ich realizacji.',
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
      'Ustaw hierarchię kategorii (Jedzenie > Restauracje), dodaj swoje konta bankowe, gotówkę, kryptowaluty.',
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
