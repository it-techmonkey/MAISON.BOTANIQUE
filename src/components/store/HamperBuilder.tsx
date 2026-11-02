'use client';

import { useEffect, useRef, useState } from 'react';
import { HAMPER_ITEMS, HAMPER_PRESETS, HAMPER_SECTIONS, HAMPER_SLOTS, presetPhoto, hamperCodeString, hamperProblems, hamperTotal, hamperWhatsappLink, selectionFromSlots, PICK_MIN, type HamperItem, type HamperSlot, type HamperSlots, type SlotId } from '@/lib/hamper';
import HamperScene from './HamperScene';
import Money from './Money';
import { useStore } from './StoreProvider';

const byCode = new Map(HAMPER_ITEMS.map((item) => [item.code, item]));
// Photos already made this visit, so going back to a hamper costs nothing.
const renderCache = new Map<string, string>();
const START = HAMPER_PRESETS.find((preset) => preset.id === 'home') ?? HAMPER_PRESETS[0];
const keyOf = (slots: HamperSlots) => hamperCodeString(selectionFromSlots(slots));

export default function HamperBuilder() {
  const { ar, t } = useStore();
  const [slots, setSlots] = useState<HamperSlots>(START.slots);
  const [open, setOpen] = useState<SlotId | null>(null);
  const [note, setNote] = useState('');
  const [render, setRender] = useState<{ key: string; src: string } | null>(null);
  const [rendering, setRendering] = useState(false);
  const renderOff = useRef(false);
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
  const matched = HAMPER_PRESETS.find((preset) => keyOf(preset.slots) === keyOf(slots));
  const renderKey = hamperCodeString(selection);
  const renderBody = JSON.stringify(selection);

  // A swapped hamper gets its own photo: wait for the customer to settle, then ask the server (see /api/hamper-image).
  // Without the service (503) or past its limits the tidy preview simply stays.
  useEffect(() => {
    if (matched || !ready || renderOff.current) { setRendering(false); return; }
    const cached = renderCache.get(renderKey);
    if (cached) { setRender({ key: renderKey, src: cached }); setRendering(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setRendering(true);
      try {
        const response = await fetch('/api/hamper-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: renderBody, signal: controller.signal });
        if (response.status === 503 || response.status === 429) renderOff.current = true;
        if (!response.ok) return;
        const { image } = (await response.json()) as { image: string };
        renderCache.set(renderKey, image);
        setRender({ key: renderKey, src: image });
      } catch { /* aborted or offline: keep the preview */ } finally {
        if (!controller.signal.aborted) setRendering(false);
      }
    }, 1500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [matched, ready, renderKey, renderBody]);

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
  const cta = t('Send my hamper on WhatsApp', 'أرسل سلتي عبر واتساب');
  const send = ready
    ? <a className="button button--block" href={hamperWhatsappLink(selection, note)} target="_blank" rel="noopener noreferrer" data-track-location="hamper_whatsapp">{cta}</a>
    : <button type="button" className="button button--block" disabled>{cta}</button>;

  return (
    <div className="hamper-layout" id="diwali-builder">
      <div className="hamper-visual">
        {matched ? (
          <figure className="hamper-photo">
            <img src={presetPhoto(matched.id)} alt={`${ar ? matched.ar : matched.en}: ${t('a ready-made Diwali hamper', 'سلة ديوالي جاهزة')}`} width="1024" height="1024" />
            <figcaption>{t('Illustrative photo. Swap anything below and the picture updates.', 'صورة توضيحية. بدّل أي قطعة أدناه وستتحدث الصورة.')}</figcaption>
          </figure>
        ) : render?.key === renderKey ? (
          <figure className="hamper-photo">
            <img src={render.src} alt={t('Your Diwali hamper', 'سلة ديوالي الخاصة بك')} width="1024" height="1024" />
            <figcaption>{t('Illustration of your hamper. The real one is hand-packed by Conscious Curations.', 'صورة توضيحية لسلتك. تُغلَّف السلة الحقيقية يدوياً من Conscious Curations.')}</figcaption>
          </figure>
        ) : (
          <figure className="hamper-photo hamper-photo--scene">
            <HamperScene items={items} onPick={openSlot} />
            <figcaption>{t('Preview of your changes. The real hamper is hand-packed by Conscious Curations.', 'معاينة لتعديلاتك. تُغلَّف السلة الحقيقية يدوياً من Conscious Curations.')}</figcaption>
          </figure>
        )}
        {rendering && <p className="hamper-photo__busy" role="status">{t('Creating a photo of your hamper…', 'نجهّز صورة لسلتك…')}</p>}
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
              <img src={presetPhoto(preset.id)} alt="" width="48" height="48" />
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
                    {item && <span className="slot__price"><Money amount={item.price} ar={ar} />{item.unit && <small> {t('/ pair', '/ الزوج')}</small>}</span>}
                    <span className="slot__swap" aria-hidden="true">{isOpen ? t('Close', 'إغلاق') : item ? t('Swap', 'استبدال') : t('Choose', 'اختر')}</span>
                  </button>
                  {canClear && <button type="button" className="slot__clear" onClick={() => choose(slot.id, null)} aria-label={`${t('Remove', 'إزالة')} ${ar ? item.ar : item.en}`}>×</button>}
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
            <textarea value={note} maxLength={200} rows={2} onChange={(event) => setNote(event.target.value)} placeholder={t('Happy Diwali…', 'ديوالي سعيد…')} />
          </label>
        </div>
      </div>

      <div className="hamper-bar" role="region" aria-label={t('Hamper total', 'مجموع السلة')}>
        <span className="hamper-bar__info">
          <span className="hamper-bar__total"><Money amount={total} ar={ar} /></span>
          <span className="hamper-bar__state">{ready ? t('Ready to send', 'جاهزة للإرسال') : missing[0]}</span>
        </span>
        {ready
          ? <a className="hamper-bar__go" href={hamperWhatsappLink(selection, note)} target="_blank" rel="noopener noreferrer" data-track-location="hamper_whatsapp_bar">{t('Send on WhatsApp', 'أرسل عبر واتساب')}</a>
          : <button type="button" className="hamper-bar__go" disabled>{t('Send on WhatsApp', 'أرسل عبر واتساب')}</button>}
      </div>
    </div>
  );
}
