import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { TopBar } from '@/components/TopBar';
import { WalkthroughOverlay } from '@/components/WalkthroughOverlay';
import './globals.css';

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Palantir - Intelligence Terminal',
  description: 'Real-time prediction market intelligence',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
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
          <a
            href="#main-content"
            className="skip-to-content"
          >
            Skip to main content
          </a>
          <div className="flex h-screen flex-col overflow-hidden">
            <TopBar />
            <main id="main-content" className="flex-1 overflow-hidden bg-background" tabIndex={-1}>
              <RouteErrorBoundary>{children}</RouteErrorBoundary>
            </main>
            <WalkthroughOverlay />
          </div>
        </Providers>
      </body>
    </html>
  );
}
