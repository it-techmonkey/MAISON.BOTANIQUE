'use client';

import { useEffect, useRef, useState } from 'react';
import HamperScene from './HamperScene';
import { HAMPER_PRESETS, HAMPER_SECTIONS, HAMPER_ITEMS, PICK_MAX, PICK_MIN, hamperCodeString, hamperProblems, hamperTotal, hamperWhatsappLink, type HamperItem, type HamperSelection } from '@/lib/hamper';
import Money from './Money';
import { useStore } from './StoreProvider';

type Step = 'basket' | 'pieces' | 'treat';
const EMPTY: HamperSelection = { basket: null, picks: [], treats: [] };
const byCode = new Map(HAMPER_ITEMS.map((item) => [item.code, item]));
const sectionOf = (kind: 'basket' | 'pick' | 'treat') => HAMPER_SECTIONS.filter((section) => section.kind === kind);

const STEPS: Record<Step, { en: string; ar: string; subEn: string; subAr: string }> = {
  basket: { en: 'Basket', ar: 'السلة', subEn: 'Start with a handwoven basket, made by women artisan groups across India.', subAr: 'ابدأ بسلة منسوجة يدوياً بأيدي مجموعات حرفيات في الهند.' },
  pieces: { en: 'Pieces', ar: 'القطع', subEn: `Tap ${PICK_MIN} to ${PICK_MAX} handcrafted pieces. Tap again to take one out.`, subAr: `اضغط على ${PICK_MIN} إلى ${PICK_MAX} قطع يدوية. اضغط مرة أخرى لإزالتها.` },
  treat: { en: 'Treat', ar: 'الحلوى', subEn: 'Homemade sweets and snacks from Chefat65, the Conscious Curations family kitchen.', subAr: 'حلويات ووجبات خفيفة منزلية من Chefat65، مطبخ عائلة Conscious Curations.' },
};

function Card({ item, chosen, locked, onToggle }: { item: HamperItem; chosen: boolean; locked: boolean; onToggle: () => void }) {
  const { ar, t } = useStore();
  const name = ar ? item.ar : item.en;
  return (
    <li>
      <button type="button" className={`hamper-card${chosen ? ' is-chosen' : ''}`} aria-pressed={chosen} disabled={locked && !chosen} onClick={onToggle}>
        <span className="hamper-card__media">
          <img src={item.photo} alt="" loading="lazy" width="240" height="240" />
          <span className="hamper-card__code">{item.code}</span>
          <span className="hamper-card__tick" aria-hidden="true">✓</span>
        </span>
        <span className="hamper-card__name">{name}</span>
        <span className="hamper-card__note">{ar ? item.noteAr : item.noteEn}</span>
        <span className="hamper-card__price"><Money amount={item.price} ar={ar} />{item.unit && <small> {t('/ pair', '/ الزوج')}</small>}</span>
        <span className="sr-only">{chosen ? t('Chosen', 'تم الاختيار') : locked ? t('Hamper is full', 'السلة ممتلئة') : t('Choose', 'اختر')}</span>
      </button>
    </li>
  );
}

