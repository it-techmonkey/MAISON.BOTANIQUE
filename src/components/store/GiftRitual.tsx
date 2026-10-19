'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useStore } from './StoreProvider';

const STEPS = [
  {
    title: { en: 'Choose the piece', ar: 'اختر القطعة' },
    detail: { en: 'Find the flowers that feel right for them.', ar: 'اعثر على الزهور التي تليق بهم.' },
  },
  {
    title: { en: 'Write your note', ar: 'اكتب رسالتك' },
    detail: { en: 'Add your own words on the product page. They travel with the flowers.', ar: 'أضف كلماتك في صفحة المنتج، وسترافق الزهور.' },
  },
  {
    title: { en: 'Choose a time', ar: 'اختر الموعد' },
    detail: { en: 'Pick the day and a three-hour window, even for today.', ar: 'اختر اليوم وفترة من ثلاث ساعات، حتى لليوم نفسه.' },
  },
];

/** "A little more than flowers": the gift note and date, explained in three steps. */
export default function GiftRitual() {
  const { ar, t } = useStore();
  const [active, setActive] = useState(0);
  const pick = (value: { en: string; ar: string }) => (ar ? value.ar : value.en);

  return (
    <section className="ritual" id="gifting" data-track-section="gift_ritual" aria-labelledby="ritual-title">
      <div className="ritual__photo">
        <Image src="/assets/dark-editorial-concept.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 48vw" />
        <span>MAISON BOTANIQUE / THE GIFT</span>
      </div>
      <div className="ritual__content">
        <p className="eyebrow">{t('A personal touch', 'لمسة شخصية')}</p>
        <h2 id="ritual-title">{t('A little more than flowers.', 'أكثر من مجرد زهور.')}</h2>
        <p className="ritual__intro">{t('The right arrangement is only the beginning. Make the gift feel like it came from you.', 'التنسيق المناسب هو البداية فقط. اجعل الهدية تعبّر عنك.')}</p>
        <div className="ritual__steps">
          {STEPS.map((step, index) => (
            <div key={step.title.en} className={`ritual__step${active === index ? ' is-active' : ''}`}>
              <button type="button" aria-expanded={active === index} aria-controls={`ritual-step-${index}`} onClick={() => setActive(index)}>
                <span>0{index + 1}</span><strong>{pick(step.title)}</strong><span aria-hidden="true">{active === index ? '−' : '+'}</span>
              </button>
              <div id={`ritual-step-${index}`} hidden={active !== index}><p>{pick(step.detail)}</p></div>
            </div>
          ))}
        </div>
        <Link className="button button--blush" href="/shop">{t('Explore the collection', 'تصفّح المجموعة')} <span aria-hidden="true">↗</span></Link>
      </div>
      <p className="ritual__quote">{t('The best part is what you say.', 'أجمل ما في الهدية ما تقوله.')}</p>
    </section>
  );
}
