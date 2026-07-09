export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Header title="Ustawienia" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#01581E]" />
            <h2 className="text-sm font-semibold text-foreground">Konto</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="text-sm text-foreground font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID użytkownika</p>
              <p className="text-xs font-mono text-muted-foreground">{user.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ostatnie logowanie</p>
              <p className="text-xs text-foreground">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pl-PL') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-[#01581E]" />
            <h2 className="text-sm font-semibold text-foreground">Preferencje</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Waluta domyślna</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                <option value="PLN">PLN — Polski złoty</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dolar</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Motyw</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                <option value="system">Systemowy</option>
                <option value="light">Jasny</option>
                <option value="dark">Ciemny</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#01581E]" />
            <h2 className="text-sm font-semibold text-foreground">Bezpieczeństwo</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-xs font-medium text-foreground">Logowanie OTP</p>
                <p className="text-xs text-muted-foreground">Bez hasła — kod jednorazowy</p>
              </div>
              <span className="text-xs text-[#01581E] font-medium">Aktywne</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-medium text-foreground">Szyfrowanie danych</p>
                <p className="text-xs text-muted-foreground">Supabase RLS + TLS</p>
              </div>
              <span className="text-xs text-[#01581E] font-medium">Aktywne</span>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-destructive/30 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-destructive mb-2">Strefa niebezpieczna</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Te operacje są nieodwracalne. Przed wykonaniem upewnij się, że masz kopię zapasową.
        </p>
        <button className="px-4 py-2 rounded-lg border border-destructive/50 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors">
          Usuń wszystkie dane
        </button>
      </div>
    </div>
  );
}
