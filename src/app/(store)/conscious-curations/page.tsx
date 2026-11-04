import type { Metadata } from 'next';
import HamperBuilder from '@/components/store/HamperBuilder';
import CoBrand from '@/components/store/CoBrand';
import HamperFromPrice from '@/components/store/HamperFromPrice';
import HostGiftsLink from '@/components/store/HostGiftsLink';
import { PageHero } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';
import { CURATED_COLLECTIONS } from '@/lib/hamper';
import '@/styles/pages.css';
import '@/styles/hamper.css';

export const metadata: Metadata = {
  title: 'Conscious Curations',
  description: 'Handwoven by women artisans, made from upcycled and locally sourced materials. Curated gifts by Conscious Curations, with Maison Botanique.',
  alternates: { canonical: '/conscious-curations' },
  openGraph: { title: 'Conscious Curations · Maison Botanique', description: 'Handwoven by women artisans, upcycled and locally sourced gifts, with homemade treats. Build your own hamper.', url: '/conscious-curations', images: [{ url: '/hamper/presets/festive.webp', width: 1024, height: 1024 }] },
};

const diwali = CURATED_COLLECTIONS.find((collection) => collection.slug === 'diwali')!;

const PILLARS = [
  { en: 'Handwoven', ar: 'منسوج يدوياً', textEn: 'Baskets and trays woven by women artisan groups across India.', textAr: 'سلال وصواني تنسجها مجموعات حرفيات في أنحاء الهند.' },
  { en: 'Upcycled', ar: 'معاد تدويره', textEn: 'Made from upcycled textile and plastic waste.', textAr: 'مصنوعة من أقمشة وبلاستيك معاد تدويره.' },
  { en: 'Locally sourced', ar: 'من مصادر محلية', textEn: 'Sustainable, locally sourced pieces that support underprivileged communities.', textAr: 'قطع مستدامة من مصادر محلية تدعم المجتمعات المحتاجة.' },
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
        <p><a className="button" href="#diwali"><T en="Build a hamper" ar="صمّم سلتك" /></a></p>
        <HamperFromPrice />
        <HostGiftsLink />
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

      <section className="hamper-builder" id="diwali" aria-labelledby="diwali-title">
        <div className="hamper-builder__head">
          <p className="eyebrow"><T en={diwali.en} ar={diwali.ar} /></p>
          <h2 id="diwali-title"><T en={diwali.titleEn} ar={diwali.titleAr} /></h2>
          <p><T en="Pick a basket, fill it with handcrafted pieces and add a festive treat. Hand-packed by Conscious Curations with dried flowers and their brand ribbon." ar="اختر سلة، واملأها بقطع مصنوعة يدوياً، وأضف حلوى احتفالية. تُغلَّف يدوياً من Conscious Curations بالزهور المجففة وشريط العلامة." /></p>
        </div>
        <HamperBuilder />
      </section>
    </div>
  );
}
