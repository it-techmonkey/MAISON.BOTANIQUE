import type { Metadata } from 'next';
import CollectionBrowser from '@/components/store/CollectionBrowser';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Shop the collection',
  description: 'Roses, bouquets, vases, boxes and flower gifts from Maison Botanique in Dubai. Browse by occasion, flower, format or budget.',
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  return (
    <div className="section--top">
      <CollectionBrowser listId="shop" eagerImages={6} />
    </div>
  );
}
