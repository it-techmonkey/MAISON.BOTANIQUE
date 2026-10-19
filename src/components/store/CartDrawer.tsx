'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { checkSchedule, earliestDate, formatDeliveryDate, findSlot, type DeliverySchedule, type ScheduleProblem } from '@/lib/delivery';
import { formatMoney } from '@/lib/format';
import { trackCartViewed, trackCheckoutFailed, trackCheckoutStarted, trackDeliveryScheduled } from '@/lib/analytics/track';
import DeliveryPicker, { useDubaiNow } from './DeliveryPicker';
import { CloseIcon, LeafMark } from './icons';
import { useStore } from './StoreProvider';

const copy = {
  en: {
    close: 'Close', bag: 'Your bag', empty: 'Your bag is waiting for a little beauty.',
    emptyDetail: 'Explore the collection and add a flower moment.', shop: 'Shop the collection',
    sample: 'Sample price', each: 'each', note: 'Gift note',
    subtotal: 'Subtotal', sampleSubtotal: 'Sample subtotal', delivery: 'Delivery',
    deliveryLive: 'Calculated at checkout', deliveryLater: 'Confirmed before launch',
    checkout: 'Continue to secure checkout', preview: 'Preview checkout',
    reviewTitle: 'Checkout preview',
    reviewIntro: 'Your selections are saved in this browser for up to 30 days. Checkout is not connected yet; no order or payment will be taken.',
    reviewNotice: 'A connected Shopify catalog, final prices and delivery rules are required before orders can open.',
    back: 'Back to bag', remove: 'Remove', quantity: 'Quantity',
    pending: 'Opening checkout…', updating: 'Updating your bag…',
    error: 'Checkout could not open. Please try again.', cartError: 'Your bag could not be updated. Please try again.',
    concept: 'Concept catalog · provisional products and prices',
    extras: 'Add a little extra', add: 'Add', continueShopping: 'Continue shopping',
    secure: 'Secure checkout with Shopify', noteSaved: 'Gift notes and your delivery time travel with your order', scheduled: 'Delivering',
  },
  ar: {
    close: 'إغلاق', bag: 'حقيبتك', empty: 'حقيبتك تنتظر لمسة من الجمال.',
    emptyDetail: 'تصفّح المجموعة وأضف لحظة من الزهور.', shop: 'تسوّق المجموعة',
    sample: 'سعر تجريبي', each: 'للوحدة', note: 'رسالة الإهداء',
    subtotal: 'المجموع الفرعي', sampleSubtotal: 'المجموع التجريبي', delivery: 'التوصيل',
    deliveryLive: 'يُحتسب عند الدفع', deliveryLater: 'يُؤكَّد قبل الإطلاق',
    checkout: 'متابعة الدفع الآمن', preview: 'معاينة الدفع',
    reviewTitle: 'معاينة الدفع',
    reviewIntro: 'اختياراتك محفوظة في هذا المتصفح لمدة تصل إلى ٣٠ يومًا. الدفع غير متصل بعد؛ لن يُنشأ طلب أو تُحصّل دفعة.',
    reviewNotice: 'يلزم ربط كتالوج Shopify وأسعار نهائية وقواعد توصيل قبل استقبال الطلبات.',
    back: 'العودة إلى الحقيبة', remove: 'إزالة', quantity: 'الكمية',
    pending: 'جارٍ فتح صفحة الدفع…', updating: 'جارٍ تحديث حقيبتك…',
    error: 'تعذّر فتح صفحة الدفع. يرجى المحاولة مجددًا.', cartError: 'تعذّر تحديث حقيبتك. يرجى المحاولة مجددًا.',
    concept: 'مجموعة تجريبية · منتجات وأسعار مبدئية',
    extras: 'أضف لمسة إضافية', add: 'أضف', continueShopping: 'متابعة التسوق',
    secure: 'دفع آمن عبر Shopify', noteSaved: 'رسائل الإهداء وموعد التوصيل ترافق طلبك', scheduled: 'موعد التوصيل',
  },
};

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useStore();
  if (!cartOpen) return null;
  return <Drawer onClose={() => setCartOpen(false)} />;
}

