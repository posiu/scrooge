import { getTranslations } from 'next-intl/server';
import { MarketingNav } from '@/components/landing/MarketingNav';
import { MarketingFooter } from '@/components/landing/MarketingFooter';

// Szablon polityki prywatności dopasowany do faktycznego zakresu przetwarzania
// danych w aplikacji (patrz sekcje 2–4). Ponieważ Scrooge przetwarza dane
// finansowe, przed publikacją produkcyjną zalecana jest weryfikacja przez
// prawnika / IOD — w szczególności pól oznaczonych [DO UZUPEŁNIENIA].

export async function generateMetadata() {
  const t = await getTranslations('Privacy');
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

export default async function PrivacyPage() {
  const t = await getTranslations('Privacy');
  const s2items = t.raw('s2items') as string[];
  const s3items = t.raw('s3items') as string[];
  const s4items = t.raw('s4items') as string[];
  const s5items = t.raw('s5items') as string[];
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

          <Section id="administrator" title={t('s1title')}>
            <p>{t('s1p1')}</p>
            <p className="whitespace-pre-line">{t('s1block')}</p>
            <p>{t('s1p2')}</p>
          </Section>

          <Section id="zakres" title={t('s2title')}>
            <p>{t('s2intro')}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {s2items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Section>

          <Section id="cele" title={t('s3title')}>
            <ul className="list-disc pl-5 space-y-1.5">
              {s3items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Section>

          <Section id="odbiorcy" title={t('s4title')}>
            <p>{t('s4intro')}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {s4items.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p>{t('s4outro')}</p>
          </Section>

          <Section id="okres" title={t('s5title')}>
            <ul className="list-disc pl-5 space-y-1.5">
              {s5items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Section>

          <Section id="prawa" title={t('s6title')}>
            <p>{t('s6intro')}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {s6items.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p>{t('s6outro')}</p>
          </Section>

          <Section id="bezpieczenstwo" title={t('s7title')}>
            <p>{t('s7p1')}</p>
          </Section>

          <Section id="cookies" title={t('s8title')}>
            <p>{t('s8p1')}</p>
          </Section>

          <Section id="zmiany" title={t('s9title')}>
            <p>{t('s9p1')}</p>
          </Section>

          <Section id="kontakt" title={t('s10title')}>
            <p>{t('s10p1')}</p>
          </Section>

        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
