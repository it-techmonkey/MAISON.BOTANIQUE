'use client';

import Image from 'next/image';
import Link from 'next/link';
import { GUIDE_VISUALS } from '@/lib/guide-visuals';
import { ProductRail } from './ProductCard';
import { useStore } from './StoreProvider';
import '@/styles/growth.css';

/** One catalogue photograph under the page title, linked to its product. */
export function GuideHero({ path }: { path: string }) {
  const { ar, products } = useStore();
  const product = products.find((item) => item.id === GUIDE_VISUALS[path]?.hero);
  if (!product) return null;
  return (
    <figure className="guide-hero">
      <div className="guide-hero__media" style={{ backgroundColor: product.bg }}>
        <Image src={product.image} alt={ar ? `${product.nameAr}: ${product.lineAr}` : `${product.name}: ${product.line}`} fill sizes="(max-width: 1100px) 100vw, 1080px" priority />
      </div>
      <figcaption><Link href={`/shop/${product.id}`}>{ar ? product.nameAr : product.name}</Link></figcaption>
    </figure>
  );
}

/** Three catalogue products related to the guide, with the usual details and add-to-bag actions. */
export function GuideProducts({ path }: { path: string }) {
  const { ar, products } = useStore();
  const picked = (GUIDE_VISUALS[path]?.products ?? []).map((id) => products.find((item) => item.id === id)).filter((item) => item !== undefined);
  if (!picked.length) return null;
  const label = ar ? 'تنسيقات للنظر فيها' : 'Arrangements to consider';
  return (
    <section className="section guide-products" aria-label={label}>
      <h2>{label}</h2>
      <ProductRail products={picked} label={label} listId={`guide:${path}`} />
    </section>
  );
}
