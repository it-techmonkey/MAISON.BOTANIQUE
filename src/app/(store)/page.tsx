import Image from 'next/image';
import Link from 'next/link';
import { Bi } from '@/components/store/blocks';
import GiftRitual from '@/components/store/GiftRitual';
import { InlineShopBrowser } from '@/components/store/ShopBrowser';
import { T } from '@/components/store/StoreProvider';
import Turntable from '@/components/Turntable';
import { OCCASIONS } from '@/lib/site';
import '@/styles/home.css';

// Rebuild at most every five minutes; the Shopify product webhook
// (/api/revalidate) refreshes the catalog immediately after an edit.
export const revalidate = 300;

/** Products shown on the home page before "View all". */
const HOME_GRID_LIMIT = 8;

const ASSURANCES = [
  { en: 'Secure checkout with Shopify', ar: 'دفع آمن عبر Shopify' },
  { en: 'A personal gift note with every piece', ar: 'رسالة إهداء شخصية مع كل قطعة' },
  { en: 'Same-day delivery, in the time window you choose', ar: 'توصيل في اليوم نفسه، في الوقت الذي تختاره' },
  { en: 'Arranged by hand in Dubai', ar: 'تُنسَّق يدوياً في دبي' },
];

export default function HomePage() {
  return (
    <>
      <Turntable />

      <ul className="assurances home-assurances">
        {ASSURANCES.map((item) => <li key={item.en}><Bi text={item} /></li>)}
      </ul>

      <section className="collection-band" id="shop" data-track-section="home_collection" aria-labelledby="collection-title">
        <div className="collection-band__inner">
          <div className="collection-band__heading">
            <div>
              <p className="eyebrow"><T en="Maison Botanique · Dubai" ar="ميزون بوتانيك · دبي" /></p>
              <h2 id="collection-title"><T en="The collection." ar="المجموعة." /></h2>
            </div>
            <p><T en="A considered piece for every kind of gesture. Begin with the person, the occasion, or the flowers."
              ar="قطعة مختارة لكل لفتة. ابدأ بالشخص أو المناسبة أو الزهور." /></p>
          </div>
          <InlineShopBrowser limit={HOME_GRID_LIMIT} />
        </div>
      </section>

      <section className="occasion-strip" data-track-section="home_occasions" aria-labelledby="occasion-strip-title">
        <div className="occasion-strip__heading">
          <p className="eyebrow"><T en="A reason to give" ar="سبب للإهداء" /></p>
          <h2 id="occasion-strip-title"><T en="Shop by occasion." ar="تسوّق حسب المناسبة." /></h2>
        </div>
        <ul>
          {OCCASIONS.map((occasion) => (
            <li key={occasion.id}>
              <Link href={`/occasions/${occasion.id}`} className="occasion-chip">
                <span className="occasion-chip__media"><Image src={occasion.image} alt="" fill sizes="(max-width: 700px) 45vw, 16vw" /></span>
                <strong><Bi text={occasion.name} /></strong>
                <em><Bi text={occasion.line} /></em>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <GiftRitual />

      <section className="bespoke" data-track-section="home_bespoke" aria-labelledby="bespoke-title">
        <div>
          <p className="eyebrow"><T en="Beyond the bouquet" ar="ما بعد الباقة" /></p>
          <h2 id="bespoke-title"><T en="Events, weddings and corporate gifting." ar="المناسبات والأعراس وهدايا الشركات." /></h2>
        </div>
        <div className="bespoke__aside">
          <p><T en="Tell us about the occasion and we will reply with ideas, a palette and an estimate."
            ar="أخبرنا عن المناسبة وسنرد بأفكار ولوحة ألوان وتقدير للتكلفة." /></p>
          <Link className="button" href="/services#enquire"><T en="Start an enquiry" ar="ابدأ استفساراً" /> <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </>
  );
}
