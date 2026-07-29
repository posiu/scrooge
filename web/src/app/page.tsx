import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
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
import { WaitlistButton } from '@/components/landing/WaitlistButton';

const FEATURE_ICONS = [BarChart3, Brain, Gavel, LineChart, Target, TrendingUp, PieChart, Download, ShieldCheck];

export default async function LandingPage() {
  const t = await getTranslations('Landing');
  const tCommon = await getTranslations('Common');
  const features = t.raw('features') as { title: string; description: string }[];
  const steps = t.raw('steps') as { title: string; description: string }[];
  const securityPoints = t.raw('securityPoints') as string[];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav variant="home" />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01581E]/10 text-[#01581E] text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            {t('badge')}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            {t('heroTitleStart')}{' '}
            <span className="text-[#01581E]">{t('heroTitleHighlight')}</span>
            <br />{t('heroTitleEnd')}
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <WaitlistButton className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#01581E] text-white font-medium hover:bg-[#01581E]/90 transition-all hover:shadow-lg hover:shadow-[#01581E]/20">
              {tCommon('notifyMe')}
              <ArrowRight className="w-4 h-4" />
            </WaitlistButton>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
            >
              <Tag className="w-4 h-4" />
              {t('ctaPricing')}
            </Link>
          </div>
        </div>
      </section>

      {/* Screens carousel */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            {t('screensTitle')}
          </h2>
          <p className="text-muted-foreground">
            {t('screensSubtitle')}
          </p>
        </div>
        <ScreensCarousel />
      </section>

      {/* Features */}
      <section id="funkcje" className="px-4 sm:px-6 lg:px-8 py-24 bg-muted/30 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={feature.title}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-[#01581E]/5 transition-all hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#01581E]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#01581E]" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('howTitle')}
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
            {t('securityTitle')}
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
            {t('securityBody')}
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
            {t('ctaTitle')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t('ctaSubtitle')}
          </p>
          <WaitlistButton className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#01581E] text-white font-medium text-lg hover:bg-[#01581E]/90 transition-all hover:shadow-xl hover:shadow-[#01581E]/25">
            {tCommon('notifyMe')}
            <ArrowRight className="w-5 h-5" />
          </WaitlistButton>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
