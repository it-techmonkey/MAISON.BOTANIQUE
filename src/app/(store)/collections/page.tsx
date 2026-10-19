import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PageHero } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';
import { getCatalog } from '@/lib/shopify/catalog';
import '@/styles/pages.css';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Every Maison Botanique collection: bouquets, gifts and preserved flowers, gathered by theme.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsPage() {
  const { collections, products } = await getCatalog();
  const imageOf = new Map(products.map((product) => [product.id, product.image]));

  return (
    <div className="section section--top">
      <PageHero
        eyebrow={{ en: 'Maison Botanique · Dubai', ar: 'ميزون بوتانيك · دبي' }}
        title={{ en: 'Collections.', ar: 'المجموعات.' }}
        intro={{ en: 'Pieces gathered by theme, season and gesture.', ar: 'قطع مجمّعة حسب الطابع والموسم واللفتة.' }} />
      {collections.length ? (
        <ul className="occasion-list">
          {collections.map((collection) => {
            const image = collection.image ?? imageOf.get(collection.productIds[0]) ?? '/assets/placeholder.svg';
            return (
              <li key={collection.id}>
                <Link href={`/collections/${collection.id}`} className="occasion-card">
                  <span className="occasion-card__media">
                    <Image src={image} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
                  </span>
                  <span className="occasion-card__index">
                    <T en={`${collection.productIds.length} ${collection.productIds.length === 1 ? 'piece' : 'pieces'}`}
                      ar={`${new Intl.NumberFormat('ar-AE').format(collection.productIds.length)} قطعة`} />
                  </span>
                  <strong><T en={collection.title} ar={collection.titleAr} /></strong>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <h2><T en="Collections are being arranged." ar="المجموعات قيد التنسيق." /></h2>
          <div className="empty-state__actions">
            <Link className="button" href="/shop"><T en="Shop all pieces" ar="تسوّق كل القطع" /> <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      )}
    </div>
  );
}
