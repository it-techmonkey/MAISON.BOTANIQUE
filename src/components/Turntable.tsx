'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { trackHeroClicked, trackHeroNavigated } from '@/lib/analytics/track';
import { formatMoney } from '@/lib/format';
import { SHOW_COLLECTION_EVENT, type ShowCollectionDetail } from '@/lib/site';
import SaleTag from './store/SaleTag';
import { useStore } from './store/StoreProvider';
import '../styles/turntable.css';
import Money from './store/Money';

gsap.registerPlugin(useGSAP);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The design's resting pose for the arrangement and its shadow. */
const REST_POSE = { xPercent: 15, yPercent: 9, scale: 0.88, rotation: -2 };
const SHADOW_REST = { xPercent: 8, scale: 0.84, opacity: 0.32 };
/** Phones: the arrangement sits centred within the page margins, not pushed right. */
const MOBILE = '(max-width: 680px)';
const MOBILE_REST_POSE = { ...REST_POSE, xPercent: 0, yPercent: 6, scale: 0.9 };
const MOBILE_SHADOW_REST = { ...SHADOW_REST, xPercent: 0 };
const isMobile = () => typeof window !== 'undefined' && window.matchMedia(MOBILE).matches;
const restPose = () => (isMobile() ? MOBILE_REST_POSE : REST_POSE);
const shadowRest = () => (isMobile() ? MOBILE_SHADOW_REST : SHADOW_REST);

/** The featured arrangements advance on their own this often until the visitor takes over. */
const AUTOPLAY_MS = 5500;

/** Product names longer than this use the smaller two-line title. */
const LONG_TITLE_CHARACTERS = 22;

interface TurntableProps {
  onActiveChange?: (index: number) => void;
}

/**
 * Home hero: three featured arrangements. The page scrolls normally (nothing is
 * pinned). The arrangements advance on their own, and the arrows, dots and
 * swipes move between them, each one travelling through the scene (the
 * outgoing piece drifts up and away, the next arrives and settles).
 */
