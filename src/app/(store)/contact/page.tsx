import type { Metadata } from 'next';
import Link from 'next/link';
import { Bi, PageHero } from '@/components/store/blocks';
import { EnquiryForm } from '@/components/store/Forms';
import { T } from '@/components/store/StoreProvider';
import { SITE } from '@/lib/site';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Write to the Maison Botanique flower desk in Dubai about an order, a gift or an occasion.',
  alternates: { canonical: '/contact' },
};

const TOPICS = [
  { value: 'An order', label: { en: 'An order', ar: 'طلب' } },
  { value: 'A gift or bespoke arrangement', label: { en: 'A gift or bespoke arrangement', ar: 'هدية أو تنسيق خاص' } },
  { value: 'Events or weddings', label: { en: 'Events or weddings', ar: 'المناسبات أو الأعراس' } },
  { value: 'Corporate gifting', label: { en: 'Corporate gifting', ar: 'هدايا الشركات' } },
  { value: 'Something else', label: { en: 'Something else', ar: 'أمر آخر' } },
];

export default function ContactPage() {
  return (
    <div className="section section--top">
      <PageHero
        eyebrow={{ en: 'The flower desk', ar: 'مكتب الزهور' }}
        title={{ en: 'We would love to hear from you.', ar: 'يسعدنا أن نسمع منك.' }}
        intro={{
          en: 'Whether it is a question about an order, a gift you are planning or an occasion on the horizon, write to us and we will reply as soon as we can.',
          ar: 'سواء كان سؤالاً عن طلب، أو هدية تخطط لها، أو مناسبة قادمة، راسلنا وسنرد عليك في أقرب وقت ممكن.',
        }} />
      <div className="contact-layout">
        <aside className="contact-details">
          <div>
            <h2 className="eyebrow"><T en="Email" ar="البريد الإلكتروني" /></h2>
            <a href={`mailto:${SITE.email}`} dir="ltr">{SITE.email}</a>
          </div>
          {SITE.phone && (
            <div>
              <h2 className="eyebrow"><T en="Telephone" ar="الهاتف" /></h2>
              <a href={`tel:${SITE.phone}`} dir="ltr">{SITE.phone}</a>
            </div>
          )}
          {SITE.whatsapp && (
            <div>
              <h2 className="eyebrow">WhatsApp</h2>
              <a href={`https://wa.me/${SITE.whatsapp}`} rel="noopener"><T en="Message us" ar="راسلنا" /></a>
            </div>
          )}
          <div>
            <h2 className="eyebrow"><T en="Based in" ar="مقرنا" /></h2>
            <p><Bi text={SITE.city} /></p>
          </div>
          <div>
            <h2 className="eyebrow"><T en="Before you write" ar="قبل أن تراسلنا" /></h2>
            <p><T en="Delivery, care and ordering questions may already be answered in" ar="قد تجد إجابة أسئلة التوصيل والعناية والطلب في" />{' '}
              <Link href="/faq"><T en="our questions" ar="الأسئلة الشائعة" /></Link>.</p>
          </div>
        </aside>
        <EnquiryForm kind="contact" topics={TOPICS} />
      </div>
    </div>
  );
}
