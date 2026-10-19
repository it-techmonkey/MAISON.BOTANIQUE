'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trackProductClicked, trackProductListViewed } from '@/lib/analytics/track';
import { BUDGET_BANDS, budgetOf, liveCatalogGroups } from '@/lib/catalog-groups';
import type { Product } from '@/lib/types';
import { formatAED } from './ShopSheets';
import { useStore } from './StoreProvider';

const FAVOURITE_TABS = ['all', 'roses', 'bouquets', 'boxes', 'vases', 'gifts', 'grand-gestures'];
const FAVOURITES = 12;
const SETTLE_MS = 900;

function SectionHead({ id, title, href, label }: { id?: string; title: string; href: string; label: string }) {
  return (
    <div className="hs-head">
      <h2 id={id}>{title}</h2>
      <Link className="hs-viewall" href={href}>{label} <span aria-hidden="true">→</span></Link>
    </div>
  );
}

/** Shop by occasion: one round photograph per occasion, each a different piece. */
function OccasionTiles() {
  const { ar, t, products } = useStore();
  const { occasions } = useMemo(() => liveCatalogGroups(products), [products]);
  const tiles = useMemo(() => {
    const used = new Set<string>();
    return occasions.map((occasion) => {
      const items = products.filter((product) => product.occasions.includes(occasion.id));
      const pick = items.find((product) => !used.has(product.id)) ?? items[0];
      if (pick) used.add(pick.id);
      return { ...occasion, image: pick?.imageSmall };
    });
  }, [occasions, products]);

  return (
    <section id="occasions" className="hs" aria-labelledby="hs-occasions" data-track-section="home_occasions" data-track-location="home_occasions">
      <SectionHead id="hs-occasions" title={t('Shop by Occasion', 'تسوّق حسب المناسبة')} href="/occasions" label={t('View all', 'عرض الكل')} />
      <ul className="hs-occasions">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link href={`/occasions/${tile.id}`}>
              <span className="hs-occasions__img">{tile.image && <img src={tile.image} alt="" loading="lazy" width="120" height="120" />}</span>
              <span>{ar ? tile.ar : tile.en}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shop by budget: four bands, each with a photograph of a piece in that band. */
function BudgetTiles() {
  const { ar, t, products } = useStore();
  const tiles = useMemo(() => BUDGET_BANDS.map((band) => ({
    ...band,
    image: products.find((product) => budgetOf(product.price) === band.id && product.available)?.imageSmall,
  })).filter((tile) => tile.image), [products]);

  return (
    <section className="hs" aria-labelledby="hs-budget" data-track-section="home_budget" data-track-location="home_budget">
      <SectionHead id="hs-budget" title={t('Shop by Budget', 'تسوّق حسب الميزانية')} href="/shop" label={t('View all', 'عرض الكل')} />
      <ul className="hs-budget">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link href={`/shop#budget/${tile.id}`}>
              <span className="hs-budget__copy"><span>{ar ? tile.ar : tile.en}</span><span aria-hidden="true">→</span></span>
              <img src={tile.image} alt="" loading="lazy" width="240" height="240" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A row of the most loved pieces, filterable by type, moved with the arrows. */
function Favourites() {
  const { ar, t, products, openProduct } = useStore();
  const catalog = useMemo(() => liveCatalogGroups(products), [products]);
  const tabs = FAVOURITE_TABS.map((id) => catalog.findGroup(id)).filter((group) => group !== null);
  const [tab, setTab] = useState('all');
  const trackRef = useRef<HTMLUListElement>(null);
  const list = useMemo(() => {
    const group = catalog.findGroup(tab);
    return products.filter((product) => product.available && (!group || group.test(product))).sort((a, b) => a.order - b.order).slice(0, FAVOURITES);
  }, [products, catalog, tab]);
  const listId = `home_favourites:${tab}`;

  useEffect(() => {
    const timer = window.setTimeout(() => trackProductListViewed({ listId, filters: { tab } }, list), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [listId]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.9 * (ar ? -1 : 1), behavior: 'smooth' });
  };
  const open = (product: Product, index: number) => {
    trackProductClicked(product, { listId }, index + 1);
    openProduct(product);
  };

  return (
    <section className="hs" aria-labelledby="hs-favourites" data-track-section="home_favourites" data-track-location="home_favourites">
      <SectionHead id="hs-favourites" title={t('Most loved', 'الأكثر حباً')} href="/shop" label={t('View all', 'عرض الكل')} />
      <div className="hs-tabs" role="tablist" aria-label={t('Most loved by type', 'الأكثر حباً حسب النوع')}>
        {tabs.map((group) => (
          <button key={group.id} type="button" role="tab" aria-selected={tab === group.id} onClick={() => setTab(group.id)}>{ar ? group.ar : group.en}</button>
        ))}
      </div>
      <div className="hs-rail">
        <ul className="hs-rail__track" ref={trackRef}>
          {list.map((product, index) => {
            const name = ar ? product.nameAr : product.name;
            return (
              <li key={product.id} className="hs-card">
                <button type="button" className="hs-card__frame" onClick={() => open(product, index)} aria-label={name}>
                  <img src={product.imageSmall} alt={ar ? name : product.imageAlt} width="480" height="480" loading={index < 4 ? 'eager' : 'lazy'} decoding="async" />
                  {index === 0 && tab === 'all' && <span className="hs-card__badge">{t('Most loved', 'الأكثر حباً')}</span>}
                </button>
                <h3><button type="button" onClick={() => open(product, index)}>{name}</button></h3>
                <p className="hs-card__line">{ar ? product.lineAr : product.line}</p>
                <p className="hs-card__price">
                  {product.sizes.length > 1 ? `${t('From', 'من')} ` : ''}{formatAED(product.price, ar)}
                  {product.compareAtPrice && <s>{formatAED(product.compareAtPrice, ar)}</s>}
                </p>
                <button type="button" className="hs-card__add" onClick={() => open(product, index)}>{t('Add to bag', 'أضف إلى الحقيبة')}</button>
              </li>
            );
          })}
        </ul>
        <div className="hs-rail__arrows">
          <button type="button" onClick={() => move(-1)} aria-label={t('Previous pieces', 'القطع السابقة')}>{ar ? '→' : '←'}</button>
          <button type="button" onClick={() => move(1)} aria-label={t('Next pieces', 'القطع التالية')}>{ar ? '←' : '→'}</button>
        </div>
      </div>
    </section>
  );
}

export default function HomeSections() {
  return (
    <>
      <OccasionTiles />
      <BudgetTiles />
      <Favourites />
    </>
  );
}
