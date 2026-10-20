import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/blocks';
import { SITE } from '@/lib/site';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms for ordering flowers and gifts from Maison Botanique.',
  alternates: { canonical: '/terms' },
};

// A plain-language starting point. Confirm the business details, cancellation
// and refund policy with the owner and a legal reviewer before launch.
export default function TermsPage() {
  return (
    <InfoPage
      hero={{
        eyebrow: { en: 'Terms', ar: 'الشروط' },
        title: { en: 'The fine print, kept simple.', ar: 'التفاصيل، ببساطة.' },
      }}
      sections={[
        {
          title: { en: 'Orders', ar: 'الطلبات' },
          paragraphs: [
            { en: 'An order is confirmed when you receive our confirmation email. Prices are shown in UAE dirhams and the total, including any delivery fee, is shown at checkout before you pay.', ar: 'يُعد الطلب مؤكداً عند استلامك رسالة التأكيد عبر البريد الإلكتروني. تُعرض الأسعار بالدرهم الإماراتي، ويظهر المجموع شاملاً أي رسوم توصيل عند الدفع وقبل إتمامه.' },
          ],
        },
        {
          title: { en: 'Natural variation', ar: 'الاختلاف الطبيعي' },
          paragraphs: [
            { en: 'Every arrangement is made by hand with seasonal flowers. Colours, stems and wrapping may vary slightly from the photographs, and we may substitute a flower of equal quality when needed.', ar: 'كل تنسيق يُصنع يدوياً بزهور موسمية. قد تختلف الألوان والأزهار والتغليف قليلاً عن الصور، وقد نستبدل زهرة بأخرى بالجودة نفسها عند الحاجة.' },
          ],
        },
        {
          title: { en: 'Delivery', ar: 'التوصيل' },
          paragraphs: [
            { en: 'Please make sure the recipient’s address and phone number are correct. If no one is available to receive the flowers, we will contact you to arrange the next step.', ar: 'يرجى التأكد من صحة عنوان المستلم ورقم هاتفه. إذا لم يكن هناك من يستلم الزهور، سنتواصل معك لترتيب الخطوة التالية.' },
          ],
        },
        {
          title: { en: 'Changes and cancellations', ar: 'التعديلات والإلغاء' },
          paragraphs: [
            { en: `If you need to change or cancel an order, write to ${SITE.email} as early as possible. Fresh flowers are prepared especially for you, so we may not be able to cancel an order once it has been arranged.`, ar: `إذا احتجت إلى تعديل طلب أو إلغائه، راسلنا على ${SITE.email} في أقرب وقت ممكن. تُجهَّز الزهور الطازجة خصيصاً لك، لذا قد لا نتمكن من إلغاء الطلب بعد تنسيقه.` },
          ],
        },
        {
          title: { en: 'If something is not right', ar: 'إذا لم يكن شيء ما كما ينبغي' },
          paragraphs: [
            { en: `If your flowers arrive damaged or not as described, send us your request within 30 minutes of delivery, at ${SITE.email}. Our refund policy explains what we will do.`, ar: `إذا وصلت زهورك تالفة أو بخلاف الوصف، أرسل إلينا طلبك خلال ٣٠ دقيقة من التوصيل على ${SITE.email}. توضّح سياسة الاسترداد ما سنقوم به.` },
          ],
        },
      ]} />
  );
}
