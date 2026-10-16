import React, { useEffect, useRef, useState } from 'react';
import { products as conceptProducts } from '../data/products';
import { createShopifyCheckout, getCheckoutReadiness } from '../lib/shopify';
import '../styles/shop.css';

const STORAGE_KEY = 'maison-botanique-concept-cart-v1';
const LEGACY_STORAGE_KEY = 'layl-and-leaf-concept-cart-v1';
const STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const copy = {
  en: {
    close: 'Close', bag: 'Your bag', bagEmpty: 'Your bag is waiting for a little beauty.',
    bagEmptyDetail: 'Explore the collection and add a flower moment.',
    backToShop: 'Explore the collection', sample: 'Sample price',
    presentation: 'Presentation', giftNote: 'Gift note', notePlaceholder: 'Your message, if you wish…',
    noteHint: 'Optional · up to 280 characters', date: 'Preferred delivery date',
    dateHint: 'A preferred date only. Delivery availability will be confirmed when the real store opens.',
    addBag: 'Add to bag', subtotal: 'Sample subtotal', delivery: 'Delivery',
    deliveryLater: 'Calculated by the future store',
    previewCheckout: 'Preview checkout', secureCheckout: 'Continue to secure checkout',
    reviewTitle: 'Checkout preview', reviewIntro: 'Your selections are saved in this browser for up to 30 days. Checkout is not connected yet; no order or payment will be taken.',
    reviewNotice: 'A real Shopify store, approved product variants, final prices and delivery rules are required before orders can open.',
    backBag: 'Back to bag', remove: 'Remove', quantity: 'Quantity',
    pending: 'Connecting to checkout…', error: 'Checkout could not open. Please try again.',
    dateOutdated: 'A preferred date in your bag has passed. Remove that piece and add it again with a new date before checkout.',
    conceptTag: 'Concept catalog / provisional product', each: 'each',
    noteLine: 'Gift note', dateLine: 'Preferred date',
  },
  ar: {
    close: 'إغلاق', bag: 'حقيبتك', bagEmpty: 'حقيبتك تنتظر لمسة من الجمال.',
    bagEmptyDetail: 'تصفّح المجموعة وأضف لحظة من الزهور.',
    backToShop: 'تصفّح المجموعة', sample: 'سعر تجريبي',
    presentation: 'الحجم', giftNote: 'رسالة الإهداء', notePlaceholder: 'رسالتك إن رغبت…',
    noteHint: 'اختياري · حتى ٢٨٠ حرفًا', date: 'تاريخ التوصيل المفضّل',
    dateHint: 'تاريخ مفضّل فقط. سيُؤكَّد التوفّر عند إطلاق المتجر الفعلي.',
    addBag: 'أضف إلى الحقيبة', subtotal: 'المجموع التجريبي', delivery: 'التوصيل',
    deliveryLater: 'يُحدَّد عند إطلاق المتجر',
    previewCheckout: 'معاينة الدفع', secureCheckout: 'متابعة الدفع الآمن',
    reviewTitle: 'معاينة الدفع', reviewIntro: 'اختياراتك محفوظة في هذا المتصفح لمدة تصل إلى ٣٠ يومًا. الدفع غير متصل بعد؛ لن يُنشأ طلب أو تُحصّل دفعة.',
    reviewNotice: 'يلزم متجر Shopify فعلي ومنتجات معتمدة وأسعار نهائية وقواعد توصيل قبل استقبال الطلبات.',
    backBag: 'العودة إلى الحقيبة', remove: 'إزالة', quantity: 'الكمية',
    pending: 'جارٍ فتح صفحة الدفع…', error: 'تعذّر فتح صفحة الدفع. يرجى المحاولة مجددًا.',
    dateOutdated: 'انقضى تاريخ توصيل مفضّل في حقيبتك. أزل هذا المنتج وأضفه مجددًا بتاريخ جديد قبل الدفع.',
    conceptTag: 'مجموعة تجريبية / منتج مبدئي', each: 'للوحدة',
    noteLine: 'رسالة الإهداء', dateLine: 'التاريخ المفضّل',
  },
};

