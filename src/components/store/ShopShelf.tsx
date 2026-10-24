'use client';

import { useMemo } from 'react';
import { liveCatalogGroups } from '@/lib/catalog-groups';
import { isSeasonal } from '@/lib/seasonal';
import type { Product } from '@/lib/types';
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
    // Every chip gets its own photograph: a piece already shown on an earlier chip is skipped, and
    // some chips prefer something that is not a rose, so the row does not repeat the same bouquet.
    const prefer: Record<string, (product: Product) => boolean> = {
      bouquets: (product) => !product.flowers.includes('rose'),
      'under-300': (product) => !product.flowers.includes('rose'),
    };
    const used = new Set<string>();
    return SHELF_GROUPS.flatMap((id) => {
      const group = findGroup(id);
      if (!group) return [];
      const pool = products.filter((product) => product.available && product.imageSmall && !isSeasonal(product.id) && group.test(product));
      const wanted = prefer[id];
      const pick = (wanted && pool.find((product) => !used.has(product.id) && wanted(product))) || pool.find((product) => !used.has(product.id)) || pool[0];
      if (!pick) return [];
      used.add(pick.id);
      return [{ id, label: ar ? group.ar : group.en, photo: pick.imageSmall }];
    });
  }, [ar, products]);

  if (!chips.length) return null;
  return (
    <nav className="shelf" aria-label={t('Shop by category', 'تسوّق حسب الفئة')} data-track-section="home_shelf" data-track-location="home_shelf">
      <ul>
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
