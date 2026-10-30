import type { Metadata } from 'next';
import { ArrowLink, InfoPage } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';
import { articleSchema } from '@/lib/article-schema';
import '@/styles/pages.css';

const PATH = '/guides/flowers-for-a-dinner-host';
const TITLE = 'Choosing a flower arrangement for a dinner host';
const DESCRIPTION = 'Invited to dinner in Dubai? A short, practical guide to choosing flowers for your host: the right shape, scent and timing, and how to send them if you cannot arrive with them.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

export default function FlowersForDinnerHostGuide() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(PATH, TITLE, DESCRIPTION)).replace(/</g, '\\u003c') }} />
      <InfoPage
        hero={{
          eyebrow: { en: 'Gifting guide', ar: 'دليل الإهداء' },
          title: { en: 'Choosing a flower arrangement for a dinner host', ar: 'اختيار تنسيق زهور لمضيف العشاء' },
          intro: {
            en: 'Flowers are a classic thank-you for a host, but a host who is busy cooking and setting a table needs something easy. The best choice is one they can put down in a minute and enjoy all evening.',
            ar: 'الزهور هدية شكر تقليدية للمضيف، لكن المضيف المنشغل بالطهي وتجهيز المائدة يحتاج إلى شيء سهل. أفضل خيار هو ما يمكن وضعه في دقيقة والاستمتاع به طوال السهرة.' },
        }}
        sections={[
          {
            title: { en: 'Think about where it will sit', ar: 'فكّر في مكان وضعها' },
            paragraphs: [
              { en: 'A tall arrangement on a dining table blocks the view across it. If you expect the flowers to be placed where guests eat, a lower, compact arrangement is easier to live with; a taller one suits a console, sideboard or entrance table.', ar: 'التنسيق المرتفع على طاولة الطعام يحجب الرؤية بين الضيوف. إذا توقعت أن توضع الزهور حيث يجلس الضيوف، فالتنسيق المنخفض المتماسك أسهل في التعامل؛ أما التنسيق الأطول فيناسب طاولة جانبية أو مدخل المنزل.' },
              { en: 'Maison Botanique arrangements come as bouquets, vase arrangements and boxes. A vase or box arrangement is already contained, so the host is not hunting for a vase while guests arrive; a bouquet is a lovely gesture but gives the host one more task.', ar: 'تتوفر تنسيقات ميزون بوتانيك على شكل باقات وتنسيقات في مزهرية وصناديق. التنسيق في مزهرية أو صندوق جاهز بذاته، فلا يضطر المضيف إلى البحث عن مزهرية أثناء وصول الضيوف؛ أما الباقة فهي لفتة جميلة لكنها تضيف مهمة أخرى على المضيف.' },
            ],
          },
          {
            title: { en: 'Keep scent and colour gentle', ar: 'اختر عطراً ولوناً هادئين' },
            paragraphs: [
              { en: 'Strongly scented flowers can compete with the food, so roses and other lightly scented blooms are a safe choice for a meal. Choose a colour that is easy to place in someone else’s home: soft pinks and white are rarely out of place, while red roses read as a warmer, more celebratory gift.', ar: 'قد تنافس الزهور ذات الرائحة القوية رائحة الطعام، لذا تُعد الورود والأزهار خفيفة العطر خياراً آمناً للمائدة. اختر لوناً يسهل وضعه في منزل شخص آخر: الأبيض والوردي الهادئ نادراً ما يكونان في غير مكانهما، بينما تبدو الورود الحمراء هدية أكثر دفئاً واحتفالاً.' },
            ],
          },
          {
            title: { en: 'If you cannot bring them yourself', ar: 'إن لم تستطع إحضارها بنفسك' },
            paragraphs: [
              { en: 'You can send the arrangement to the host’s address instead of carrying it. Pick a delivery day and time window at checkout and add a handwritten card so the thank-you comes in your words. Delivery areas, windows and fees are on our delivery page.', ar: 'يمكنك إرسال التنسيق إلى عنوان المضيف بدلاً من حمله. اختر يوم التوصيل وفترته عند الدفع وأضف بطاقة مكتوبة بخط اليد لتصل كلمات الشكر بصوتك. تجد مناطق التوصيل ومواعيده ورسومه في صفحة التوصيل.' },
              { en: 'Delivering on the day of the dinner can be a little busy for a host, so consider sending the flowers the day after as a thank-you, or earlier in the day if you want them on the table that evening.', ar: 'قد يكون التوصيل في يوم العشاء مزدحماً بعض الشيء للمضيف، لذا فكّر في إرسال الزهور في اليوم التالي كشكر، أو في وقت أبكر من النهار إن أردتها على المائدة في تلك الأمسية.' },
            ],
          },
          {
            title: { en: 'Help them keep it fresh', ar: 'ساعدهم على إبقائها طازجة' },
            paragraphs: [
              { en: 'A host will appreciate knowing how to look after the flowers once the evening is over. Our guide to caring for fresh flowers in an air-conditioned Dubai home covers vase placement, water and humidity, and is worth passing on.', ar: 'سيُقدّر المضيف معرفة كيفية العناية بالزهور بعد انتهاء السهرة. يتناول دليلنا للعناية بالزهور الطازجة في منزل مكيّف بدبي مكان المزهرية والماء والرطوبة، ويستحق أن تشاركه.' },
            ],
          },
        ]} />
      <aside className="section callout">
        <div>
          <h2><T en="Choosing an arrangement" ar="اختيار التنسيق" /></h2>
          <p><T en="Browse the current edit and check each product's listed contents before you order." ar="تصفح المجموعة الحالية وتحقق من المحتويات المذكورة لكل منتج قبل الطلب." /></p>
        </div>
        <ArrowLink href="/shop" label={{ en: 'Shop flowers', ar: 'تسوّق الزهور' }} variant="button" />
      </aside>
      <aside className="section callout">
        <div>
          <h2><T en="Caring for the flowers" ar="العناية بالزهور" /></h2>
          <p><T en="Pass on our guide to keeping fresh flowers in an air-conditioned home." ar="شارك دليلنا للحفاظ على الزهور الطازجة في منزل مكيّف." /></p>
        </div>
        <ArrowLink href="/guides/flower-care-air-conditioning" label={{ en: 'Flower care guide', ar: 'دليل العناية بالزهور' }} />
      </aside>
      <aside className="section callout">
        <div>
          <h2><T en="Delivery" ar="التوصيل" /></h2>
          <p><T en="Delivery windows, areas and fees are covered on our delivery page." ar="تجد مواعيد التوصيل ومناطقه ورسومه في صفحة التوصيل." /></p>
        </div>
        <ArrowLink href="/delivery" label={{ en: 'Delivery & care', ar: 'التوصيل والعناية' }} />
      </aside>
    </>
  );
}
