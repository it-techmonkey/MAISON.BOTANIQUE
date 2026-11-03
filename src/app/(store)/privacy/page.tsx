import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/blocks';
import { SITE } from '@/lib/site';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How Maison Botanique handles your personal information.',
  alternates: { canonical: '/privacy' },
};

// Reflects what this website actually does today. Have it reviewed against
// UAE data-protection requirements before launch.
export default function PrivacyPage() {
  return (
    <InfoPage
      hero={{
        eyebrow: { en: 'Privacy', ar: 'الخصوصية' },
        title: { en: 'Your information, handled with care.', ar: 'معلوماتك، نتعامل معها بعناية.' },
      }}
      sections={[
        {
          title: { en: 'What we collect', ar: 'ما نجمعه' },
          paragraphs: [
            { en: 'When you order, we receive the details needed to fulfil it: your name, contact details, the recipient’s name and address, your gift note and your delivery date and time.', ar: 'عند الطلب، نتلقى التفاصيل اللازمة لتنفيذه: اسمك وبيانات التواصل واسم المستلم وعنوانه ورسالة الإهداء وتاريخ التوصيل ووقته.' },
            { en: 'When you write to us or join our list, we receive the details you enter in the form.', ar: 'عندما تراسلنا أو تنضم إلى قائمتنا، نتلقى البيانات التي تدخلها في النموذج.' },
          ],
        },
        {
          title: { en: 'How we use it', ar: 'كيف نستخدمها' },
          paragraphs: [
            { en: 'We use your information to prepare and deliver your order, to reply to your messages and, only if you have asked us to, to send our newsletter. You can unsubscribe at any time.', ar: 'نستخدم معلوماتك لتجهيز طلبك وتوصيله، وللرد على رسائلك، ولإرسال نشرتنا فقط إذا طلبت ذلك. يمكنك إلغاء الاشتراك في أي وقت.' },
          ],
        },
        {
          title: { en: 'Checkout and payment', ar: 'الدفع وإتمام الطلب' },
          paragraphs: [
            { en: 'Checkout and payment are provided by Shopify. Card details are entered on Shopify’s secure checkout and are never seen or stored by this website.', ar: 'يوفر Shopify خدمة الدفع وإتمام الطلب. تُدخل بيانات البطاقة في صفحة الدفع الآمنة لدى Shopify، ولا يطّلع عليها هذا الموقع أو يخزنها.' },
          ],
        },
        {
          title: { en: 'Your browser', ar: 'متصفحك' },
          paragraphs: [
            { en: 'If you sign in to your account, a secure cookie keeps you signed in on this website. Your account, addresses and order history are held by Shopify; you can edit or delete them from your account page.', ar: 'عند تسجيل الدخول إلى حسابك، يُبقيك ملف تعريف ارتباط آمن مسجلاً على هذا الموقع. يحتفظ Shopify بحسابك وعناوينك وسجل طلباتك، ويمكنك تعديلها أو حذفها من صفحة حسابك.' },
            { en: 'This website stores your bag and your language choice in your browser so they are still there when you return.', ar: 'يحفظ هذا الموقع حقيبتك واختيار اللغة في متصفحك ليبقيا عند عودتك.' },
            { en: 'We use Shopify’s storefront analytics and PostHog to understand how the site is used: which pages and products are viewed, what is added to the bag and which orders are completed. PostHog may record sessions to help us improve the site; anything you type, and your gift notes, are hidden in those recordings. Both use cookies or similar browser storage, and neither receives your name, email address or gift notes from this website. PostHog also records where on a page people click and scroll, and how quickly pages load. When you order, PostHog receives the order’s value and contents with your Shopify customer number, so we can see how returning customers use the site.', ar: 'نستخدم تحليلات Shopify وPostHog لفهم طريقة استخدام الموقع: الصفحات والمنتجات التي تتم مشاهدتها، وما يُضاف إلى الحقيبة، والطلبات المكتملة. قد يسجّل PostHog الجلسات لمساعدتنا على تحسين الموقع، مع إخفاء كل ما تكتبه ورسائل الإهداء. يستخدم كلاهما ملفات تعريف الارتباط أو تخزيناً مشابهاً في المتصفح، ولا يتلقى أي منهما اسمك أو بريدك الإلكتروني أو رسائل الإهداء من هذا الموقع. كما يسجّل PostHog أماكن النقر والتمرير في الصفحات وسرعة تحميلها. وعند الطلب، يتلقى PostHog قيمة الطلب ومحتوياته مع رقم عميلك في Shopify، لنفهم كيف يستخدم العملاء العائدون الموقع.' },
            { en: 'Where Shopify’s privacy settings allow marketing and data sharing, the Meta Pixel records page visits, the products you view, what you add to the bag and when you start checkout, to help us measure our ads. It uses cookies or similar browser identifiers. We do not send your name, contact details or gift notes to Meta from this website.', ar: 'عندما تسمح إعدادات الخصوصية في Shopify بالتسويق ومشاركة البيانات، يسجّل Meta Pixel زيارات الصفحات والمنتجات التي تشاهدها وما تضيفه إلى الحقيبة وبدء الدفع، لمساعدتنا على قياس إعلاناتنا. ويستخدم ملفات تعريف الارتباط أو معرّفات مشابهة في المتصفح. لا نرسل اسمك أو بيانات التواصل أو رسالة الإهداء إلى Meta من هذا الموقع.' },
          ],
        },
        {
          title: { en: 'Your choices', ar: 'خياراتك' },
          paragraphs: [
            { en: `To ask what information we hold about you, or to have it corrected or deleted, write to ${SITE.email}.`, ar: `لمعرفة المعلومات التي نحتفظ بها عنك، أو لتصحيحها أو حذفها، راسلنا على ${SITE.email}.` },
          ],
        },
      ]} />
  );
}
