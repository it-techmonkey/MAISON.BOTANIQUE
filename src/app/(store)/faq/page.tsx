import type { Metadata } from 'next';
import { ArrowLink, InfoPage } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';
import { ORDER_QUESTIONS } from '@/lib/growth-content';
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
          ...ORDER_QUESTIONS.filter(({ question }) => question.en === 'Which size is in the photograph?')
            .map(({ question, answer }) => ({ title: question, paragraphs: [answer] })),
          {
            title: { en: 'Can I send flowers to Dubai from another country?', ar: 'هل يمكنني إرسال الزهور إلى دبي من بلد آخر؟' },
            paragraphs: [{ en: 'You can browse and order online from abroad. Use the recipient’s full Dubai delivery address and a reachable phone number, and check the date in Dubai time. Available payment methods appear at checkout; overseas card acceptance depends on your bank and the payment provider. Our Notes on giving guides explain the steps.', ar: 'يمكنك التصفح والطلب عبر الإنترنت من الخارج. استخدم عنوان المستلم كاملاً في دبي ورقم هاتف يمكن التواصل معه، وتحقق من التاريخ بتوقيت دبي. تظهر طرق الدفع عند إتمام الطلب، ويعتمد قبول البطاقة الأجنبية على مصرفك ومزود الدفع. توضح أدلة «عن الإهداء» الخطوات.' }],
          },
          {
            title: { en: 'How do I add a gift note?', ar: 'كيف أضيف رسالة إهداء؟' },
            paragraphs: [{ en: 'Open any piece and write your message in the gift note field before adding it to your bag. Each piece in your bag can carry its own note.', ar: 'افتح أي قطعة واكتب رسالتك في خانة رسالة الإهداء قبل إضافتها إلى الحقيبة. يمكن أن تحمل كل قطعة في حقيبتك رسالتها الخاصة.' }],
          },
          {
            title: { en: 'Can I choose the delivery date and time?', ar: 'هل يمكنني اختيار تاريخ ووقت التوصيل؟' },
            paragraphs: [{ en: 'Yes. Choose the day and a three-hour delivery window (9am to 9pm) in your bag, up to 60 days ahead. For same-day delivery in Dubai, order at least one hour before the window starts.', ar: 'نعم. اختر اليوم وفترة توصيل من ثلاث ساعات (من 9 صباحاً حتى 9 مساءً) من حقيبتك، حتى 60 يوماً مقدماً. للتوصيل في اليوم نفسه داخل دبي، اطلب قبل بداية الفترة بساعة واحدة على الأقل.' }],
          },
          {
            title: { en: 'Where do you deliver?', ar: 'إلى أين توصلون؟' },
            paragraphs: [{ en: 'We offer same-day delivery in Dubai and also deliver across the UAE. Delivery is AED 30 in Dubai and AED 50 elsewhere in the UAE. Enter the full recipient delivery address at checkout, including building, apartment and area.', ar: 'نوفر التوصيل في اليوم نفسه داخل دبي، ونوصل أيضاً إلى جميع أنحاء الإمارات. التوصيل ٣٠ درهماً في دبي و٥٠ درهماً في بقية الإمارات. أدخل عنوان المستلم كاملاً عند الدفع، بما فيه المبنى والشقة والمنطقة.' }],
          },
          {
            title: { en: 'Will my flowers look exactly like the photograph?', ar: 'هل ستبدو زهوري تماماً كما في الصورة؟' },
            paragraphs: [{ en: 'Every arrangement is made by hand with seasonal flowers, so each one is a little different. If a stem is not at its best, we use one of equal quality and a similar feeling.', ar: 'كل تنسيق يُصنع يدوياً بزهور موسمية، لذا يختلف كل واحد قليلاً. إذا لم تكن زهرة في أفضل حالاتها، نستخدم أخرى بالجودة نفسها وبإحساس مشابه.' }],
          },
          {
            title: { en: 'What if my flowers arrive damaged?', ar: 'ماذا لو وصلت زهوري تالفة؟' },
            paragraphs: [{ en: 'Send us your request within 30 minutes of delivery, with your order number and a photograph, and we will replace the arrangement or refund the order. See our refund policy for details.', ar: 'أرسل إلينا طلبك خلال ٣٠ دقيقة من التوصيل مع رقم طلبك وصورة، وسنستبدل التنسيق أو نردّ قيمة الطلب. راجع سياسة الاسترداد لمعرفة التفاصيل.' }],
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
