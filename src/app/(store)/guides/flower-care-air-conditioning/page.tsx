import type { Metadata } from 'next';
import { ArrowLink, InfoPage } from '@/components/store/blocks';
import { GuideHero, GuideProducts } from '@/components/store/GuideVisuals';
import { T } from '@/components/store/StoreProvider';
import { articleSchema } from '@/lib/article-schema';
import { guideHeroImage } from '@/lib/guide-visuals';
import '@/styles/pages.css';

const PATH = '/guides/flower-care-air-conditioning';
const TITLE = 'How to care for fresh flowers in an air-conditioned Dubai home';
const DESCRIPTION = 'Dubai air conditioning dries a room faster than fresh flowers expect. A short, practical guide to vase placement, watering and humidity so your arrangement lasts.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, type: 'article', images: [guideHeroImage(PATH)!] },
};

export default function FlowerCareAcGuide() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(PATH, TITLE, DESCRIPTION, guideHeroImage(PATH))).replace(/</g, '\\u003c') }} />
      <InfoPage
        media={<GuideHero path={PATH} />}
        hero={{
          eyebrow: { en: 'Flower care', ar: 'العناية بالزهور' },
          title: { en: 'Caring for fresh flowers in an air-conditioned Dubai home', ar: 'العناية بالزهور الطازجة في منزل مكيّف بدبي' },
          intro: {
            en: 'Dubai homes run the air conditioning for most of the year. That keeps the air cool, but it also pulls moisture out of the room faster than a humid climate would, which can shorten a fresh arrangement’s life if you place it in the wrong spot.',
            ar: 'تعمل أجهزة التكييف في المنازل بدبي معظم أيام السنة. وهذا يحافظ على برودة الهواء، لكنه يسحب الرطوبة من الغرفة أسرع من مناخ رطب، ما قد يقصّر عمر التنسيق الطازج إذا وُضع في المكان الخاطئ.' },
        }}
        sections={[
          {
            title: { en: 'Why air conditioning dries flowers out faster', ar: 'لماذا يُجفّف التكييف الزهور أسرع' },
            paragraphs: [
              { en: 'Air conditioning works by removing humidity along with heat, so a cooled room is also a drier one. Dry air draws moisture out of petals and leaves faster than it would in a naturally humid room, even when the vase water looks fine.', ar: 'يعمل التكييف على سحب الرطوبة مع الحرارة، لذا تكون الغرفة المبرّدة أكثر جفافاً أيضاً. يسحب الهواء الجاف الرطوبة من البتلات والأوراق أسرع من غرفة رطبة طبيعياً، حتى لو بدا ماء المزهرية بحالة جيدة.' },
              { en: 'A direct draught from a vent is the bigger problem: it dries the stems and petals facing it unevenly, so that side of the arrangement wilts first while the rest still looks fresh.', ar: 'التيار المباشر من فتحة التكييف هو المشكلة الأكبر: يُجفّف السيقان والبتلات المواجهة له بشكل غير متساوٍ، فيذبل ذلك الجانب من التنسيق أولاً بينما يبقى الباقي طازجاً.' },
            ],
          },
          {
            title: { en: 'Where to place the vase', ar: 'أين تضع المزهرية' },
            paragraphs: [
              { en: 'Keep the arrangement out of the direct airflow of a vent or standing fan, and off the top of a console unit. A metre or two to the side of the airflow is usually enough.', ar: 'ضع التنسيق بعيداً عن التيار المباشر لفتحة التكييف أو المروحة، وبعيداً عن أعلى وحدة التكييف. يكفي عادة الابتعاد متراً أو مترين عن مسار الهواء.' },
              { en: 'Dubai’s sun through a window is strong even behind glass, so keep flowers away from direct afternoon light as well as the vent. A hallway, dining table or shaded console away from both is the easiest safe spot.', ar: 'أشعة الشمس في دبي قوية حتى عبر الزجاج، لذا أبعد الزهور عن ضوء الظهيرة المباشر كما تبعدها عن فتحة التكييف. يُعد الممر أو طاولة الطعام أو طاولة جانبية مظللة بعيدة عن الاثنين أسهل مكان آمن.' },
              { en: 'Keep the vase away from a fruit bowl too: ripening fruit releases ethylene gas, which makes cut flowers age faster regardless of the room’s humidity.', ar: 'أبعد المزهرية أيضاً عن وعاء الفاكهة: تطلق الفاكهة الناضجة غاز الإيثيلين، ما يُسرّع شيخوخة الزهور المقطوفة بغض النظر عن رطوبة الغرفة.' },
            ],
          },
          {
            title: { en: 'Water and trimming, adjusted for drier air', ar: 'الماء والتقليم في هواء جاف' },
            paragraphs: [
              { en: 'Trim each stem at an angle and place the flowers in a clean vase of fresh, cool water, then refresh the water and trim again every two days, as usual.', ar: 'قصّ كل ساق بشكل مائل وضع الزهور في مزهرية نظيفة بماء بارد ونظيف، ثم جدّد الماء وأعد القص كل يومين كالمعتاد.' },
              { en: 'In an air-conditioned room, check the water level daily rather than every two days: dry air makes the water evaporate and the stems drink faster than in a humid room, so a vase can run low sooner than you expect.', ar: 'في غرفة مكيّفة، تحقق من منسوب الماء يومياً بدلاً من كل يومين: يتبخر الماء وتمتص السيقان أسرع في الهواء الجاف منه في غرفة رطبة، فقد ينخفض منسوب المزهرية أسرع مما تتوقع.' },
            ],
          },
          {
            title: { en: 'Adding a little humidity back', ar: 'إعادة قليل من الرطوبة' },
            paragraphs: [
              { en: 'A light misting of the petals once a day helps offset the dryness of air-conditioned air, especially for roses and other full-headed blooms. Mist lightly rather than soaking the petals.', ar: 'الرش الخفيف للبتلات مرة يومياً يساعد على تعويض جفاف هواء التكييف، خصوصاً للورود والأزهار مكتملة الرأس. رُش بخفة دون أن تبلل البتلات تماماً.' },
              { en: 'If the room is particularly dry, lowering the fan speed or pointing a wall-mounted vent away from the arrangement makes a noticeable difference without changing the thermostat.', ar: 'إذا كانت الغرفة جافة بشكل ملحوظ، فإن خفض سرعة المروحة أو توجيه فتحة التكييف الجدارية بعيداً عن التنسيق يُحدث فرقاً واضحاً دون تغيير درجة الحرارة.' },
            ],
          },
          {
            title: { en: 'Preserved flowers in an always-on-AC room', ar: 'الزهور المحفوظة في غرفة تكييفها دائم' },
            paragraphs: [
              { en: 'Preserved flowers need no water at all, which makes them a reliable choice for an office or hallway that stays cool and dry year-round. Keep them out of direct sun and humidity, and dust gently with a soft brush.', ar: 'لا تحتاج الزهور المحفوظة إلى ماء على الإطلاق، ما يجعلها خياراً موثوقاً لمكتب أو ممر يبقى بارداً وجافاً طوال العام. أبعدها عن الشمس المباشرة والرطوبة، وانفض عنها الغبار برفق بفرشاة ناعمة.' },
            ],
          },
        ]} />
      <GuideProducts path={PATH} />
      <aside className="section callout">
        <div>
          <h2><T en="Choosing an arrangement" ar="اختيار التنسيق" /></h2>
          <p><T en="Browse the current edit and check each product's listed contents before you order." ar="تصفح المجموعة الحالية وتحقق من المحتويات المذكورة لكل منتج قبل الطلب." /></p>
        </div>
        <ArrowLink href="/shop" label={{ en: 'Shop flowers', ar: 'تسوّق الزهور' }} variant="button" />
      </aside>
      <aside className="section callout">
        <div>
          <h2><T en="Sending flowers to a host" ar="إرسال زهور إلى مضيف" /></h2>
          <p><T en="Guests invited to dinner: how to choose an arrangement your host will enjoy." ar="للضيوف المدعوين إلى عشاء: كيف تختار تنسيقاً يستمتع به مضيفك." /></p>
        </div>
        <ArrowLink href="/guides/flowers-for-a-dinner-host" label={{ en: 'Dinner host guide', ar: 'دليل مضيف العشاء' }} />
      </aside>
      <aside className="section callout">
        <div>
          <h2><T en="Delivery and more care tips" ar="التوصيل ونصائح عناية إضافية" /></h2>
          <p><T en="Delivery windows, areas and general care are covered on our delivery page." ar="تجد مواعيد التوصيل ومناطقه ونصائح العناية العامة في صفحة التوصيل." /></p>
        </div>
        <ArrowLink href="/delivery" label={{ en: 'Delivery & care', ar: 'التوصيل والعناية' }} />
      </aside>
    </>
  );
}
