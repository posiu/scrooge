export const dynamic = 'force-dynamic';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';
import type { Locale } from '@/i18n/config';

const INTL_LOCALE: Record<Locale, string> = { pl: 'pl-PL', en: 'en-US' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const t = await getTranslations('Settings');
  const locale = await getLocale() as Locale;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title={t('title')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#01581E]" />
            <h2 className="text-sm font-semibold text-foreground">{t('account')}</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('email')}</p>
              <p className="text-sm text-foreground font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('userId')}</p>
              <p className="text-xs font-mono text-muted-foreground">{user.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('lastSignIn')}</p>
              <p className="text-xs text-foreground">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString(INTL_LOCALE[locale]) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-[#01581E]" />
            <h2 className="text-sm font-semibold text-foreground">{t('preferences')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">{t('defaultCurrency')}</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                <option value="PLN">PLN — Polski złoty</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dolar</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">{t('theme')}</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                <option value="system">{t('themeSystem')}</option>
                <option value="light">{t('themeLight')}</option>
                <option value="dark">{t('themeDark')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#01581E]" />
            <h2 className="text-sm font-semibold text-foreground">{t('security')}</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-xs font-medium text-foreground">{t('otpLogin')}</p>
                <p className="text-xs text-muted-foreground">{t('otpLoginHint')}</p>
              </div>
              <span className="text-xs text-[#01581E] font-medium">{t('active')}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-medium text-foreground">{t('encryption')}</p>
                <p className="text-xs text-muted-foreground">{t('encryptionHint')}</p>
              </div>
              <span className="text-xs text-[#01581E] font-medium">{t('active')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-destructive/30 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-destructive mb-2">{t('dangerZone')}</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {t('dangerZoneHint')}
        </p>
        <button className="px-4 py-2 rounded-lg border border-destructive/50 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors">
          {t('deleteAllData')}
        </button>
      </div>
    </div>
  );
}