function safeLine(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const product = conceptProducts.find((item) => item.id === raw.productId);
  if (!product) return null;
  if (!product.sizes.some((size) => size.id === raw.sizeId)) return null;
  const sizeId = raw.sizeId;
  const note = typeof raw.note === 'string' ? raw.note.slice(0, 280) : '';
  if (raw.deliveryDate && !validDate(raw.deliveryDate)) return null;
  const deliveryDate = raw.deliveryDate || '';
  const quantity = Math.min(99, Math.max(1, Number.parseInt(raw.quantity, 10) || 1));
  return {
    key: JSON.stringify([product.id, sizeId, note, deliveryDate]),
    productId: product.id, sizeId, note, deliveryDate, quantity,
  };
}

function readSavedCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || 'null');
    const age = Date.now() - Number(parsed?.savedAt);
    if (!parsed || !Array.isArray(parsed.lines) || !Number.isFinite(age) || age < 0 || age > STORAGE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return parsed.lines.slice(0, 40).map(safeLine).filter(Boolean);
  } catch { return []; }
}

function lineDetails(line) {
  const product = conceptProducts.find((item) => item.id === line.productId);
  if (!product) return null;
  const size = product.sizes.find((item) => item.id === line.sizeId);
  if (!size) return null;
  return { product, size, unitPrice: product.price + size.add };
}

export function useShopCart() {
  const [cart, setCart] = useState(readSavedCart);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), lines: cart })); } catch { /* Private browsing may block storage. */ }
  }, [cart]);

  function addItem(product, options = {}) {
    const canonical = conceptProducts.find((item) => item.id === product?.id);
    if (!canonical) return;
    const line = safeLine({
      productId: canonical.id,
      sizeId: options.sizeId || canonical.sizes[0].id,
      note: options.note || '',
      deliveryDate: options.deliveryDate || '',
      quantity: 1,
    });
    setCart((current) => {
      const found = current.find((item) => item.key === line.key);
      if (!found) return [...current, line];
      return current.map((item) => item.key === line.key
        ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item);
    });
  }

  function updateQuantity(key, quantity) {
    const nextQuantity = Math.max(0, Math.min(99, Number.parseInt(quantity, 10) || 0));
    setCart((current) => current.flatMap((line) => line.key !== key
      ? [line] : nextQuantity ? [{ ...line, quantity: nextQuantity }] : []));
  }

  function removeItem(key) { setCart((current) => current.filter((line) => line.key !== key)); }
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => {
    const details = lineDetails(line);
    return total + (details?.unitPrice || 0) * line.quantity;
  }, 0);
  return { cart, addItem, updateQuantity, removeItem, cartCount, subtotal };
}

function formatAED(value, ar) {
  return new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE', {
    style: 'currency', currency: 'AED', maximumFractionDigits: 0,
  }).format(value);
}

function todayDubai() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M3 12h18m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function DialogShell({ children, onClose, label, ar, kind }) {
  const shellRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'Tab') {
        const focusable = shellRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = priorOverflow;
      document.removeEventListener('keydown', handleKey);
      previous?.focus?.();
    };
  }, []);

  return <div className="ll-shop-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={shellRef} className={`ll-shop-panel ll-shop-panel--${kind}`} role="dialog" aria-modal="true" aria-label={label} dir={ar ? 'rtl' : 'ltr'}>
      <button ref={closeRef} className="ll-shop-close" type="button" onClick={onClose} aria-label={copy[ar ? 'ar' : 'en'].close}><CloseIcon /></button>
      {children}
    </section>
  </div>;
}

