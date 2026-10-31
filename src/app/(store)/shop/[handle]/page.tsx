import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bi, SectionHeading } from '@/components/store/blocks';
import { CatalogRail } from '@/components/store/ProductCard';
import ProductPurchase from '@/components/store/ProductPurchase';
import { T } from '@/components/store/StoreProvider';
import { OrderQuestions } from '@/components/store/GrowthPages';
import { ORDER_QUESTIONS } from '@/lib/growth-content';
import { SITE_URL } from '@/lib/site';
import { productSchema } from '@/lib/product-schema';
import { formatDeliveryDate } from '@/lib/delivery';
import { REAL_PUMPKIN_HANDLES, seasonalDeliveryRange, TORAN_HANDLE } from '@/lib/seasonal';
import { getCatalog } from '@/lib/shopify/catalog';
import '@/styles/shop.css';

export const revalidate = 300;

async function findProduct(handle: string) {
  const { products } = await getCatalog();
  return products.find((product) => product.id === handle);
}

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((product) => ({ handle: product.id }));
}

export async function generateMetadata({ params }: PageProps<'/shop/[handle]'>): Promise<Metadata> {
  const product = await findProduct((await params).handle);
  if (!product) return {};
  return {
    title: product.name,
    description: product.answerSummary || product.description || `${product.name} from Maison Botanique, Dubai.`,
    alternates: { canonical: `/shop/${product.id}` },
    openGraph: { title: product.name, description: product.description, images: [{ url: product.image }] },
  };
}

// Per-product FAQ/Q&A additions. Added one at a time by the daily content
// task, highest order-count product first (private/sales/customer-sales-master).
const FAQS_BY_PRODUCT: Record<string, { question: { en: string; ar: string }; answer: { en: string; ar: string } }[]> = {
  'eloise-pink-and-white-rose-bouquet': [
    {
      question: { en: 'How many roses are in the Eloise bouquet?', ar: 'كم عدد الورود في باقة إيلويز؟' },
      answer: {
        en: 'Signature has 51 hand-selected pink and white roses, Grand has 101 and Luxe has 201, all gathered in the same ivory wrap. Only the rose count changes between sizes.',
        ar: 'يضم حجم سيغنتشر 51 وردة وردية وبيضاء منتقاة يدوياً، وغراند 101 وردة، ولوكس 201 وردة، جميعها بالغلاف العاجي نفسه. يتغير عدد الورود فقط بين الأحجام.',
      },
    },
  ],
  'aimee-red-rose-bouquet': [
    {
      question: { en: 'How many roses are in the Aimée bouquet?', ar: 'كم عدد الورود في باقة إيميه؟' },
      answer: {
        en: 'Signature has 51 hand-selected red roses, Grand has 101 and Luxe has 201, all wrapped in white paper with a red satin ribbon. Only the rose count changes between sizes.',
        ar: 'يضم حجم سيغنتشر 51 وردة حمراء منتقاة يدوياً، وغراند 101 وردة، ولوكس 201 وردة، جميعها بغلاف ورقي أبيض وشريط ساتان أحمر. يتغير عدد الورود فقط بين الأحجام.',
      },
    },
  ],
  'aveline-red-pink-and-white-rose-bouquet': [
    {
      question: { en: 'How many roses are in the Aveline bouquet?', ar: 'كم عدد الورود في باقة أفلين؟' },
      answer: {
        en: 'Signature has 51 hand-selected red, pink and white roses, Grand has 101 and Luxe has 201. Only the rose count changes between sizes.',
        ar: 'يضم حجم سيغنتشر 51 وردة حمراء ووردية وبيضاء منتقاة يدوياً، وغراند 101 وردة، ولوكس 201 وردة. يتغير عدد الورود فقط بين الأحجام.',
      },
    },
  ],
};

const DETAILS = [
  {
    title: { en: 'Delivery', ar: 'التوصيل' },
    body: {
      en: 'Same-day delivery is available across the UAE. The delivery fee for your address is shown at checkout. Choose the day and a three-hour window (9am to 9pm) in your bag; same-day windows close one hour before they end (last online order 8pm). For 9pm to 12am, order on WhatsApp.',
      ar: 'التوصيل في اليوم نفسه متاح في جميع أنحاء الإمارات. تظهر رسوم التوصيل لعنوانك عند الدفع. اختر اليوم وفترة من ثلاث ساعات (من 9 صباحاً حتى 9 مساءً) من حقيبتك، وتُغلق فترات اليوم نفسه قبل بدايتها بساعة واحدة.',
    },
  },
  {
    title: { en: 'Seasonal substitutions', ar: 'البدائل الموسمية' },
    body: {
      en: 'Flowers are natural and seasonal. If a stem is not at its best, we replace it with one of equal quality and similar feeling.',
      ar: 'الزهور طبيعية وموسمية. إذا لم تكن زهرة ما في أفضل حالاتها، نستبدلها بأخرى بالجودة نفسها وبإحساس مشابه.',
    },
  },
  {
    title: { en: 'Care', ar: 'العناية' },
    body: {
      en: 'Trim the stems at an angle, use fresh cool water and keep the flowers away from direct sun and air conditioning vents.',
      ar: 'قصّ السيقان بشكل مائل، واستخدم ماءً بارداً ونظيفاً، وأبعد الزهور عن أشعة الشمس المباشرة وفتحات التكييف.',
    },
  },
];

