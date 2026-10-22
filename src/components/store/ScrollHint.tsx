import { T } from './StoreProvider';

/**
 * A paper tab on the hero's bottom edge telling first-time visitors the page
 * continues below the featured arrangements. It sits in the pinned hero, so it
 * stays in view while they browse the three and leaves with the hero.
 */
export default function ScrollHint() {
  return (
    <p className="tt-scroll-hint">
      <T en="Scroll to explore the collection" ar="مرّروا لاستكشاف المجموعة" />
      <span className="tt-scroll-hint__arrow" aria-hidden="true">↓</span>
    </p>
  );
}
