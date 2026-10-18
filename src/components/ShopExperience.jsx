import React, { useEffect, useRef, useState } from 'react';
import { allProducts, findProduct } from '../data/catalog';
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
    presentation: 'Size', giftNote: 'Gift note', notePlaceholder: 'Your message, if you wish…',
    noteHint: 'Optional · up to 280 characters', date: 'Preferred delivery date',
    dateHint: 'A preferred date only. Delivery availability will be confirmed when the real store opens.',
    addBag: 'Add to bag', subtotal: 'Sample subtotal', delivery: 'Delivery',
    deliveryLater: 'Free in JVC · across Dubai, confirmed at checkout',
    offerLine: 'Opening offer: 25% off for our first 100 customers, applied at checkout with your code.',
    included: "What's included", alsoLike: 'You may also like',
    previewCheckout: 'Preview checkout', secureCheckout: 'Continue to secure checkout',
    reviewTitle: 'Checkout preview', reviewIntro: 'Your selections are saved in this browser for up to 30 days. Checkout is not connected yet; no order or payment will be taken.',
    reviewNotice: 'A real Shopify store, approved product variants, final prices and delivery rules are required before orders can open.',
    backBag: 'Back to bag', remove: 'Remove', quantity: 'Quantity',
    pending: 'Connecting to checkout…', error: 'Checkout could not open. Please try again.',
    dateOutdated: 'A preferred date in your bag has passed. Remove that piece and add it again with a new date before checkout.',
    conceptTag: 'Concept catalog / provisional product', each: 'each',
    noteLine: 'Gift note', dateLine: 'Preferred date',
    pictured: (size) => `Pictured: ${size}`, asPictured: 'As pictured', yourCard: 'Your card', handwritten: 'Handwritten in our studio',
    cardEmpty: 'Write what you would say if you were there.', signedAs: 'Signed', secret: 'Keep it a secret', secretSign: 'Someone who adores you',
    dubai: 'Dubai', anotherDay: 'Another day', noPrices: 'No prices travel with the gift.',
    photoPromise: 'Your bouquet is hand-tied in Dubai and your card is written by hand.',
    letterLabel: 'Your letter', ageLabel: 'Age on the arrangement', chooseLetter: 'Choose a letter to continue', chooseAge: 'Add the age to continue',
    signedLine: 'Signed', anonymousLine: 'Signed anonymously', customLine: 'Personalisation',
  },
  ar: {
    close: 'إغلاق', bag: 'حقيبتك', bagEmpty: 'حقيبتك تنتظر لمسة من الجمال.',
    bagEmptyDetail: 'تصفّح المجموعة وأضف لحظة من الزهور.',
    backToShop: 'تصفّح المجموعة', sample: 'سعر تجريبي',
    presentation: 'الحجم', giftNote: 'رسالة الإهداء', notePlaceholder: 'رسالتك إن رغبت…',
    noteHint: 'اختياري · حتى ٢٨٠ حرفًا', date: 'تاريخ التوصيل المفضّل',
    dateHint: 'تاريخ مفضّل فقط. سيُؤكَّد التوفّر عند إطلاق المتجر الفعلي.',
    addBag: 'أضف إلى الحقيبة', subtotal: 'المجموع التجريبي', delivery: 'التوصيل',
    deliveryLater: 'مجاني في JVC · في دبي يُؤكَّد عند الدفع',
    offerLine: 'عرض الافتتاح: خصم ٢٥٪ لأول ١٠٠ عميل، يُطبَّق عند الدفع برمزك.',
    included: 'ما يتضمنه', alsoLike: 'قد يعجبك أيضاً',
    previewCheckout: 'معاينة الدفع', secureCheckout: 'متابعة الدفع الآمن',
    reviewTitle: 'معاينة الدفع', reviewIntro: 'اختياراتك محفوظة في هذا المتصفح لمدة تصل إلى ٣٠ يومًا. الدفع غير متصل بعد؛ لن يُنشأ طلب أو تُحصّل دفعة.',
    reviewNotice: 'يلزم متجر Shopify فعلي ومنتجات معتمدة وأسعار نهائية وقواعد توصيل قبل استقبال الطلبات.',
    backBag: 'العودة إلى الحقيبة', remove: 'إزالة', quantity: 'الكمية',
    pending: 'جارٍ فتح صفحة الدفع…', error: 'تعذّر فتح صفحة الدفع. يرجى المحاولة مجددًا.',
    dateOutdated: 'انقضى تاريخ توصيل مفضّل في حقيبتك. أزل هذا المنتج وأضفه مجددًا بتاريخ جديد قبل الدفع.',
    conceptTag: 'مجموعة تجريبية / منتج مبدئي', each: 'للوحدة',
    noteLine: 'رسالة الإهداء', dateLine: 'التاريخ المفضّل',
    pictured: (size) => `في الصورة: ${size}`, asPictured: 'كما في الصورة', yourCard: 'بطاقتك', handwritten: 'تُكتب بخط اليد في مشغلنا',
    cardEmpty: 'اكتب ما كنت ستقوله لو كنت هناك.', signedAs: 'التوقيع', secret: 'أبقِها مفاجأة', secretSign: 'شخص يحبك',
    dubai: 'دبي', anotherDay: 'يوم آخر', noPrices: 'لا تُرفق الأسعار مع الهدية.',
    photoPromise: 'تُنسَّق باقتك يدوياً في دبي وتُكتب بطاقتك بخط اليد.',
    letterLabel: 'الحرف', ageLabel: 'العمر على التنسيق', chooseLetter: 'اختر الحرف للمتابعة', chooseAge: 'أضف العمر للمتابعة',
    signedLine: 'التوقيع', anonymousLine: 'توقيع مجهول', customLine: 'التخصيص',
  },
};

