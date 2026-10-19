'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { TAB_IDS, liveCatalogGroups } from '@/lib/catalog-groups';
import { SITE } from '@/lib/site';
import { whatsappLink, whatsappMessage } from '@/lib/whatsapp';
import { CollectionLink } from './SiteHeader';
import { useStore } from './StoreProvider';

const FOOTER = {
  en: {
    shop: 'Shop', occasions: 'Occasions', help: 'Help', about: 'Maison Botanique',
    helpLines: ['Delivery across Dubai', 'Free delivery in JVC'],
    whatsapp: 'WhatsApp a florist', events: 'Weddings & events',
    aboutLines: ['Hand-tied in Dubai', 'A handwritten card with every gift', 'No prices travel with the gift'],
    language: 'العربية', top: 'Back to top',
    notice: 'Prices are in AED. Delivery and any taxes are confirmed at checkout.',
    preview: 'Preview for review. Prices are samples and payments are not live.',
  },
  ar: {
    shop: 'تسوّق', occasions: 'المناسبات', help: 'المساعدة', about: 'ميزون بوتانيك',
    helpLines: ['التوصيل في جميع أنحاء دبي', 'توصيل مجاني في JVC'],
    whatsapp: 'تواصل عبر واتساب', events: 'حفلات الزفاف والمناسبات',
    aboutLines: ['تُنسَّق يدوياً في دبي', 'بطاقة بخط اليد مع كل هدية', 'لا تُرفق الأسعار مع الهدية'],
    language: 'English', top: 'العودة للأعلى',
    notice: 'الأسعار بالدرهم الإماراتي. يُؤكَّد التوصيل وأي ضرائب عند الدفع.',
    preview: 'معاينة للمراجعة. الأسعار تجريبية والدفع غير مفعل.',
  },
};

const PAGES = {
  help: [
    { href: '/delivery', en: 'Delivery & care', ar: 'التوصيل والعناية' },
    { href: '/faq', en: 'Questions', ar: 'الأسئلة الشائعة' },
    { href: '/contact', en: 'Contact', ar: 'تواصل معنا' },
    { href: '/account', en: 'Your account', ar: 'حسابي' },
  ],
  about: [
    { href: '/atelier', en: 'Our philosophy', ar: 'فلسفتنا' },
    { href: '/services', en: 'Events & gifting', ar: 'المناسبات والإهداء' },
    { href: '/privacy', en: 'Privacy', ar: 'الخصوصية' },
    { href: '/terms', en: 'Terms', ar: 'الشروط' },
  ],
};

export default function SiteFooter() {
  const { ar, live, products, setLocale } = useStore();
  const t = FOOTER[ar ? 'ar' : 'en'];
  const { occasions, findGroup } = useMemo(() => liveCatalogGroups(products), [products]);
  const rooms = TAB_IDS.filter((id) => id !== 'all').map(findGroup).filter((group) => group !== null);
  const whatsapp = whatsappLink(whatsappMessage.general(ar));
  const events = whatsappLink(whatsappMessage.events(ar));
  const label = (item: { en: string; ar: string }) => (ar ? item.ar : item.en);

  return (
    <footer className="mb-footer" id="site-footer" data-track-location="footer">
      <div className="mb-footer__cols" data-track-section="footer_links">
        <div className="mb-footer__brand"><span>MAISON</span><strong>BOTANIQUE</strong></div>
        <nav aria-label={t.shop}>
          <h2>{t.shop}</h2>
          {rooms.map((group) => <CollectionLink key={group.id} hash={group.id}>{label(group)}</CollectionLink>)}
        </nav>
        <nav aria-label={t.occasions}>
          <h2>{t.occasions}</h2>
          {occasions.map((occasion) => <CollectionLink key={occasion.id} hash={`occasion/${occasion.id}`}>{label(occasion)}</CollectionLink>)}
        </nav>
        <div>
          <h2>{t.help}</h2>
          {t.helpLines.map((line) => <p key={line}>{line}</p>)}
          {PAGES.help.map((page) => <Link key={page.href} href={page.href}>{label(page)}</Link>)}
          <a href={`mailto:${SITE.email}`} dir="ltr">{SITE.email}</a>
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>}
          {events && <a href={events} target="_blank" rel="noopener noreferrer">{t.events}</a>}
        </div>
        <div>
          <h2>{t.about}</h2>
          {t.aboutLines.map((line) => <p key={line}>{line}</p>)}
          {PAGES.about.map((page) => <Link key={page.href} href={page.href}>{label(page)}</Link>)}
        </div>
      </div>
      <div className="mb-footer__base">
        <span>© {new Date().getFullYear()} Maison Botanique · Dubai</span>
        <span className="mb-footer__notice">{live ? t.notice : t.preview}</span>
        <span className="mb-footer__actions">
          <button type="button" onClick={() => setLocale(ar ? 'en' : 'ar')}>{t.language}</button>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t.top} ↑</button>
        </span>
      </div>
    </footer>
  );
}
