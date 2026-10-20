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
            { en: 'If your request is accepted, we will replace the arrangement or refund the order to your original payment method, and we will confirm which by email.', ar: 'إذا قُبل طلبك، فسنستبدل التنسيق أو نردّ قيمة الطلب إلى وسيلة الدفع الأصلية، وسنؤكد لك ذلك عبر البريد الإلكتروني.' },
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
