import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/Toaster';

export const metadata: Metadata = {
  title: {
    default: 'Scrooge — Domowy Controlling',
    template: '%s | Scrooge',
  },
  description: 'Zarządzaj domowym budżetem jak profesjonalista. Budżet vs. realizacja, trendy, raporty i AI asystent finansowy.',
  keywords: ['budżet domowy', 'controlling', 'finanse osobiste', 'wydatki', 'oszczędności'],
  authors: [{ name: 'Scrooge App' }],
  applicationName: 'Scrooge',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Scrooge', statusBarStyle: 'black-translucent' },
  openGraph: {
    title: 'Scrooge — Domowy Controlling',
    description: 'Twój inteligentny asystent domowego budżetu',
    type: 'website',
    locale: 'pl_PL',
  },
};


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
