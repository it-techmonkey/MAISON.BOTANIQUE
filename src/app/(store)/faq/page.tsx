import type { Metadata } from 'next';
import { ArrowLink, InfoPage } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Questions',
  description: 'Answers to common questions about ordering, delivery, gift notes and flower care at Maison Botanique.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <InfoPage
        asQuestions
        hero={{
          eyebrow: { en: 'Questions', ar: 'الأسئلة الشائعة' },
          title: { en: 'Good to know.', ar: 'معلومات مفيدة.' },
          intro: { en: 'If your question is not here, the flower desk is always happy to help.', ar: 'إذا لم تجد سؤالك هنا، يسعد مكتب الزهور دائماً بمساعدتك.' },
        }}
        sections={[
          {
            title: { en: 'How do I add a gift note?', ar: 'كيف أضيف رسالة إهداء؟' },
            paragraphs: [{ en: 'Open any piece and write your message in the gift note field before adding it to your bag. Each piece in your bag can carry its own note.', ar: 'افتح أي قطعة واكتب رسالتك في خانة رسالة الإهداء قبل إضافتها إلى الحقيبة. يمكن أن تحمل كل قطعة في حقيبتك رسالتها الخاصة.' }],
          },
          {
            title: { en: 'Can I choose the delivery date and time?', ar: 'هل يمكنني اختيار تاريخ ووقت التوصيل؟' },
            paragraphs: [{ en: 'Yes. Choose the day and a three-hour delivery window (9am to 9pm) in your bag, up to 60 days ahead. For same-day delivery, order at least three hours before the window starts.', ar: 'نعم. اختر اليوم وفترة توصيل من ثلاث ساعات (من 9 صباحاً حتى 9 مساءً) من حقيبتك، حتى 60 يوماً مقدماً. للتوصيل في اليوم نفسه، اطلب قبل بداية الفترة بثلاث ساعات على الأقل.' }],
          },
          {
            title: { en: 'Where do you deliver?', ar: 'إلى أين توصلون؟' },
            paragraphs: [{ en: 'We deliver across the UAE, with same-day delivery available everywhere. Delivery is AED 30 in Dubai and AED 40 elsewhere in the UAE, shown at checkout before you pay.', ar: 'نوصل في جميع أنحاء الإمارات، مع توصيل في اليوم نفسه في كل مكان. التوصيل ٣٠ درهماً في دبي و٤٠ درهماً في بقية الإمارات، ويظهر عند الدفع وقبل إتمامه.' }],
          },
          {
            title: { en: 'Will my flowers look exactly like the photograph?', ar: 'هل ستبدو زهوري تماماً كما في الصورة؟' },
            paragraphs: [{ en: 'Every arrangement is made by hand with seasonal flowers, so each one is a little different. If a stem is not at its best, we use one of equal quality and a similar feeling.', ar: 'كل تنسيق يُصنع يدوياً بزهور موسمية، لذا يختلف كل واحد قليلاً. إذا لم تكن زهرة في أفضل حالاتها، نستخدم أخرى بالجودة نفسها وبإحساس مشابه.' }],
          },
          {
            title: { en: 'How do I pay?', ar: 'كيف أدفع؟' },
            paragraphs: [{ en: 'Checkout is handled securely by Shopify. The payment methods available to you are shown at checkout.', ar: 'تتم عملية الدفع بأمان عبر Shopify، وتظهر طرق الدفع المتاحة لك عند إتمام الطلب.' }],
          },
          {
            title: { en: 'Do you arrange flowers for events and weddings?', ar: 'هل تنسقون الزهور للمناسبات والأعراس؟' },
            paragraphs: [{ en: 'Yes, as well as seasonal subscriptions and corporate gifting. Tell us about your occasion on our services page and we will reply with ideas.', ar: 'نعم، إضافة إلى الاشتراكات الموسمية وهدايا الشركات. أخبرنا عن مناسبتك في صفحة الخدمات وسنرد بأفكار.' }],
          },
          {
            title: { en: 'How long will my flowers last?', ar: 'كم ستدوم زهوري؟' },
            paragraphs: [{ en: 'With fresh water and a trim every two days, most fresh arrangements stay lovely for several days. Preserved flowers are made to last much longer. See delivery and care for tips.', ar: 'مع تجديد الماء وقص السيقان كل يومين، تبقى معظم التنسيقات الطازجة جميلة لعدة أيام. أما الزهور المحفوظة فتدوم لفترة أطول بكثير. اطلع على صفحة التوصيل والعناية للنصائح.' }],
          },
        ]} />
      <aside className="section callout">
        <div>
          <h2><T en="Still wondering?" ar="ما زال لديك سؤال؟" /></h2>
          <p><T en="Write to the flower desk and we will reply as soon as we can." ar="راسل مكتب الزهور وسنرد في أقرب وقت ممكن." /></p>
        </div>
        <ArrowLink href="/contact" label={{ en: 'Contact us', ar: 'تواصل معنا' }} variant="button" />
      </aside>
    </>
  );
}
