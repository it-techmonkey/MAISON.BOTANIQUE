'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { formatMoney } from '@/lib/format';
import { trackDeliveryScheduled, trackGiftOptionAdded, trackProductSizeSelected, trackProductViewed } from '@/lib/analytics/track';
import { checkSchedule, earliestDate, type DeliverySchedule, type ScheduleProblem } from '@/lib/delivery';
import { findOccasion } from '@/lib/site';
import type { Product } from '@/lib/types';
import DeliveryPicker, { useDubaiNow } from './DeliveryPicker';
import { useStore } from './StoreProvider';
import '@/styles/shop.css';

const NOTE_LIMIT = 280;



/** Name, price and the purchase form on the product page. */
export default function ProductPurchase({ handle }: { handle: string }) {
  const { products } = useStore();
  const product = products.find((item) => item.id === handle);
  // The page only renders for products in the catalog, so this is a safeguard.
  if (!product) return null;
  return <Purchase key={product.id} product={product} />;
}

function Purchase({ product }: { product: Product }) {
  const { ar, t, live, addToBag, cart } = useStore();
  const id = useId();
  const now = useDubaiNow();
  const pickerRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const firstAvailable = product.sizes.find((size) => size.available) ?? product.sizes[0];
  const [sizeId, setSizeId] = useState(firstAvailable.id);
  const [note, setNote] = useState('');
  const [schedule, setSchedule] = useState<Partial<DeliverySchedule>>({});
  const [scheduleProblem, setScheduleProblem] = useState<ScheduleProblem | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const chosen = product.sizes.find((size) => size.id === sizeId) ?? firstAvailable;
  const price = formatMoney(chosen.price, product.currencyCode, ar);
  const name = ar ? product.nameAr : product.name;

  // Once per product page, with the variant shown first (as Shopify expects).
  const viewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (viewedRef.current === product.id) return;
    viewedRef.current = product.id;
    trackProductViewed(product, firstAvailable);
  }, [product, firstAvailable]);

  // Start from the order's schedule, or the earliest day with an open slot.
  const scheduleStarted = useRef(false);
  useEffect(() => {
    if (!now || scheduleStarted.current) return;
    scheduleStarted.current = true;
    const existing = cart.delivery && !checkSchedule(cart.delivery, now) ? cart.delivery : null;
    setSchedule(existing ?? { date: earliestDate(now) });
  }, [now, cart.delivery]);

  // The gift note is reported the first time it is filled in; its text is never sent.
  const reportedOptions = useRef(new Set<string>());
  const reportOption = (option: 'gift_note', details?: Record<string, unknown>) => {
    if (reportedOptions.current.has(option)) return;
    reportedOptions.current.add(option);
    trackGiftOptionAdded(product, option, details);
  };
  const chooseSize = (nextId: string) => {
    setSizeId(nextId);
    const size = product.sizes.find((item) => item.id === nextId);
    if (size) trackProductSizeSelected(product, size);
  };

  // The mobile bar appears once the main button has scrolled out of view.
  useEffect(() => {
    const button = submitRef.current;
    if (!button || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  // Showing the mobile bar lifts the WhatsApp button above it.
  useEffect(() => {
    document.body.classList.toggle('has-sticky-buy', showSticky);
    return () => document.body.classList.remove('has-sticky-buy');
  }, [showSticky]);

  const add = (source: string) => {
    const problem = checkSchedule(schedule, now ?? undefined);
    setScheduleProblem(problem);
    if (problem) {
      pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const delivery = schedule as DeliverySchedule;
    addToBag(product, { sizeId, note: note.trim(), delivery, source });
    trackDeliveryScheduled(delivery, source);
    setNote('');
  };

  return (
    <div className="purchase">
      <p className="eyebrow">{ar ? product.categoryAr : product.category}</p>
      <h1>{name}</h1>
      <p className="purchase__price">
        <strong>{price}</strong>
        {!live && <span>{t('Sample price', 'سعر تجريبي')}</span>}
      </p>
      <p className="purchase__description">{ar ? product.descriptionAr : product.description}</p>

      {product.occasions.length > 0 && (
        <p className="purchase__occasions">
          <span>{t('Lovely for', 'مناسبة لـ')}</span>
          {product.occasions.map((occasionId) => {
            const occasion = findOccasion(occasionId);
            return occasion ? <Link key={occasionId} href={`/occasions/${occasionId}`}>{ar ? occasion.name.ar : occasion.name.en}</Link> : null;
          })}
        </p>
      )}

      <form className="purchase__form" onSubmit={(event) => { event.preventDefault(); add('product_page'); }}>
        {product.sizes.length > 1 && (
          <fieldset className="size-options">
            <legend>{t('Presentation', 'الحجم')}</legend>
            <div>
              {product.sizes.map((size) => (
                <label key={size.id} className={`size-option${size.id === sizeId ? ' is-selected' : ''}${size.available ? '' : ' is-unavailable'}`}>
                  <input type="radio" name={`${id}-size`} value={size.id} checked={size.id === sizeId}
                    disabled={!size.available} onChange={() => chooseSize(size.id)} />
                  <span>{ar ? size.nameAr : size.name}</span>
                  <small>{size.available ? formatMoney(size.price, product.currencyCode, ar) : t('Sold out', 'نفدت الكمية')}</small>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="field">
          <label htmlFor={`${id}-note`}>{t('Gift note (optional)', 'رسالة الإهداء (اختياري)')}</label>
          <textarea id={`${id}-note`} value={note} maxLength={NOTE_LIMIT} rows={3} onChange={(event) => setNote(event.target.value)}
            onBlur={() => { if (note.trim()) reportOption('gift_note', { note_length: note.trim().length }); }}
            placeholder={t('Your message, if you wish…', 'رسالتك إن رغبت…')} />
          <span className="field__hint">
            {new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE').format(NOTE_LIMIT - note.length)} {t('characters left', 'حرفاً متبقياً')}
          </span>
        </div>

        <div ref={pickerRef}>
          <DeliveryPicker value={schedule} problem={scheduleProblem}
            onChange={(next) => { setSchedule(next); setScheduleProblem(null); }} />
        </div>

        <div className="purchase__submit">
          <button ref={submitRef} className="button button--block" type="submit" disabled={!chosen.available}>
            <span>{chosen.available ? `${t('Add to bag', 'أضف إلى الحقيبة')} · ${price}` : t('Sold out', 'نفدت الكمية')}</span>
            <span aria-hidden="true">↗</span>
          </button>
          <ul className="assurances assurances--plain">
            <li>{t('Secure checkout with Shopify', 'دفع آمن عبر Shopify')}</li>
            <li>{t('Your note travels with the flowers', 'رسالتك ترافق الزهور')}</li>
            <li>{t('Arranged by hand in Dubai', 'تُنسَّق يدوياً في دبي')}</li>
          </ul>
        </div>
      </form>

      <div className={`sticky-buy${showSticky ? ' is-visible' : ''}`} aria-hidden={!showSticky}>
        <div><strong>{name}</strong><span>{price}</span></div>
        <button type="button" className="button" onClick={() => add('product_page_sticky')} disabled={!chosen.available} tabIndex={showSticky ? 0 : -1}>
          {chosen.available ? t('Add to bag', 'أضف إلى الحقيبة') : t('Sold out', 'نفدت الكمية')} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
