import type { Metadata } from 'next';
import { ArrowLink, InfoPage } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';
import { articleSchema } from '@/lib/article-schema';
import { occasionPath } from '@/lib/site';
import '@/styles/pages.css';

const PATH = '/guides/congratulations-flowers-dubai';
const TITLE = 'Congratulations flowers in Dubai';
const DESCRIPTION = 'Sending flowers for a promotion, graduation, new home or new chapter in Dubai: how to choose the right arrangement, add a handwritten card and pick a delivery day and time.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

export default function CongratulationsFlowersGuide() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(PATH, TITLE, DESCRIPTION)).replace(/</g, '\\u003c') }} />
      <InfoPage
        hero={{
          eyebrow: { en: 'Occasion guide', ar: 'دليل المناسبات' },
          title: { en: 'Congratulations flowers in Dubai', ar: 'زهور التهنئة في دبي' },
          intro: {
            en: 'A promotion, a graduation, a new home or a new chapter: good news deserves flowers that arrive on the day it happens. Here is how to choose, and how to send them.',
            ar: 'ترقية أو تخرج أو بيت جديد أو فصل جديد: الأخبار السارة تستحق زهوراً تصل في يومها. إليك كيف تختار وكيف ترسلها.' },
        }}
        sections={[
          {
            title: { en: 'Match the flowers to the news', ar: 'اختر الزهور بما يناسب الخبر' },
            paragraphs: [
              { en: 'For a graduation, the Laurel, Scholar and Coral graduation bouquets and the Cadence graduation box are made for the day. For a promotion or a new job, a clean, confident arrangement works well; for a new home, a box or vase arrangement is ready to place on a table the moment it arrives.', ar: 'للتخرج، باقات لوريل وسكولار وكورال للتخرج وصندوق كادنس للتخرج مصممة لهذا اليوم. وللترقية أو الوظيفة الجديدة، يناسب تنسيق أنيق وواثق؛ أما للبيت الجديد فالتنسيق في صندوق أو مزهرية جاهز للوضع على الطاولة فور وصوله.' },
              { en: 'Brighter flowers such as sunflowers (for example the Amber sunflower and golden rose bouquet) read as cheerful and celebratory, while orchids, such as the Empress orchid bouquet, feel polished and lasting. Roses, such as the Magnifica grand rose bouquet, are the most traditional way to make a bigger statement.', ar: 'الزهور المشرقة مثل عباد الشمس (كباقة أمبر من عباد الشمس والورد الذهبي) توحي بالبهجة والاحتفال، بينما تبدو الأوركيد، مثل باقة إمبريس، أنيقة وتدوم طويلاً. أما الورود، مثل باقة ماغنيفيكا الكبيرة، فهي الطريقة الأكثر تقليدية لإبداء لفتة أكبر.' },
            ],
          },
          {
            title: { en: 'Add the words that matter', ar: 'أضف الكلمات التي تهم' },
            paragraphs: [
              { en: 'Every order can carry a handwritten card, so the congratulations arrives in your own words. A short, specific line, naming what they achieved, means more than a general greeting.', ar: 'يمكن أن يرافق كل طلب بطاقة مكتوبة بخط اليد، فتصل التهنئة بكلماتك. جملة قصيرة ومحددة تذكر ما أنجزه المُهنَّأ تعني أكثر من تحية عامة.' },
            ],
          },
          {
            title: { en: 'Choose the day and the time', ar: 'اختر اليوم والوقت' },
            paragraphs: [
              { en: 'Pick a delivery day and a three-hour window at checkout, up to 60 days ahead, so flowers for a graduation ceremony or a first day in a new office can be planned in advance. Delivery areas, windows and fees are on our delivery page. For a recipient you cannot reach in person, enter the full address including building and apartment number.', ar: 'اختر يوم التوصيل وفترة من ثلاث ساعات عند الدفع، حتى 60 يوماً مقدماً، فيمكنك التخطيط مسبقاً لزهور حفل تخرج أو لأول يوم في مكتب جديد. تجد مناطق التوصيل ومواعيده ورسومه في صفحة التوصيل. وللمستلم الذي لا تستطيع الوصول إليه شخصياً، أدخل العنوان كاملاً بما في ذلك المبنى ورقم الشقة.' },
            ],
          },
        ]} />
      <aside className="section callout">
        <div>
          <h2><T en="Browse congratulations flowers" ar="تصفح زهور التهنئة" /></h2>
          <p><T en="See every arrangement tagged for congratulations and check each product's listed contents before you order." ar="شاهد كل التنسيقات المخصصة للتهنئة وتحقق من المحتويات المذكورة لكل منتج قبل الطلب." /></p>
        </div>
        <ArrowLink href={occasionPath('congratulations')} label={{ en: 'Shop congratulations', ar: 'تسوّق التهنئة' }} variant="button" />
      </aside>
      <aside className="section callout">
        <div>
          <h2><T en="Delivery" ar="التوصيل" /></h2>
          <p><T en="Delivery windows, areas and fees are covered on our delivery page." ar="تجد مواعيد التوصيل ومناطقه ورسومه في صفحة التوصيل." /></p>
        </div>
        <ArrowLink href="/delivery" label={{ en: 'Delivery & care', ar: 'التوصيل والعناية' }} />
      </aside>
      <aside className="section callout">
        <div>
          <h2><T en="Keeping them fresh" ar="للحفاظ على نضارتها" /></h2>
          <p><T en="Pass on our guide to keeping fresh flowers in an air-conditioned home." ar="شارك دليلنا للحفاظ على الزهور الطازجة في منزل مكيّف." /></p>
        </div>
        <ArrowLink href="/guides/flower-care-air-conditioning" label={{ en: 'Flower care guide', ar: 'دليل العناية بالزهور' }} />
      </aside>
    </>
  );
}
