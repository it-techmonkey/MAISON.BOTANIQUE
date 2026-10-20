import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/blocks';
import { SITE } from '@/lib/site';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Refund policy',
  description: 'When and how to ask for a replacement or refund from Maison Botanique: send your request within 30 minutes of delivery.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return (
    <InfoPage
      hero={{
        eyebrow: { en: 'Refund policy', ar: 'سياسة الاسترداد' },
        title: { en: 'If something is not right.', ar: 'إذا لم يكن شيء ما كما ينبغي.' },
        intro: { en: 'Fresh flowers are perishable, so we ask you to tell us quickly.', ar: 'الزهور الطازجة سريعة التلف، لذا نرجو إبلاغنا بسرعة.' },
      }}
      sections={[
        {
          title: { en: 'When to contact us', ar: 'متى تتواصل معنا' },
          paragraphs: [
            { en: 'If your flowers arrive damaged or not as described, send us your request within 30 minutes of delivery. Requests made after that cannot be accepted.', ar: 'إذا وصلت زهورك تالفة أو بخلاف الوصف، أرسل إلينا طلبك خلال ٣٠ دقيقة من التوصيل. لا يمكن قبول الطلبات المقدّمة بعد ذلك.' },
          ],
        },
        {
          title: { en: 'How to send your request', ar: 'كيف ترسل طلبك' },
          paragraphs: [
            { en: `Write to ${SITE.email} with your order number and a photograph of the flowers.`, ar: `راسلنا على ${SITE.email} مع رقم طلبك وصورة للزهور.` },
          ],
        },
        {
          title: { en: 'What we will do', ar: 'ما سنقوم به' },
          paragraphs: [
            { en: 'We reply by email once we have seen your photograph. If your request is accepted, we will either replace the arrangement or refund the order, and we will confirm which by email.', ar: 'نردّ عليك عبر البريد الإلكتروني بعد الاطلاع على صورتك. إذا قُبل طلبك، فسنستبدل التنسيق أو نردّ قيمة الطلب، وسنؤكد لك ذلك عبر البريد الإلكتروني.' },
          ],
        },
        {
          title: { en: 'How refunds are paid', ar: 'كيف يُدفع المبلغ المسترد' },
          paragraphs: [
            { en: 'A refund covers the price of the affected arrangement and is paid to the original payment method, in UAE dirhams. Your bank or card provider may take several working days to show it on your statement.', ar: 'يشمل الاسترداد سعر التنسيق المتضرر، ويُدفع إلى وسيلة الدفع الأصلية بالدرهم الإماراتي. قد يستغرق ظهوره في كشف حسابك عدة أيام عمل بحسب البنك أو مزوّد البطاقة.' },
          ],
        },
        {
          title: { en: 'What we cannot refund', ar: 'ما لا يمكننا استرداده' },
          paragraphs: [
            { en: 'We cannot refund an order for a change of mind, for natural variation in seasonal flowers, or because the address was incomplete or no one was available to receive the delivery. If a delivery could not be made, write to us and we will help arrange the next step.', ar: 'لا يمكننا استرداد قيمة الطلب بسبب تغيير الرأي، أو الاختلاف الطبيعي في الزهور الموسمية، أو لأن العنوان غير مكتمل أو لم يكن هناك من يستلم الطلب. إذا تعذّر التوصيل، راسلنا وسنساعدك في ترتيب الخطوة التالية.' },
          ],
        },
        {
          title: { en: 'Changes and cancellations', ar: 'التعديلات والإلغاء' },
          paragraphs: [
            { en: `To change or cancel an order, write to ${SITE.email} as early as possible. Fresh flowers are prepared especially for you, so we may not be able to cancel an order once it has been arranged.`, ar: `لتعديل طلب أو إلغائه، راسلنا على ${SITE.email} في أقرب وقت ممكن. تُجهَّز الزهور الطازجة خصيصاً لك، لذا قد لا نتمكن من إلغاء الطلب بعد تنسيقه.` },
          ],
        },
      ]} />
  );
}
