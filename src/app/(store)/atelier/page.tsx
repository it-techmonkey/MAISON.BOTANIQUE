import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowLink, Bi, PageHero } from '@/components/store/blocks';
import { LeafMark } from '@/components/store/icons';
import { T } from '@/components/store/StoreProvider';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Our philosophy',
  description: 'Maison Botanique is a considered floral house in Dubai, creating thoughtful floral moments for life’s everyday occasions.',
  alternates: { canonical: '/atelier' },
};

const PRINCIPLES = [
  {
    title: { en: 'Chosen with care', ar: 'مختارة بعناية' },
    body: {
      en: 'We work with the season, not against it. Stems are chosen for their colour, their form and the way they hold a room, so every arrangement looks its best on the day it arrives.',
      ar: 'نعمل مع الموسم لا ضده. تُختار الأزهار للونها وشكلها وحضورها في المكان، لتبدو كل باقة في أجمل حالاتها يوم وصولها.',
    },
  },
  {
    title: { en: 'Arranged with intention', ar: 'منسقة بقصد' },
    body: {
      en: 'Every piece is composed by hand. We would rather a bouquet feel like a letter, written for one person on one day, than a product assembled from a template.',
      ar: 'كل قطعة تُنسق يدوياً. نفضّل أن تكون الباقة كرسالة كُتبت لشخص واحد في يوم واحد، لا منتجاً يُجمَّع وفق قالب.',
    },
  },
  {
    title: { en: 'Given from the heart', ar: 'تُهدى من القلب' },
    body: {
      en: 'The flowers are only part of the gift. Your note, the wrapping and the moment it is opened matter just as much, so we finish every piece with the same care.',
      ar: 'الزهور جزء من الهدية فقط. رسالتك والتغليف ولحظة فتحها لا تقل أهمية، لذلك ننهي كل قطعة بالعناية نفسها.',
    },
  },
];

export default function AtelierPage() {
  return (
    <>
      <div className="section section--top">
        <PageHero
          eyebrow={{ en: 'Our philosophy', ar: 'فلسفتنا' }}
          title={{ en: 'Not just flowers. A feeling, in bloom.', ar: 'ليست مجرد زهور. بل شعور يتفتّح.' }}
          intro={{
            en: 'Maison Botanique creates thoughtful floral moments for life’s everyday occasions.',
            ar: 'تصنع ميزون بوتانيك لحظات زهرية مدروسة لمناسبات الحياة اليومية.',
          }}
          image="/assets/dried-arrangement.jpg" />
      </div>

      <section className="story" aria-labelledby="story-title">
        <LeafMark className="story__mark" />
        <h2 id="story-title" className="sr-only"><T en="Our story" ar="قصتنا" /></h2>
        <p className="story__lead"><T
          en="We believe the best bouquets feel personal. A colour that reminds you of someone. A stem chosen because it means something. A small gesture that turns an ordinary day into a memory."
          ar="نؤمن بأن أجمل الباقات هي التي تحمل طابعاً شخصياً. لون يذكّرك بشخص ما. زهرة اختيرت لأنها تعني شيئاً. لفتة صغيرة تحوّل يوماً عادياً إلى ذكرى." /></p>
        <p><T
          en="Maison Botanique is a considered collection of flowers for life’s everyday moments — chosen with care, arranged with intention, and given from the heart. Modern and warm, quietly luxurious and always personal: flowers that feel special without ever feeling out of reach."
          ar="ميزون بوتانيك مجموعة مختارة من الزهور للحظات الحياة اليومية — تُختار بعناية وتُنسق بقصد وتُهدى من القلب. عصرية ودافئة وفاخرة بهدوء وشخصية دائماً: زهور تبدو مميزة من دون أن تكون بعيدة المنال." /></p>
      </section>

      <section className="section principles" aria-labelledby="principles-title">
        <h2 id="principles-title" className="sr-only"><T en="How we work" ar="كيف نعمل" /></h2>
        <ol>
          {PRINCIPLES.map((principle, index) => (
            <li key={principle.title.en}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3><Bi text={principle.title} /></h3>
              <p><Bi text={principle.body} /></p>
            </li>
          ))}
        </ol>
      </section>

      <section className="split" aria-labelledby="finish-title">
        <div className="split__media"><Image src="/assets/wrapped-gifts.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
        <div className="split__copy">
          <p className="eyebrow"><T en="The finishing touch" ar="اللمسة الأخيرة" /></p>
          <h2 id="finish-title"><T en="A thoughtful gesture, beautifully arranged." ar="لفتة مدروسة، منسقة بجمال." /></h2>
          <p><T
            en="Soft wrapping, a ribbon in deep olive and a card for your own words. Every piece leaves us ready to be given, for the big days and the beautifully ordinary ones."
            ar="تغليف ناعم وشريط بلون الزيتون العميق وبطاقة لكلماتك أنت. تخرج كل قطعة من عندنا جاهزة للإهداء، للأيام الكبيرة وللأيام العادية الجميلة." /></p>
          <div className="button-row">
            <ArrowLink href="/shop" label={{ en: 'Shop the collection', ar: 'تسوّق المجموعة' }} variant="button" />
            <ArrowLink href="/services" label={{ en: 'Events & services', ar: 'المناسبات والخدمات' }} />
          </div>
        </div>
      </section>

      <p className="quote"><T en="Make an ordinary day feel a little less ordinary." ar="اجعل يوماً عادياً أقل اعتيادية قليلاً." /></p>
    </>
  );
}
