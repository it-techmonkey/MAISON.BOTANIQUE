import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/blocks';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Delivery & care',
  description: 'How Maison Botanique delivers across the UAE, with same-day delivery, and how to care for your flowers once they arrive.',
  alternates: { canonical: '/delivery' },
};

// Delivery areas, windows, fees and cut-off times are set in Shopify and must
// be confirmed by the owner. This page avoids promises until they are.
export default function DeliveryPage() {
  return (
    <InfoPage
      draft
      hero={{
        eyebrow: { en: 'Delivery & care', ar: 'التوصيل والعناية' },
        title: { en: 'A little beauty, delivered to your door.', ar: 'قليل من الجمال، يصل إلى بابك.' },
        intro: { en: 'Everything you need to know about receiving your flowers, and keeping them lovely for longer.', ar: 'كل ما تحتاج معرفته عن استلام زهورك، والحفاظ على جمالها لفترة أطول.' },
      }}
      sections={[
        {
          title: { en: 'Where we deliver', ar: 'أين نوصل' },
          paragraphs: [
            { en: 'We deliver same day across the UAE. Delivery is AED 30 in Dubai and AED 40 elsewhere in the UAE. Enter the full recipient address at checkout, including building or villa, apartment number and area.', ar: 'نوصل في اليوم نفسه في جميع أنحاء الإمارات. التوصيل ٣٠ درهماً في دبي و٤٠ درهماً في بقية الإمارات. أدخل عنوان المستلم كاملاً عند الدفع، بما فيه المبنى أو الفيلا ورقم الشقة والمنطقة.' },
          ],
        },
        {
          title: { en: 'Choosing a date', ar: 'اختيار التاريخ' },
          paragraphs: [
            { en: 'Choose the delivery day and a three-hour window (9am to 9pm) in your bag, today or up to 60 days ahead. Same-day windows stay open until three hours before they start. One delivery per order; if anything needs to change, we let you know straight away.', ar: 'اختر يوم التوصيل وفترة من ثلاث ساعات (من 9 صباحاً حتى 9 مساءً) من حقيبتك، لليوم نفسه أو حتى 60 يوماً مقدماً. تبقى فترات اليوم نفسه متاحة حتى ثلاث ساعات قبل بدايتها. توصيل واحد لكل طلب، ونخبرك فوراً إذا احتاج أي شيء إلى تغيير.' },
          ],
        },
        {
          title: { en: 'Your gift note', ar: 'رسالة الإهداء' },
          paragraphs: [
            { en: 'Add a note of up to 280 characters to each piece, and it will travel with the flowers.', ar: 'أضف رسالة حتى ٢٨٠ حرفاً لكل قطعة، وسترافق الزهور.' },
          ],
        },
        {
          title: { en: 'Seasonal substitutions', ar: 'البدائل الموسمية' },
          paragraphs: [
            { en: 'Flowers are natural and seasonal. If a particular stem is not at its best, we replace it with one of equal quality and a similar colour and feeling, so the arrangement stays true to what you chose.', ar: 'الزهور طبيعية وموسمية. إذا لم تكن زهرة معينة في أفضل حالاتها، نستبدلها بأخرى بالجودة نفسها ولون وإحساس مشابهين، ليبقى التنسيق وفياً لما اخترته.' },
          ],
        },
        {
          title: { en: 'Caring for fresh flowers', ar: 'العناية بالزهور الطازجة' },
          paragraphs: [
            { en: 'Trim each stem at an angle and place the flowers in a clean vase of fresh, cool water. Refresh the water and trim again every two days.', ar: 'قصّ كل ساق بشكل مائل وضع الزهور في مزهرية نظيفة بماء بارد ونظيف. جدّد الماء وأعد القص كل يومين.' },
            { en: 'Keep them away from direct sun, fruit bowls and air conditioning vents, which shorten their life.', ar: 'أبعدها عن أشعة الشمس المباشرة وأوعية الفاكهة وفتحات التكييف، فهي تقصّر عمرها.' },
          ],
        },
        {
          title: { en: 'Caring for preserved flowers', ar: 'العناية بالزهور المحفوظة' },
          paragraphs: [
            { en: 'Preserved flowers need no water. Keep them indoors, out of direct sun and humidity, and dust gently with a soft brush.', ar: 'لا تحتاج الزهور المحفوظة إلى الماء. احفظها داخل المنزل بعيداً عن الشمس المباشرة والرطوبة، وانفض الغبار عنها برفق بفرشاة ناعمة.' },
          ],
        },
      ]} />
  );
}