function ProductSheet({ product, ar, onClose, onAdd }) {
  const t = copy[ar ? 'ar' : 'en'];
  const [sizeId, setSizeId] = useState(product.sizes[0].id);
  const [note, setNote] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const chosenSize = product.sizes.find((size) => size.id === sizeId) || product.sizes[0];
  const price = product.price + chosenSize.add;

  return <DialogShell key={product.id} onClose={onClose} label={ar ? product.nameAr : product.name} ar={ar} kind="product">
    <div className="ll-product-photo" style={{ backgroundColor: product.bg }}>
      <img src={product.image} alt={ar ? product.nameAr : product.name} />
      <span className="ll-photo-index">MAISON BOTANIQUE / THE COLLECTION</span>
    </div>
    <div className="ll-product-body">
      <div className="ll-shop-kicker">{t.conceptTag}</div>
      <div className="ll-product-category">{ar ? product.categoryAr : product.category}</div>
      <h2>{ar ? product.nameAr : product.name}</h2>
      <p className="ll-product-description">{ar ? product.descriptionAr : product.description}</p>
      <div className="ll-shop-price"><strong>{formatAED(price, ar)}</strong><span>{t.sample}</span></div>

      <fieldset className="ll-shop-fieldset">
        <legend>{t.presentation}</legend>
        <div className="ll-size-options">{product.sizes.map((size) => <label key={size.id} className={size.id === sizeId ? 'is-selected' : ''}>
          <input type="radio" name={`size-${product.id}`} value={size.id} checked={size.id === sizeId} onChange={() => setSizeId(size.id)} />
          <span>{ar ? size.nameAr : size.name}</span><small>{formatAED(product.price + size.add, ar)}</small>
        </label>)}</div>
      </fieldset>

      <label className="ll-shop-label" htmlFor="ll-gift-note">{t.giftNote}</label>
      <textarea id="ll-gift-note" value={note} maxLength={280} onChange={(event) => setNote(event.target.value)} placeholder={t.notePlaceholder} rows={3} />
      <span className="ll-shop-help">{t.noteHint}</span>

      <label className="ll-shop-label" htmlFor="ll-date">{t.date}</label>
      <input id="ll-date" type="date" min={todayDubai()} value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
      <span className="ll-shop-help">{t.dateHint}</span>

      <button className="ll-shop-primary" type="button" onClick={() => onAdd(product, { sizeId, note: note.trim(), deliveryDate })}>
        <span>{t.addBag}</span><ArrowIcon />
      </button>
    </div>
  </DialogShell>;
}

