'use client';

import { useEffect, useState } from 'react';
import { HAMPER_SECTIONS, PICK_MAX, PICK_MIN, hamperCodeString, hamperProblems, hamperTotal, hamperWhatsappLink, type HamperItem, type HamperSection, type HamperSelection } from '@/lib/hamper';
import Link from 'next/link';
import CoBrand from './CoBrand';
import { PageHero } from './blocks';
import Money from './Money';
import { useStore } from './StoreProvider';

const STEPS = {
  B: { en: 'Step 1 · Choose your basket', ar: 'الخطوة 1 · اختر سلتك', sub: { en: 'Handwoven by women artisan groups across India.', ar: 'منسوجة يدوياً بأيدي مجموعات حرفيات في الهند.' } },
  pick: { en: 'Step 2 · Fill it', ar: 'الخطوة 2 · املأها', sub: { en: `Choose ${PICK_MIN} to ${PICK_MAX} handcrafted pieces from the four collections below.`, ar: `اختر من ${PICK_MIN} إلى ${PICK_MAX} قطع مصنوعة يدوياً من المجموعات الأربع أدناه.` } },
  F: { en: 'Step 3 · Add a treat', ar: 'الخطوة 3 · أضف حلوى', sub: { en: 'Homemade sweets and snacks by Chefat65, the Conscious Curations family kitchen.', ar: 'حلويات ووجبات خفيفة منزلية من Chefat65، مطبخ عائلة Conscious Curations.' } },
} as const;

const SECTION_AR_SUB: Record<string, [string, string]> = {
  L: ['Candles, diyas and rangolis to light up the season', 'شموع وديّات ورانغولي تضيء الموسم'],
  P: ['Thoughtful pieces for your Diwali puja', 'قطع مدروسة لبوجا ديوالي'],
  T: ['Handcrafted pieces for your table', 'قطع مصنوعة يدوياً لمائدتك'],
  W: ['Hand-made pieces for every day', 'قطع يدوية لكل يوم'],
};

function ItemCard({ item, chosen, locked, onToggle }: { item: HamperItem; chosen: boolean; locked: boolean; onToggle: () => void }) {
  const { ar, t } = useStore();
  const name = ar ? item.ar : item.en;
  return (
    <li className={`hamper-card${chosen ? ' is-chosen' : ''}`}>
      <div className="hamper-card__media">
        <img src={item.photo} alt={name} loading="lazy" width="240" height="240" />
        <span className="hamper-card__code">{item.code}</span>
      </div>
      <h4 className="hamper-card__name">{name}</h4>
      <p className="hamper-card__note">{ar ? item.noteAr : item.noteEn}</p>
      <p className="hamper-card__price"><Money amount={item.price} ar={ar} />{item.unit && <span> {t('/ pair', '/ الزوج')}</span>}</p>
      <button type="button" className="hamper-card__pick" aria-pressed={chosen} disabled={locked && !chosen} onClick={onToggle}>
        {chosen ? t('Chosen ✓', 'تم الاختيار ✓') : locked ? t('Hamper is full', 'السلة ممتلئة') : t('Choose', 'اختر')}
      </button>
    </li>
  );
}

function Group({ section, selection, toggle }: { section: HamperSection; selection: HamperSelection; toggle: (item: HamperItem) => void }) {
  const { ar } = useStore();
  const picked = (code: string) => code === selection.basket || selection.picks.includes(code) || selection.treats.includes(code);
  const full = section.kind === 'pick' && selection.picks.length >= PICK_MAX;
  return (
    <ul className="hamper-grid" aria-label={ar ? section.ar : section.en}>
      {section.items.map((item) => <ItemCard key={item.code} item={item} chosen={picked(item.code)} locked={full} onToggle={() => toggle(item)} />)}
    </ul>
  );
}

