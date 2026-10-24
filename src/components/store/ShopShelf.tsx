'use client';

import { useMemo, type MouseEvent } from 'react';
import { SHOW_COLLECTION_EVENT, type ShowCollectionDetail } from '@/lib/site';
import { liveCatalogGroups } from '@/lib/catalog-groups';
import { CollectionLink } from './SiteHeader';
import { useStore } from './StoreProvider';

/** The ways in shown on the first screen, in order. Groups the catalogue cannot fill yet are skipped. */
const SHELF_GROUPS = ['roses', 'bouquets', 'boxes', 'gifts', 'plants', 'vases', 'under-300'];

/**
 * A row of round category photographs directly under the hero, so the first
 * screen shows there is a whole shop here, and visitors who never scroll can
 * tap straight into it. The row runs off the screen's edge on phones.
 */
export default function ShopShelf() {
  const { ar, t, products } = useStore();
  const chips = useMemo(() => {
    const { findGroup } = liveCatalogGroups(products);
    return SHELF_GROUPS.flatMap((id) => {
      const group = findGroup(id);
      const photo = group && products.find((product) => product.available && product.imageSmall && group.test(product))?.imageSmall;
      return group && photo ? [{ id, label: ar ? group.ar : group.en, photo }] : [];
    });
  }, [ar, products]);

  const showAll = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    history.replaceState(null, '', '#shop');
    window.dispatchEvent(new CustomEvent<ShowCollectionDetail>(SHOW_COLLECTION_EVENT, { detail: { occasions: false } }));
  };

  if (!chips.length) return null;
  return (
    <nav className="shelf" aria-label={t('Shop by category', 'تسوّق حسب الفئة')} data-track-section="home_shelf" data-track-location="home_shelf">
      <ul>
        <li>
          <a href="#shop" onClick={showAll} className="shelf__all">
            <span className="shelf__img shelf__img--all" aria-hidden="true">→</span>
            <span>{t('Shop all', 'تسوّق الكل')}</span>
          </a>
        </li>
        {chips.map((chip) => (
          <li key={chip.id}>
            <CollectionLink hash={chip.id}>
              <span className="shelf__img"><img src={chip.photo} alt="" loading="lazy" width="96" height="96" /></span>
              <span>{chip.label}</span>
            </CollectionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