function CartDrawer({ ar, onClose, cart, updateQuantity, removeItem, subtotal, products }) {
  const t = copy[ar ? 'ar' : 'en'];
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const readiness = getCheckoutReadiness(cart, products);

  async function handleCheckout() {
    if (readiness.reason === 'date') { setError(t.dateOutdated); return; }
    if (!readiness.ready) { setReview(true); return; }
    setPending(true);
    setError('');
    try {
      const url = await createShopifyCheckout(cart, products);
      window.location.assign(url);
    } catch { setError(t.error); setPending(false); }
  }

  return <DialogShell onClose={onClose} label={review ? t.reviewTitle : t.bag} ar={ar} kind="cart">
    <div className="ll-cart-header"><span className="ll-shop-kicker">MAISON BOTANIQUE / DUBAI</span><h2>{review ? t.reviewTitle : t.bag}</h2></div>
    {review ? <div className="ll-cart-review">
      <div className="ll-review-symbol" aria-hidden="true">MB</div>
      <p className="ll-review-lead">{t.reviewIntro}</p>
      <p>{t.reviewNotice}</p>
      <div className="ll-review-total"><span>{t.subtotal}</span><strong>{formatAED(subtotal, ar)}</strong></div>
      <button className="ll-shop-secondary" type="button" onClick={() => setReview(false)}>{t.backBag}</button>
    </div> : cart.length === 0 ? <div className="ll-cart-empty">
      <div className="ll-empty-flower" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M31 54c2-14 2-27 0-42M31 32C13 27 15 13 16 11c12 0 17 9 15 21Zm0 9c4-13 14-18 21-16-1 10-8 16-21 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="31" cy="12" r="3" fill="currentColor" />
        </svg>
      </div>
      <h3>{t.bagEmpty}</h3><p>{t.bagEmptyDetail}</p>
      <button className="ll-shop-secondary" type="button" onClick={onClose}>{t.backToShop}</button>
    </div> : <>
      <div className="ll-cart-lines">{cart.map((line) => {
        const details = lineDetails(line);
        if (!details) return null;
        const { product, size, unitPrice } = details;
        return <article className="ll-cart-line" key={line.key}>
          <img src={product.image} alt="" />
          <div className="ll-cart-line-info">
            <span className="ll-cart-line-category">{ar ? product.categoryAr : product.category}</span>
            <h3>{ar ? product.nameAr : product.name}</h3>
            <p>{ar ? size.nameAr : size.name} · {formatAED(unitPrice, ar)} {t.each}</p>
            {line.note && <p className="ll-cart-line-detail">{t.noteLine}: {line.note}</p>}
            {line.deliveryDate && <p className="ll-cart-line-detail">{t.dateLine}: {line.deliveryDate}</p>}
            {line.deliveryDate && line.deliveryDate < todayDubai() && <p className="ll-cart-date-alert">{t.dateOutdated}</p>}
            <div className="ll-cart-controls">
              <div className="ll-quantity" aria-label={t.quantity}>
                <button type="button" onClick={() => updateQuantity(line.key, line.quantity - 1)} aria-label={`${t.quantity} −`}>−</button>
                <span aria-live="polite">{line.quantity}</span>
                <button type="button" onClick={() => updateQuantity(line.key, line.quantity + 1)} disabled={line.quantity >= 99} aria-label={`${t.quantity} +`}>+</button>
              </div>
              <button className="ll-remove" type="button" onClick={() => removeItem(line.key)}>{t.remove}</button>
            </div>
          </div>
        </article>;
      })}</div>
      <div className="ll-cart-footer">
        <div className="ll-cart-totals"><div><span>{t.subtotal}</span><strong>{formatAED(subtotal, ar)}</strong></div><div><span>{t.delivery}</span><span>{t.deliveryLater}</span></div></div>
        <button className="ll-shop-primary" type="button" onClick={handleCheckout} disabled={pending}>
          <span>{pending ? t.pending : readiness.ready ? t.secureCheckout : t.previewCheckout}</span><ArrowIcon />
        </button>
        {error && <p className="ll-shop-error" role="alert">{error}</p>}
        <span className="ll-cart-disclaimer">{t.conceptTag} · {t.sample}</span>
      </div>
    </>}
  </DialogShell>;
}

export default function ShopExperience({
  locale = 'en', products = conceptProducts,
  cartOpen, setCartOpen, selectedProduct, setSelectedProduct,
  cart = [], addItem, updateQuantity, removeItem,
}) {
  const ar = locale === 'ar';
  const selected = typeof selectedProduct === 'string'
    ? products.find((item) => item.id === selectedProduct) : selectedProduct;
  const subtotal = cart.reduce((total, line) => {
    const details = lineDetails(line);
    return total + (details?.unitPrice || 0) * line.quantity;
  }, 0);

  function handleAdd(product, options) {
    addItem?.(product, options);
    setSelectedProduct?.(null);
    setCartOpen?.(true);
  }

  // A single modal at a time keeps keyboard focus and body scroll predictable.
  if (selected) return <ProductSheet key={selected.id} product={selected} ar={ar} onClose={() => setSelectedProduct?.(null)} onAdd={handleAdd} />;
  if (cartOpen) return <CartDrawer ar={ar} onClose={() => setCartOpen?.(false)} cart={cart} updateQuantity={updateQuantity} removeItem={removeItem} subtotal={subtotal} products={products} />;
  return null;
}
