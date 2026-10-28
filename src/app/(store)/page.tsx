import type { Metadata } from 'next';
import Turntable from '@/components/Turntable';
import HeroPromises from '@/components/store/HeroPromises';
import ShopShelf from '@/components/store/ShopShelf';
import CollectionBrowser from '@/components/store/CollectionBrowser';
import HomeSections from '@/components/store/HomeSections';
import { ResidencesBand } from '@/components/store/Residences';
import '@/styles/home.css';
import { dubaiNow } from '@/lib/delivery';

// Rebuild at most every five minutes; the Shopify product webhook
// (/api/revalidate) refreshes the catalog immediately after an edit.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: 'Flower Delivery in Dubai | Maison Botanique' },
  description: 'Explore bouquets and thoughtful gifts from Maison Botanique, with a handwritten card and delivery across the UAE.',
  alternates: { canonical: '/' },
};

// The complete shopping journey, with the standalone /shop kept for direct links.
export default function HomePage() {
  return (
    <>
      <Turntable />
      <ShopShelf />
      <HeroPromises />
      <HomeSections initialDubaiDate={dubaiNow().date} />
      <CollectionBrowser listId="home" showOccasions={false} />
      <ResidencesBand />
    </>
  );
}
