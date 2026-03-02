import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { TopBar } from '@/components/TopBar';
import './globals.css';

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Palantir - Intelligence Terminal',
  description: 'Real-time prediction market intelligence',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrains.variable} min-h-screen bg-background text-foreground antialiased font-[family-name:var(--font-jetbrains)]`}
      >
        <Providers>
          <div className="flex h-screen flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-hidden bg-background">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