export default async function ProductPage({ params }: PageProps<'/shop/[handle]'>) {
  const product = await findProduct((await params).handle);
  if (!product) notFound();
  const range = seasonalDeliveryRange(product.id);
  const faqs = FAQS_BY_PRODUCT[product.id];
  const details = [...DETAILS, ...(faqs ?? []).map((faq) => ({ title: faq.question, body: faq.answer }))].map((item, index) => {
    if (index === 0 && range) return { ...item, body: {
      en: `This seasonal piece is delivered ${formatDeliveryDate(range.from, false)} – ${formatDeliveryDate(range.to, false)}. Choose a three-hour window for your order; delivery fees appear at checkout.`,
      ar: `يتوفر توصيل هذا المنتج الموسمي من ${formatDeliveryDate(range.from, true)} إلى ${formatDeliveryDate(range.to, true)}. اختر فترة توصيل من ثلاث ساعات لطلبك؛ وتظهر الرسوم عند الدفع.`,
    } };
    if (index === 1 && product.id === TORAN_HANDLE) return { ...item, body: {
      en: 'Fresh marigolds naturally vary a little in shade and fullness from the photograph.',
      ar: 'تختلف أزهار القطيفة الطازجة طبيعياً قليلاً في اللون والكثافة عما يظهر في الصورة.',
    } };
    if (index === 1 && REAL_PUMPKIN_HANDLES.includes(product.id)) return { ...item, body: {
      en: 'The pumpkin is real and natural, so its shape and shade vary slightly from the photograph. Flowers are natural and seasonal; if a stem is not at its best, we replace it with one of equal quality.',
      ar: 'اليقطينة حقيقية وطبيعية، لذا يختلف شكلها ولونها قليلاً عن الصورة. الزهور طبيعية وموسمية؛ وإذا لم تكن زهرة ما في أفضل حالاتها نستبدلها بأخرى بالجودة نفسها.',
    } };
    if (index === 2 && REAL_PUMPKIN_HANDLES.includes(product.id)) return { ...item, body: {
      en: 'Keep it in a cool place away from direct sun and air-conditioning vents. The pumpkin is compostable: once it starts to soften, remove the flowers and liner and compost the pumpkin.',
      ar: 'ضعها في مكان بارد بعيداً عن الشمس المباشرة وفتحات التكييف. اليقطينة قابلة للتحلل: عندما تبدأ بالليونة، أزل الزهور والبطانة وضع اليقطينة في السماد.',
    } };
    if (index === 2 && range) return { ...item, body: product.id === TORAN_HANDLE ? {
      en: 'Keep the fresh toran in a cool, shaded place until you hang it. Avoid direct sun and heat.',
      ar: 'احفظ إكليل القطيفة الطازج في مكان بارد ومظلل حتى تعلّقه، بعيداً عن الشمس المباشرة والحرارة.',
    } : {
      en: 'Keep the arrangement in a cool place away from direct sun and air-conditioning vents. Handle the vessel and flowers gently.',
      ar: 'ضع التنسيق في مكان بارد بعيداً عن الشمس المباشرة وفتحات التكييف، وتعامل مع الوعاء والزهور برفق.',
    } };
    return item;
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema(product, SITE_URL, faqs?.map((faq) => ({ question: faq.question.en, answer: faq.answer.en })))).replace(/</g, '\\u003c') }} />
      <div className="section section--top product-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/shop"><T en="Shop" ar="المتجر" /></Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page"><T en={product.name} ar={product.nameAr} /></span>
        </nav>
        <div className="product-layout">
          <div className="product-gallery" style={{ backgroundColor: product.bg }}>
            <div className="product-gallery__media"><Image src={product.image} alt={product.imageAlt || product.name} fill priority sizes="(max-width: 900px) 100vw, 55vw" /></div>
          </div>
          <div className="product-info">
            <ProductPurchase handle={product.id} />
            <div className="details">
              {details.map((item, index) => (
                <details key={item.title.en} open={index === 0}>
                  <summary><Bi text={item.title} /></summary>
                  <p><Bi text={item.body} /></p>
                </details>
              ))}
            </div>
          </div>
        </div>
        {(product.answerSummary || product.answerSummaryAr) && <p className="growth-product-answer"><T en={product.answerSummary || product.description} ar={product.answerSummaryAr || product.descriptionAr} /></p>}
      </div>
      <div className="section growth-page growth-reading">
        <OrderQuestions questions={ORDER_QUESTIONS.filter(({ question }) => ['Can I include a handwritten card?', 'Which size is in the photograph?'].includes(question.en))} />
      </div>
      <section className="section section--sand" aria-labelledby="related-title">
        <SectionHeading id="related-title"
          eyebrow={{ en: 'You may also love', ar: 'قد يعجبك أيضاً' }}
          title={{ en: 'More from the edit.', ar: 'المزيد من المختارات.' }}
          link={{ href: '/shop', label: { en: 'Shop the collection', ar: 'تسوّق المجموعة' } }} />
        <CatalogRail exclude={product.id} limit={8} listId="related" label={{ en: 'More from the edit', ar: 'المزيد من المختارات' }} />
      </section>
    </>
  );
}
