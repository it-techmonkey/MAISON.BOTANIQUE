'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackHeroClicked, trackHeroNavigated } from '@/lib/analytics/track';
import { formatMoney } from '@/lib/format';
import { useStore } from './store/StoreProvider';
import '../styles/turntable.css';

gsap.registerPlugin(useGSAP);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The design's resting pose for the arrangement and its shadow. */
const REST_POSE = { xPercent: 15, yPercent: 9, scale: 0.88, rotation: -2 };
const SHADOW_REST = { xPercent: 8, scale: 0.84, opacity: 0.32 };

/** Product names longer than this use the smaller two-line title. */
const LONG_TITLE_CHARACTERS = 22;

interface TurntableProps {
  onActiveChange?: (index: number) => void;
}

/**
 * Home hero: three featured arrangements. The page scrolls normally; the
 * arrows move between arrangements, each one travelling through the scene
 * (the outgoing piece drifts up and away, the next arrives and settles).
 */
export default function Turntable({ onActiveChange }: TurntableProps) {
  const { products, locale, live, addToBag } = useStore();
  const router = useRouter();
  const looks = useMemo(() => products.filter((product) => product.featured).slice(0, 3), [products]);
  const count = looks.length;
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<gsap.core.Timeline | null>(null);
  const activeRef = useRef(0);
  const onActiveChangeRef = useRef(onActiveChange);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
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
  // little smaller, lower right and tilted (also set in turntable.css, so it
  // holds before hydration). GSAP takes over that pose for the transitions.
  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const images = gsap.utils.toArray<HTMLElement>('.tt-artwork__image', section);
    // x/y reset: GSAP would otherwise read the CSS translate as a pixel
    // offset and add the percentage offset on top of it.
    gsap.set(images, { x: 0, y: 0, ...REST_POSE });
    const shadow = section.querySelector('.tt-artwork__ground');
    if (shadow) gsap.set(shadow, { x: 0, ...SHADOW_REST });
  }, { scope: sectionRef, dependencies: [count] });

  const goTo = useCallback((next: number) => {
    const from = activeRef.current;
    const bounded = clamp(next, 0, Math.max(count - 1, 0));
    if (bounded === from) return;
    commitActive(bounded);
    const arrived = looks[bounded];
    if (arrived) trackHeroNavigated(arrived, bounded > from ? 'next' : 'previous', bounded + 1, count);

    const section = sectionRef.current;
    if (!section || reducedMotion) return;
    const images = section.querySelectorAll<HTMLElement>('.tt-artwork__image');
    const outgoing = images[from];
    const incoming = images[bounded];
    const shadow = section.querySelector('.tt-artwork__ground');
    if (!outgoing || !incoming) return;

    // A quick second click finishes the running move before starting the next.
    transitionRef.current?.progress(1).kill();
    const direction = bounded > from ? 1 : -1;
    const timeline = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    timeline.to(outgoing, { opacity: 0, xPercent: 15 - 32 * direction, yPercent: -1, scale: 0.96, rotation: -2 - 2 * direction, duration: 0.8 }, 0);
    timeline.fromTo(incoming,
      { opacity: 0, xPercent: 28 * direction + 15, yPercent: 13, scale: 0.8, rotation: 2 * direction },
      { opacity: 1, ...REST_POSE, duration: 0.95 }, 0.15);
    if (shadow) {
      timeline.fromTo(shadow, { xPercent: 8 + 10 * direction, scale: 0.78, opacity: 0.2 }, { ...SHADOW_REST, duration: 0.95 }, 0.15);
    }
    transitionRef.current = timeline;
  }, [commitActive, count, looks, reducedMotion]);

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
          <p className="tt-intro__eyebrow"><span dir="ltr">Maison Botanique</span> · {arabic ? 'دبي' : 'Dubai'}</p>
          <h1>{arabic ? <>زهور<br />لها حضور.</> : <>Flowers with<br />presence.</>}</h1>
          <p>{arabic ? 'لفتات مدروسة، تحملها الزهور إلى من نحب.' : 'Considered gestures, beautifully expressed in flowers.'}</p>
          <Link className="button" href="/shop">{arabic ? 'تسوّق المجموعة' : 'Shop the collection'}</Link>
        </div>
      </section>
    );
  }
  const current = looks[clamp(active, 0, count - 1)];
  const productName = arabic ? current.nameAr || current.name : current.name;
  const category = arabic ? current.categoryAr || current.category : current.category;
  const price = formatMoney(current.price, current.currencyCode, arabic);

  return (
    <section id="turntable" data-track-section="home_hero" ref={sectionRef} className={`tt-section${reducedMotion ? ' tt-section--reduced' : ''}`}
      aria-label={arabic ? 'المجموعة المميزة' : 'The featured collection'} dir={arabic ? 'rtl' : 'ltr'}>
      <div className="tt-stage">
        <div className="tt-stage__inner">
          <div className="tt-copy" ref={copyRef} data-fit="0">
          <div className="tt-intro">
            <p className="tt-intro__eyebrow"><span dir="ltr">Maison Botanique</span> · {arabic ? 'دبي' : 'Dubai'}</p>
            <h1>{arabic ? <>زهور<br />لها حضور.</> : <>Flowers with<br />presence.</>}</h1>
            <p className="tt-intro__body">{arabic ? 'لفتات مدروسة، تحملها الزهور إلى من نحب.' : 'Considered gestures, beautifully expressed in flowers.'}</p>
          </div>

          <div className={`tt-product${productName.length > LONG_TITLE_CHARACTERS ? ' tt-product--long' : ''}`} aria-live="polite" aria-atomic="true">
            <div className="tt-product__counter" dir="ltr">
              <span>{String(active + 1).padStart(2, '0')}</span><span className="tt-product__divider" aria-hidden="true" /><span>{String(count).padStart(2, '0')}</span>
            </div>
            <div className="tt-product__details" key={current.id}>
              <p className="tt-product__category">{category}</p>
              <h2>{productName}</h2>
              <p className="tt-product__price">
                {live ? (arabic ? 'من' : 'From') : (arabic ? 'سعر تجريبي' : 'Sample price')} <span aria-hidden="true">·</span> {price}
              </p>
            </div>
            <div className="tt-product__actions">
              {/* A button, as in the design, so the hero's button styles apply; it opens the product page. */}
              <button type="button" className="tt-product__discover" onClick={() => { trackHeroClicked(current, 'discover', active + 1); router.push(`/shop/${current.id}`); }}>
                {arabic ? 'اكتشف التنسيق' : 'Discover arrangement'} <span aria-hidden="true">↗</span>
              </button>
              <button type="button" className="tt-product__add" onClick={() => { trackHeroClicked(current, 'add_to_bag', active + 1); addToBag(current, { source: 'hero' }); }} disabled={!current.available}>
                {current.available ? (arabic ? 'أضف إلى الحقيبة' : 'Add to bag') : (arabic ? 'نفدت الكمية' : 'Sold out')}
              </button>
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
            <p>{arabic ? 'مرّر لاكتشاف المجموعة' : 'Scroll to explore the collection'}</p>
            <div className="tt-controls" aria-label={arabic ? 'التنقل بين التنسيقات' : 'Browse arrangements'}>
              <button type="button" onClick={() => goTo(activeRef.current - 1)} disabled={active === 0} aria-label={arabic ? 'التنسيق السابق' : 'Previous arrangement'}>{arabic ? '→' : '←'}</button>
              <button type="button" onClick={() => goTo(activeRef.current + 1)} disabled={active === count - 1} aria-label={arabic ? 'التنسيق التالي' : 'Next arrangement'}>{arabic ? '←' : '→'}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
