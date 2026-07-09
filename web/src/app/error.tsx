'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
      <div className="w-12 h-12 bg-[#01581E] rounded-xl flex items-center justify-center mb-6">
        <TrendingUp className="w-6 h-6 text-white" />
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-2">500</h1>
      <p className="text-muted-foreground mb-6">Błąd serwera. Spróbuj ponownie.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Spróbuj ponownie
        </button>
        <Link href="/" className="px-4 py-2 rounded-lg bg-[#01581E] text-white text-sm font-medium hover:bg-[#01581E]/90 transition-colors">
          Strona główna
        </Link>
      </div>
    </div>
  );
}