export default function HamperBuilder() {
  const { ar, t } = useStore();
  const [selection, setSelection] = useState<HamperSelection>(EMPTY);
  const [step, setStep] = useState<Step>('basket');
  const [filter, setFilter] = useState<string>('all');
  const tabsRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDialogElement>(null);

  const total = hamperTotal(selection);
  const problems = hamperProblems(selection);
  const ready = problems.length === 0;
  const codes = hamperCodeString(selection);
  const chosen = codes ? codes.split(' + ').map((code) => byCode.get(code)!) : [];
  const piecesLeft = Math.max(0, PICK_MIN - selection.picks.length);

  // Raises the floating WhatsApp button above the phone summary bar.
  useEffect(() => {
    document.body.classList.add('has-hamper-bar');
    return () => document.body.classList.remove('has-hamper-bar');
  }, []);

  const goTo = (next: Step) => {
    setStep(next);
    const tabs = tabsRef.current?.getBoundingClientRect();
    if (tabs && tabs.top < 70) tabsRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

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
    if (kind === 'basket' && selection.basket !== item.code) goTo('pieces');
  };

  const applyPreset = (preset: (typeof HAMPER_PRESETS)[number]) => {
    setSelection({ basket: preset.basket, picks: [...preset.picks], treats: [...preset.treats] });
    goTo('pieces');
    // On a phone the picture is below the cards, so show it straight away.
    if (window.matchMedia('(max-width: 960px)').matches) previewRef.current?.showModal();
  };

  const done: Record<Step, boolean> = { basket: !problems.includes('basket'), pieces: !problems.includes('few'), treat: !problems.includes('treat') };
  const badge: Record<Step, string> = {
    basket: done.basket ? '✓' : '0/1',
    pieces: `${selection.picks.length}/${PICK_MIN}–${PICK_MAX}`,
    treat: done.treat ? `✓ ${selection.treats.length}` : '0',
  };
  const order: Step[] = ['basket', 'pieces', 'treat'];
  const next = order[order.indexOf(step) + 1];

  const missing: string[] = [];
  if (problems.includes('basket')) missing.push(t('Choose a basket', 'اختر سلة'));
  if (problems.includes('few')) missing.push(selection.picks.length
    ? t(`Choose ${piecesLeft} more handcrafted piece${piecesLeft > 1 ? 's' : ''}`, `اختر ${piecesLeft} من القطع اليدوية أيضاً`)
    : t(`Choose at least ${PICK_MIN} handcrafted pieces`, `اختر ${PICK_MIN} قطع يدوية على الأقل`));
  if (problems.includes('treat')) missing.push(t('Add a festive treat', 'أضف حلوى احتفالية'));

  const visible = step === 'basket' ? sectionOf('basket') : step === 'treat' ? sectionOf('treat') : sectionOf('pick').filter((section) => filter === 'all' || section.id === filter);
  const items = visible.flatMap((section) => section.items);
  const full = step === 'pieces' && selection.picks.length >= PICK_MAX;
  const isChosen = (code: string) => code === selection.basket || selection.picks.includes(code) || selection.treats.includes(code);
  const nextLabel = next === 'pieces' ? t('Next: pieces', 'التالي: القطع') : t('Next: add a treat', 'التالي: أضف حلوى');

  const basketItem = selection.basket ? byCode.get(selection.basket) : undefined;
  const pickItems = selection.picks.map((code) => byCode.get(code)!);
  const treatItems = selection.treats.map((code) => byCode.get(code)!);

  const send = ready
    ? <a className="button button--block" href={hamperWhatsappLink(selection)} target="_blank" rel="noopener noreferrer" data-track-location="hamper_whatsapp">{t('Send my hamper on WhatsApp', 'أرسل سلتي عبر واتساب')}</a>
    : <button type="button" className="button button--block" disabled>{t('Send my hamper on WhatsApp', 'أرسل سلتي عبر واتساب')}</button>;

  return (
    <div className="hamper-layout" id="diwali-builder">
      <div className="hamper-browse">
        <div className="hamper-presets">
          <span>{t('Ready-made ideas, then make them yours', 'أفكار جاهزة، ثم عدّلها كما تحب')}</span>
          {HAMPER_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => applyPreset(preset)}>
              {ar ? preset.ar : preset.en} · <Money amount={hamperTotal(preset)} ar={ar} />
            </button>
          ))}
        </div>

        <div className="hamper-tabs" role="tablist" ref={tabsRef} aria-label={t('Hamper steps', 'خطوات السلة')}>
          {order.map((key, index) => (
            <button key={key} type="button" role="tab" id={`hamper-tab-${key}`} aria-selected={step === key} aria-controls="hamper-panel" className={done[key] ? 'is-done' : ''} onClick={() => goTo(key)}>
              <span className="hamper-tabs__n">{index + 1}</span>
              <span className="hamper-tabs__label">{ar ? STEPS[key].ar : STEPS[key].en}</span>
              <span className="hamper-tabs__badge" dir="ltr">{badge[key]}</span>
            </button>
          ))}
        </div>

        <div className="hamper-head">
          <p>{ar ? STEPS[step].subAr : STEPS[step].subEn}</p>
          {next && (step === 'basket' ? done.basket : step === 'pieces' ? done.pieces : false) && (
            <button type="button" className="hamper-next" onClick={() => goTo(next)}>{nextLabel} →</button>
          )}
        </div>

        {step === 'pieces' && (
          <div className="hamper-filters" role="group" aria-label={t('Filter pieces', 'تصفية القطع')}>
            {[{ id: 'all', en: 'All pieces', ar: 'كل القطع' }, ...sectionOf('pick')].map((section) => (
              <button key={section.id} type="button" aria-pressed={filter === section.id} onClick={() => setFilter(section.id)}>{ar ? section.ar : section.en}</button>
            ))}
          </div>
        )}

        <div id="hamper-panel" role="tabpanel" aria-labelledby={`hamper-tab-${step}`}>
          <ul className="hamper-grid">
            {items.map((item) => <Card key={item.code} item={item} chosen={isChosen(item.code)} locked={full} onToggle={() => toggle(item)} />)}
          </ul>
        </div>
      </div>

      <aside className="hamper-summary" id="hamper-summary" aria-label={t('Your hamper', 'سلتك')}>
        <h2>{ready ? t('Your hamper is ready', 'سلتك جاهزة') : t('Your hamper', 'سلتك')}</h2>

        <HamperScene basket={basketItem} picks={pickItems} treats={treatItems} onRemove={toggle} />

        <dl className="hamper-total">
          <div><dt>{t('Total', 'المجموع')}</dt><dd><Money amount={total} ar={ar} /></dd></div>
          <div><dt>{t('50% advance to book', 'دفعة مقدمة 50٪ للحجز')}</dt><dd><Money amount={total / 2} ar={ar} /></dd></div>
        </dl>

        {ready
          ? <p className="hamper-code"><span>{t('Your code', 'رمز سلتك')}</span> <bdi dir="ltr">{codes}</bdi></p>
          : <ul className="hamper-missing" aria-live="polite">{missing.map((line) => <li key={line}>{line}</li>)}</ul>}

        {send}
        <button type="button" className="button button--ghost button--block hamper-preview-btn" disabled={!chosen.length} onClick={() => previewRef.current?.showModal()}>{t('See it full size', 'شاهدها بحجم كامل')}</button>

        {chosen.length > 0 && (
          <ul className="hamper-lines">
            {chosen.map((item) => (
              <li key={item.code}>
                <span className="hamper-lines__code">{item.code}</span>
                <span className="hamper-lines__name">{ar ? item.ar : item.en}</span>
                <span className="hamper-lines__price"><Money amount={item.price} ar={ar} /></span>
              </li>
            ))}
          </ul>
        )}

        <details className="hamper-terms">
          <summary>{t('How ordering works', 'كيف يتم الطلب')}</summary>
          <ul>
            <li>{t('Opens WhatsApp with your code, items and total ready to send to Conscious Curations, who prepare and deliver your hamper.', 'يفتح واتساب برمز سلتك وقطعها والمجموع جاهزة للإرسال إلى Conscious Curations، وهم من يجهّز السلة ويوصلها.')}</li>
            <li>{t('50% advance books the order; the rest is settled before delivery.', 'دفعة مقدمة 50٪ لتأكيد الطلب، والباقي قبل التوصيل.')}</li>
            <li>{t('Delivery at a small extra cost, free for orders above AED 1,000.', 'التوصيل بتكلفة إضافية بسيطة، ومجاني للطلبات فوق 1,000 درهم.')}</li>
            <li>{t('The picture is a guide to your selection; the hamper is hand-packed by Conscious Curations.', 'الصورة دليل لاختيارك؛ وتُغلَّف السلة يدوياً من Conscious Curations.')}</li>
          </ul>
        </details>
        {chosen.length > 0 && <button type="button" className="hamper-clear" onClick={() => { setSelection(EMPTY); goTo('basket'); }}>{t('Start again', 'ابدأ من جديد')}</button>}
      </aside>

      <dialog className="hamper-preview" ref={previewRef} aria-label={t('Your hamper', 'سلتك')} onClick={(event) => { if (event.target === previewRef.current) previewRef.current.close(); }}>
        <div className="hamper-preview__bar">
          <h2>{t('Your Diwali hamper', 'سلة ديوالي الخاصة بك')}</h2>
          <button type="button" onClick={() => previewRef.current?.close()} aria-label={t('Close', 'إغلاق')}>×</button>
        </div>
        <div className="hamper-preview__scene"><HamperScene basket={basketItem} picks={pickItems} treats={treatItems} /></div>
        <p className="hamper-preview__total"><span>{t('Total', 'المجموع')}</span> <Money amount={total} ar={ar} /></p>
        {ready ? <a className="button button--block" href={hamperWhatsappLink(selection)} target="_blank" rel="noopener noreferrer" data-track-location="hamper_whatsapp_preview">{t('Send my hamper on WhatsApp', 'أرسل سلتي عبر واتساب')}</a> : <p className="hamper-missing">{missing.join(' · ')}</p>}
        <ul className="hamper-preview__items">
          {chosen.map((item) => (
            <li key={item.code}>
              <img src={item.photo} alt="" width="56" height="56" />
              <span>{ar ? item.ar : item.en}</span>
              <span><Money amount={item.price} ar={ar} /></span>
            </li>
          ))}
        </ul>
        <p className="hamper-preview__note">{t('An illustration of your selection. Conscious Curations hand-pack the real hamper.', 'صورة توضيحية لاختيارك. تُغلَّف السلة الحقيقية يدوياً من Conscious Curations.')}</p>
        <button type="button" className="hamper-clear" onClick={() => previewRef.current?.close()}>{t('Keep editing', 'متابعة التعديل')}</button>
      </dialog>

      <div className="hamper-bar" role="region" aria-label={t('Hamper total', 'مجموع السلة')}>
        <span className="hamper-bar__scene"><HamperScene basket={basketItem} picks={pickItems} treats={treatItems} mini /></span>
        <span className="hamper-bar__info">
          <span className="hamper-bar__total"><Money amount={total} ar={ar} /></span>
          <span className="hamper-bar__state">{ready ? t('Ready to send', 'جاهزة للإرسال') : missing[0]}</span>
        </span>
        <button type="button" className="hamper-bar__go" onClick={() => previewRef.current?.showModal()}>{t('See hamper', 'شاهد السلة')}</button>
      </div>
    </div>
  );
}
