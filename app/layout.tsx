'use client';

import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import PreAlphaWarning from '@/components/pre-alpha-warning';
import CookieConsentBanner from '@/components/cookie-consent-banner';
import { YMaps } from '@pbe/react-yandex-maps';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

// Metadata object cannot be exported from a client component.
// We can either move it to a parent layout or remove it if not strictly necessary.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <title>T-mapinc</title>
        <meta name="description" content="Интерактивная карта с отзывами пользователей" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('antialiased font-body', inter.className)}>
        <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY }}>
          <FirebaseClientProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <main className="flex-grow">{children}</main>
                <footer className="bg-card border-t p-4 text-center text-sm text-muted-foreground">
                  <p>© {new Date().getFullYear()} T-mapinc. Все права защищены.</p>
                </footer>
              </div>
              <Toaster />
              <PreAlphaWarning />
              <CookieConsentBanner />
            </AuthProvider>
          </FirebaseClientProvider>
        </YMaps>
      </body>
    </html>
  );
}
