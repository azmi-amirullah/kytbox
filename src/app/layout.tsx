import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClientTopLoader } from '@/components/client-top-loader';
import { Suspense } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/toast-provider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { headers } from 'next/headers';
import { PwaRegister } from '@/components/pwa-register';
import './globals.css';

import { siteConfig } from '@/config/site';

async function NoncedProviders() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <>
      <ClientTopLoader nonce={nonce} />
      <Analytics nonce={nonce} />
      <SpeedInsights nonce={nonce} />
    </>
  );
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'Kytbox',
    'Bio links',
    'Cashflow tracking',
    'Personal kit',
    'Finance',
  ],
  authors: [
    {
      name: siteConfig.creator,
      url: siteConfig.links.twitter,
    },
  ],
  creator: siteConfig.creator,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@azmi_amirullah',
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {supabaseUrl && (
          <>
            <link rel='preconnect' href={supabaseUrl} crossOrigin='anonymous' />
            <link rel='dns-prefetch' href={supabaseUrl} />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem={false}
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <NoncedProviders />
          </Suspense>
          <Suspense fallback={null}>{children}</Suspense>
          <ToastProvider />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
