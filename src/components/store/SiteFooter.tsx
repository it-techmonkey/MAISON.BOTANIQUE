'use client';

import Link from 'next/link';
import { ABOUT_LINKS, HELP_LINKS, NAV_LINKS, OCCASIONS, SITE } from '@/lib/site';
import { NewsletterForm } from './Forms';
import { useStore } from './StoreProvider';

export default function SiteFooter() {
  const { ar, t, live } = useStore();
  const pick = (value: { en: string; ar: string }) => (ar ? value.ar : value.en);

  return (
    <footer className="site-footer" data-track-location="footer">
      <section className="footer-letter" data-track-section="footer_newsletter" aria-labelledby="footer-letter-title">
        <div>
          <p className="eyebrow">{t('A note from the flower desk', 'رسالة من مكتب الزهور')}</p>
          <h2 id="footer-letter-title">{t('Something lovely, now and then.', 'شيء جميل، بين حين وآخر.')}</h2>
          <p>{t('Seasonal flowers, thoughtful gifting ideas and little reasons to celebrate.', 'زهور الموسم وأفكار إهداء مدروسة وأسباب صغيرة للاحتفال.')}</p>
        </div>
        <NewsletterForm />
      </section>

      <div className="footer-brand" aria-hidden="true"><span>MAISON</span><strong>BOTANIQUE</strong></div>
      <p className="footer-line">{t('Flowers for the moments that stay with us.', 'زهور للحظات تبقى معنا.')}</p>

      <div className="footer-columns" data-track-section="footer_links">
        <nav aria-label={t('Shop', 'المتجر')}>
          <h3>{t('Shop', 'المتجر')}</h3>
          <ul>{[ABOUT_LINKS[0], ...NAV_LINKS.slice(1, 4)].map((link) => <li key={link.href}><Link href={link.href}>{pick(link.label)}</Link></li>)}</ul>
        </nav>
        <nav aria-label={t('Occasions', 'المناسبات')}>
          <h3>{t('Occasions', 'المناسبات')}</h3>
          <ul>{OCCASIONS.map((occasion) => <li key={occasion.id}><Link href={`/occasions/${occasion.id}`}>{pick(occasion.name)}</Link></li>)}</ul>
        </nav>
        <nav aria-label={t('Maison', 'الدار')}>
          <h3>{t('Maison', 'الدار')}</h3>
          <ul>{ABOUT_LINKS.slice(1).map((link) => <li key={link.href}><Link href={link.href}>{pick(link.label)}</Link></li>)}</ul>
        </nav>
        <nav aria-label={t('Help', 'المساعدة')}>
          <h3>{t('Help', 'المساعدة')}</h3>
          <ul>{HELP_LINKS.filter((link) => link.href !== '/contact').map((link) => <li key={link.href}><Link href={link.href}>{pick(link.label)}</Link></li>)}</ul>
        </nav>
        <div>
          <h3>{t('Write to us', 'راسلنا')}</h3>
          <ul>
            <li><a href={`mailto:${SITE.email}`} dir="ltr">{SITE.email}</a></li>
            {SITE.phone && <li><a href={`tel:${SITE.phone}`} dir="ltr">{SITE.phone}</a></li>}
            {SITE.whatsapp && <li><a href={`https://wa.me/${SITE.whatsapp}`} rel="noopener">WhatsApp</a></li>}
            {SITE.instagram && <li><a href={`https://instagram.com/${SITE.instagram}`} rel="noopener" dir="ltr">@{SITE.instagram}</a></li>}
          </ul>
        </div>
      </div>

      <div className="footer-legal">
        <span>{t('Dubai, UAE', 'دبي، الإمارات')}</span>
        <span>© {new Date().getFullYear()} Maison Botanique</span>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t('Back to top ↑', 'العودة للأعلى ↑')}</button>
      </div>
      {!live && (
        <p className="footer-concept">{t(
          'Concept storefront for review. Imagery, products and prices are illustrative and payments are not live. Delivery terms will be confirmed before launch.',
          'متجر تجريبي للمراجعة. الصور والمنتجات والأسعار توضيحية والدفع غير مفعّل. ستُؤكَّد شروط التوصيل قبل الإطلاق.',
        )}</p>
      )}
    </footer>
  );
}