export default function Turntable({ onActiveChange }: TurntableProps) {
  const { products, locale, live, openProduct } = useStore();
  const looks = useMemo(() => products
    .filter((product) => product.featured)
    .sort((a, b) => (a.heroOrder ?? 99) - (b.heroOrder ?? 99))
    .slice(0, 3), [products]);
  const count = looks.length;
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<gsap.core.Timeline | null>(null);
  const activeRef = useRef(0);
  const onActiveChangeRef = useRef(onActiveChange);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Autoplay stops for good once the visitor moves the hero themselves, and
  // pauses while the pointer or focus is on it or the hero is off screen.
  const [manual, setManual] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const arabic = locale === 'ar';
  onActiveChangeRef.current = onActiveChange;

  const commitActive = useCallback((next: number) => {
    const bounded = clamp(next, 0, Math.max(count - 1, 0));
    if (activeRef.current === bounded) return;
    activeRef.current = bounded;
    setActive(bounded);
    onActiveChangeRef.current?.(bounded);
  }, [count]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    activeRef.current = 0;
    setActive(0);
    onActiveChangeRef.current?.(0);
  }, [count]);

  // The resting pose matches the storefront design: the arrangement sits a
  // little smaller, lower right and tilted (centred on phones; also set in
  // turntable.css, so it holds before hydration). GSAP takes over that pose
  // for the transitions, and resets it when the screen crosses the phone width.
  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const images = gsap.utils.toArray<HTMLElement>('.tt-artwork__image', section);
    const shadow = section.querySelector('.tt-artwork__ground');
    const media = gsap.matchMedia();
    media.add({ mobile: MOBILE, wide: '(min-width: 681px)' }, () => {
      // x/y reset: GSAP would otherwise read the CSS translate as a pixel
      // offset and add the percentage offset on top of it.
      gsap.set(images, { x: 0, y: 0, ...restPose() });
      if (shadow) gsap.set(shadow, { x: 0, ...shadowRest() });
    });
    return () => media.revert();
  }, { scope: sectionRef, dependencies: [count] });

  const goTo = useCallback((next: number, heading?: 1 | -1) => {
    const from = activeRef.current;
    const bounded = clamp(next, 0, Math.max(count - 1, 0));
    if (bounded === from) return;
    const direction = heading ?? (bounded > from ? 1 : -1);
    commitActive(bounded);
    const arrived = looks[bounded];
    if (arrived) trackHeroNavigated(arrived, direction > 0 ? 'next' : 'previous', bounded + 1, count);

    const section = sectionRef.current;
    if (!section || reducedMotion) return;
    const images = section.querySelectorAll<HTMLElement>('.tt-artwork__image');
    const outgoing = images[from];
    const incoming = images[bounded];
    const shadow = section.querySelector('.tt-artwork__ground');
    if (!outgoing || !incoming) return;

    // A move during a move continues from wherever each piece is, rather than
    // snapping the running move to its end (that jump read as a stutter when
    // clicking quickly through the hero).
    transitionRef.current?.kill();
    const pose = restPose();
    const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut', overwrite: 'auto' } });
    images.forEach((image) => {
      if (image !== incoming && Number(gsap.getProperty(image, 'opacity')) > 0) {
        timeline.to(image, { opacity: 0, xPercent: pose.xPercent - 26 * direction, yPercent: 3, scale: 0.94, rotation: -2 - 1.5 * direction, duration: 0.7 }, 0);
      }
    });
    if (Number(gsap.getProperty(incoming, 'opacity')) < 0.05) {
      gsap.set(incoming, { opacity: 0, xPercent: 22 * direction + pose.xPercent, yPercent: 12, scale: 0.84, rotation: 1.5 * direction });
    }
    timeline.to(incoming, { opacity: 1, ...pose, duration: 0.85, ease: 'power3.out' }, 0.1);
    if (shadow) timeline.to(shadow, { ...shadowRest(), duration: 0.85, ease: 'power3.out' }, 0.1);
    transitionRef.current = timeline;
  }, [commitActive, count, looks, reducedMotion]);

  /** Moves one arrangement along, wrapping at either end. `byVisitor` ends autoplay. */
  const step = useCallback((direction: 1 | -1, byVisitor = true) => {
    if (count < 2) return;
    if (byVisitor) setManual(true);
    goTo((activeRef.current + direction + count) % count, direction);
  }, [count, goTo]);

  const jumpTo = (index: number) => {
    setManual(true);
    goTo(index);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.5 });
    observer.observe(section);
    return () => observer.disconnect();
  }, [count]);

  // Autoplay: a fresh timer after every change, so a manual move or a pause
  // never lands a second move straight after it.
  useEffect(() => {
    if (reducedMotion || manual || hovered || !visible || count < 2) return undefined;
    const timer = window.setTimeout(() => step(1, false), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, count, hovered, manual, reducedMotion, step, visible]);

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // A deliberate sideways swipe moves one arrangement; vertical drags are page scrolls.
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    step((dx < 0) !== arabic ? 1 : -1);
  };

  const showAll = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    history.replaceState(null, '', '#shop');
    window.dispatchEvent(new CustomEvent<ShowCollectionDetail>(SHOW_COLLECTION_EVENT, { detail: { occasions: false } }));
  };

  useEffect(() => () => { transitionRef.current?.kill(); }, []);

  // Fit the copy column: when the intro and the product details are taller
  // than the space between the header and the arrows (short screens, long
  // product names), step the type down until nothing overlaps.
  useLayoutEffect(() => {
    const copy = copyRef.current;
    if (!copy) return undefined;
    const fit = () => {
      for (const level of ['0', '1', '2']) {
        copy.dataset.fit = level;
        if (copy.scrollHeight <= copy.clientHeight + 1) return;
      }
    };
    fit();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    observer?.observe(copy);
    document.fonts?.ready.then(fit);
    return () => observer?.disconnect();
  }, [active, locale, count]);

  // No featured products yet (e.g. a new Shopify store): show the brand hero alone.
  if (!count) {
    return (
      <section className="tt-fallback" data-track-section="home_hero" dir={arabic ? 'rtl' : 'ltr'}>
        <img src="/assets/bouquet-concept.jpg" alt="" className="tt-fallback__image" />
        <div className="tt-fallback__copy">
          <p className="tt-intro__eyebrow">{arabic ? 'زهور، بإحساس' : 'Flowers, with feeling'}</p>
          <h1>{arabic ? <>زهور جميلة.<br />تصل بعناية.</> : <>Beautiful flowers.<br />Thoughtfully delivered.</>}</h1>
          <p>{arabic ? 'لفتات مدروسة، تحملها الزهور إلى من نحب.' : 'Considered gestures, beautifully expressed in flowers.'}</p>
          <a className="button" href="#shop">{arabic ? 'تسوّق المجموعة' : 'Shop the collection'}</a>
        </div>
      </section>
    );
  }
  const current = looks[clamp(active, 0, count - 1)];
  const productName = arabic ? current.nameAr || current.name : current.name;
  const category = arabic ? current.categoryAr || current.category : current.category;
  const price = <Money amount={current.price} currency={current.currencyCode} ar={arabic} />;

  return (
    <section id="turntable" data-track-section="home_hero" ref={sectionRef} className={`tt-section${reducedMotion ? ' tt-section--reduced' : ''}`}
      aria-label={arabic ? 'المجموعة المميزة' : 'The featured collection'} dir={arabic ? 'rtl' : 'ltr'}
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)} onBlurCapture={() => setHovered(false)}>
      <div className="tt-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="tt-stage__inner">
          <div className="tt-copy" ref={copyRef} data-fit="0">
          <div className="tt-intro">
            <p className="tt-intro__eyebrow">{arabic ? 'زهور، بإحساس' : 'Flowers, with feeling'}</p>
            <h1>{arabic ? <>زهور جميلة.<br />تصل بعناية.</> : <>Beautiful flowers.<br />Thoughtfully delivered.</>}</h1>
            <p className="tt-intro__body">{arabic ? 'لفتات مدروسة، تحملها الزهور إلى من نحب.' : 'Considered gestures, beautifully expressed in flowers.'}</p>
          </div>

          <div className={`tt-product${productName.length > LONG_TITLE_CHARACTERS ? ' tt-product--long' : ''}`} aria-live="polite" aria-atomic="true">
            <div className="tt-product__details" key={current.id}>
              <p className="tt-product__category">{category}</p>
              <h2>{productName}</h2>
              <p className="tt-product__price">
                {live ? (arabic ? 'من' : 'From') : (arabic ? 'السعر' : 'Price')} <span aria-hidden="true">·</span> {price}
                {current.compareAtPrice && <s aria-label={`${arabic ? 'بدلاً من' : 'was'} ${formatMoney(current.compareAtPrice, current.currencyCode, arabic)}`}><Money amount={current.compareAtPrice} currency={current.currencyCode} ar={arabic} /></s>}
                <SaleTag price={current.price} compareAtPrice={current.compareAtPrice} />
              </p>
            </div>
            <div className="tt-product__actions">
              <button type="button" className="tt-product__add" onClick={() => { trackHeroClicked(current, 'add_to_bag', active + 1); openProduct(current); }} disabled={!current.available}>
                {current.available ? (arabic ? 'أضف إلى الحقيبة' : 'Add to bag') : (arabic ? 'نفدت الكمية' : 'Sold out')}
              </button>
              <a className="tt-product__discover" href="#shop" onClick={showAll}>{arabic ? 'تسوّق الكل' : 'Shop all'}</a>
            </div>
          </div>
          </div>

          <div className="tt-artwork" aria-label={arabic ? 'معرض تنسيقات الزهور' : 'Floral arrangements'}>
            <div className="tt-artwork__ground" aria-hidden="true" />
            {looks.map((product, index) => (
              // The frame carries the design's soft oval mask and animates; the
              // photo inside is always a 2:3 portrait, so any product photo
              // (square, landscape) takes the same tall shape as the design.
              <div key={product.id || index} className={`tt-artwork__image${index === active ? ' is-active' : ''}`} aria-hidden={index !== active}>
                <img className="tt-artwork__photo" src={product.image}
                  alt={index === active ? (arabic ? product.nameAr || product.name : product.name) : ''}
                  fetchPriority={index === 0 ? 'high' : 'auto'} loading="eager" decoding="async" />
              </div>
            ))}
          </div>

          <div className="tt-footer">
            <div className="tt-dots" role="group" aria-label={arabic ? 'اختيار التنسيق' : 'Choose an arrangement'}>
              {looks.map((product, index) => (
                <button key={product.id || index} type="button" className={`tt-dot${index === active ? ' is-active' : ''}`}
                  data-running={index === active && !reducedMotion && !manual && !hovered && visible ? 'true' : 'false'}
                  style={{ '--tt-autoplay': `${AUTOPLAY_MS}ms` } as React.CSSProperties}
                  onClick={() => jumpTo(index)} aria-current={index === active}
                  aria-label={`${arabic ? product.nameAr || product.name : product.name}`}><span /></button>
              ))}
            </div>
            <div className="tt-controls" aria-label={arabic ? 'التنقل بين التنسيقات' : 'Browse arrangements'}>
              <button type="button" onClick={() => step(-1)} aria-label={arabic ? 'التنسيق السابق' : 'Previous arrangement'}>{arabic ? '→' : '←'}</button>
              <button type="button" onClick={() => step(1)} aria-label={arabic ? 'التنسيق التالي' : 'Next arrangement'}>{arabic ? '←' : '→'}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
