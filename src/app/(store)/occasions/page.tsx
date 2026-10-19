import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLink, Bi, PageHero } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';
import { OCCASIONS } from '@/lib/site';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Shop by occasion',
  description: 'Flowers for romance, birthdays, anniversaries, thank yous, new beginnings and every day in between.',
  alternates: { canonical: '/occasions' },
};

export default function OccasionsPage() {
  return (
    <div className="section section--top">
      <PageHero
        eyebrow={{ en: 'A reason to give', ar: 'سبب للإهداء' }}
        title={{ en: 'What’s the occasion?', ar: 'ما المناسبة؟' }}
        intro={{ en: 'Some things are better said with flowers. Begin with the moment, and we will help you find the right piece.', ar: 'بعض الأشياء تُقال بالزهور على نحو أجمل. ابدأ باللحظة، وسنساعدك في إيجاد القطعة المناسبة.' }} />
      <ol className="occasion-list">
        {OCCASIONS.map((occasion, index) => (
          <li key={occasion.id}>
            <Link href={`/occasions/${occasion.id}`} className="occasion-card">
              <span className="occasion-card__media">
                <Image src={occasion.image} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
              </span>
              <span className="occasion-card__index">{String(index + 1).padStart(2, '0')}</span>
              <strong><Bi text={occasion.name} /></strong>
              <em><Bi text={occasion.line} /></em>
            </Link>
          </li>
        ))}
      </ol>
      <aside className="callout">
        <div>
          <h2><T en="Something more particular in mind?" ar="هل تفكر في شيء أكثر خصوصية؟" /></h2>
          <p><T en="Tell us about the person and the moment. We are glad to arrange something especially for it."
            ar="أخبرنا عن الشخص واللحظة، ويسعدنا أن ننسق شيئاً خاصاً لها." /></p>
        </div>
        <ArrowLink href="/contact" label={{ en: 'Ask the flower desk', ar: 'اسأل مكتب الزهور' }} variant="button" />
      </aside>
    </div>
  );
}