function Drawer({ onClose }: { onClose: () => void }) {
  const { ar, locale, live, cart, products, addToBag } = useStore();
  const t = copy[ar ? 'ar' : 'en'];
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const { lines, subtotal } = cart;
  const now = useDubaiNow();
  const deliveryRef = useRef<HTMLDivElement>(null);
  // The bag's own copy of the schedule while it is incomplete; complete
  // choices are saved to the cart straight away.
  const [draft, setDraft] = useState<Partial<DeliverySchedule>>({});
  const [scheduleProblem, setScheduleProblem] = useState<ScheduleProblem | null>(null);
  const draftStarted = useRef(false);
  useEffect(() => {
    if (!now || draftStarted.current) return;
    draftStarted.current = true;
    setDraft(cart.delivery ?? { date: earliestDate(now) });
  }, [now, cart.delivery]);
  // An order schedule set elsewhere (product page, another tab) replaces the draft.
  useEffect(() => { if (cart.delivery) setDraft(cart.delivery); }, [cart.delivery]);
  const scheduleNow = cart.delivery ?? draft;
  const changeSchedule = (next: Partial<DeliverySchedule>) => {
    setDraft(next);
    setScheduleProblem(null);
    if (next.date && next.slotId && !checkSchedule(next, now ?? undefined)) {
      void cart.setDelivery(next as DeliverySchedule);
      trackDeliveryScheduled(next as DeliverySchedule, 'bag');
    }
  };
  const scheduledSlot = cart.delivery ? findSlot(cart.delivery.slotId) : null;
  // Small companions to what is already in the bag: preserved pieces and gifts first.
  const inBag = new Set(lines.map((line) => line.product?.id));
  const extras = products
    .filter((product) => product.available && !inBag.has(product.id))
    .sort((a, b) => Number(b.category !== 'Bouquets') - Number(a.category !== 'Bouquets') || a.price - b.price)
    .slice(0, 3);

  // One cart view per opening, reported once the cart has settled. Adding to
  // the bag opens the drawer before the mutation starts, so wait briefly for
  // the bag to stay idle rather than reporting the cart as it was before.
  const viewReported = useRef(false);
  const latest = useRef({ lines, subtotal, shopifyCart: cart.shopifyCart });
  latest.current = { lines, subtotal, shopifyCart: cart.shopifyCart };
  useEffect(() => {
    if (viewReported.current || cart.busy) return undefined;
    const timer = window.setTimeout(() => {
      viewReported.current = true;
      const { lines: settledLines, subtotal: settledSubtotal, shopifyCart } = latest.current;
      trackCartViewed(settledLines, settledSubtotal.amount, settledSubtotal.currencyCode, shopifyCart);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [cart.busy]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)');
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

  const close = () => { cart.clearError(); onClose(); };

  async function handleCheckout() {
    const problem = checkSchedule(scheduleNow, now ?? undefined);
    if (problem) {
      trackCheckoutFailed(problem, cart.shopifyCart?.id ?? null, subtotal.amount);
      setScheduleProblem(problem);
      deliveryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setPending(true);
    setError('');
    try {
      const url = await cart.checkoutUrl(locale);
      if (!url) { setReview(true); setPending(false); return; }
      trackCheckoutStarted(lines, subtotal.amount, subtotal.currencyCode, cart.shopifyCart?.id ?? null, locale, cart.delivery);
      window.location.assign(url);
    } catch {
      trackCheckoutFailed('checkout_url_error', cart.shopifyCart?.id ?? null, subtotal.amount);
      setError(t.error);
      setPending(false);
    }
  }

  return (
    <div className="bag-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section ref={panelRef} data-track-location="bag" className="bag-panel" role="dialog" aria-modal="true" aria-label={review ? t.reviewTitle : t.bag}>
        <header className="bag-header">
          <h2>{review ? t.reviewTitle : t.bag}</h2>
          <button ref={closeRef} className="icon-button" type="button" onClick={close} aria-label={t.close}><CloseIcon /></button>
        </header>

        {review ? (
          <div className="bag-review">
            <LeafMark className="bag-review__mark" />
            <p className="bag-review__lead">{t.reviewIntro}</p>
            <p>{t.reviewNotice}</p>
            <div className="bag-total"><span>{t.sampleSubtotal}</span><strong>{formatMoney(subtotal.amount, subtotal.currencyCode, ar)}</strong></div>
            <button className="button button--ghost" type="button" onClick={() => setReview(false)}>{t.back}</button>
          </div>
        ) : lines.length === 0 ? (
          <div className="bag-empty">
            {cart.busy ? <p role="status">{t.updating}</p> : <>
              <LeafMark className="bag-empty__mark" />
              <h3>{t.empty}</h3>
              <p>{t.emptyDetail}</p>
              {cart.error && <p className="form-error" role="alert">{t.cartError}</p>}
              <Link className="button" href="/shop" onClick={close}>{t.shop}<span aria-hidden="true">↗</span></Link>
            </>}
          </div>
        ) : <>
          <div className="bag-scroll">
          <div className="bag-lines" aria-busy={cart.busy}>
            {lines.map((line) => (
              <article className="bag-line" key={line.key}>
                <img src={line.image} alt="" />
                <div className="bag-line__info">
                  <span className="eyebrow">{ar ? line.categoryAr : line.category}</span>
                  <h3>{line.product ? <Link href={`/shop/${line.product.id}`} onClick={close}>{ar ? line.nameAr : line.name}</Link> : (ar ? line.nameAr : line.name)}</h3>
                  <p>{ar ? line.sizeNameAr : line.sizeName} · {formatMoney(line.unitPrice.amount, line.unitPrice.currencyCode, ar)} {t.each}</p>
                  {line.note && <p className="bag-line__detail" data-ph-mask>{t.note}: {line.note}</p>}
                  <div className="bag-line__controls">
                    <div className="quantity" role="group" aria-label={t.quantity}>
                      <button type="button" onClick={() => cart.updateQuantity(line.key, line.quantity - 1)} disabled={cart.busy} aria-label={`${t.quantity} −`}>−</button>
                      <span aria-live="polite">{line.quantity}</span>
                      <button type="button" onClick={() => cart.updateQuantity(line.key, line.quantity + 1)} disabled={cart.busy || line.quantity >= 99} aria-label={`${t.quantity} +`}>+</button>
                    </div>
                    <button className="text-button" type="button" onClick={() => cart.removeItem(line.key)} disabled={cart.busy}>{t.remove}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <section className="bag-delivery" ref={deliveryRef}>
            <DeliveryPicker compact value={scheduleNow} problem={scheduleProblem} onChange={changeSchedule} />
          </section>
          {extras.length > 0 && (
            <section className="bag-extras" aria-label={t.extras}>
              <h3>{t.extras}</h3>
              <ul>
                {extras.map((product) => (
                  <li key={product.id} className="bag-extra">
                    <img src={product.image} alt="" />
                    <div><strong>{ar ? product.nameAr : product.name}</strong><span>{formatMoney(product.price, product.currencyCode, ar)}</span></div>
                    <button type="button" onClick={() => addToBag(product, { source: 'bag_extra' })} disabled={cart.busy}
                      aria-label={`${t.add}: ${ar ? product.nameAr : product.name}`}>{t.add} +</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          </div>
          <footer className="bag-footer">
            <div className="bag-total"><span>{live ? t.subtotal : t.sampleSubtotal}</span><strong>{formatMoney(subtotal.amount, subtotal.currencyCode, ar)}</strong></div>
            {cart.delivery && scheduledSlot && (
              <div className="bag-total bag-total--quiet" data-ph-mask><span>{t.scheduled}</span>
                <span>{formatDeliveryDate(cart.delivery.date, ar)} · <bdi>{ar ? scheduledSlot.label.ar : scheduledSlot.label.en}</bdi></span></div>
            )}
            <div className="bag-total bag-total--quiet"><span>{t.delivery}</span><span>{live ? t.deliveryLive : t.deliveryLater}</span></div>
            <button className="button button--block" type="button" onClick={handleCheckout} disabled={pending || cart.busy}>
              <span>{pending ? t.pending : cart.busy ? t.updating : live ? t.checkout : t.preview}</span><span aria-hidden="true">↗</span>
            </button>
            {(error || cart.error) && <p className="form-error" role="alert">{error || t.cartError}</p>}
            <ul className="assurances"><li>{t.secure}</li><li>{t.noteSaved}</li></ul>
            <Link className="text-button bag-continue" href="/shop" onClick={close}>{t.continueShopping}</Link>
            {!live && <p className="bag-footer__note">{t.concept}</p>}
          </footer>
        </>}
      </section>
    </div>
  );
}
