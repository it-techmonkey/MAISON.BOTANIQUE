import Image from 'next/image';
import { whatsappLink } from '@/lib/whatsapp';
import { Bi, ArrowLink } from './blocks';

// PREVIEW ONLY: the photograph is a free Pexels stock image of hanging marigold garlands (thevisionaryvows),
// standing in until Maison's own toran photograph is generated and approved. The wording promises no price or
// discount; pre-orders open once the Diwali range is confirmed.
const PHOTO = '/assets/placeholder/diwali-toran-stock.jpg';

/** Teaser between the hero and the shopping sections: Diwali is coming, to build anticipation. */
export default function DiwaliBand() {
  const notify = whatsappLink('Hello Maison Botanique, please tell me when the Diwali pre-orders open.');
  const label = { en: 'Tell me when it opens', ar: 'أخبروني عند الفتح' };
  return (
    <section className="rb rb--diwali" aria-labelledby="db-title" data-track-section="home_diwali_teaser" data-track-location="home_diwali_teaser">
      <div className="rb__copy">
        <p className="eyebrow"><Bi text={{ en: 'Coming soon · Diwali', ar: 'قريباً · ديوالي' }} /></p>
        <h2 id="db-title"><Bi text={{ en: 'Diwali, the Maison way.', ar: 'ديوالي على طريقة ميزون.' }} /></h2>
        <p><Bi text={{ en: 'Marigold and thoughtful gifting are on their way. Pre-orders open soon, beginning with a marigold toran for your doorway.', ar: 'القطيفة وهدايا مدروسة في الطريق إليكم. يفتح الحجز المسبق قريباً، ونبدأ بتوران من القطيفة لمدخل بيتكم.' }} /></p>
        {notify
          ? <a className="button button--ghost" href={notify} target="_blank" rel="noopener noreferrer"><span><Bi text={label} /></span><span aria-hidden="true">↗</span></a>
          : <ArrowLink href="/contact" variant="ghost" label={label} />}
      </div>
      <div className="rb__media">
        <Image src={PHOTO} alt="" fill sizes="(max-width: 800px) 100vw, 42vw" style={{ objectPosition: '50% 70%' }} />
      </div>
    </section>
  );
}
