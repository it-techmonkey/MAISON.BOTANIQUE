import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/store/blocks';
import { UrlShopBrowser } from '@/components/store/ShopBrowser';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Shop the collection',
  description: 'Bouquets, gifts and preserved flowers from Maison Botanique in Dubai. Browse by type or occasion.',
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  return (
    <div className="section section--top">
      <PageHero
        eyebrow={{ en: 'Maison Botanique · Dubai', ar: 'ميزون بوتانيك · دبي' }}
        title={{ en: 'The collection.', ar: 'المجموعة.' }}
        intro={{
          en: 'A considered piece for every kind of gesture. Begin with the person, the occasion, or the flowers.',
          ar: 'قطعة مختارة لكل لفتة. ابدأ بالشخص أو المناسبة أو الزهور.',
        }} />
      {/* Filters live in the URL, which is only known in the browser. */}
      <Suspense fallback={<div className="product-grid product-grid--loading" aria-hidden="true" />}>
        <UrlShopBrowser />
      </Suspense>
    </div>
  );
}
