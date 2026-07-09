'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'font-sans text-sm',
          success: 'border-[#01581E]/30',
        },
      }}
    />
  );
}