function safeLine(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const product = findProduct(raw.productId);
  if (!product) return null;
  if (!product.sizes.some((size) => size.id === raw.sizeId)) return null;
  const sizeId = raw.sizeId;
  const note = typeof raw.note === 'string' ? raw.note.slice(0, 280) : '';
  if (raw.deliveryDate && !validDate(raw.deliveryDate)) return null;
  const deliveryDate = raw.deliveryDate || '';
  const quantity = Math.min(99, Math.max(1, Number.parseInt(raw.quantity, 10) || 1));
  const anonymous = raw.anonymous === true;
  const signedAs = !anonymous && typeof raw.signedAs === 'string' ? raw.signedAs.slice(0, 60) : '';
  const custom = typeof raw.custom === 'string' ? raw.custom.slice(0, 24) : '';
  return {
    key: JSON.stringify([product.id, sizeId, note, deliveryDate, signedAs, anonymous, custom]),
    productId: product.id, sizeId, note, deliveryDate, quantity, signedAs, anonymous, custom,
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
  const product = findProduct(line.productId);
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
    const canonical = findProduct(product?.id);
    if (!canonical) return;
    const line = safeLine({
      productId: canonical.id,
      sizeId: options.sizeId || canonical.sizes[0].id,
      note: options.note || '',
      deliveryDate: options.deliveryDate || '',
      signedAs: options.signedAs || '',
      anonymous: options.anonymous === true,
      custom: options.custom || '',
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

const STARTERS = {
  en: {
    birthday: ["Happy birthday. Here's to the year ahead, and every year after.", 'Another year of you. Lucky us.'],
    love: ['Still you. Always you.', 'For every ordinary day you made extraordinary.'],
    thanks: ['Thank you, truly. This is a small part of what I owe you.', 'For everything you did, quietly and so well.'],
    sorry: ['I was wrong. These are the first part of my apology.'],
    'get-well': ["Get well soon. We're keeping your seat warm."],
    'new-baby': ['Welcome to the world, little one.', 'Congratulations on your beautiful new arrival.'],
    congratulations: ['You earned every bit of this. Congratulations.'],
    'just-because': ['No reason at all. Just you.', 'Thinking of you today.'],
  },
  ar: {
    birthday: ['عيد ميلاد سعيد، وكل عام وأنت بخير.', 'سنة جديدة من وجودك. ما أسعدنا بك.'],
    love: ['أنت دائماً، أنت فقط.', 'أحبك اليوم أكثر من الأمس.'],
    thanks: ['شكراً من القلب، هذه لفتة صغيرة أمام كل ما قدمته.'],
    sorry: ['كنت مخطئاً، وهذه أول كلمات اعتذاري.'],
    'get-well': ['سلامتك، ننتظر عودتك بخير.'],
    'new-baby': ['أهلاً بك في هذا العالم يا صغيري.', 'مبارك المولود الجديد.'],
    congratulations: ['تستحق كل هذا النجاح. مبارك.'],
    'just-because': ['من دون مناسبة، فقط لأنك أنت.', 'أفكر فيك اليوم.'],
  },
};
const OCCASION_ALIAS = { anniversary: 'love', 'thank-you': 'thanks' };

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayLabel(isoDate, index, ar) {
  if (index === 0) return ar ? 'اليوم' : 'Today';
  if (index === 1) return ar ? 'غداً' : 'Tomorrow';
  return new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00Z`));
}

function CardPreview({ message, signedAs, anonymous, ar, t }) {
  const arabic = /[؀-ۿ]/.test(message);
  return <div className="qa-stage" aria-hidden="true">
    <div className="qa-envelope">
      <div className="qa-card">
        <span className="qa-card-mark">MAISON · BOTANIQUE</span>
        <span className={`qa-card-text${arabic ? ' is-arabic' : ''}${message ? '' : ' is-empty'}`}>{message || t.cardEmpty}</span>
        <span className="qa-card-from">{anonymous ? t.secretSign : signedAs}</span>
      </div>
      <div className="qa-pocket" />
      <div className="qa-seal">MB</div>
    </div>
  </div>;
}

function QuickAdd({ product, ar, onClose, onAdd, related = [], onOpen }) {
  const t = copy[ar ? 'ar' : 'en'];
  const today = todayDubai();
  const [sizeId, setSizeId] = useState(product.sizes[0].id);
  const [note, setNote] = useState('');
  const [signedAs, setSignedAs] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [custom, setCustom] = useState('');
  const [dayIndex, setDayIndex] = useState(-1);
  const [otherDate, setOtherDate] = useState('');
  const chosen = product.sizes.find((size) => size.id === sizeId) || product.sizes[0];
  const price = product.price + chosen.add;
  const occasion = OCCASION_ALIAS[product.occasions?.[0]] || product.occasions?.[0] || 'just-because';
  const starters = STARTERS[ar ? 'ar' : 'en'][occasion] || STARTERS[ar ? 'ar' : 'en']['just-because'];
  const days = [0, 1, 2].map((offset) => addDays(today, offset));
  const deliveryDate = dayIndex === 3 ? otherDate : dayIndex >= 0 ? days[dayIndex] : '';
  const composition = (ar ? product.compositionAr : product.composition) || [];
  const needsCustom = Boolean(product.custom);
  const customMissing = needsCustom && !custom.trim();
  const number = product.no ? `N° ${String(product.no).padStart(3, '0')}` : t.conceptTag;

  return <DialogShell key={product.id} onClose={onClose} label={ar ? product.nameAr : product.name} ar={ar} kind="quickadd">
    <div className="qa-scroll">
      <div className="qa-head">
        <span className="qa-kicker">{number} · {ar ? product.categoryAr : product.category}</span>
      </div>
      <div className="qa-hero">
        <img src={product.image} alt={ar ? product.nameAr : (product.alt || product.name)} />
        <div>
          <h2>{ar ? product.nameAr : product.name}</h2>
          {composition.length ? <>
            <span className="qa-included">{t.included}</span>
            <ul className="qa-list">{composition.map((item) => <li key={item}>{item}</li>)}</ul>
          </> : <p>{ar ? product.descriptionAr : product.description}</p>}
        </div>
      </div>

      <fieldset className="qa-section">
        <legend className="qa-legend"><span>{t.presentation}</span><em>{product.sizes.length > 1 ? t.pictured(ar ? product.sizes[0].nameAr : product.sizes[0].name) : t.asPictured}</em></legend>
        <div className="qa-sizes">{product.sizes.map((size, index) => <label key={size.id} className={`qa-size${size.id === sizeId ? ' is-selected' : ''}`}>
          <input type="radio" name={`qa-size-${product.id}`} value={size.id} checked={size.id === sizeId} onChange={() => setSizeId(size.id)} />
          <span className="qa-size-name"><strong>{ar ? size.nameAr : size.name}</strong>{(ar ? size.detailAr : size.detail) && <em>{ar ? size.detailAr : size.detail}</em>}</span>
          <span className="qa-scale" aria-hidden="true">{Array.from({ length: Math.min(index + 1, 6) }, (_, bar) => <i key={bar} style={{ height: `${9 + bar * 5}px` }} />)}</span>
          <span className="qa-size-price">{formatAED(product.price + size.add, ar)}</span>
        </label>)}</div>
        {needsCustom && <div className="qa-custom">
          <label htmlFor="qa-custom">{product.custom.kind === 'letter' ? t.letterLabel : product.custom.kind === 'age' ? t.ageLabel : product.custom.label}</label>
          <input id="qa-custom" value={custom} maxLength={product.custom.kind === 'letter' ? 1 : product.custom.kind === 'age' ? 3 : 24}
            inputMode={product.custom.kind === 'age' ? 'numeric' : 'text'}
            onChange={(event) => setCustom(product.custom.kind === 'letter' ? event.target.value.toUpperCase() : event.target.value)}
            placeholder={product.custom.kind === 'letter' ? 'A – Z' : product.custom.kind === 'age' ? '30' : ''} />
        </div>}
      </fieldset>

      <section className="qa-section" aria-labelledby="qa-card-title">
        <div className="qa-legend"><span id="qa-card-title">{t.yourCard}</span><em>{t.handwritten}</em></div>
        <CardPreview message={note.trim()} signedAs={signedAs.trim()} anonymous={anonymous} ar={ar} t={t} />
        <label className="qa-label" htmlFor="ll-gift-note">{t.giftNote}</label>
        <textarea id="ll-gift-note" value={note} maxLength={280} rows={3} onChange={(event) => setNote(event.target.value)} placeholder={t.notePlaceholder} />
        <div className="qa-starters">{starters.map((line) => <button type="button" key={line} onClick={() => setNote(line)}>{line}</button>)}</div>
        <div className="qa-sign">
          <input aria-label={t.signedAs} placeholder={t.signedAs} value={signedAs} maxLength={60} disabled={anonymous} onChange={(event) => setSignedAs(event.target.value)} />
          <button type="button" role="switch" aria-checked={anonymous} className="qa-switch" onClick={() => setAnonymous(!anonymous)}><i />{t.secret}</button>
        </div>
      </section>

      <fieldset className="qa-section">
        <legend className="qa-legend"><span>{t.date}</span><em>{t.dubai}</em></legend>
        <div className="qa-days">
          {days.map((iso, index) => <label key={iso} className={`qa-day${dayIndex === index ? ' is-selected' : ''}`}>
            <input type="radio" name="qa-day" checked={dayIndex === index} onChange={() => setDayIndex(index)} />
            <span>{dayLabel(iso, index, ar)}</span><strong>{Number(iso.slice(8))}</strong>
          </label>)}
          <label className={`qa-day${dayIndex === 3 ? ' is-selected' : ''}`}>
            <input type="radio" name="qa-day" checked={dayIndex === 3} onChange={() => setDayIndex(3)} />
            <span>{t.anotherDay}</span><strong>…</strong>
          </label>
        </div>
        {dayIndex === 3 && <input id="ll-date" type="date" min={today} value={otherDate} onChange={(event) => setOtherDate(event.target.value)} aria-label={t.date} />}
        <span className="ll-shop-help">{t.dateHint}</span>
      </fieldset>

      <ul className="qa-assure"><li>{t.noPrices}</li><li>{t.photoPromise}</li></ul>
      {related.length > 0 && <section className="qa-related" aria-labelledby="qa-related-title">
        <h3 id="qa-related-title" className="qa-included">{t.alsoLike}</h3>
        <div className="qa-related-row">{related.map((item) => <button type="button" key={item.id} onClick={() => onOpen(item)}>
          <img src={item.imageSmall} alt="" loading="lazy" width="160" height="160" />
          <span>{ar ? item.nameAr : item.name}</span>
          <small>{formatAED(item.price, ar)}</small>
        </button>)}</div>
      </section>}
    </div>
    <div className="qa-foot">
      <button className="qa-add" type="button" disabled={customMissing}
        onClick={() => onAdd(product, { sizeId, note: note.trim(), deliveryDate, signedAs: signedAs.trim(), anonymous, custom: custom.trim() })}>
        {customMissing ? (product.custom.kind === 'letter' ? t.chooseLetter : t.chooseAge) : `${t.addBag} · ${formatAED(price, ar)}`}
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
          <img src={product.imageSmall || product.image} alt="" />
          <div className="ll-cart-line-info">
            <span className="ll-cart-line-category">{ar ? product.categoryAr : product.category}</span>
            <h3>{ar ? product.nameAr : product.name}</h3>
            <p>{ar ? size.nameAr : size.name} · {formatAED(unitPrice, ar)} {t.each}</p>
            {line.custom && <p className="ll-cart-line-detail">{t.customLine}: {line.custom}</p>}
            {line.note && <p className="ll-cart-line-detail">{t.noteLine}: {line.note}</p>}
            {(line.anonymous || line.signedAs) && <p className="ll-cart-line-detail">{line.anonymous ? t.anonymousLine : `${t.signedLine}: ${line.signedAs}`}</p>}
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
        <p className="ll-cart-offer">{t.offerLine}</p>
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
  locale = 'en', products = allProducts,
  cartOpen, setCartOpen, selectedProduct, setSelectedProduct,
  cart = [], addItem, updateQuantity, removeItem, related: relatedPool = [], onAdded,
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
    const size = product.sizes.find((item) => item.id === options?.sizeId) || product.sizes[0];
    // Keep the visitor browsing: the app shows a confirmation; fall back to opening the bag.
    if (onAdded) onAdded(product, ar ? size.nameAr : size.name);
    else setCartOpen?.(true);
  }

  // Three nearby pieces: same room first, then a shared occasion.
  const related = selected ? relatedPool
    .filter((item) => item.id !== selected.id)
    .map((item) => ({ item, score: (item.room === selected.room ? 2 : 0) + (item.occasions?.some((o) => selected.occasions?.includes(o)) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || a.item.order - b.item.order)
    .slice(0, 3).map(({ item }) => item) : [];

  // A single modal at a time keeps keyboard focus and body scroll predictable.
  if (selected) return <QuickAdd key={selected.id} product={selected} ar={ar} onClose={() => setSelectedProduct?.(null)} onAdd={handleAdd} related={related} onOpen={(item) => setSelectedProduct?.(item)} />;
  if (cartOpen) return <CartDrawer ar={ar} onClose={() => setCartOpen?.(false)} cart={cart} updateQuantity={updateQuantity} removeItem={removeItem} subtotal={subtotal} products={products} />;
  return null;
}
