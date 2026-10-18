import React from 'react';
import '../styles/chrome.css';
import { whatsappLink, whatsappMessage } from '../lib/whatsapp';
import { WhatsAppEventsLink } from './WhatsAppButton.jsx';

const OFFER = {
  en: ['Opening offer · 25% off for our first 100 customers', 'Free delivery in JVC', 'Delivering across Dubai', 'A scented candle with each of those first orders'],
  ar: ['عرض الافتتاح · خصم ٢٥٪ لأول ١٠٠ عميل', 'توصيل مجاني في JVC', 'التوصيل في جميع أنحاء دبي', 'شمعة معطّرة مع كل طلب من هذه الطلبات الأولى'],
};

// A slow, continuous offer ribbon. The list is rendered twice so the loop is seamless;
// screen readers get the copy once from the button's label.
export function OfferBar({ locale = 'en', onClaim }) {
  const ar = locale === 'ar';
  const items = OFFER[ar ? 'ar' : 'en'];
  const claim = ar ? 'احصل على رمزك ←' : 'Claim your code →';
  const run = <span className="offer-bar__run" aria-hidden="true">{items.map((item) => <span key={item}>{item}</span>)}<span className="offer-bar__claim">{claim}</span></span>;
  // The whole ribbon opens the offer sign-up.
  return <button type="button" className="offer-bar" onClick={onClaim} aria-label={`${items.join('. ')}. ${claim}`}>
    <span className="offer-bar__track">{run}{run}</span>
  </button>;
}

const FOOTER = {
  en: {
    shop: 'Shop', occasions: 'Occasions', help: 'Help', about: 'Maison Botanique',
    helpLinks: ['Delivery across Dubai', 'Free delivery in JVC', 'Delivery times · coming soon', 'Flower care guide · coming soon'],
    whatsapp: 'WhatsApp a florist', whatsappSoon: 'WhatsApp a florist · coming soon',
    aboutLines: ['Hand-tied in Dubai', 'A handwritten card with every gift', 'No prices travel with the gift'],
    language: 'العربية', top: 'Back to top',
    notice: 'Preview for review. Prices are samples and payments are not live.',
  },
  ar: {
    shop: 'تسوّق', occasions: 'المناسبات', help: 'المساعدة', about: 'ميزون بوتانيك',
    helpLinks: ['التوصيل في جميع أنحاء دبي', 'توصيل مجاني في JVC', 'مواعيد التوصيل · قريباً', 'دليل العناية بالزهور · قريباً'],
    whatsapp: 'تواصل عبر واتساب', whatsappSoon: 'تواصل عبر واتساب · قريباً',
    aboutLines: ['تُنسَّق يدوياً في دبي', 'بطاقة بخط اليد مع كل هدية', 'لا تُرفق الأسعار مع الهدية'],
    language: 'English', top: 'العودة للأعلى',
    notice: 'معاينة للمراجعة. الأسعار تجريبية والدفع غير مفعل.',
  },
};

export function SiteFooter({ locale = 'en', rooms = [], occasions = [], onLocale }) {
  const ar = locale === 'ar';
  const t = FOOTER[ar ? 'ar' : 'en'];
  const whatsapp = whatsappLink(whatsappMessage('general', ar));
  return <footer className="mb-footer" id="site-footer" dir={ar ? 'rtl' : 'ltr'}>
    <div className="mb-footer__cols">
      <div className="mb-footer__brand"><span>MAISON</span><strong>BOTANIQUE</strong></div>
      <nav aria-label={t.shop}><h2>{t.shop}</h2>{rooms.map((r) => <a key={r.id} href={`#${r.id}`}>{ar ? r.ar : r.en}</a>)}</nav>
      <nav aria-label={t.occasions}><h2>{t.occasions}</h2>{occasions.map((o) => <a key={o.id} href={`#occasion/${o.id}`}>{ar ? o.ar : o.en}</a>)}</nav>
      <div><h2>{t.help}</h2>{t.helpLinks.map((line) => <p key={line}>{line}</p>)}
        {whatsapp ? <><p><a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a></p><p><WhatsAppEventsLink locale={locale} /></p></> : <p>{t.whatsappSoon}</p>}
      </div>
      <div><h2>{t.about}</h2>{t.aboutLines.map((line) => <p key={line}>{line}</p>)}</div>
    </div>
    <div className="mb-footer__base">
      <span>© Maison Botanique · Dubai</span>
      <span className="mb-footer__notice">{t.notice}</span>
      <span className="mb-footer__actions">
        <button type="button" onClick={onLocale}>{t.language}</button>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t.top} ↑</button>
      </span>
    </div>
  </footer>;
}
