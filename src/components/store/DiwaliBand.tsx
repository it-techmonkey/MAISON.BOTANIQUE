import Image from 'next/image';
import { whatsappLink } from '@/lib/whatsapp';
import { Bi, ArrowLink } from './blocks';

// PREVIEW ONLY: the photograph is a free Pexels stock image (marigold field, GM Rajib), standing in
// until Maison's own toran photograph is generated and approved. The wording promises no price or
// discount; pre-orders open once the Diwali range is confirmed.
const PHOTO = '/assets/placeholder/diwali-marigold-stock.jpg';

/** Teaser between the hero and the shopping sections: Diwali is coming, to build anticipation. */
export default function DiwaliBand() {
  const notify = whatsappLink('Hello Maison Botanique, please tell me when the Diwali pre-orders open.');
  return (
    <section className="db" aria-labelledby="db-title" data-track-section="home_diwali_teaser" data-track-location="home_diwali_teaser">
      <div className="db__media">
        <Image src={PHOTO} alt="" fill sizes="(max-width: 800px) 100vw, 40vw" />
      </div>
      <div className="db__copy">
        <p className="eyebrow"><Bi text={{ en: 'Coming soon · Diwali, 8 November', ar: 'قريباً · ديوالي، ٨ نوفمبر' }} /></p>
        <h2 id="db-title"><Bi text={{ en: 'Diwali, the Maison way.', ar: 'ديوالي على طريقة ميزون.' }} /></h2>
        <p><Bi text={{ en: 'Marigold, light and thoughtful gifting are on their way. Pre-orders open soon, beginning with a marigold toran for your doorway.', ar: 'القطيفة والنور وهدايا مدروسة في الطريق إليكم. يفتح الحجز المسبق قريباً، ونبدأ بتوران من القطيفة لمدخل بيتكم.' }} /></p>
        {notify
          ? <a className="button button--ghost" href={notify} target="_blank" rel="noopener noreferrer"><span><Bi text={{ en: 'Tell me when it opens', ar: 'أخبروني عند الفتح' }} /></span><span aria-hidden="true">↗</span></a>
          : <ArrowLink href="/contact" variant="ghost" label={{ en: 'Tell me when it opens', ar: 'أخبروني عند الفتح' }} />}
      </div>
    </section>
  );
}
