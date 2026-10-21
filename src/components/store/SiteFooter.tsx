'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { TAB_IDS, liveCatalogGroups } from '@/lib/catalog-groups';
import { occasionHash, SITE } from '@/lib/site';
import { whatsappLink, whatsappMessage } from '@/lib/whatsapp';
import { NewsletterForm } from './Forms';
import { InstagramIcon } from './icons';
import { CollectionLink } from './SiteHeader';
import { useStore } from './StoreProvider';
import { WhatsAppIcon } from './WhatsAppButton';

const FOOTER = {
  en: {
    shop: 'Shop', occasions: 'Occasions', help: 'Help', bloom: 'Stay in bloom',
    delivery: 'Same-day delivery in Dubai. UAE delivery: AED 30 in Dubai · AED 50 elsewhere.',
    bloomLine: 'Be the first to know about new collections and offers.',
    whatsapp: 'WhatsApp', language: 'العربية', top: 'Back to top',
    notice: 'Prices are in AED. Delivery and any taxes are confirmed at checkout.',
    preview: 'Preview for review. Payments are not live.',
  },
  ar: {
    shop: 'تسوّق', occasions: 'المناسبات', help: 'المساعدة', bloom: 'ابقَ في أجواء الزهور',
    delivery: 'توصيل في اليوم نفسه داخل دبي. نوصل إلى جميع أنحاء الإمارات: ٣٠ درهماً في دبي، و٥٠ درهماً في بقية الإمارات.',
    bloomLine: 'كن أول من يعرف عن المجموعات والعروض الجديدة.',
    whatsapp: 'واتساب', language: 'English', top: 'العودة للأعلى',
    notice: 'الأسعار بالدرهم الإماراتي. يُؤكَّد التوصيل وأي ضرائب عند الدفع.',
    preview: 'معاينة للمراجعة. الدفع غير مفعل.',
  },
};

const HELP = [
  { href: '/delivery', en: 'Delivery information', ar: 'معلومات التوصيل' },
  { href: '/delivery#where-we-deliver', en: 'Delivery areas', ar: 'مناطق التوصيل' },
  { href: '/residences', en: 'Flowers for your building', ar: 'زهور لمبناك' },
  { href: '/delivery#caring-for-fresh-flowers', en: 'Flower care guide', ar: 'دليل العناية بالزهور' },
  { href: '/refund-policy', en: 'Refund policy', ar: 'سياسة الاسترداد' },
  { href: '/contact', en: 'Contact us', ar: 'تواصل معنا' },
  { href: '/account', en: 'Your account', ar: 'حسابي' },
];

const BASE = [
  { href: '/atelier', en: 'Our philosophy', ar: 'فلسفتنا' },
  { href: '/services', en: 'Events & gifting', ar: 'المناسبات والإهداء' },
  { href: '/privacy', en: 'Privacy', ar: 'الخصوصية' },
  { href: '/terms', en: 'Terms', ar: 'الشروط' },
  { href: '/refund-policy', en: 'Refunds', ar: 'الاسترداد' },
];

export default function SiteFooter() {
  const { ar, live, products, setLocale } = useStore();
  const t = FOOTER[ar ? 'ar' : 'en'];
  const { occasions, findGroup } = useMemo(() => liveCatalogGroups(products), [products]);
  const rooms = TAB_IDS.filter((id) => id !== 'all').map(findGroup).filter((group) => group !== null);
  const whatsapp = whatsappLink(whatsappMessage.general(ar));
  const label = (item: { en: string; ar: string }) => (ar ? item.ar : item.en);

  return (
    <footer className="mb-footer" id="site-footer" data-track-location="footer">
      <div className="mb-footer__cols" data-track-section="footer_links">
        <div className="mb-footer__brand">
          <span>MAISON</span><strong>BOTANIQUE</strong>
          <p>{t.delivery}</p>
          <p className="mb-footer__social">
            {SITE.instagram && <a href={`https://instagram.com/${SITE.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon /></a>}
            {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp}><WhatsAppIcon /></a>}
            <a href={`mailto:${SITE.email}`} aria-label={SITE.email} dir="ltr">@</a>
          </p>
        </div>
        <nav aria-label={t.shop}>
          <h2>{t.shop}</h2>
          {rooms.map((group) => <CollectionLink key={group.id} hash={group.id}>{label(group)}</CollectionLink>)}
        </nav>
        <nav aria-label={t.occasions}>
          <h2>{t.occasions}</h2>
          {occasions.map((occasion) => <CollectionLink key={occasion.id} hash={occasionHash(occasion.id)}>{label(occasion)}</CollectionLink>)}
        </nav>
        <nav aria-label={t.help}>
          <h2>{t.help}</h2>
          {HELP.map((page) => <Link key={page.href} href={page.href}>{label(page)}</Link>)}
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>}
        </nav>
        <div>
          <h2>{t.bloom}</h2>
          <p>{t.bloomLine}</p>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="mb-footer__base">
        <span>© {new Date().getFullYear()} Maison Botanique · Dubai</span>
        <span className="mb-footer__notice">{live ? t.notice : t.preview}</span>
        <span className="mb-footer__actions">
          {BASE.map((page) => <Link key={page.href} href={page.href}>{label(page)}</Link>)}
          <button type="button" onClick={() => setLocale(ar ? 'en' : 'ar')}>{t.language}</button>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t.top} ↑</button>
        </span>
      </div>
    </footer>
  );
}
