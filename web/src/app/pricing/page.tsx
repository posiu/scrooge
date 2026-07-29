import { getTranslations } from 'next-intl/server';
import { Check, X } from 'lucide-react';
import { MarketingNav } from '@/components/landing/MarketingNav';
import { MarketingFooter } from '@/components/landing/MarketingFooter';
import { WaitlistButton } from '@/components/landing/WaitlistButton';

interface PlanFeature {
  label: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period?: string | null;
  description: string;
  features: PlanFeature[];
  cta: string;
}

export default async function PricingPage() {
  const t = await getTranslations('Pricing');
  const plans = t.raw('plans') as Plan[];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav variant="pricing" />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => {
            const highlighted = i === 1;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col h-full ${
                  highlighted
                    ? 'border-[#01581E] bg-card shadow-xl shadow-[#01581E]/10 md:-translate-y-2'
                    : 'border-border bg-card'
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#01581E] text-white text-xs font-medium">
                    {t('mostPopular')}
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

                <WaitlistButton
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full ${
                    highlighted
                      ? 'bg-[#01581E] text-white hover:bg-[#01581E]/90'
                      : 'border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {plan.cta}
                </WaitlistButton>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          {t('footnote')}
        </p>
      </section>

      <MarketingFooter />
    </div>
  );
}
