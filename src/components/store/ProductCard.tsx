'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/lib/format';
import { trackProductClicked, trackProductListViewed, type ProductListContext } from '@/lib/analytics/track';
import { isMostLoved } from '@/lib/most-loved';
import type { Product } from '@/lib/types';
import { useStore } from './StoreProvider';
import '@/styles/catalog.css';

interface ProductCardProps {
  product: Product;
  /** `sizes` attribute for the responsive image. */
  sizes?: string;
  priority?: boolean;
  /** The list the card appears in and its 1-based position, for click analytics. */
  list?: ProductListContext;
  position?: number;
}

/** Photograph, price and both next steps (details or straight to the bag) on every card. */
export function ProductCard({ product, sizes = '(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 24vw', priority = false, list, position = 0 }: ProductCardProps) {
  const { ar, t, addToBag } = useStore();
  const onOpen = () => { if (list) trackProductClicked(product, list, position); };
  const name = ar ? product.nameAr : product.name;
  const href = `/shop/${product.id}`;
  const fromPrice = product.sizes.length > 1 && new Set(product.sizes.map((size) => size.price)).size > 1;

  return (
    <article className="product-card">
      <Link href={href} className="product-card__media" style={{ backgroundColor: product.bg }} tabIndex={-1} aria-hidden="true" onClick={onOpen}>
        <Image src={product.image} alt="" fill sizes={sizes} priority={priority} />
        {!product.available ? <span className="product-card__badge">{t('Sold out', 'نفدت الكمية')}</span>
          : isMostLoved(product.id) && <span className="product-card__badge">{t('Most loved', 'الأكثر حباً')}</span>}
      </Link>
      <div className="product-card__meta">
        <span>{ar ? product.categoryAr : product.category}</span>
        <span>{fromPrice && <>{t('From', 'من')} </>}{formatMoney(product.price, product.currencyCode, ar)}</span>
      </div>
      <h3 className="product-card__title"><Link href={href} onClick={onOpen}>{name}</Link></h3>
      <p className="product-card__description">{ar ? product.lineAr : product.line}</p>
      <div className="product-card__actions">
        <Link className="product-card__details" href={href} onClick={onOpen} aria-label={`${t('Explore details', 'التفاصيل')}: ${name}`}>
          {t('Explore details', 'التفاصيل')} <span aria-hidden="true">↗</span>
        </Link>
        <button type="button" className="product-card__add" disabled={!product.available} onClick={() => addToBag(product, { source: list ? `card:${list.listId}` : 'card' })}
          aria-label={product.available ? `${t('Add to bag', 'أضف إلى الحقيبة')}: ${name}` : undefined}>
          {product.available ? t('Add to bag', 'أضف إلى الحقيبة') : t('Sold out', 'نفدت الكمية')}
        </button>
      </div>
    </article>
  );
}

/** Horizontal, snap-scrolling row of products with previous/next controls. */
export function ProductRail({ products, label, listId }: { products: Product[]; label: string; listId: string }) {
  const { ar, t } = useStore();
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: products.length <= 4 });

  const update = () => {
    const rail = railRef.current;
    if (!rail) return;
    const distance = Math.abs(rail.scrollLeft);
    const max = rail.scrollWidth - rail.clientWidth;
    setEdges({ start: distance < 4, end: distance > max - 4 });
  };
  const move = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>('.product-card');
    const step = (card?.offsetWidth ?? 320) + 24;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({ left: direction * step * (ar ? -1 : 1), behavior: reduced ? 'auto' : 'smooth' });
  };

  if (!products.length) return null;
  return (
    <div className="rail">
      <div className="rail__controls">
        <button type="button" className="round-button" onClick={() => move(-1)} disabled={edges.start} aria-label={t('Previous pieces', 'القطع السابقة')}>
          <span className="flip-rtl" aria-hidden="true">←</span>
        </button>
        <button type="button" className="round-button" onClick={() => move(1)} disabled={edges.end} aria-label={t('Next pieces', 'القطع التالية')}>
          <span className="flip-rtl" aria-hidden="true">→</span>
        </button>
      </div>
      <div className="rail__track" ref={railRef} onScroll={update} role="region" aria-label={label} tabIndex={0}>
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} list={{ listId }} position={index + 1}
            sizes="(max-width: 640px) 78vw, (max-width: 1100px) 42vw, 24vw" />
        ))}
      </div>
    </div>
  );
}

interface CatalogSelection {
  occasion?: string;
  /** Limit to one Shopify collection, in its own order. */
  collection?: string;
  /** Leave this product out, e.g. the one on the current page. */
  exclude?: string;
  limit?: number;
}

function useSelection({ occasion, collection, exclude, limit }: CatalogSelection) {
  const { products, collections } = useStore();
  let picked = products;
  if (collection) {
    const byId = new Map(products.map((product) => [product.id, product]));
    picked = (collections.find((item) => item.id === collection)?.productIds ?? [])
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
  }
  picked = picked.filter((product) => product.id !== exclude && (!occasion || product.occasions.includes(occasion)));
  return limit ? picked.slice(0, limit) : picked;
}

/** A rail of catalog products, for server-rendered pages. */
export function CatalogRail(props: CatalogSelection & { label: { en: string; ar: string }; listId: string }) {
  const { ar } = useStore();
  const products = useSelection(props);
  return <ProductRail products={products} label={ar ? props.label.ar : props.label.en} listId={props.listId} />;
}

/** Reports a product list impression once per list and set of products. */
export function useListViewed(context: ProductListContext, products: Product[], enabled = true) {
  const key = `${context.listId}|${JSON.stringify(context.filters ?? {})}|${products.map((product) => product.id).join(',')}`;
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || reported.current === key) return;
    reported.current = key;
    trackProductListViewed(context, products);
    // `key` captures everything the event depends on.
  }, [key, enabled]);
}

/** A grid of catalog products, for server-rendered pages. */
export function CatalogGrid(props: CatalogSelection & { listId: string }) {
  const { t } = useStore();
  const products = useSelection(props);
  useListViewed({ listId: props.listId }, products);
  if (!products.length) {
    return (
      <div className="empty-state">
        <h2>{t('New pieces are being arranged.', 'قطع جديدة قيد التنسيق.')}</h2>
        <p>{t('Browse the full collection, or ask us to arrange something especially for the occasion.', 'تصفّح المجموعة كاملة، أو اطلب منا تنسيقاً خاصاً لهذه المناسبة.')}</p>
        <div className="empty-state__actions">
          <Link className="button button--ghost" href="/shop">{t('Shop the collection', 'تسوّق المجموعة')} <span aria-hidden="true">↗</span></Link>
          <Link className="button" href="/contact">{t('Ask the flower desk', 'اسأل مكتب الزهور')} <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    );
  }
  return <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} list={{ listId: props.listId }} position={index + 1} />)}</div>;
}
