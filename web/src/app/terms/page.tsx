import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MarketingNav } from '@/components/landing/MarketingNav';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

// Szablon regulaminu — pola oznaczone [DO UZUPEŁNIENIA] wymagają danych
// prawdziwego podmiotu świadczącego usługę oraz przeglądu prawnego przed
// publikacją produkcyjną, ze względu na przetwarzanie danych finansowych.

export async function generateMetadata() {
  const t = await getTranslations('Terms');
  return { title: t('pageTitle') };
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_a]:text-[#01581E] [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

function privacyLink(chunks: React.ReactNode) {
  return <Link href="/privacy">{chunks}</Link>;
}

function pricingLink(chunks: React.ReactNode) {
  return <Link href="/pricing">{chunks}</Link>;
}

export default async function TermsPage() {
  const t = await getTranslations('Terms');
  const s2items = t.raw('s2items') as string[];
  const s3items = t.raw('s3items') as string[];
  const s6items = t.raw('s6items') as string[];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav variant="pricing" />

      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            {t('pageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('updated')}
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-3xl mx-auto">

          <Section id="postanowienia-ogolne" title={t('s1title')}>
            <p>{t('s1p1')}</p>
            <p>{t('s1p2')}</p>
            <p>{t.rich('s1p3', { link: privacyLink })}</p>
          </Section>

          <Section id="definicje" title={t('s2title')}>
            <ul className="list-disc pl-5 space-y-1.5">
              {s2items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Section>

          <Section id="zakres-uslugi" title={t('s3title')}>
            <p>{t('s3intro')}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {s3items.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p>{t.rich('s3outro', { link: pricingLink })}</p>
          </Section>

          <Section id="konto" title={t('s4title')}>
            <p>{t('s4p1')}</p>
            <p>{t('s4p2')}</p>
          </Section>

          <Section id="platnosci" title={t('s5title')}>
            <p>{t.rich('s5p1', { link: pricingLink })}</p>
          </Section>

          <Section id="obowiazki" title={t('s6title')}>
            <ul className="list-disc pl-5 space-y-1.5">
              {s6items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Section>

          <Section id="odpowiedzialnosc" title={t('s7title')}>
            <p>{t('s7p1')}</p>
            <p>{t('s7p2')}</p>
            <p>{t('s7p3')}</p>
          </Section>

          <Section id="reklamacje" title={t('s8title')}>
            <p>{t('s8p1')}</p>
          </Section>

          <Section id="rozwiazanie" title={t('s9title')}>
            <p>{t.rich('s9p1', { link: privacyLink })}</p>
          </Section>

          <Section id="wlasnosc" title={t('s10title')}>
            <p>{t('s10p1')}</p>
          </Section>

          <Section id="zmiany-regulaminu" title={t('s11title')}>
            <p>{t('s11p1')}</p>
          </Section>

          <Section id="postanowienia-koncowe" title={t('s12title')}>
            <p>{t('s12p1')}</p>
          </Section>

        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
