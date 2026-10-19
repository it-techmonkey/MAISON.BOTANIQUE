import Image from 'next/image';
import { getCatalog } from '@/lib/shopify/catalog';
import { EMIRATES } from '@/lib/site';
import { ArrowLink, Bi } from './blocks';
import { BuildingIcon, ClockIcon, FlowerIcon, HomeIcon } from './icons';

/** A piece photographed for the residences section: the second hero product, else the first. */
async function residencesPhoto() {
  const { products } = await getCatalog();
  return products.find((product) => product.heroOrder === 2) ?? products[0];
}

/** Home page band that leads to the residences page. */
export async function ResidencesBand() {
  const photo = await residencesPhoto();
  return (
    <section className="rb" aria-labelledby="rb-title" data-track-section="home_residences" data-track-location="home_residences">
      <div className="rb__media">
        {photo && <Image src={photo.image} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" />}
      </div>
      <div className="rb__copy">
        <p className="eyebrow"><Bi text={{ en: 'Your building, our blooms', ar: 'مبناك، وزهورنا' }} /></p>
        <h2 id="rb-title"><Bi text={{ en: 'Your doorstep, in full bloom.', ar: 'عند بابك، في أبهى تفتّح.' }} /></h2>
        <p><Bi text={{ en: 'Premium flowers for your residential building. Choose your bouquet and we will deliver it to your apartment, in every emirate.', ar: 'زهور فاخرة لمبناك السكني. اختر باقتك وسنوصلها إلى شقتك، في كل إمارة.' }} /></p>
        <ArrowLink href="/residences" variant="ghost" label={{ en: 'Learn more', ar: 'اعرف المزيد' }} />
      </div>
    </section>
  );
}

const STEPS = [
  { icon: <FlowerIcon />, text: { en: 'Shop a curated selection', ar: 'تسوّق من مجموعة مختارة' } },
  { icon: <ClockIcon />, text: { en: 'Choose your delivery time', ar: 'اختر وقت التوصيل' } },
  { icon: <HomeIcon />, text: { en: 'We deliver to your apartment', ar: 'نوصل إلى شقتك' } },
];

/** The residences page: how it works for building residents, and the emirates we deliver in. */
export async function ResidencesPage() {
  const photo = await residencesPhoto();
  return (
    <div className="res">
      <section className="res__hero" aria-labelledby="res-title">
        <div className="res__copy">
          <p className="eyebrow"><Bi text={{ en: 'Exclusive for residents', ar: 'حصرياً للسكان' }} /></p>
          <h1 id="res-title">
            <Bi text={{ en: 'Welcome home.', ar: 'أهلاً بك في بيتك.' }} /><br />
            <Bi text={{ en: 'Your flowers await.', ar: 'زهورك بانتظارك.' }} />
          </h1>
          <ul className="res__steps">
            {STEPS.map((step) => <li key={step.text.en}>{step.icon}<span><Bi text={step.text} /></span></li>)}
          </ul>
        </div>
        <div className="res__media">
          {photo && <Image src={photo.image} alt="" fill priority sizes="(max-width: 900px) 100vw, 45vw" />}
          <aside className="res__card" aria-labelledby="res-delivering">
            <BuildingIcon />
            <h2 id="res-delivering" className="eyebrow"><Bi text={{ en: 'Delivering in', ar: 'نوصل في' }} /></h2>
            <ul>
              {EMIRATES.map((emirate) => <li key={emirate.en}><Bi text={emirate} /></li>)}
            </ul>
            <p><Bi text={{ en: 'Same-day delivery. AED 30 in Dubai, AED 40 elsewhere in the UAE.', ar: 'توصيل في اليوم نفسه. ٣٠ درهماً في دبي و٤٠ درهماً في بقية الإمارات.' }} /></p>
            <ArrowLink href="/shop" variant="button" label={{ en: 'Shop now', ar: 'تسوّق الآن' }} />
          </aside>
        </div>
      </section>
    </div>
  );
}
