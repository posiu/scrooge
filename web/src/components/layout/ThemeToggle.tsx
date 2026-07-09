'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      title="Zmień motyw"
    >
      <Sun className="w-4 h-4 text-muted-foreground dark:hidden" />
      <Moon className="w-4 h-4 text-muted-foreground hidden dark:block" />
    </button>
  );
}
