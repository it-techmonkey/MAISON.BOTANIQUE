import Image from 'next/image';
import { getCatalog } from '@/lib/shopify/catalog';
import { ArrowLink, Bi } from './blocks';
import { FlowerIcon, GiftIcon, HeartIcon, TruckIcon } from './icons';

const TRUST = [
  { icon: <TruckIcon />, text: { en: 'Same-day delivery across the UAE', ar: 'توصيل في اليوم نفسه في جميع أنحاء الإمارات' } },
  { icon: <GiftIcon />, text: { en: 'A handwritten card with every gift', ar: 'بطاقة بخط اليد مع كل هدية' } },
  { icon: <FlowerIcon />, text: { en: 'Fresh, premium blooms', ar: 'زهور طازجة فاخرة' } },
  { icon: <HeartIcon />, text: { en: 'Thoughtfully packaged', ar: 'تغليف مدروس بعناية' } },
];

/** Home hero: the proposition, two ways in, and the four promises. The photograph is the first hero product. */
export default async function HomeHero() {
  const { products } = await getCatalog();
  const hero = products.find((product) => product.heroOrder === 1) ?? products[0];

  return (
    <section id="home-hero" className="hero" data-track-location="hero" data-track-section="home_hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="eyebrow"><Bi text={{ en: 'Flowers, with feeling', ar: 'زهور، بإحساس' }} /></p>
        <h1 id="hero-title">
          <Bi text={{ en: 'Beautiful flowers.', ar: 'زهور جميلة.' }} /><br />
          <Bi text={{ en: 'Thoughtfully delivered.', ar: 'تصل بعناية.' }} />
        </h1>
        <p className="hero__lede">
          <Bi text={{ en: 'Considered bouquets for the people and moments that matter, across the UAE.', ar: 'باقات مختارة بعناية للأشخاص واللحظات التي تهمّك، في جميع أنحاء الإمارات.' }} />
        </p>
        <div className="hero__actions">
          <ArrowLink href="/shop" variant="button" label={{ en: 'Shop the collection', ar: 'تسوّق المجموعة' }} />
          <a className="button button--ghost" href="#occasions"><span><Bi text={{ en: 'Shop by occasion', ar: 'تسوّق حسب المناسبة' }} /></span></a>
        </div>
        <ul className="hero__trust">
          {TRUST.map((item) => <li key={item.text.en}>{item.icon}<span><Bi text={item.text} /></span></li>)}
        </ul>
      </div>
      <div className="hero__media">
        {hero && <Image src={hero.image} alt={hero.imageAlt || hero.name} fill priority sizes="(max-width: 900px) 100vw, 56vw" />}
      </div>
    </section>
  );
}
