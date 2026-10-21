import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans, Noto_Naskh_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';
import AnalyticsListeners from '@/components/analytics/AnalyticsListeners';
import ShopifyAnalytics from '@/components/analytics/ShopifyAnalytics';
import ShopifyScriptTags from '@/components/analytics/ShopifyScriptTags';
import { SITE_URL } from '@/lib/site';

// Storefront typography: Cormorant Garamond for headlines, DM Sans for body
// and UI, Noto Naskh Arabic for the Arabic storefront. The Arabic face (92KB)
// is not preloaded: English pages never need it, and Arabic text requests it.
const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400', '500', '600'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap' });
const body = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const arabic = Noto_Naskh_Arabic({ subsets: ['arabic'], variable: '--font-naskh', display: 'swap', preload: false });

// The review site stays out of search results until SITE_INDEXABLE=true.
const indexable = process.env.SITE_INDEXABLE === 'true';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Maison Botanique — Flowers for the Art of Giving',
    template: '%s · Maison Botanique',
  },
  description: 'Considered bouquets and thoughtful gifts for the people, places and moments that matter. A floral house in Dubai.',
  icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
  openGraph: { siteName: 'Maison Botanique', type: 'website', locale: 'en_AE', alternateLocale: ['ar_AE'] },
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F5F2EB',
};

// Applies a saved Arabic preference before the first paint. The page stays
// hidden until the store provider has rendered Arabic text (or 1.5s pass).
const localeScript = `try{if(localStorage.getItem('maison-botanique-locale')==='ar'){var d=document.documentElement;d.lang='ar';d.dir='rtl';d.classList.add('mb-locale-pending');setTimeout(function(){d.classList.remove('mb-locale-pending')},1500)}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${display.variable} ${body.variable} ${arabic.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeScript }} />
        <ShopifyScriptTags />
      </head>
      <body>
        {children}
        <ShopifyAnalytics />
        <AnalyticsListeners />
      </body>
    </html>
  );
}
