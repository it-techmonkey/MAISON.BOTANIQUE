'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  trackCartViewed, trackCheckoutFailed, trackCheckoutStarted, trackDeliveryScheduled, trackGiftOptionAdded,
  trackProductSizeSelected, trackProductViewed,
} from '@/lib/analytics/track';
import { DeliveryRequiredError, type CartLineView } from '@/lib/cart/use-shop-cart';
import {
  addDays, bookableDays, checkSchedule, dateOpen, deliverySummary, earliestDate, formatDeliveryDate, lastBookableDate, slotsFor, windowLabel, windowsFor,
  type DeliverySchedule, type ScheduleProblem,
} from '@/lib/delivery';
import { useDubaiNow } from '@/lib/use-today';
import { SITE_URL } from '@/lib/site';
import { whatsappLink, whatsappMessage } from '@/lib/whatsapp';
import type { Product } from '@/lib/types';
import { PROMISES } from './HeroPromises';
import SaleTag from './SaleTag';
import { useStore } from './StoreProvider';
import { WhatsAppIcon } from './WhatsAppButton';
import Money from './Money';

const NOTE_LIMIT = 280;

const copy = {
  en: {
    close: 'Close', bag: 'Your bag', bagEmpty: 'Your bag is waiting for a little beauty.',
    bagEmptyDetail: 'Explore the collection and add a flower moment.',
    backToShop: 'Explore the collection',
    presentation: 'Size', giftNote: 'Gift note', notePlaceholder: 'Your message, if you wish…',
    date: 'When should it arrive?',
    dateHint: 'Book today or up to 60 days ahead. One delivery date and time for the whole order.',
    windowLegend: 'Time', missing_date: 'Choose a delivery day and time to continue.', missing_slot: 'Choose a delivery time to continue.',
    date_passed: 'That delivery day has passed. Please choose another.', slot_passed: 'That delivery time has passed. Please choose another.',
    day_closed: "We aren't delivering on that day. Please choose another.",
    deliveryLine: 'Arrives', askAbout: 'Ask about this gift on WhatsApp',
    helpOrder: 'Questions? Chat with us on WhatsApp', orderWhatsapp: 'Order on WhatsApp instead',
    addBag: 'Add to bag', subtotal: 'Subtotal',
    offerLine: 'Welcome offer: 25% off your first order with your code at checkout.',
    included: "What's included", alsoLike: 'You may also like',
    previewCheckout: 'Preview checkout', secureCheckout: 'Continue to secure checkout',
    reviewTitle: 'Checkout preview', reviewIntro: 'Your selections are saved in this browser for up to 30 days. Checkout is not connected yet; no order or payment will be taken.',
    reviewNotice: 'A real Shopify store, approved product variants, final prices and delivery rules are required before orders can open.',
    backBag: 'Back to bag', remove: 'Remove', quantity: 'Quantity',
    pending: 'Connecting to checkout…', updating: 'Updating your bag…', error: 'Checkout could not open. Please try again.',
    cartError: 'Your bag could not be updated. Please try again.',
    each: 'each', noteLine: 'Gift note',
    pictured: (size: string) => `Pictured: ${size}`, asPictured: 'As pictured', yourCard: 'Your card', handwritten: 'Handwritten in our studio',
    cardEmpty: 'Write what you would say if you were there.', signedAs: 'Signed', secret: 'Keep it a secret', secretSign: 'Someone who adores you',
    dubai: 'Dubai', anotherDay: 'Another day',
    deliveryRow: 'Delivery day and time', earliest: 'Earliest', chooseDelivery: 'Choose day and time', useEarliest: 'Use this time', changeDelivery: 'Change',
    deliverySaved: 'Saved for your order',
    letterLabel: 'Your letter', ageLabel: 'Age on the arrangement', chooseLetter: 'Choose a letter to continue', chooseAge: 'Add the age to continue', chooseCustom: 'Add your personalisation to continue',
    signedLine: 'Signed', anonymousLine: 'Signed anonymously', customLine: 'Personalisation', was: 'was', soldOut: 'Sold out',
    viewDetails: 'View full details',
  },
  ar: {
    close: 'إغلاق', bag: 'حقيبتك', bagEmpty: 'حقيبتك تنتظر لمسة من الجمال.',
    bagEmptyDetail: 'تصفّح المجموعة وأضف لحظة من الزهور.',
    backToShop: 'تصفّح المجموعة',
    presentation: 'الحجم', giftNote: 'رسالة الإهداء', notePlaceholder: 'رسالتك إن رغبت…',
    date: 'متى تريد أن تصل؟',
    dateHint: 'احجز لليوم أو حتى ٦٠ يوماً مقدماً. موعد توصيل واحد للطلب كله.',
    windowLegend: 'الوقت', missing_date: 'اختر يوم التوصيل ووقته للمتابعة.', missing_slot: 'اختر وقت التوصيل للمتابعة.',
    date_passed: 'انقضى يوم التوصيل هذا. يرجى اختيار يوم آخر.', slot_passed: 'انقضى موعد التوصيل هذا. يرجى اختيار موعد آخر.',
    day_closed: 'لا نوصّل في هذا اليوم. يرجى اختيار يوم آخر.',
    deliveryLine: 'موعد الوصول', askAbout: 'استفسر عن هذه الهدية عبر واتساب',
    helpOrder: 'لديك سؤال؟ تحدّث معنا عبر واتساب', orderWhatsapp: 'اطلب عبر واتساب بدلاً من ذلك',
    addBag: 'أضف إلى الحقيبة', subtotal: 'المجموع الفرعي',
    offerLine: 'عرض الترحيب: خصم ٢٥٪ على طلبك الأول برمزك عند الدفع.',
    included: 'ما يتضمنه', alsoLike: 'قد يعجبك أيضاً',
    previewCheckout: 'معاينة الدفع', secureCheckout: 'متابعة الدفع الآمن',
    reviewTitle: 'معاينة الدفع', reviewIntro: 'اختياراتك محفوظة في هذا المتصفح لمدة تصل إلى ٣٠ يومًا. الدفع غير متصل بعد؛ لن يُنشأ طلب أو تُحصّل دفعة.',
    reviewNotice: 'يلزم متجر Shopify فعلي ومنتجات معتمدة وأسعار نهائية وقواعد توصيل قبل استقبال الطلبات.',
    backBag: 'العودة إلى الحقيبة', remove: 'إزالة', quantity: 'الكمية',
    pending: 'جارٍ فتح صفحة الدفع…', updating: 'جارٍ تحديث حقيبتك…', error: 'تعذّر فتح صفحة الدفع. يرجى المحاولة مجددًا.',
    cartError: 'تعذّر تحديث حقيبتك. يرجى المحاولة مجدداً.',
    each: 'للوحدة', noteLine: 'رسالة الإهداء',
    pictured: (size: string) => `في الصورة: ${size}`, asPictured: 'كما في الصورة', yourCard: 'بطاقتك', handwritten: 'تُكتب بخط اليد في مشغلنا',
    cardEmpty: 'اكتب ما كنت ستقوله لو كنت هناك.', signedAs: 'التوقيع', secret: 'أبقِها مفاجأة', secretSign: 'شخص يحبك',
    dubai: 'دبي', anotherDay: 'يوم آخر',
    deliveryRow: 'يوم التوصيل ووقته', earliest: 'أقرب موعد', chooseDelivery: 'اختر اليوم والوقت', useEarliest: 'اعتمد هذا الموعد', changeDelivery: 'تغيير',
    deliverySaved: 'تم حفظه لطلبك',
    letterLabel: 'الحرف', ageLabel: 'العمر على التنسيق', chooseLetter: 'اختر الحرف للمتابعة', chooseAge: 'أضف العمر للمتابعة', chooseCustom: 'أضف التخصيص للمتابعة',
    signedLine: 'التوقيع', anonymousLine: 'توقيع مجهول', customLine: 'التخصيص', was: 'بدلاً من', soldOut: 'نفدت الكمية',
    viewDetails: 'عرض كل التفاصيل',
  },
};
type Copy = typeof copy.en;

