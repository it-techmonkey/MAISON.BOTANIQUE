'use client';

import { SHOW_COLLECTION_EVENT, occasionHash, type ShowCollectionDetail } from '@/lib/site';
import { CollectionLink } from './SiteHeader';

import { useMemo, type MouseEvent } from 'react';
import { BUDGET_BANDS, budgetOf, liveCatalogGroups } from '@/lib/catalog-groups';
import { useStore } from './StoreProvider';
import { DiwaliBar, HalloweenShelf } from './SeasonalBands';
import { isSeasonal } from '@/lib/seasonal';

/**
 * "View all" goes down to the full collection just below on the home page,
 * cleared of any filter, rather than to the separate /shop page.
 */
function SectionHead({ id, title, label, occasions = false }: { id?: string; title: string; label: string; occasions?: boolean }) {
  const viewAll = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    history.replaceState(null, '', '#shop');
    window.dispatchEvent(new CustomEvent<ShowCollectionDetail>(SHOW_COLLECTION_EVENT, { detail: { occasions } }));
  };
  return (
    <div className="hs-head">
      <h2 id={id}>{title}</h2>
      <a className="hs-viewall" href="#shop" onClick={viewAll}>{label} <span aria-hidden="true">→</span></a>
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
      const items = products.filter((product) => product.occasions.includes(occasion.id) && !isSeasonal(product.id));
      const pick = items.find((product) => !used.has(product.id)) ?? items[0];
      if (pick) used.add(pick.id);
      return { ...occasion, image: pick?.imageSmall };
    });
  }, [occasions, products]);

  return (
    <section id="occasions" className="hs" aria-labelledby="hs-occasions" data-track-section="home_occasions" data-track-location="home_occasions">
      <SectionHead id="hs-occasions" title={t('Shop by Occasion', 'تسوّق حسب المناسبة')} occasions label={t('View all', 'عرض الكل')} />
      <ul className="hs-occasions">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <CollectionLink hash={occasionHash(tile.id)}>
              <span className="hs-occasions__img">{tile.image && <img src={tile.image} alt="" loading="lazy" width="120" height="120" />}</span>
              <span>{ar ? tile.ar : tile.en}</span>
            </CollectionLink>
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
    image: products.find((product) => budgetOf(product.price) === band.id && product.available && !isSeasonal(product.id))?.imageSmall,
  })).filter((tile) => tile.image), [products]);

  return (
    <section className="hs" aria-labelledby="hs-budget" data-track-section="home_budget" data-track-location="home_budget">
      <SectionHead id="hs-budget" title={t('A gift for every gesture', 'هدية لكل لفتة')} label={t('View all', 'عرض الكل')} />
      <ul className="hs-budget">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <CollectionLink hash={`budget/${tile.id}`}>
              <span className="hs-budget__copy"><span>{ar ? tile.ar : tile.en}</span><span aria-hidden="true">→</span></span>
              <img src={tile.image} alt="" loading="lazy" width="240" height="240" />
            </CollectionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Home order (owner, 19 Oct): A gift for every gesture, then Shop by Occasion,
// then straight into the full collection. Seasonal (owner, 25 Oct 2026): the
// Halloween shelf comes before A gift for every gesture, the Diwali band after it. Most loved is a tag on products
// (src/data/most-loved.json), not a section.
export default function HomeSections() {
  return (
    <>
      <HalloweenShelf />
      <BudgetTiles />
      <DiwaliBar />
      <OccasionTiles />
    </>
  );
}
