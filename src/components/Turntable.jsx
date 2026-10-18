import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import '../styles/turntable.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function priceLabel(value, locale) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
    style: 'currency', currency: 'AED', maximumFractionDigits: 0,
  }).format(value);
}

export default function Turntable({ products = [], locale = 'en', onProductClick, onAddToCart, onActiveChange }) {
  const looks = useMemo(() => products.slice(0, 3), [products]);
  const count = looks.length;
  const sectionRef = useRef(null);
  const triggerRef = useRef(null);
  const timelineRef = useRef(null);
  const activeRef = useRef(0);
  const onActiveChangeRef = useRef(onActiveChange);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const arabic = locale === 'ar';
  onActiveChangeRef.current = onActiveChange;

  const commitActive = useCallback((next) => {
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

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section || count < 2 || reducedMotion) {
      triggerRef.current = null;
      timelineRef.current = null;
      return undefined;
    }

    const images = gsap.utils.toArray('.tt-artwork__image', section);
    const shadow = section.querySelector('.tt-artwork__ground');
    const title = section.querySelector('.tt-intro');
    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate() {
        // Read the scrubbed animation time, which may lag behind raw scroll.
        commitActive(clamp(Math.floor((this.time() - 0.18) / 2), 0, count - 1));
      },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * count * 0.96),
        pin: true,
        pinSpacing: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    timelineRef.current = timeline;
    triggerRef.current = timeline.scrollTrigger;

    gsap.set(images, { opacity: 0, xPercent: 28, yPercent: 12, scale: 0.86, rotation: 2 });
    gsap.set(images[0], { opacity: 1, xPercent: 15, yPercent: 9, scale: 0.88, rotation: -2 });

    looks.forEach((_, index) => {
      const at = index === 0 ? 0 : index * 2 - 0.25;
      const image = images[index];
      timeline.fromTo(image,
        { opacity: index === 0 ? 1 : 0, xPercent: index === 0 ? 15 : 28, yPercent: index === 0 ? 9 : 13, scale: 0.88, rotation: index === 0 ? -2 : 2 },
        { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, rotation: 0, duration: 0.85 }, at);
      // The floral subject travels through the pinned scene rather than just dissolving.
      if (index < count - 1) {
        timeline.to(image, { opacity: 0, xPercent: -17, yPercent: -10, scale: 1.1, rotation: -2, duration: 0.8 }, index * 2 + 1.55);
      } else {
        timeline.to(image, { xPercent: -4, yPercent: -3, scale: 1.035, duration: 1.1 }, at + 0.85);
      }
    });
    timeline.fromTo(shadow, { xPercent: 8, scale: 0.84, opacity: 0.32 }, { xPercent: -8, scale: 1.08, opacity: 0.58, duration: count * 2 }, 0);
    timeline.fromTo(title, { yPercent: 0 }, { yPercent: -6, duration: count * 2 }, 0);
    timeline.set(images[count - 1], { opacity: 1 }, count * 2);

    let disposed = false;
    document.fonts?.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => {
      disposed = true;
      triggerRef.current = null;
      timelineRef.current = null;
    };
  }, { scope: sectionRef, dependencies: [count, reducedMotion, commitActive], revertOnUpdate: true });

  const goTo = useCallback((next) => {
    const bounded = clamp(next, 0, Math.max(count - 1, 0));
    if (bounded === activeRef.current) return;
    const trigger = triggerRef.current;
    const timeline = timelineRef.current;
    if (!trigger || !timeline || reducedMotion) {
      commitActive(bounded);
      return;
    }
    const desiredTime = bounded === 0 ? 0 : bounded * 2 + 0.55;
    const progress = clamp(desiredTime / timeline.duration(), 0, 1);
    window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: 'smooth' });
  }, [commitActive, count, reducedMotion]);

  if (!count) return null;
  const current = looks[clamp(active, 0, count - 1)];
  const productName = arabic ? current.nameAr || current.name : current.name;
  const category = arabic ? current.categoryAr || current.category : current.category;
  const price = priceLabel(current.price, locale);

  return (
    <section id="turntable" ref={sectionRef} className={`tt-section${reducedMotion ? ' tt-section--reduced' : ''}`}
      aria-label={arabic ? 'المجموعة المميزة' : 'The featured collection'} dir={arabic ? 'rtl' : 'ltr'}>
      <div className="tt-stage">
        <div className="tt-stage__inner">
          <div className="tt-intro">
            <h1>{arabic ? <>زهور<br />لها حضور.</> : <>Flowers with<br />presence.</>}</h1>
            <p className="tt-intro__body">{arabic ? 'لفتات مدروسة، تحملها الزهور إلى من نحب.' : 'Considered gestures, beautifully expressed in flowers.'}</p>
          </div>

          <div className="tt-artwork" aria-label={arabic ? 'معرض تنسيقات الزهور' : 'Floral arrangements'}>
            <div className="tt-artwork__ground" aria-hidden="true" />
            {looks.map((product, index) => (
              <img key={product.id || index} className={`tt-artwork__image${index === active ? ' is-active' : ''}`}
                src={product.image}
                alt={index === active ? (arabic ? product.nameAr || product.name : product.name) : ''}
                aria-hidden={index !== active}
                fetchPriority={index === 0 ? 'high' : 'auto'} loading="eager" decoding="async" />
            ))}
          </div>

          <div className="tt-product" aria-live="polite" aria-atomic="true">
            <div className="tt-product__counter" dir="ltr">
              <span>{String(active + 1).padStart(2, '0')}</span><span className="tt-product__divider" aria-hidden="true" /><span>{String(count).padStart(2, '0')}</span>
            </div>
            <div className="tt-product__details" key={current.id}>
              <p className="tt-product__category">{category}</p>
              <h2>{productName}</h2>
              <p className="tt-product__price">{arabic ? 'سعر تجريبي' : 'Sample price'} <span aria-hidden="true">·</span> {price}</p>
            </div>
            <div className="tt-product__actions">
              <button type="button" className="tt-product__discover" onClick={() => onProductClick?.(current)}>
                {arabic ? 'اكتشف التنسيق' : 'Discover arrangement'} <span aria-hidden="true">↗</span>
              </button>
              <button type="button" className="tt-product__add" onClick={() => onAddToCart?.(current)}>
                {arabic ? 'أضف إلى الحقيبة' : 'Add to bag'}
              </button>
            </div>
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
