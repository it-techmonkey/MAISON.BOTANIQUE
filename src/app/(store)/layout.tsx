import type { ReactNode } from 'react';
import CartDrawer from '@/components/store/CartDrawer';
import SiteFooter from '@/components/store/SiteFooter';
import SiteHeader from '@/components/store/SiteHeader';
import StoreProvider, { T } from '@/components/store/StoreProvider';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import { getCatalog } from '@/lib/shopify/catalog';
import '@/styles/global.css';

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
      <CartDrawer />
      <WhatsAppButton />
    </StoreProvider>
  );
}
