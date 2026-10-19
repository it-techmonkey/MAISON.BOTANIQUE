import type { Metadata } from 'next';
import Image from 'next/image';
import { Bi, PageHero } from '@/components/store/blocks';
import { EnquiryForm } from '@/components/store/Forms';
import { T } from '@/components/store/StoreProvider';
import { SERVICES } from '@/lib/site';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Events, weddings & subscriptions',
  description: 'Florals for events, weddings, seasonal subscriptions and corporate gifting in Dubai. Tell us about your occasion.',
  alternates: { canonical: '/services' },
};

const PROCESS = [
  { title: { en: 'Tell us about it', ar: 'أخبرنا عنها' }, body: { en: 'Share the occasion, the place, the date and the feeling you have in mind.', ar: 'شاركنا المناسبة والمكان والتاريخ والشعور الذي تفكر فيه.' } },
  { title: { en: 'We propose', ar: 'نقدّم مقترحاً' }, body: { en: 'We reply with ideas, a palette and an estimate shaped to your brief.', ar: 'نرد بأفكار ولوحة ألوان وتقدير للتكلفة يناسب متطلباتك.' } },
  { title: { en: 'We arrange', ar: 'ننسّق' }, body: { en: 'Once confirmed, we compose, deliver and set up every piece.', ar: 'بعد التأكيد، ننسق كل قطعة ونوصلها ونركّبها.' } },
];

const TOPICS = [
  ...SERVICES.map((service) => ({ value: service.name.en, label: service.name })),
  { value: 'Something else', label: { en: 'Something else', ar: 'أمر آخر' } },
];

export default function ServicesPage() {
  return (
    <>
      <div className="section section--top">
        <PageHero
          eyebrow={{ en: 'Beyond the bouquet', ar: 'ما بعد الباقة' }}
          title={{ en: 'Flowers for life’s finer moments.', ar: 'زهور لأجمل لحظات الحياة.' }}
          intro={{
            en: 'From a single table to a whole celebration, and from a weekly arrangement to a season of client gifts, we design florals around the people and the place.',
            ar: 'من طاولة واحدة إلى احتفال كامل، ومن تنسيق أسبوعي إلى موسم من هدايا العملاء، نصمم الزهور حول الأشخاص والمكان.',
          }} />
      </div>

      <div className="services">
        {SERVICES.map((service, index) => (
          <section key={service.id} id={service.id} className={`service${index % 2 ? ' service--reverse' : ''}`} aria-labelledby={`${service.id}-title`}>
            <div className="service__media"><Image src={service.image} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
            <div className="service__copy">
              <span className="service__index">{String(index + 1).padStart(2, '0')}</span>
              <h2 id={`${service.id}-title`}><Bi text={service.name} /></h2>
              <p className="service__summary"><Bi text={service.summary} /></p>
              <p><Bi text={service.detail} /></p>
              <ul>{service.points.map((point) => <li key={point.en}><Bi text={point} /></li>)}</ul>
              <a className="arrow-link" href="#enquire"><T en="Enquire" ar="استفسر" /> <span aria-hidden="true" className="flip-rtl">→</span></a>
            </div>
          </section>
        ))}
      </div>

      <section className="section section--sand" aria-labelledby="process-title">
        <p className="eyebrow"><T en="How it works" ar="كيف نعمل" /></p>
        <h2 id="process-title" className="section-title"><T en="Three simple steps." ar="ثلاث خطوات بسيطة." /></h2>
        <ol className="steps">
          {PROCESS.map((step, index) => (
            <li key={step.title.en}>
              <span className="steps__number">{String(index + 1).padStart(2, '0')}</span>
              <h3><Bi text={step.title} /></h3>
              <p><Bi text={step.body} /></p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section enquire" id="enquire" aria-labelledby="enquire-title">
        <div className="enquire__intro">
          <p className="eyebrow"><T en="Enquire" ar="استفسر" /></p>
          <h2 id="enquire-title"><T en="Tell us about your occasion." ar="أخبرنا عن مناسبتك." /></h2>
          <p><T en="A few details are enough to begin. We will reply by email with ideas and next steps."
            ar="بعض التفاصيل تكفي للبدء. سنرد عبر البريد الإلكتروني بأفكار وخطوات تالية." /></p>
        </div>
        <EnquiryForm kind="enquiry" showDate topics={TOPICS} />
      </section>
    </>
  );
}