export function formatAED(value: number, arabic: boolean) {
  return new Intl.NumberFormat(arabic ? 'ar-AE' : 'en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value);
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M3 12h18m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function DialogShell({ children, onClose, label, kind }: { children: ReactNode; onClose: () => void; label: string; kind: 'quickadd' | 'cart' }) {
  const { ar } = useStore();
  const shellRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;
      const focusable = shellRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = priorOverflow;
      document.removeEventListener('keydown', handleKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="ll-shop-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={shellRef} className={`ll-shop-panel ll-shop-panel--${kind}`} role="dialog" aria-modal="true" aria-label={label} dir={ar ? 'rtl' : 'ltr'} data-track-location={kind === 'cart' ? 'bag' : 'quick_add'}>
        <button ref={closeRef} className="ll-shop-close" type="button" onClick={onClose} aria-label={copy[ar ? 'ar' : 'en'].close}><CloseIcon /></button>
        {children}
      </section>
    </div>
  );
}

function CardPreview({ message, signedAs, anonymous, t }: { message: string; signedAs: string; anonymous: boolean; t: Copy }) {
  const arabic = /[؀-ۿ]/.test(message);
  return (
    <div className="qa-stage" aria-hidden="true" data-ph-mask>
      <div className="qa-envelope">
        <div className="qa-card">
          <span className="qa-card-mark">MAISON · BOTANIQUE</span>
          <span className={`qa-card-text${arabic ? ' is-arabic' : ''}${message ? '' : ' is-empty'}`}>{message || t.cardEmpty}</span>
          <span className="qa-card-from">{anonymous ? t.secretSign : signedAs}</span>
        </div>
        <div className="qa-pocket" />
        <div className="qa-seal">MB</div>
      </div>
    </div>
  );
}

/** Size, card and personalisation for one product. Used by the quick-add sheet and the product page. */
export function PurchaseOptions({ product, onAdd, related = [], onOpen, compact = false }: {
  product: Product;
  onAdd: (options: { sizeId: string; note: string; signedAs: string; anonymous: boolean; custom: string; delivery?: DeliverySchedule }) => void;
  related?: Product[];
  onOpen?: (product: Product) => void;
  /** Leaves out the header and image (the product page shows its own). */
  compact?: boolean;
}) {
  const { ar, live, cart } = useStore();
  const t = copy[ar ? 'ar' : 'en'];
  const nowDubai = useDubaiNow();
  const [delivery, setDelivery] = useState<Partial<DeliverySchedule>>(cart.delivery ?? {});
  useEffect(() => { if (cart.delivery) setDelivery(cart.delivery); }, [cart.delivery]);
  const firstAvailable = product.sizes.find((size) => size.available) ?? product.sizes[0];
  const [sizeId, setSizeId] = useState(firstAvailable.id);
  const [note, setNote] = useState('');
  const [signedAs, setSignedAs] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [custom, setCustom] = useState('');
  const noteReported = useRef(false);
  const chosen = product.sizes.find((size) => size.id === sizeId) ?? firstAvailable;
  const composition = (ar ? product.compositionAr : product.composition) ?? [];
  const field = product.custom;
  const customMissing = Boolean(field) && !custom.trim();
  const number = product.no ? `N° ${String(product.no).padStart(3, '0')}` : '';
  const name = ar ? product.nameAr : product.name;
  const deliveryChosen = Boolean(delivery.date && delivery.slotId && nowDubai && !checkSchedule(delivery, nowDubai));
  const askLink = whatsappLink(whatsappMessage.product(ar, {
    name, size: ar ? chosen.nameAr : chosen.name,
    price: chosen.available ? formatAED(chosen.price, ar) : '',
    delivery: deliveryChosen ? `${formatDeliveryDate(delivery.date!, ar)} · ${windowLabel(delivery.slotId!, ar)}` : '',
    url: `${SITE_URL}/shop/${product.id}`,
  }));

  const chooseSize = (id: string) => {
    setSizeId(id);
    const size = product.sizes.find((item) => item.id === id);
    if (size) trackProductSizeSelected(product, size);
  };
  const reportNote = () => {
    if (noteReported.current || !note.trim()) return;
    noteReported.current = true;
    trackGiftOptionAdded(product, 'gift_note', { note_length: note.trim().length });
  };

  return (
    <>
      <div className="qa-scroll">
        {!compact && <>
          <div className="qa-head">
            <span className="qa-kicker">{number ? `${number} · ` : ''}{ar ? product.categoryAr : product.category}</span>
          </div>
          <div className="qa-hero">
            <img src={product.image} alt={ar ? product.nameAr : (product.imageAlt || product.name)} />
            <div>
              <h2>{name}</h2>
              {composition.length ? <>
                <span className="qa-included">{t.included}</span>
                <ul className="qa-list">{composition.map((item) => <li key={item}>{item}</li>)}</ul>
              </> : <p>{ar ? product.descriptionAr : product.description}</p>}
              <a className="qa-details-link" href={`/shop/${product.id}`}>{t.viewDetails} <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </>}

        <fieldset className="qa-section">
          <legend className="qa-legend"><span>{t.presentation}</span><em>{product.sizes.length > 1 ? t.pictured(ar ? product.sizes[0].nameAr : product.sizes[0].name) : t.asPictured}</em></legend>
          <div className="qa-sizes">{product.sizes.map((size, index) => (
            <label key={size.id} className={`qa-size${size.id === sizeId ? ' is-selected' : ''}${size.available ? '' : ' is-unavailable'}`}>
              <input type="radio" name={`qa-size-${product.id}`} value={size.id} checked={size.id === sizeId} disabled={!size.available} onChange={() => chooseSize(size.id)} />
              <span className="qa-size-name"><strong>{ar ? size.nameAr : size.name}</strong>{(ar ? size.detailAr : size.detail) && <em>{ar ? size.detailAr : size.detail}</em>}</span>
              <span className="qa-scale" aria-hidden="true">{Array.from({ length: Math.min(index + 1, 6) }, (_, bar) => <i key={bar} style={{ height: `${9 + bar * 5}px` }} />)}</span>
              <span className="qa-size-price">
                {size.available ? <Money amount={size.price} ar={ar} whole /> : t.soldOut}
                {size.available && size.compareAtPrice && <s aria-label={`${t.was} ${formatAED(size.compareAtPrice, ar)}`}><Money amount={size.compareAtPrice} ar={ar} whole /></s>}
                {size.available && <SaleTag price={size.price} compareAtPrice={size.compareAtPrice} />}
              </span>
            </label>
          ))}</div>
          {field && <div className="qa-custom">
            <label htmlFor={`qa-custom-${product.id}`}>{field.kind === 'letter' ? t.letterLabel : field.kind === 'age' ? t.ageLabel : field.label}</label>
            <input id={`qa-custom-${product.id}`} value={custom} maxLength={field.kind === 'letter' ? 1 : field.kind === 'age' ? 3 : 24}
              inputMode={field.kind === 'age' ? 'numeric' : 'text'}
              onChange={(event) => setCustom(field.kind === 'letter' ? event.target.value.toUpperCase() : event.target.value)}
              placeholder={field.kind === 'letter' ? 'A – Z' : field.kind === 'age' ? '30' : ''} />
          </div>}
        </fieldset>

        <ProductDelivery t={t} value={delivery} onChange={setDelivery} askLink={askLink} />

        <section className="qa-section" aria-labelledby={`qa-card-title-${product.id}`}>
          <div className="qa-legend"><span id={`qa-card-title-${product.id}`}>{t.yourCard}</span><em>{t.handwritten}</em></div>
          <CardPreview message={note.trim()} signedAs={signedAs.trim()} anonymous={anonymous} t={t} />
          <label className="qa-label" htmlFor={`gift-note-${product.id}`}>{t.giftNote}</label>
          <textarea id={`gift-note-${product.id}`} value={note} maxLength={NOTE_LIMIT} rows={2} onChange={(event) => setNote(event.target.value)} onBlur={reportNote} placeholder={t.notePlaceholder} />
          <div className="qa-sign">
            <input aria-label={t.signedAs} placeholder={t.signedAs} value={signedAs} maxLength={60} disabled={anonymous} onChange={(event) => setSignedAs(event.target.value)} />
            <button type="button" role="switch" aria-checked={anonymous} className="qa-switch" onClick={() => setAnonymous(!anonymous)}><i />{t.secret}</button>
          </div>
        </section>

        <ul className="qa-promises" aria-label={ar ? 'وعودنا' : 'Our promises'}>
          {PROMISES.map((item) => <li key={item.text.en}>{item.icon}<span>{ar ? item.text.ar : item.text.en}</span></li>)}
        </ul>
        {related.length > 0 && onOpen && <section className="qa-related" aria-labelledby={`qa-related-title-${product.id}`}>
          <h3 id={`qa-related-title-${product.id}`} className="qa-included">{t.alsoLike}</h3>
          <div className="qa-related-row">{related.map((item) => (
            <button type="button" key={item.id} onClick={() => onOpen(item)}>
              <img src={item.imageSmall} alt="" loading="lazy" width="160" height="160" />
              <span>{ar ? item.nameAr : item.name}</span>
              <small><Money amount={item.price} ar={ar} whole /></small>
            </button>
          ))}</div>
        </section>}
      </div>
      <div className="qa-foot">
        <button className="qa-add" type="button" disabled={customMissing || !chosen.available}
          onClick={() => onAdd({
            sizeId: chosen.id, note: note.trim(), signedAs: signedAs.trim(), anonymous, custom: custom.trim(),
            ...(delivery.date && delivery.slotId && nowDubai && !checkSchedule(delivery, nowDubai) ? { delivery: delivery as DeliverySchedule } : {}),
          })}>
          {!chosen.available ? t.soldOut
            : customMissing ? (field?.kind === 'letter' ? t.chooseLetter : field?.kind === 'age' ? t.chooseAge : t.chooseCustom)
            : <>{t.addBag} · <Money amount={chosen.price} ar={ar} whole /></>}
        </button>
      </div>
    </>
  );
}

function QuickAdd({ product }: { product: Product }) {
  const { ar, products, openProduct, addToBag } = useStore();
  const name = ar ? product.nameAr : product.name;

  // Opening the sheet is the product view (as on a product page).
  useEffect(() => {
    const size = product.sizes.find((item) => item.available) ?? product.sizes[0];
    trackProductViewed(product, size);
  }, [product]);

  // Three nearby pieces: same room first, then a shared occasion.
  const related = useMemo(() => products
    .filter((item) => item.id !== product.id && item.available)
    .map((item) => ({ item, score: (item.room === product.room ? 2 : 0) + (item.occasions.some((o) => product.occasions.includes(o)) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || a.item.order - b.item.order)
    .slice(0, 3)
    .map(({ item }) => item), [products, product]);

  return (
    <DialogShell key={product.id} onClose={() => openProduct(null)} label={name} kind="quickadd">
      <PurchaseOptions key={product.id} product={product} related={related} onOpen={openProduct}
        onAdd={(options) => addToBag(product, { ...options, source: 'quick_add' })} />
    </DialogShell>
  );
}

/** The first window that can still be booked, for the collapsed delivery row. */
function earliestSlot(now: NonNullable<ReturnType<typeof useDubaiNow>>): DeliverySchedule | null {
  const date = earliestDate(now);
  const slot = slotsFor(date, now)[0];
  return slot ? { date, slotId: slot.id } : null;
}

/**
 * Delivery day and time on the product page. The picker is always open: it suggests the earliest
 * window and lets the shopper use it or choose another. The choice is for the whole order and is
 * saved to the cart with the add; it never blocks "Add to bag".
 */
function ProductDelivery({ t, value, onChange, askLink }: { t: Copy; value: Partial<DeliverySchedule>; onChange: (next: Partial<DeliverySchedule>) => void; askLink: string | null }) {
  const { ar } = useStore();
  const now = useDubaiNow();
  const complete = Boolean(value.date && value.slotId && now && !checkSchedule(value, now));
  const earliest = now ? earliestSlot(now) : null;
  const dayWord = (date: string) => (now && date === now.date ? (ar ? 'اليوم' : 'Today') : now && date === addDays(now.date, 1) ? (ar ? 'غداً' : 'Tomorrow') : formatDeliveryDate(date, ar));
  const describe = (schedule: DeliverySchedule) => `${dayWord(schedule.date)} · ${windowLabel(schedule.slotId, ar)}`;
  return (
    <section className="qa-section qa-delivery" data-ph-mask>
      <div className="pd-row">
        <div className="pd-text">
          <span className="pd-label">{t.deliveryRow}</span>
          {complete
            ? <strong className="pd-value">{describe(value as DeliverySchedule)}<em>{t.deliverySaved}</em></strong>
            : earliest && <span className="pd-value">{t.earliest}: {describe(earliest)}</span>}
        </div>
        <div className="pd-actions">
          {!complete && earliest && <button type="button" className="pd-link" onClick={() => { onChange(earliest); trackDeliveryScheduled(earliest, 'product_page'); }}>{t.useEarliest}</button>}
          {askLink && <a className="pd-ask" href={askLink} target="_blank" rel="noopener noreferrer" aria-label={t.askAbout} data-tip={t.askAbout}><WhatsAppIcon /></a>}
        </div>
      </div>
      <DeliveryPicker t={t} scope="product" value={value} problem={null}
        onChange={(next) => { onChange(next); if (next.date && next.slotId && now && !checkSchedule(next, now)) trackDeliveryScheduled(next as DeliverySchedule, 'product_page'); }} />
    </section>
  );
}

// One delivery for the whole order: the next open days, any later date up to
// the booking horizon, then a time window. Passed windows are disabled.
function DeliveryPicker({ t, value, onChange, problem, scope = 'bag' }: {
  t: Copy;
  /** 'bag' is the checkout picker; 'product' sits on the product page and must not be mistaken for it. */
  scope?: 'bag' | 'product';
  value: Partial<DeliverySchedule>;
  onChange: (next: Partial<DeliverySchedule>) => void;
  problem: ScheduleProblem | null;
}) {
  const { ar } = useStore();
  const now = useDubaiNow();
  const today = now?.date ?? '';
  const quick = now ? bookableDays(3, now) : [];
  const date = value.date ?? '';
  const other = Boolean(date) && !quick.includes(date);
  // "Another day" shows when the saved date is outside the quick days, or when the shopper asks for it.
  const [wantOther, setWantOther] = useState(false);
  const showOther = wantOther || other;
  const windows = date && now ? windowsFor(date, now) : [];
  const closed = Boolean(date) && Boolean(now) && !dateOpen(date, now!);
  const dayLabel = (iso: string) => {
    if (iso === today) return ar ? 'اليوم' : 'Today';
    if (iso === addDays(today, 1)) return ar ? 'غداً' : 'Tomorrow';
    return new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  };
  const chooseDate = (next: string) => {
    const keep = value.slotId && now && windowsFor(next, now).some((slot) => slot.id === value.slotId && slot.available);
    onChange({ date: next, slotId: keep ? value.slotId : undefined });
  };

  return (
    <fieldset className={`qa-section${scope === 'bag' ? ' dl-picker' : ' dl-picker-product'}`} data-ph-mask>
      <legend className="qa-legend"><span>{t.date}</span><em>{t.dubai}</em></legend>
      <div className="qa-days">
        {quick.map((iso) => (
          <label key={iso} className={`qa-day${date === iso && !showOther ? ' is-selected' : ''}`}>
            <input type="radio" name={`${scope}-day`} checked={date === iso && !showOther} onChange={() => { setWantOther(false); chooseDate(iso); }} />
            <span>{dayLabel(iso)}</span><strong>{Number(iso.slice(8))}</strong>
          </label>
        ))}
        <label className={`qa-day${showOther ? ' is-selected' : ''}`}>
          <input type="radio" name={`${scope}-day`} checked={showOther} onChange={() => { setWantOther(true); if (!other) onChange({}); }} />
          <span>{t.anotherDay}</span><strong>…</strong>
        </label>
      </div>
      {showOther && now && <input type="date" min={today} max={lastBookableDate(now)} value={other ? date : ''}
        onChange={(event) => (event.target.value ? chooseDate(event.target.value) : onChange({}))} aria-label={t.date} />}
      {closed && <p className="ll-cart-date-alert" role="alert">{date < today ? t.date_passed : t.day_closed}</p>}
      {date && !closed && <div className="dl-windows" role="radiogroup" aria-label={t.windowLegend}>
        {windows.map((slot) => (
          <label key={slot.id} className={`dl-window${value.slotId === slot.id ? ' is-selected' : ''}${slot.available ? '' : ' is-off'}`}>
            <input type="radio" name={`${scope}-window`} disabled={!slot.available} checked={value.slotId === slot.id}
              onChange={() => onChange({ date, slotId: slot.id })} />
            <bdi>{windowLabel(slot.id, ar)}</bdi>
          </label>
        ))}
      </div>}
      {problem && problem !== 'day_closed' && <p className="ll-cart-date-alert" role="alert">{t[problem]}</p>}
      <span className="ll-shop-help">{t.dateHint}</span>
    </fieldset>
  );
}

function bagSummary(lines: CartLineView[], arabic: boolean) {
  return lines.map((line) => {
    const extras = [line.custom, line.note && `“${line.note}”`].filter(Boolean).join(' · ');
    return `• ${line.quantity} × ${arabic ? line.nameAr : line.name} (${arabic ? line.sizeNameAr : line.sizeName})${extras ? ` · ${extras}` : ''}`;
  }).join('\n');
}

function Bag() {
  const { ar, locale, live, cart, setCartOpen, openOffer } = useStore();
  const t = copy[ar ? 'ar' : 'en'];
  const { lines, subtotal } = cart;
  const now = useDubaiNow();
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [welcomeCode, setWelcomeCode] = useState('');
  const [useWelcome, setUseWelcome] = useState(true);
  const welcomeAttempt = useRef('');
  const [problem, setProblem] = useState<ScheduleProblem | null>(null);
  useEffect(() => {
    const sync = () => {
      try { setWelcomeCode(JSON.parse(localStorage.getItem('mb-launch-offer-v1') || '{}').code || ''); } catch { /* No offer. */ }
    };
    sync();
    window.addEventListener('maison-offer-changed', sync);
    return () => window.removeEventListener('maison-offer-changed', sync);
  }, []);
  useEffect(() => {
    const key = `${cart.shopifyCart?.id || ''}:${welcomeCode}`;
    if (!welcomeCode || !cart.shopifyCart || !cart.applyWelcomeOffer || welcomeAttempt.current === key) return;
    welcomeAttempt.current = key;
    void cart.applyWelcomeOffer().catch(() => setError(ar ? 'تعذّر تطبيق العرض. يمكنك المتابعة بدونه.' : 'The welcome offer could not be applied. You can continue without it.'));
  }, [welcomeCode, cart.shopifyCart?.id, cart.applyWelcomeOffer, ar]);

  // The bag's own copy of the schedule while it is incomplete; complete
  // choices are saved to the cart straight away.
  const [draft, setDraft] = useState<Partial<DeliverySchedule>>(cart.delivery ?? {});
  useEffect(() => { if (cart.delivery) setDraft(cart.delivery); }, [cart.delivery]);
  const schedule = cart.delivery ?? draft;
  const summary = cart.delivery ? deliverySummary(cart.delivery, ar) : '';
  // Checkout stays closed until a delivery day and a time window that can still be booked are chosen.
  const blocked = checkSchedule(schedule, now ?? undefined);
  const orderLink = lines.length ? whatsappLink(whatsappMessage.bag(ar, bagSummary(lines, ar), summary)) : null;
  const close = () => { cart.clearError(); setCartOpen(false); };

  // One cart view per opening, reported once the cart has settled.
  const viewReported = useRef(false);
  const latest = useRef({ lines, subtotal, shopifyCart: cart.shopifyCart });
  latest.current = { lines, subtotal, shopifyCart: cart.shopifyCart };
  useEffect(() => {
    if (viewReported.current || cart.busy) return undefined;
    const timer = window.setTimeout(() => {
      viewReported.current = true;
      const settled = latest.current;
      trackCartViewed(settled.lines, settled.subtotal.amount, settled.subtotal.currencyCode, settled.shopifyCart);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [cart.busy]);

  const changeSchedule = (next: Partial<DeliverySchedule>) => {
    setDraft(next);
    setProblem(null);
    setError('');
    if (next.date && next.slotId && !checkSchedule(next, now ?? undefined)) {
      void cart.setDelivery(next as DeliverySchedule);
      trackDeliveryScheduled(next as DeliverySchedule, 'bag');
    }
  };

  async function handleCheckout() {
    const found = checkSchedule(schedule, now ?? undefined);
    if (found) {
      trackCheckoutFailed(found, cart.shopifyCart?.id ?? null, subtotal.amount);
      setProblem(found);
      document.querySelector<HTMLElement>('.dl-picker')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setPending(true);
    setError('');
    try {
      const url = await cart.checkoutUrl(locale, useWelcome);
      if (!url) { setReview(true); setPending(false); return; }
      trackCheckoutStarted(lines, subtotal.amount, subtotal.currencyCode, cart.shopifyCart?.id ?? null, locale, cart.delivery);
      window.location.assign(url);
    } catch (cause) {
      if (cause instanceof DeliveryRequiredError) {
        trackCheckoutFailed(cause.problem, cart.shopifyCart?.id ?? null, subtotal.amount);
        setProblem(cause.problem);
      } else {
        trackCheckoutFailed('checkout_url_error', cart.shopifyCart?.id ?? null, subtotal.amount);
        setError(t.error);
      }
      setPending(false);
    }
  }

  const welcome = (
    <section className="bag-welcome">
      {welcomeCode ? <>
        <p>{cart.shopifyCart?.discountCodes.some((item) => item.applicable && item.code === welcomeCode) ? (ar ? 'تم تطبيق خصم الترحيب' : 'Welcome discount applied') : (ar ? 'رمز الترحيب جاهز للدفع' : 'Welcome code ready for checkout')}</p>
        <label><input type="checkbox" checked={useWelcome} onChange={(event) => { setUseWelcome(event.target.checked); void cart.applyWelcomeOffer?.(event.target.checked).catch(() => setError(t.error)); }} />{ar ? 'استخدم عرض الترحيب' : 'Use my welcome offer'}</label>
      </> : <button type="button" className="button button--ghost" onClick={openOffer}>{ar ? 'احصل على خصم ٢٥٪ على طلبك الأول' : 'Get 25% off your first order'}</button>}
    </section>
  );

  return (
    <DialogShell onClose={close} label={review ? t.reviewTitle : t.bag} kind="cart">
      <div className="ll-cart-header"><span className="ll-shop-kicker">MAISON BOTANIQUE / DUBAI</span><h2>{review ? t.reviewTitle : t.bag}</h2></div>
      {!review && lines.length === 0 && welcome}
      {review ? (
        <div className="ll-cart-review">
          <div className="ll-review-symbol" aria-hidden="true">MB</div>
          <p className="ll-review-lead">{t.reviewIntro}</p>
          <p>{t.reviewNotice}</p>
          <div className="ll-review-total"><span>{t.subtotal}</span><strong><Money amount={subtotal.amount} ar={ar} whole /></strong></div>
          {orderLink && <a className="ll-shop-primary wa-order" href={orderLink} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /><span>{t.orderWhatsapp}</span></a>}
          <button className="ll-shop-secondary" type="button" onClick={() => setReview(false)}>{t.backBag}</button>
        </div>
      ) : lines.length === 0 ? (
        <div className="ll-cart-empty">
          {cart.busy ? <p role="status">{t.updating}</p> : <>
            <div className="ll-empty-flower" aria-hidden="true">
              <svg viewBox="0 0 64 64" fill="none">
                <path d="M31 54c2-14 2-27 0-42M31 32C13 27 15 13 16 11c12 0 17 9 15 21Zm0 9c4-13 14-18 21-16-1 10-8 16-21 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="31" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <h3>{t.bagEmpty}</h3><p>{t.bagEmptyDetail}</p>
            {cart.error && <p className="ll-shop-error" role="alert">{t.cartError}</p>}
            <button className="ll-shop-secondary" type="button" onClick={close}>{t.backToShop}</button>
          </>}
        </div>
      ) : <>
        <div className="ll-cart-lines" aria-busy={cart.busy}>
          {welcome}
          {lines.map((line) => (
            <article className="ll-cart-line" key={line.key}>
              <img src={line.image} alt="" />
              <div className="ll-cart-line-info">
                <h3>{line.product ? <a href={`/shop/${line.product.id}`}>{ar ? line.nameAr : line.name}</a> : (ar ? line.nameAr : line.name)}</h3>
                <p>{ar ? line.sizeNameAr : line.sizeName} · <Money amount={line.unitPrice.amount} ar={ar} whole /> {t.each}</p>
                {line.custom && <p className="ll-cart-line-detail">{t.customLine}: {line.custom}</p>}
                {line.note && <p className="ll-cart-line-detail" data-ph-mask>{t.noteLine}: {line.note}</p>}
                {(line.anonymous || line.signedAs) && <p className="ll-cart-line-detail" data-ph-mask>{line.anonymous ? t.anonymousLine : `${t.signedLine}: ${line.signedAs}`}</p>}
                <div className="ll-cart-controls">
                  <div className="ll-quantity" role="group" aria-label={t.quantity}>
                    <button type="button" onClick={() => cart.updateQuantity(line.key, line.quantity - 1)} disabled={cart.busy} aria-label={`${t.quantity} −`}>−</button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button type="button" onClick={() => cart.updateQuantity(line.key, line.quantity + 1)} disabled={cart.busy || line.quantity >= 99} aria-label={`${t.quantity} +`}>+</button>
                  </div>
                  <button className="ll-remove" type="button" onClick={() => cart.removeItem(line.key)} disabled={cart.busy}>{t.remove}</button>
                </div>
              </div>
            </article>
          ))}
          <DeliveryPicker t={t} value={schedule} onChange={changeSchedule} problem={problem} />
        </div>
        <div className="ll-cart-footer">
          <div className="ll-cart-totals">
            <div><span>{t.subtotal}</span><strong><Money amount={subtotal.amount} ar={ar} whole /></strong></div>
            {summary && <div><span>{t.deliveryLine}</span><span data-ph-mask>{summary}</span></div>}
          </div>
          {blocked && <p className="ll-cart-date-alert" role="status">{t[blocked]}</p>}
          <button className={`ll-shop-primary${blocked ? ' is-blocked' : ''}`} type="button" onClick={handleCheckout}
            disabled={pending || cart.busy} aria-disabled={blocked ? true : undefined}>
            <span>{pending ? t.pending : cart.busy ? t.updating : live ? t.secureCheckout : t.previewCheckout}</span><ArrowIcon />
          </button>
          {(error || cart.error) && <p className="ll-shop-error" role="alert">{error || t.cartError}</p>}
          {orderLink && <a className="wa-inline ll-cart-wa" href={orderLink} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />{t.orderWhatsapp}</a>}
        </div>
      </>}
    </DialogShell>
  );
}

/** The add-to-bag confirmation: the visitor keeps browsing. */
function BagToast() {
  const { ar, toast, dismissToast, setCartOpen } = useStore();
  return (
    <div className={`bag-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
      {toast && <>
        <img src={toast.product.imageSmall} alt="" />
        <p><em>{ar ? toast.product.nameAr : toast.product.name}</em>{toast.sizeName ? `, ${toast.sizeName},` : ''} {ar ? 'في حقيبتك الآن' : 'is in your bag'}.</p>
        <button type="button" onClick={() => { dismissToast(); setCartOpen(true); }}>{ar ? 'عرض الحقيبة' : 'View bag'}</button>
        <button type="button" className="bag-toast__close" aria-label={ar ? 'إغلاق' : 'Close'} onClick={dismissToast}>×</button>
      </>}
    </div>
  );
}

/** The quick-add sheet and the bag. A single modal at a time keeps focus and scroll predictable. */
export default function ShopSheets() {
  const { selectedProduct, cartOpen } = useStore();
  return (
    <>
      {selectedProduct ? <QuickAdd key={selectedProduct.id} product={selectedProduct} /> : cartOpen ? <Bag /> : null}
      <BagToast />
    </>
  );
}