export default function HamperBuilder() {
  const { ar, t } = useStore();
  const [selection, setSelection] = useState<HamperSelection>({ basket: null, picks: [], treats: [] });
  const total = hamperTotal(selection);
  const problems = hamperProblems(selection);
  const ready = problems.length === 0;
  const codes = hamperCodeString(selection);
  const lines = HAMPER_SECTIONS.flatMap((section) => section.items).filter((item) => codes.split(' + ').includes(item.code));

  // Raises the floating WhatsApp button above the phone summary bar.
  useEffect(() => {
    document.body.classList.add('has-hamper-bar');
    return () => document.body.classList.remove('has-hamper-bar');
  }, []);

  const toggle = (item: HamperItem) => {
    const kind = HAMPER_SECTIONS.find((section) => section.items.includes(item))!.kind;
    setSelection((current) => {
      if (kind === 'basket') return { ...current, basket: current.basket === item.code ? null : item.code };
      const key = kind === 'pick' ? 'picks' : 'treats';
      const list = current[key];
      if (list.includes(item.code)) return { ...current, [key]: list.filter((code) => code !== item.code) };
      if (kind === 'pick' && list.length >= PICK_MAX) return current;
      return { ...current, [key]: [...list, item.code] };
    });
  };

  const piecesLeft = Math.max(0, PICK_MIN - selection.picks.length);
  const missing: string[] = [];
  if (problems.includes('basket')) missing.push(t('Choose a basket', 'اختر سلة'));
  if (problems.includes('few')) missing.push(selection.picks.length
    ? t(`Choose ${piecesLeft} more handcrafted piece${piecesLeft > 1 ? 's' : ''}`, `اختر ${piecesLeft} من القطع اليدوية أيضاً`)
    : t(`Choose at least ${PICK_MIN} handcrafted pieces`, `اختر ${PICK_MIN} قطع يدوية على الأقل`));
  if (problems.includes('treat')) missing.push(t('Add a festive treat', 'أضف حلوى احتفالية'));

  const send = ready
    ? <a className="button button--block" href={hamperWhatsappLink(selection)} target="_blank" rel="noopener noreferrer" data-track-location="hamper_whatsapp">{t('Send my hamper on WhatsApp', 'أرسل سلتي عبر واتساب')}</a>
    : <button type="button" className="button button--block" disabled>{t('Send my hamper on WhatsApp', 'أرسل سلتي عبر واتساب')}</button>;

  const sectionsByKind = (kind: HamperSection['kind']) => HAMPER_SECTIONS.filter((section) => section.kind === kind);
  const heading = (key: keyof typeof STEPS, id: string) => (
    <div className="hamper-step__head"><h2 id={id}>{ar ? STEPS[key].ar : STEPS[key].en}</h2><p>{ar ? STEPS[key].sub.ar : STEPS[key].sub.en}</p></div>
  );

  return (
    <div className="hamper section section--top">
      <PageHero
        eyebrow={{ en: 'Diwali 2026 · by Conscious Curations', ar: 'ديوالي 2026 · من Conscious Curations' }}
        title={{ en: 'Build your own Diwali hamper.', ar: 'صمّم هدية ديوالي بنفسك.' }}
        intro={{
          en: 'Pick a handwoven basket, fill it with handcrafted pieces and add a festive treat. Curated by Conscious Curations and hand-packed with dried flowers and their brand ribbon.',
          ar: 'اختر سلة منسوجة يدوياً، واملأها بقطع مصنوعة يدوياً، وأضف حلوى احتفالية. من تنسيق Conscious Curations وتُغلَّف يدوياً بالزهور المجففة وشريط العلامة.',
        }}>
        <CoBrand />
        <p className="cc-crumb"><Link href="/conscious-curations">← {t('Conscious Curations', 'Conscious Curations')}</Link></p>
      </PageHero>

      <div className="hamper-layout">
        <div className="hamper-steps">
          <section className="hamper-step" aria-labelledby="hamper-s1">
            {heading('B', 'hamper-s1')}
            {sectionsByKind('basket').map((section) => <Group key={section.id} section={section} selection={selection} toggle={toggle} />)}
          </section>

          <section className="hamper-step" aria-labelledby="hamper-s2">
            {heading('pick', 'hamper-s2')}
            {sectionsByKind('pick').map((section) => (
              <div key={section.id} className="hamper-sub">
                <h3>{ar ? section.ar : section.en}<span>{ar ? SECTION_AR_SUB[section.id][1] : SECTION_AR_SUB[section.id][0]}</span></h3>
                <Group section={section} selection={selection} toggle={toggle} />
              </div>
            ))}
          </section>

          <section className="hamper-step" aria-labelledby="hamper-s3">
            {heading('F', 'hamper-s3')}
            {sectionsByKind('treat').map((section) => <Group key={section.id} section={section} selection={selection} toggle={toggle} />)}
          </section>
        </div>

        <aside className="hamper-summary" id="hamper-summary" aria-label={t('Your hamper', 'سلتك')}>
          <h2>{t('Your hamper', 'سلتك')}</h2>
          {lines.length ? (
            <ul className="hamper-lines">
              {lines.map((item) => (
                <li key={item.code}>
                  <span className="hamper-lines__code">{item.code}</span>
                  <span className="hamper-lines__name">{ar ? item.ar : item.en}</span>
                  <span className="hamper-lines__price"><Money amount={item.price} ar={ar} /></span>
                  <button type="button" onClick={() => toggle(item)} aria-label={`${t('Remove', 'إزالة')} ${ar ? item.ar : item.en}`}>×</button>
                </li>
              ))}
            </ul>
          ) : <p className="hamper-empty">{t('Start with a basket. Everything you choose appears here.', 'ابدأ بسلة. كل ما تختاره سيظهر هنا.')}</p>}

          <dl className="hamper-total">
            <div><dt>{t('Total', 'المجموع')}</dt><dd><Money amount={total} ar={ar} /></dd></div>
            <div><dt>{t('50% advance to book', 'دفعة مقدمة 50٪ للحجز')}</dt><dd><Money amount={total / 2} ar={ar} /></dd></div>
          </dl>

          {ready
            ? <p className="hamper-code"><span>{t('Your code', 'رمز سلتك')}</span> <bdi dir="ltr">{codes}</bdi></p>
            : <ul className="hamper-missing" aria-live="polite">{missing.map((line) => <li key={line}>{line}</li>)}</ul>}

          {send}
          <ul className="hamper-terms">
            <li>{t('Opens WhatsApp with your code, items and total ready to send to Conscious Curations, who prepare and deliver your hamper.', 'يفتح واتساب برمز سلتك وقطعها والمجموع جاهزة للإرسال إلى Conscious Curations، وهم من يجهّز السلة ويوصلها.')}</li>
            <li>{t('50% advance books the order; the rest is settled before delivery.', 'دفعة مقدمة 50٪ لتأكيد الطلب، والباقي قبل التوصيل.')}</li>
            <li>{t('Delivery at a small extra cost, free for orders above AED 1,000.', 'التوصيل بتكلفة إضافية بسيطة، ومجاني للطلبات فوق 1,000 درهم.')}</li>
          </ul>
          {!!lines.length && <button type="button" className="hamper-clear" onClick={() => setSelection({ basket: null, picks: [], treats: [] })}>{t('Start again', 'ابدأ من جديد')}</button>}
        </aside>
      </div>

      <div className="hamper-bar" role="region" aria-label={t('Hamper total', 'مجموع السلة')}>
        <span className="hamper-bar__total"><Money amount={total} ar={ar} /></span>
        <span className="hamper-bar__state">{ready ? t('Ready to send', 'جاهزة للإرسال') : missing[0]}</span>
        <a className="hamper-bar__go" href="#hamper-summary">{t('Review', 'مراجعة')}</a>
      </div>
    </div>
  );
}
