'use client';

import { useEffect, useRef, useState } from 'react';
import { HAMPER_ITEMS, HAMPER_PRESETS, HAMPER_SECTIONS, HAMPER_SLOTS, presetPhoto, presetThumb, hamperCodeString, hamperProblems, hamperTotal, hamperCodes, closestHamperPhoto, selectionFromSlots, PICK_MIN, type HamperItem, type HamperSlot, type HamperSlots, type SlotId } from '@/lib/hamper';
import Money from './Money';
import { useStore } from './StoreProvider';

const byCode = new Map(HAMPER_ITEMS.map((item) => [item.code, item]));
const START = HAMPER_PRESETS.find((preset) => preset.id === 'home') ?? HAMPER_PRESETS[0];
const keyOf = (slots: HamperSlots) => hamperCodeString(selectionFromSlots(slots));

export default function HamperBuilder() {
  const { ar, t, hamperProducts, cart, setCartOpen } = useStore();
  const [slots, setSlots] = useState<HamperSlots>(START.slots);
  const [open, setOpen] = useState<SlotId | null>(null);
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const rowRefs = useRef<Partial<Record<SlotId, HTMLLIElement | null>>>({});

  // Raises the floating WhatsApp button above the phone summary bar.
  useEffect(() => {
    document.body.classList.add('has-hamper-bar');
    return () => document.body.classList.remove('has-hamper-bar');
  }, []);

  const selection = selectionFromSlots(slots);
  const total = hamperTotal(selection);
  const problems = hamperProblems(selection);
  const ready = problems.length === 0;
  const items: Partial<Record<SlotId, HamperItem>> = {};
  for (const slot of HAMPER_SLOTS) { const code = slots[slot.id]; if (code) items[slot.id] = byCode.get(code); }
  const photo = closestHamperPhoto(selection);
  const photoNames = photo.exact ? [] : photo.notShown.map((code) => byCode.get(code)!).map((item) => (ar ? item.ar : item.en));

  const inHamper = new Set(Object.values(slots).filter(Boolean));

  const choose = (slot: SlotId, code: string | null) => { setSlots((current) => ({ ...current, [slot]: code })); setOpen(null); };
  const openSlot = (slot: SlotId) => {
    setOpen((current) => (current === slot ? null : slot));
    // Tapping a piece in the picture brings its row into view.
    rowRefs.current[slot]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const optionsFor = (slot: HamperSlot) => HAMPER_SECTIONS.filter((section) => slot.sections.includes(section.id)).flatMap((section) => section.items);

  const missing: string[] = [];
  if (problems.includes('basket')) missing.push(t('Choose a basket', 'اختر سلة'));
  if (problems.includes('few')) missing.push(t(`Add at least ${PICK_MIN} handcrafted pieces`, `أضف ${PICK_MIN} قطع يدوية على الأقل`));
  if (problems.includes('treat')) missing.push(t('Add a festive treat', 'أضف حلوى احتفالية'));
  // The chosen items are ordinary store products: the hamper goes into the bag as one line each, tied together by a shared label.
  const parts = hamperCodes(selection).map((code) => hamperProducts.find((product) => product.id === byCode.get(code)!.handle));
  const orderable = ready && parts.every((product) => product?.available && product.sizes.some((size) => size.available));
  const addHamper = async () => {
    if (!orderable || adding) return;
    setAdding(true);
    const label = `Hamper ${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    try {
      for (const [index, product] of parts.entries()) {
        await cart.addItem(product!, { sizeId: product!.sizes.find((size) => size.available)?.id, custom: label, note: index === 0 ? note : undefined, source: 'hamper_builder' });
      }
      setCartOpen(true);
    } finally { setAdding(false); }
  };
  const cta = !ready || orderable ? t('Add hamper to bag', 'أضف السلة إلى الحقيبة') : t('Ordering opens soon', 'الطلب قريباً');
  const send = <button type="button" className="button button--block" disabled={!orderable || adding} onClick={addHamper} data-track-location="hamper_add_to_bag">{cta}</button>;

  return (
    <div className="hamper-layout" id="diwali-builder">
      <div className="hamper-visual">
        <figure className={`hamper-photo${photo.exact ? '' : ' hamper-photo--nearby'}`}>
          <img src={presetPhoto(photo.id)} alt={t('A hamper from Conscious Curations', 'سلة من Conscious Curations')} width="1024" height="1024" />
          <figcaption>{photo.exact
            ? t('Illustrative photo. Swap anything below and the picture updates.', 'صورة توضيحية. بدّل أي قطعة أدناه وستتحدث الصورة.')
            : t(`Photo of a similar hamper, not showing ${photoNames.join(', ')}. What you receive is the list below.`, `صورة لسلة مشابهة، لا تُظهر ${photoNames.join('، ')}. ما ستستلمه هو القائمة أدناه.`)}</figcaption>
        </figure>
        <dl className="hamper-total">
          <div><dt>{t('Total', 'المجموع')}</dt><dd><Money amount={total} ar={ar} /></dd></div>
        </dl>
        <div className="hamper-visual__buy">
          {!ready && <ul className="hamper-missing" aria-live="polite">{missing.map((line) => <li key={line}>{line}</li>)}</ul>}
          {send}
        </div>
      </div>

      <div className="hamper-controls">
        <div className="hamper-presets" role="group" aria-label={t('Ready-made hampers', 'سلال جاهزة')}>
          <span>{t('Start from a ready-made hamper, then swap anything', 'ابدأ بسلة جاهزة ثم بدّل ما تشاء')}</span>
          {HAMPER_PRESETS.map((preset) => (
            <button key={preset.id} type="button" aria-pressed={keyOf(preset.slots) === keyOf(slots)} onClick={() => { setSlots(preset.slots); setOpen(null); }}>
              <img src={presetThumb(preset.id)} alt="" width="48" height="48" />
              <span><strong>{ar ? preset.ar : preset.en}</strong><Money amount={hamperTotal(selectionFromSlots(preset.slots))} ar={ar} /></span>
            </button>
          ))}
        </div>

        <ol className="hamper-slots">
          {HAMPER_SLOTS.map((slot) => {
            const item = items[slot.id];
            if (slot.id === 'treat2' && !items.treat) return null;
            const isOpen = open === slot.id;
            const label = ar ? slot.ar : slot.en;
            const canClear = !!item && slot.id !== 'basket' && slot.id !== 'treat';
            return (
              <li key={slot.id} ref={(node) => { rowRefs.current[slot.id] = node; }} className={`slot${isOpen ? ' is-open' : ''}${item ? '' : ' is-empty'}`}>
                <div className="slot__row">
                  <button type="button" className="slot__main" aria-expanded={isOpen} aria-controls={`slot-tray-${slot.id}`} onClick={() => openSlot(slot.id)}>
                    <span className="slot__thumb">{item ? <img src={item.photo} alt="" width="64" height="64" /> : <span aria-hidden="true">+</span>}</span>
                    <span className="slot__text">
                      <small>{label}{slot.optional ? ` · ${t('optional', 'اختياري')}` : ''}</small>
                      <strong>{item ? (ar ? item.ar : item.en) : slot.optional ? t('Add', 'إضافة') : t('Choose', 'اختر')}</strong>
                    </span>
                    {item ? <span className="slot__price"><Money amount={item.price} ar={ar} />{item.unit && <small> {t('/ pair', '/ الزوج')}</small>}</span> : <span className="slot__price" />}
                    <span className="slot__swap" aria-hidden="true">{isOpen ? t('Close', 'إغلاق') : item ? t('Swap', 'استبدال') : t('Choose', 'اختر')}</span>
                  </button>
                  {canClear ? <button type="button" className="slot__clear" onClick={() => choose(slot.id, null)} aria-label={`${t('Remove', 'إزالة')} ${ar ? item.ar : item.en}`}>×</button> : <span className="slot__clear" aria-hidden="true" />}
                </div>
                {isOpen && (
                  <ul className="slot__tray" id={`slot-tray-${slot.id}`}>
                    {optionsFor(slot).map((option) => {
                      const here = slots[slot.id] === option.code;
                      const elsewhere = !here && inHamper.has(option.code);
                      return (
                        <li key={option.code}>
                          <button type="button" aria-pressed={here} disabled={elsewhere} onClick={() => choose(slot.id, option.code)}>
                            <span className="slot__option-img"><img src={option.photo} alt="" loading="lazy" width="120" height="120" />{here && <span aria-hidden="true">✓</span>}</span>
                            <span className="slot__option-name">{ar ? option.ar : option.en}</span>
                            <span className="slot__option-price">{elsewhere ? t('In your hamper', 'في سلتك') : <><Money amount={option.price} ar={ar} />{option.unit && <small> {t('/ pair', '/ الزوج')}</small>}</>}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>

        <div className="hamper-order">
          <label className="hamper-note">
            <span>{t('Card message (optional)', 'رسالة البطاقة (اختياري)')}</span>
            <textarea value={note} maxLength={200} rows={2} onChange={(event) => setNote(event.target.value)} placeholder={t('Your message…', 'رسالتك…')} />
          </label>
        </div>
      </div>

      <div className="hamper-bar" role="region" aria-label={t('Hamper total', 'مجموع السلة')}>
        <span className="hamper-bar__info">
          <span className="hamper-bar__total"><Money amount={total} ar={ar} /></span>
          <span className="hamper-bar__state">{ready ? t('Ready to send', 'جاهزة للإرسال') : missing[0]}</span>
        </span>
        <button type="button" className="hamper-bar__go" disabled={!orderable || adding} onClick={addHamper}>{!ready || orderable ? t('Add to bag', 'أضف إلى الحقيبة') : t('Opens soon', 'قريباً')}</button>
      </div>
    </div>
  );
}
