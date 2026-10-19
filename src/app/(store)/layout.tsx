import type { ReactNode } from 'react';
import LaunchOffer from '@/components/store/LaunchOffer';
import ShopSheets from '@/components/store/ShopSheets';
import SiteFooter from '@/components/store/SiteFooter';
import SiteHeader from '@/components/store/SiteHeader';
import StoreProvider, { T } from '@/components/store/StoreProvider';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import { getCatalog } from '@/lib/shopify/catalog';
import '@/styles/global.css';
import '@/styles/chrome.css';
import '@/styles/collection.css';
import '@/styles/shop-experience.css';
import '@/styles/launch-offer.css';
import '@/styles/whatsapp.css';

// Every store page shares one catalog request (cached for five minutes and
// refreshed by the Shopify product webhook), the bag and the language choice.
// The /jvc proof sits outside this group and keeps its own styles.
export default async function StoreLayout({ children }: { children: ReactNode }) {
  const catalog = await getCatalog();
  return (
    <StoreProvider catalog={catalog}>
      <a className="skip-link" href="#main"><T en="Skip to content" ar="انتقل إلى المحتوى" /></a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <ShopSheets />
      <LaunchOffer />
      <WhatsAppButton />
    </StoreProvider>
  );
}
