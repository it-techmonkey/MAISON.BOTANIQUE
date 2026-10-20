'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { trackFormError, trackFormStarted, trackFormSubmitted } from '@/lib/analytics/track';
import { uaeMobile } from '@/lib/enquiry';
import { OFFER_CODE } from '@/lib/site';
import { useStore } from './StoreProvider';

// Welcome offer: 25% off a first order.
// The sign-up is saved in Shopify as a newsletter customer (email or SMS
// marketing consent, src/lib/shopify/forms.ts), and the visitor sees the
// shared code. Create the code in Shopify (Discounts) with no total-use limit and
// one use per customer; set NEXT_PUBLIC_LAUNCH_OFFER_CODE if it isn't MAISON25.
const STORAGE_KEY = 'mb-launch-offer-v1';
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 1500;

const COPY = {
  en: {
    eyebrow: 'Welcome offer', title: '25% off your first order', sub: 'Sign up and get 25% off your first order.',
    whatsapp: 'WhatsApp', email: 'Email', phoneLabel: 'WhatsApp number', phonePh: '50 123 4567', emailLabel: 'Email address', emailPh: 'you@example.com',
    consent: 'Send me occasional Maison offers by email or SMS (optional). I can unsubscribe at any time.', privacy: 'Privacy policy',
    cta: 'Get my code', sending: 'Sending…', no: 'No thanks', invalidPhone: 'Enter a UAE mobile number, for example 50 123 4567.', invalidEmail: 'Enter a valid email address.', needConsent: 'Tick the box so we can send your code.',
    failed: 'Something went wrong. Please try again in a moment.',
    doneTitle: 'Your code is ready', doneSub: 'Your code is ready for checkout. Your details have been saved.',
    copy: 'Copy code', copied: 'Copied', shop: 'Start shopping', terms: 'One use per customer · 25% off products.',
    tab: '25% + up to 60% off', close: 'Close',
  },
  ar: {
    eyebrow: 'عرض الترحيب', title: 'خصم ٢٥٪ على طلبك الأول', sub: 'سجّل واحصل على خصم ٢٥٪ على طلبك الأول.',
    whatsapp: 'واتساب', email: 'البريد', phoneLabel: 'رقم واتساب', phonePh: '50 123 4567', emailLabel: 'البريد الإلكتروني', emailPh: 'you@example.com',
    consent: 'أرسلوا لي عروض ميزون بالبريد أو الرسائل النصية (اختياري). يمكنني إلغاء الاشتراك في أي وقت.', privacy: 'سياسة الخصوصية',
    cta: 'احصل على الرمز', sending: 'جارٍ الإرسال…', no: 'لا، شكراً', invalidPhone: 'أدخل رقم هاتف إماراتياً، مثل 50 123 4567.', invalidEmail: 'أدخل بريداً إلكترونياً صحيحاً.', needConsent: 'ضع علامة في المربع لنرسل لك الرمز.',
    failed: 'حدث خطأ ما. يرجى المحاولة بعد قليل.',
    doneTitle: 'رمزك جاهز', doneSub: 'رمزك جاهز للدفع. تم حفظ بياناتك.',
    copy: 'انسخ الرمز', copied: 'تم النسخ', shop: 'ابدأ التسوق', terms: 'استخدام واحد لكل عميل · خصم ٢٥٪ على المنتجات.',
    tab: 'خصم ٢٥٪ + حتى ٦٠٪', close: 'إغلاق',
  },
};

interface Saved { savedDetails?: boolean; code?: string; channel?: 'whatsapp' | 'email'; dismissedAt?: number }

