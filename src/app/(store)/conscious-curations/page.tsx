import type { Metadata } from 'next';
import Link from 'next/link';
import CoBrand from '@/components/store/CoBrand';
import { PageHero } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';
import { CURATED_COLLECTIONS } from '@/lib/hamper';
import '@/styles/pages.css';
import '@/styles/hamper.css';

export const metadata: Metadata = {
  title: 'Conscious Curations',
  description: 'Handwoven by women artisans, made from upcycled and locally sourced materials, with homemade treats from the Chefat65 kitchen. Curated gifts by Conscious Curations, with Maison Botanique.',
  alternates: { canonical: '/conscious-curations' },
};

const PILLARS = [
  { en: 'Handwoven', ar: 'منسوج يدوياً', textEn: 'Baskets and trays woven by women artisan groups across India.', textAr: 'سلال وصواني تنسجها مجموعات حرفيات في أنحاء الهند.' },
  { en: 'Upcycled', ar: 'معاد تدويره', textEn: 'Made from upcycled textile and plastic waste.', textAr: 'مصنوعة من أقمشة وبلاستيك معاد تدويره.' },
  { en: 'Locally sourced', ar: 'من مصادر محلية', textEn: 'Sustainable, locally sourced pieces that support underprivileged communities.', textAr: 'قطع مستدامة من مصادر محلية تدعم المجتمعات المحتاجة.' },
  { en: 'Chefat65 kitchen', ar: 'مطبخ Chefat65', textEn: 'Homemade sweets and snacks from the family kitchen behind Conscious Curations.', textAr: 'حلويات ووجبات خفيفة منزلية من مطبخ العائلة وراء Conscious Curations.' },
];

export default function ConsciousCurationsPage() {
  return (
    <div className="hamper cc section section--top">
      <PageHero
        eyebrow={{ en: 'Curated gifts · a Maison Botanique collaboration', ar: 'هدايا منسّقة · بالتعاون مع ميزون بوتانيك' }}
        title={{ en: 'Consciously chosen by you. Curated by us.', ar: 'تختارها أنت بوعي، وننسّقها نحن.' }}
        intro={{
          en: 'Conscious Curations inspires people to choose more sustainable, locally sourced gifts, made by communities that deserve the work.',
          ar: 'تشجّع Conscious Curations على اختيار هدايا أكثر استدامة ومن مصادر محلية، تصنعها مجتمعات تستحق هذا العمل.',
        }}
        image="/hamper/artisan.jpg">
        <CoBrand />
      </PageHero>

      <section className="cc-pillars" aria-label="Conscious Curations">
        <ul>
          {PILLARS.map((pillar) => (
            <li key={pillar.en}>
              <h2><T en={pillar.en} ar={pillar.ar} /></h2>
              <p><T en={pillar.textEn} ar={pillar.textAr} /></p>
            </li>
          ))}
        </ul>
      </section>

      <section className="cc-collections" aria-labelledby="cc-collections-title">
        <div className="hamper-step__head">
          <h2 id="cc-collections-title"><T en="Collections" ar="المجموعات" /></h2>
        </div>
        <ul>
          {CURATED_COLLECTIONS.map((collection) => (
            <li key={collection.slug}>
              <Link href={`/conscious-curations/${collection.slug}`} className="cc-card">
                <span className="cc-card__img"><img src={collection.photo} alt="" loading="lazy" width="332" height="240" /></span>
                <span className="cc-card__body">
                  <span className="eyebrow"><T en={collection.en} ar={collection.ar} /></span>
                  <strong><T en={collection.titleEn} ar={collection.titleAr} /></strong>
                  <span className="cc-card__intro"><T en={collection.introEn} ar={collection.introAr} /></span>
                  <span className="cc-card__go"><T en="Start building" ar="ابدأ التصميم" /> →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="cc-note"><T en="Orders are confirmed with Conscious Curations on WhatsApp. A 50% advance books the order." ar="تُؤكَّد الطلبات مع Conscious Curations عبر واتساب. دفعة مقدمة 50٪ لتأكيد الطلب." /></p>
      </section>
    </div>
  );
}
