'use client';

import { SHOW_COLLECTION_EVENT, type ShowCollectionDetail } from '@/lib/site';
import { T } from './StoreProvider';

/**
 * A paper tab on the hero's bottom edge telling first-time visitors the page
 * continues below the featured arrangements. It sits in the pinned hero, so it
 * stays in view while they browse the three and leaves with the hero. Tapping
 * it goes to the full collection, the same way "View all" does.
 */
export default function ScrollHint() {
  const goToCollection = () => {
    history.replaceState(null, '', '#shop');
    window.dispatchEvent(new CustomEvent<ShowCollectionDetail>(SHOW_COLLECTION_EVENT, { detail: { occasions: false } }));
  };
  return (
    <button type="button" className="tt-scroll-hint" onClick={goToCollection}>
      <T en="Scroll to explore the collection" ar="مرّروا لاستكشاف المجموعة" />
      <span className="tt-scroll-hint__arrow" aria-hidden="true">↓</span>
    </button>
  );
}