function readState(): Saved {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
    if (state.code && state.code !== OFFER_CODE && !/^MB25-[A-F0-9]{20}$/.test(state.code)) { localStorage.removeItem(STORAGE_KEY); return {}; }
    return state;
  } catch { return {}; }
}
function writeState(value: Saved) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* storage may be blocked */ }
}
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export default function LaunchOffer() {
  const { ar, locale, offerSignal } = useStore();
  const t = COPY[ar ? 'ar' : 'en'];
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Saved>({});
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [value, setValue] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Opens on arrival unless the visitor already has a code or dismissed it recently.
  useEffect(() => {
    const state = readState();
    setSaved(state);
    if (new URLSearchParams(window.location.search).get('offer') === 'open') { setOpen(true); return; }
    if (state.code || (state.dismissedAt && Date.now() - state.dismissedAt < SNOOZE_MS)) return undefined;
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { if (offerSignal) setOpen(true); }, [offerSignal]);

  function dismiss() {
    setOpen(false);
    if (!saved.code) { const next = { ...saved, dismissedAt: Date.now() }; setSaved(next); writeState(next); }
  }
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => (inputRef.current || panelRef.current?.querySelector('button'))?.focus({ preventScroll: true }), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissRef.current();
      if (event.key === 'Tab') {
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>('button, input, a[href]');
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(focusTimer); document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previous?.focus?.({ preventScroll: true }); };
  }, [open]);

  const onFocus = () => {
    if (started.current) return;
    started.current = true;
    trackFormStarted('offer');
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = channel === 'whatsapp' ? !uaeMobile(value) : !validEmail(value);
    if (invalid) {
      trackFormError('offer', 'invalid', channel === 'whatsapp' ? 'phone' : 'email');
      setError(channel === 'whatsapp' ? t.invalidPhone : t.invalidEmail);
      return;
    }
    setError('');
    setSending(true);
    const body = { kind: 'offer', consent, locale, ...(channel === 'whatsapp' ? { phone: value } : { email: value }) };
    let issuedCode = OFFER_CODE;
    let delivery: 'shopify' | 'email_fallback' = 'shopify';
    try {
      const response = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      // Not connected (503): still give the code; the team receives nothing, so say nothing more.
      if (response.status === 503) delivery = 'email_fallback';
      else if (!response.ok) throw new Error(String(response.status));
      else { const result = await response.json(); issuedCode = result.code || OFFER_CODE; }
    } catch (cause) {
      trackFormError('offer', 'failed', null);
      setError(ar ? 'تعذّر الحصول على العرض. العرض متاح للطلب الأول فقط. يرجى المحاولة لاحقاً.' : 'We could not get your offer. It is available for first orders only. Please try again later.');
      if (cause instanceof Error && cause.message === '429') setError(ar ? 'يرجى الانتظار قليلاً قبل المحاولة مجدداً.' : 'Please wait a few minutes before trying again.');
      setSending(false);
      return;
    }
    // Only a flag is kept in the browser: the contact itself is never stored locally.
    const next: Saved = { code: issuedCode, channel, savedDetails: delivery !== 'email_fallback' };
    setSaved(next);
    writeState(next);
    window.dispatchEvent(new Event('maison-offer-changed'));
    setSending(false);
    trackFormSubmitted('offer', channel, delivery);
  }

  async function copyCode() {
    if (!saved.code) return;
    try { await navigator.clipboard.writeText(saved.code); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  }

  return <>
    {!open && <button type="button" className="lo-tab" onClick={() => setOpen(true)} dir={ar ? 'rtl' : 'ltr'}>{t.tab}</button>}
    {open && (
      <div className="lo-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
        <section className="lo-panel" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="lo-title" dir={ar ? 'rtl' : 'ltr'} data-track-location="launch_offer">
          <button type="button" className="lo-close" aria-label={t.close} onClick={dismiss}>×</button>
          <div className="lo-photo" aria-hidden="true"><img src="/collection/eloise-pink-and-white-rose-bouquet-960.webp" alt="" /></div>
          <div className="lo-body">
            <span className="lo-eyebrow">{t.eyebrow}</span>
            {saved.code ? <>
              <h2 id="lo-title">{t.doneTitle}</h2>
              <p className="lo-sub">{saved.savedDetails ? t.doneSub : (ar ? 'إليك رمزك. أدخله عند الدفع.' : 'Here is your code. Enter it at checkout.')}</p>
              <div className="lo-code"><strong dir="ltr">{saved.code}</strong><button type="button" onClick={copyCode}>{copied ? t.copied : t.copy}</button></div>
              <button type="button" className="lo-cta" onClick={() => { setOpen(false); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.shop}</button>
            </> : (
              <form onSubmit={submit} onFocus={onFocus} noValidate data-ph-mask>
                <h2 id="lo-title">{t.title}</h2>
                <p className="lo-sub">{t.sub}</p>
                <div className="lo-switch" role="radiogroup" aria-label={t.cta}>
                  {(['whatsapp', 'email'] as const).map((id) => (
                    <button type="button" key={id} role="radio" aria-checked={channel === id} onClick={() => { setChannel(id); setValue(''); setError(''); }}>{t[id]}</button>
                  ))}
                </div>
                <label className="lo-label" htmlFor="lo-input">{channel === 'whatsapp' ? t.phoneLabel : t.emailLabel}</label>
                <div className={`lo-field${channel === 'whatsapp' ? ' lo-field--phone' : ''}`}>
                  {channel === 'whatsapp' && <span dir="ltr">+971</span>}
                  <input id="lo-input" ref={inputRef} dir="ltr" value={value} onChange={(event) => setValue(event.target.value)}
                    type={channel === 'whatsapp' ? 'tel' : 'email'} inputMode={channel === 'whatsapp' ? 'tel' : 'email'}
                    autoComplete={channel === 'whatsapp' ? 'tel-national' : 'email'} placeholder={channel === 'whatsapp' ? t.phonePh : t.emailPh}
                    aria-invalid={Boolean(error)} aria-describedby={error ? 'lo-error' : undefined} />
                </div>
                <label className="lo-consent"><input id="lo-consent" type="checkbox" aria-describedby="lo-consent-text" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span id="lo-consent-text">{t.consent} <a href="/privacy">{t.privacy}</a></span></label>
                {error && <p className="lo-error" id="lo-error" role="alert">{error}</p>}
                <button type="submit" className="lo-cta" disabled={sending}>{sending ? t.sending : t.cta}</button>
                <button type="button" className="lo-no" onClick={dismiss}>{t.no}</button>
              </form>
            )}
            <p className="lo-terms">{t.terms}</p>
          </div>
        </section>
      </div>
    )}
  </>;
}
