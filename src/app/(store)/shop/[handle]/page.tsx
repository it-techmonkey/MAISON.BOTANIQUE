import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bi, SectionHeading } from '@/components/store/blocks';
import { CatalogRail } from '@/components/store/ProductCard';
import ProductPurchase from '@/components/store/ProductPurchase';
import { T } from '@/components/store/StoreProvider';
import { SITE_URL } from '@/lib/site';
import { productSchema } from '@/lib/product-schema';
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

const DETAILS = [
  {
    title: { en: 'Delivery', ar: 'التوصيل' },
    body: {
      en: 'Same-day delivery is available in Dubai; we also deliver across the UAE. The delivery fee for your address is shown at checkout. Choose the day and a three-hour window (9am to 9pm) in your bag; Dubai same-day windows close three hours before they start.',
      ar: 'التوصيل في اليوم نفسه متاح داخل دبي، ونوصل أيضاً إلى جميع أنحاء الإمارات. تظهر رسوم التوصيل لعنوانك عند الدفع. اختر اليوم وفترة من ثلاث ساعات (من 9 صباحاً حتى 9 مساءً) من حقيبتك، وتُغلق فترات اليوم نفسه داخل دبي قبل بدايتها بثلاث ساعات.',
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema(product, SITE_URL)).replace(/</g, '\\u003c') }} />
      <div className="section section--top product-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/shop"><T en="Shop" ar="المتجر" /></Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page"><T en={product.name} ar={product.nameAr} /></span>
        </nav>
        <div className="product-layout">
          <div className="product-gallery" style={{ backgroundColor: product.bg }}>
            <Image src={product.image} alt={product.imageAlt || product.name} fill priority sizes="(max-width: 900px) 100vw, 55vw" />
          </div>
          <div className="product-info">
            <ProductPurchase handle={product.id} />
            <div className="details">
              {DETAILS.map((item, index) => (
                <details key={item.title.en} open={index === 0}>
                  <summary><Bi text={item.title} /></summary>
                  <p><Bi text={item.body} /></p>
                </details>
              ))}
            </div>
          </div>
        </div>
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
