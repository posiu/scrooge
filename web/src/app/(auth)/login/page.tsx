'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

type Step = 'email' | 'otp' | 'success';

const IS_DEV = process.env.NODE_ENV === 'development';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') ?? '/dashboard';
  const supabase = createClient();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false, // tylko istniejący użytkownicy
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        setError('Nie znaleziono konta z tym adresem email. Skontaktuj się z administratorem.');
      } else {
        setError(error.message);
      }
      return;
    }

    setStep('otp');
  }

  async function handleDevPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !devPassword) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: devPassword,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep('success');
    setTimeout(() => router.push(next), 800);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    });

    setLoading(false);

    if (error) {
      setError('Nieprawidłowy lub wygasły kod. Spróbuj ponownie.');
      return;
    }

    setStep('success');
    setTimeout(() => router.push(next), 1000);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#01581E] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-2xl font-semibold tracking-tight">Scrooge</span>
        </div>

        {/* Quote */}
        <div className="relative">
          <blockquote className="text-white/90 text-xl font-light leading-relaxed mb-6">
            "Wiedza o tym, gdzie idą twoje pieniądze, to dopiero
            <span className="text-white font-medium"> prawdziwa wolność finansowa.</span>"
          </blockquote>
          <div className="flex gap-6 text-white/70 text-sm">
            <div className="flex flex-col">
              <span className="text-white text-2xl font-bold">100%</span>
              <span>kontrola danych</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-2xl font-bold">0 zł</span>
              <span>prowizji</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-2xl font-bold">AI</span>
              <span>asystent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#01581E] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Scrooge</span>
          </div>

          {step === 'email' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Zaloguj się
                </h1>
                <p className="text-muted-foreground text-sm">
                  Wyślemy jednorazowy kod logowania na Twój adres email.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Adres email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="twoj@email.pl"
                      required
                      autoComplete="email"
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-lg border bg-background',
                        'text-foreground placeholder:text-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-[#01581E] focus:border-transparent',
                        'transition-colors',
                        error ? 'border-destructive' : 'border-border',
                      )}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className={cn(
                    'w-full py-3 px-4 rounded-lg font-medium text-white',
                    'bg-[#01581E] hover:bg-[#01581E]/90',
                    'flex items-center justify-center gap-2',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Wyślij kod
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#01581E]" />
                <p>
                  Scrooge używa logowania bez hasła (OTP). Twoje dane finansowe
                  są bezpieczne i dostępne tylko dla Ciebie.
                </p>
              </div>

              {IS_DEV && (
                <div className="mt-6 border border-dashed border-amber-400 rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3">
                    🛠 DEV ONLY — logowanie hasłem
                  </p>
                  <form onSubmit={handleDevPasswordLogin} className="space-y-2">
                    <input
                      type="password"
                      value={devPassword}
                      onChange={(e) => setDevPassword(e.target.value)}
                      placeholder="Hasło (z Supabase dashboard)"
                      className="w-full px-3 py-2 rounded-md border border-amber-300 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={loading || !email.trim() || !devPassword}
                      className="w-full py-2 px-3 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Zaloguj hasłem (dev)
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#01581E]/10 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#01581E]" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  Sprawdź email
                </h1>
                <p className="text-muted-foreground text-sm">
                  Wysłaliśmy 6-cyfrowy kod na{' '}
                  <span className="text-foreground font-medium">{email}</span>.
                  Kod jest ważny przez 10 minut.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium text-foreground">
                    Kod jednorazowy
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    autoComplete="one-time-code"
                    className={cn(
                      'w-full px-4 py-4 rounded-lg border bg-background text-center',
                      'text-foreground text-2xl font-mono tracking-[0.5em]',
                      'focus:outline-none focus:ring-2 focus:ring-[#01581E] focus:border-transparent',
                      'transition-colors',
                      error ? 'border-destructive' : 'border-border',
                    )}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className={cn(
                    'w-full py-3 px-4 rounded-lg font-medium text-white',
                    'bg-[#01581E] hover:bg-[#01581E]/90',
                    'flex items-center justify-center gap-2',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Zaloguj się
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError(null);
                    setOtp('');
                  }}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Zmień adres email
                </button>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="animate-fade-in text-center">
              <div className="w-16 h-16 bg-[#01581E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#01581E]" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Zalogowano!
              </h1>
              <p className="text-muted-foreground text-sm">
                Przekierowuję do aplikacji...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
