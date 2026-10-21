'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import {
  DIWALI_GIFTS, DIWALI_GROUPS, DIWALI_LEAD_GROUPS, DIWALI_SECTIONS, type DiwaliGift, type DiwaliGroupId,
} from '@/data/diwali-gifts';
import { useStore } from './StoreProvider';

const SHORTLIST_KEY = 'maison-bikanervala-meeting-shortlist';
const NOTES_KEY = 'maison-bikanervala-meeting-notes';
const BIKANERVALA_LOGO = '/diwali/brand/bikanervala-logo-sm.png';

const photo = (gift: DiwaliGift, width: 600 | 1200) => `/diwali/concepts/${gift.id}-${width}.webp`;
// Ideas appear in the order of the page, which is also the order the arrows step through.
const ORDERED = [...DIWALI_LEAD_GROUPS.map((group) => group.id), ...DIWALI_GROUPS.map((group) => group.id)]
  .flatMap((id) => DIWALI_GIFTS.filter((gift) => gift.group === id));

/** Opens and closes a native dialog from state. */
function useDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return ref;
}

function Chevron({ dir }: { dir: 'prev' | 'next' }) {
  return <span className="diwali-chev" aria-hidden="true">{dir === 'prev' ? '‹' : '›'}</span>;
}

function Lockup({ className = '' }: { className?: string }) {
  return <Image unoptimized className={`diwali-lockup ${className}`} src="/diwali/brand/collab-lockup-horizontal.png" alt="Maison Botanique × Bikanervala" width={1200} height={350} />;
}

function Badge() {
  const { t } = useStore();
  return (
    <span className="diwali-badge">
      <span>{t('with', 'مع')}</span>
      <Image unoptimized src={BIKANERVALA_LOGO} width={58} height={20} alt="Bikanervala" />
    </span>
  );
}

function ConceptImage({ gift, large = false, eager = false }: { gift: DiwaliGift; large?: boolean; eager?: boolean }) {
  const { t } = useStore();
  const [failed, setFailed] = useState(false);
  return (
    <span className="diwali-image">
      {failed ? (
        <span className="diwali-image__placeholder">{t('Image in progress', 'الصورة قيد الإعداد')}</span>
      ) : (
        <picture>
          <source media="(max-width: 700px)" srcSet={photo(gift, 600)} />
          <img src={photo(gift, large ? 1200 : 600)} alt={`${gift.name.en} — Maison Botanique × Bikanervala`} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
        </picture>
      )}
      <span className="diwali-image__brand"><Badge /></span>
    </span>
  );
}

function Card({ gift, large, saved, onOpen, onToggle }: {
  gift: DiwaliGift; large?: boolean; saved: boolean; onOpen: () => void; onToggle: () => void;
}) {
  const { ar, t } = useStore();
  const name = ar ? gift.name.ar : gift.name.en;
  return (
    <article className={`diwali-card${large ? ' diwali-card--large' : ''}`}>
      <button type="button" className="diwali-card__open" onClick={onOpen} aria-label={`${t('View', 'شاهد')} ${name}`}>
        <ConceptImage gift={gift} large={large} />
        <span className="diwali-card__body">
          <span className="diwali-card__name">{name}</span>
          <span className="diwali-card__field"><small>{t('Maison starting point', 'تنسيق ميزون الأساسي')}</small><span>{ar ? gift.maisonAr : gift.maison}</span></span>
          <span className="diwali-card__field"><small>{t('Bikanervala sweets', 'حلويات بيكانيرفالا')}</small><span>{gift.sweets}</span></span>
          <span className="diwali-card__more">{t('View the idea', 'شاهد الفكرة')} ↗</span>
        </span>
      </button>
      <button type="button" className={`diwali-card__heart${saved ? ' is-saved' : ''}`} onClick={onToggle} aria-pressed={saved}
        aria-label={`${saved ? t('Remove', 'احذف') : t('Shortlist', 'أضف إلى القائمة')} ${name}`} title={t('Shortlist for the meeting', 'القائمة المختصرة للاجتماع')}>
        <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
      </button>
    </article>
  );
}

function groupLabel(group: DiwaliGroupId, ar: boolean) {
  const lead = DIWALI_LEAD_GROUPS.find((item) => item.id === group);
  if (lead) return ar ? lead.title.ar : lead.title.en;
  const lettered = DIWALI_GROUPS.find((item) => item.id === group);
  return lettered ? `${lettered.letter} · ${ar ? lettered.title.ar : lettered.title.en}` : '';
}

function IdeaDialog({ gift, onClose, onStep, saved, onToggle, note, onNote }: {
  gift: DiwaliGift | null; onClose: () => void; onStep: (direction: 1 | -1) => void;
  saved: boolean; onToggle: () => void; note: string; onNote: (value: string) => void;
}) {
  const { ar, t } = useStore();
  const ref = useDialog(Boolean(gift));
  const touch = useRef<{ x: number; y: number } | null>(null);
  const id = gift?.id;
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [id, ref]);

  const swipeStart = (event: TouchEvent) => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; };
  const swipeEnd = (event: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.4 * Math.abs(dy)) onStep((dx < 0) === !ar ? 1 : -1);
  };

  return (
    <dialog ref={ref} className="diwali-dialog" onClose={onClose} onCancel={onClose} aria-label={gift ? gift.name.en : 'Concept detail'}
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).tagName === 'TEXTAREA') return;
        if (event.key === 'ArrowRight') { event.preventDefault(); onStep(ar ? -1 : 1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); onStep(ar ? 1 : -1); }
      }}
      onClick={(event) => { if (event.target === ref.current) ref.current?.close(); }}>
      {gift && (
        <div className="diwali-dialog__inner">
          <div className="diwali-dialog__media" onTouchStart={swipeStart} onTouchEnd={swipeEnd}>
            <ConceptImage key={gift.id} gift={gift} large eager />
            <button type="button" className="diwali-dialog__arrow diwali-dialog__arrow--prev" onClick={() => onStep(-1)} aria-label={t('Previous idea', 'الفكرة السابقة')}><Chevron dir="prev" /></button>
            <button type="button" className="diwali-dialog__arrow diwali-dialog__arrow--next" onClick={() => onStep(1)} aria-label={t('Next idea', 'الفكرة التالية')}><Chevron dir="next" /></button>
          </div>
          <div className="diwali-dialog__body">
            <button type="button" className="diwali-dialog__close" onClick={() => ref.current?.close()} aria-label={t('Close', 'إغلاق')}>×</button>
            <p className="diwali-dialog__group">{groupLabel(gift.group, ar)}</p>
            <h2>{ar ? gift.name.ar : gift.name.en}</h2>
            <p className="diwali-dialog__presentation">{ar ? gift.presentation.ar : gift.presentation.en}</p>
            <div className="diwali-dialog__contents">
              <p className="eyebrow">{t('Contents', 'المحتويات')}</p>
              <dl>
                <div><dt>MAISON BOTANIQUE</dt><dd>{ar ? gift.maisonAr : gift.maison}</dd></div>
                <div><dt>BIKANERVALA</dt><dd>{gift.sweets}</dd></div>
              </dl>
            </div>
            <div className="diwali-dialog__sweet">
              <Image unoptimized src={BIKANERVALA_LOGO} width={144} height={50} alt="Bikanervala" />
              <div><strong>{t('Sweets by Bikanervala', 'حلويات من بيكانيرفالا')}</strong><p>{gift.sweets}</p></div>
            </div>
            <p className="diwali-dialog__size">
              {gift.oneSize ? t('One size.', 'حجم واحد.')
                : t('Signature, Grand and Luxe change the flowers only. The sweets stay the same.', 'تغيّر أحجام سيغنتشر وجراند ولوكس الزهور فقط؛ تبقى الحلويات كما هي.')}
            </p>
            <button type="button" className="diwali-dialog__save" aria-pressed={saved} onClick={onToggle}>
              {saved ? '♥' : '♡'} {saved ? t('On your shortlist', 'في قائمتك المختصرة') : t('Add to shortlist', 'أضف إلى القائمة المختصرة')}
            </button>
            <label className="diwali-note">
              <span>{t('Meeting note', 'ملاحظة للاجتماع')}</span>
              <textarea value={note} maxLength={400} rows={3} onChange={(event) => onNote(event.target.value)}
                placeholder={t('A thought to remember from the meeting…', 'ملاحظة نتذكرها من الاجتماع…')} />
              <small>{t('Kept on this device only.', 'تبقى على هذا الجهاز فقط.')}</small>
            </label>
            <div className="diwali-dialog__actions">
              <button type="button" className="diwali-step" onClick={() => onStep(-1)}><Chevron dir="prev" /> {t('Previous', 'السابق')}</button>
              <button type="button" className="diwali-step diwali-step--heart" aria-pressed={saved} onClick={onToggle}
                aria-label={saved ? t('Remove from shortlist', 'احذف من القائمة') : t('Add to shortlist', 'أضف إلى القائمة المختصرة')}>
                <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
              </button>
              <button type="button" className="diwali-step" onClick={() => onStep(1)}>{t('Next', 'التالي')} <Chevron dir="next" /></button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

function ReviewDialog({ open, onClose, items, notes, onNote, onRemove, onOpenIdea, onClear }: {
  open: boolean; onClose: () => void; items: DiwaliGift[]; notes: Record<string, string>;
  onNote: (id: string, value: string) => void; onRemove: (id: string) => void; onOpenIdea: (id: string) => void; onClear: () => void;
}) {
  const { ar, t } = useStore();
  const ref = useDialog(open);
  const [status, setStatus] = useState('');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const listText = () => [
    'Maison Botanique × Bikanervala — meeting shortlist', '',
    ...items.map((gift, index) => {
      const note = (notes[gift.id] ?? '').trim();
      return `${index + 1}. ${gift.name.en} — ${gift.maison} + ${gift.sweets}${note ? `\n   Note: ${note}` : ''}`;
    }),
  ].join('\n');
  const flash = (message: string) => { setStatus(message); window.setTimeout(() => setStatus(''), 2400); };
  const copy = async () => {
    const text = listText();
    try { await navigator.clipboard.writeText(text); flash(t('Copied to the clipboard.', 'تم النسخ.')); return; } catch { /* Fall back below. */ }
    try {
      const field = document.createElement('textarea');
      field.value = text;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      document.body.removeChild(field);
      flash(t('Copied to the clipboard.', 'تم النسخ.'));
    } catch { flash(t('Copy was blocked by this browser.', 'منع المتصفح النسخ.')); }
  };
  const share = async () => { try { await navigator.share({ title: 'Maison Botanique × Bikanervala', text: listText() }); } catch { /* Dismissed. */ } };

  return (
    <dialog ref={ref} className="diwali-review" onClose={onClose} onCancel={onClose} aria-label={t('Meeting shortlist', 'القائمة المختصرة للاجتماع')}
      onClick={(event) => { if (event.target === ref.current) ref.current?.close(); }}>
      <div className="diwali-review__head">
        <div>
          <p className="eyebrow">{t('For the meeting', 'للاجتماع')}</p>
          <h2>{t('Your shortlist', 'قائمتك المختصرة')}</h2>
        </div>
        <button type="button" className="diwali-dialog__close diwali-review__close" onClick={() => ref.current?.close()} aria-label={t('Close', 'إغلاق')}>×</button>
      </div>
      {items.length === 0 ? (
        <p className="diwali-review__empty">{t('Tap ♡ on any idea to build a shortlist, then review it here with your notes.', 'اضغط ♡ على أي فكرة لبناء قائمة مختصرة ثم راجعها هنا مع ملاحظاتك.')}</p>
      ) : (
        <ul>
          {items.map((gift) => (
            <li key={gift.id}>
              <button type="button" className="diwali-review__thumb" onClick={() => onOpenIdea(gift.id)} aria-label={`${t('View', 'شاهد')} ${gift.name.en}`}>
                <img src={photo(gift, 600)} alt="" loading="lazy" />
              </button>
              <div className="diwali-review__text">
                <button type="button" className="diwali-review__name" onClick={() => onOpenIdea(gift.id)}>{ar ? gift.name.ar : gift.name.en}</button>
                <p>{ar ? gift.maisonAr : gift.maison} <span aria-hidden="true">+</span> {gift.sweets}</p>
                <label>
                  <span className="diwali-review__sr">{t('Meeting note', 'ملاحظة للاجتماع')}</span>
                  <textarea rows={2} maxLength={400} value={notes[gift.id] ?? ''} onChange={(event) => onNote(gift.id, event.target.value)} placeholder={t('Add a note…', 'أضف ملاحظة…')} />
                </label>
              </div>
              <button type="button" className="diwali-review__remove" onClick={() => onRemove(gift.id)} aria-label={`${t('Remove', 'احذف')} ${gift.name.en}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      <div className="diwali-review__foot">
        <button type="button" className="diwali-step" onClick={copy} disabled={items.length === 0}>{t('Copy list', 'انسخ القائمة')}</button>
        {canShare && <button type="button" className="diwali-step" onClick={share} disabled={items.length === 0}>{t('Share', 'مشاركة')}</button>}
        <button type="button" className="diwali-review__clear" onClick={onClear} disabled={items.length === 0}>{t('Clear all', 'مسح الكل')}</button>
        <span className="diwali-review__status" role="status" aria-live="polite">{status}</span>
      </div>
    </dialog>
  );
}

/** Sticky section links, with the shortlist button. */
function SectionNav({ count, onReview }: { count: number; onReview: () => void }) {
  const { ar, t } = useStore();
  const [current, setCurrent] = useState(DIWALI_SECTIONS[0].id);
  const links = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let active = DIWALI_SECTIONS[0].id;
      for (const section of DIWALI_SECTIONS) {
        const element = document.getElementById(`diwali-s-${section.id}`);
        if (element && element.getBoundingClientRect().top <= 230) active = section.id;
      }
      setCurrent(active);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  // Keeps the current link in view in the scrolling row.
  useEffect(() => {
    const row = links.current;
    const link = row?.querySelector('[aria-current="true"]');
    if (!row || !link) return;
    const box = row.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    row.scrollBy({ left: rect.left + rect.width / 2 - (box.left + box.width / 2), behavior: 'smooth' });
  }, [current]);

  return (
    <nav className="diwali-nav" aria-label={t('Sections of this page', 'أقسام الصفحة')}>
      <div className="diwali-nav__links" ref={links}>
        {DIWALI_SECTIONS.map((section) => (
          <a key={section.id} href={`#diwali-s-${section.id}`} aria-current={current === section.id ? 'true' : undefined}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(`diwali-s-${section.id}`)?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start',
              });
            }}>
            {ar ? section.title.ar : section.title.en}
          </a>
        ))}
      </div>
      <button type="button" className="diwali-nav__list" onClick={onReview} aria-label={t('Review your shortlist', 'راجع قائمتك المختصرة')}>
        <span aria-hidden="true">{count > 0 ? '♥' : '♡'}</span> <span className="diwali-nav__list-text">{t('Shortlist', 'القائمة')}</span>
        {count > 0 && <b>{count}</b>}
      </button>
    </nav>
  );
}

function SectionHeading({ eyebrow, title, intro }: { eyebrow: ReactNode; title: ReactNode; intro?: ReactNode }) {
  return (
    <div className="diwali-section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
    </div>
  );
}

function Packaging() {
  const { t } = useStore();
  return (
    <section id="diwali-s-gift" className="diwali-packaging" aria-labelledby="diwali-packaging-title">
      <div className="diwali-section-heading">
        <p className="eyebrow">{t('On the gift', 'على الهدية')}</p>
        <h2 id="diwali-packaging-title">{t(<>Both names, <em>beautifully placed.</em></>, <>الاسمان، <em>في مكانهما.</em></>)}</h2>
        <p>{t('The original Bikanervala logo sits on ivory beside Maison Botanique. These are packaging directions for approval, not final printed stock.',
          'يظهر شعار بيكانيرفالا الأصلي على خلفية عاجية بجانب ميزون بوتانيك. هذه تصورات للتغليف بانتظار الاعتماد.')}</p>
      </div>
      <div className="diwali-packaging__grid">
        <figure>
          <div><Image unoptimized src="/diwali/brand/collab-tag.png" width={900} height={600} alt="Co-branded ribbon tag" /></div>
          <figcaption>{t('Ribbon tag on every gift', 'بطاقة على شريط كل هدية')}</figcaption>
        </figure>
        <figure>
          <div><Image unoptimized src="/diwali/brand/collab-box-label.png" width={1200} height={1200} alt="Co-branded sweet-box lid label" /></div>
          <figcaption>{t('Lid label on every sweet box', 'ملصق على غطاء كل علبة حلوى')}</figcaption>
        </figure>
        <figure>
          <div><Lockup /></div>
          <figcaption>{t('Shared message card', 'بطاقة إهداء مشتركة')}</figcaption>
        </figure>
      </div>
    </section>
  );
}

function Plan() {
  const { t } = useStore();
  const placements = [
    [t('Homepage feature', 'ظهور في الرئيسية'), t('A co-branded invitation directly after Maison Botanique’s existing hero.', 'دعوة مشتركة بعد الواجهة الحالية لموقع ميزون بوتانيك.')],
    [t('Dedicated collection', 'مجموعة مخصصة'), t('One focused page for every gift and its Bikanervala sweet pairing.', 'صفحة مركزة تعرض كل هدية وحلويات بيكانيرفالا المرافقة لها.')],
    [t('Brand on the gift', 'العلامة على الهدية'), t('A shared ribbon tag and label on each sweet box, subject to packaging approval.', 'بطاقة مشتركة على الشريط وملصق على كل علبة حلوى بعد اعتماد التغليف.')],
    [t('Seasonal storytelling', 'قصة موسمية'), t('With approval, carry the imagery into Instagram and WhatsApp.', 'بعد الموافقة، تُستخدم الصور في إنستغرام وواتساب.')],
    [t('In-store invitation', 'دعوة من المتجر'), t('An optional QR stand in Bikanervala’s UAE stores links to the collection.', 'يمكن وضع رمز QR اختياري في متاجر بيكانيرفالا بالإمارات لزيارة المجموعة.')],
  ];
  return (
    <section id="diwali-s-plan" className="diwali-plan" aria-labelledby="diwali-plan-title">
      <div className="diwali-plan__intro">
        <p className="eyebrow">{t('Where Bikanervala appears', 'أين تظهر بيكانيرفالا')}</p>
        <h2 id="diwali-plan-title">{t(<>A shared stage for <em>both names.</em></>, <>مساحة مشتركة <em>للاسمين.</em></>)}</h2>
        <p>{t('The page is only the beginning of the partnership. Each placement below would be agreed before launch.', 'هذه الصفحة بداية الشراكة فقط. تُتفق تفاصيل كل مساحة ظهور قبل الإطلاق.')}</p>
      </div>
      <ol>
        {placements.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}
      </ol>
      <p className="diwali-plan__report">{t('What we’d report: collection visits, product views, enquiries and orders.', 'ما سنقدمه من نتائج: زيارات المجموعة، مشاهدات المنتجات، الاستفسارات والطلبات.')}</p>
    </section>
  );
}

export default function DiwaliBikanervala() {
  const { ar, t } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const known = (id: unknown): id is string => typeof id === 'string' && DIWALI_GIFTS.some((gift) => gift.id === id);

  // The shortlist and notes stay on this device.
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(SHORTLIST_KEY) ?? '[]');
      if (Array.isArray(list)) setSaved(list.filter(known));
    } catch { /* Storage unavailable or damaged. */ }
    try {
      const stored = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}');
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        setNotes(Object.fromEntries(Object.entries(stored).filter(([id, note]) => known(id) && typeof note === 'string')) as Record<string, string>);
      }
    } catch { /* Storage unavailable or damaged. */ }
  }, []);

  const saveList = (list: string[]) => {
    setSaved(list);
    try { localStorage.setItem(SHORTLIST_KEY, JSON.stringify(list)); } catch { /* Private browsing may block storage. */ }
  };
  const toggle = (id: string) => saveList(saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]);
  const setNote = (id: string, value: string) => setNotes((current) => {
    const next = { ...current, [id]: value };
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(next)); } catch { /* Private browsing may block storage. */ }
    return next;
  });

  const gift = openId ? ORDERED.find((item) => item.id === openId) ?? null : null;
  const items = saved.map((id) => ORDERED.find((item) => item.id === id)).filter((item): item is DiwaliGift => Boolean(item));

  useEffect(() => {
    if (!gift && !reviewOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [gift, reviewOpen]);

  // Lifts the floating WhatsApp button above the shortlist bar.
  useEffect(() => {
    document.body.classList.toggle('has-diwali-bar', saved.length > 0);
    return () => document.body.classList.remove('has-diwali-bar');
  }, [saved.length]);

  const card = (item: DiwaliGift, large = false) => (
    <Card key={item.id} gift={item} large={large} saved={saved.includes(item.id)} onOpen={() => setOpenId(item.id)} onToggle={() => toggle(item.id)} />
  );

  return (
    <>
      <section className="diwali-hero" aria-labelledby="diwali-title">
        <div className="diwali-hero__copy">
          <div className="breadcrumbs">
            <Link href="/">{t('Home', 'الرئيسية')}</Link>
            <span>/</span>
            <span>{t('Diwali', 'ديوالي')}</span>
          </div>
          <Lockup />
          <h1 id="diwali-title">{t('Maison Botanique flowers, Bikanervala sweets, one Diwali gift.', 'زهور ميزون بوتانيك وحلويات بيكانيرفالا في هدية واحدة لديوالي.')}</h1>
          <a className="arrow-link" href="#lead-ideas">{t('Explore the ideas', 'استكشف الأفكار')} <span aria-hidden="true">↘</span></a>
        </div>
        <div className="diwali-hero__media"><ConceptImage gift={DIWALI_GIFTS[0]} large eager /></div>
      </section>

      <SectionNav count={saved.length} onReview={() => setReviewOpen(true)} />

      <section id="lead-ideas" className="diwali-leads" aria-labelledby="diwali-leads-title">
        <div className="diwali-section-heading">
          <p className="eyebrow">{t('Start the conversation', 'لنبدأ الحوار')}</p>
          <h2 id="diwali-leads-title">{t(<>The ideas to <em>put on the table.</em></>, <>الأفكار التي <em>نضعها على الطاولة.</em></>)}</h2>
          <p>{t('These directions make the partnership easy to picture. Some use standard sweet packs; the sculptural formats need a packaging prototype together.',
            'تساعد هذه الأفكار على تخيّل الشراكة. بعضها يستخدم عبوات الحلوى المعتادة، بينما تتطلب الأشكال الفنية نموذج تغليف نطوره معاً.')}</p>
        </div>
        <p className="diwali-hint">{t('Tap any idea to open it. Use ♡ to build a shortlist, and the arrows (or a swipe) to move between ideas.',
          'اضغط على أي فكرة لفتحها. استخدم ♡ لبناء قائمة مختصرة، والأسهم (أو السحب) للتنقل بين الأفكار.')}</p>
        {DIWALI_LEAD_GROUPS.map((group) => (
          <div key={group.id} id={`diwali-s-${group.id}`} className="diwali-leads__group">
            <div className="diwali-leads__label">
              <div><h3>{ar ? group.title.ar : group.title.en}</h3><p>{ar ? group.note.ar : group.note.en}</p></div>
            </div>
            <div className="diwali-grid diwali-grid--lead">{DIWALI_GIFTS.filter((item) => item.group === group.id).map((item) => card(item, true))}</div>
          </div>
        ))}
      </section>

      <section className="diwali-ideas" aria-labelledby="diwali-ideas-title">
        <SectionHeading eyebrow={t('Explore further', 'المزيد من الأفكار')}
          title={<span id="diwali-ideas-title">{t(<>More ways to <em>give together.</em></>, <>طرق أخرى <em>للإهداء معاً.</em></>)}</span>} />
        {DIWALI_GROUPS.map((group) => (
          <section key={group.id} id={`diwali-s-${group.id}`} className="diwali-ideas__group" aria-labelledby={`diwali-group-${group.id}`}>
            <div className="diwali-ideas__heading">
              <span>{group.letter}</span>
              <div><h3 id={`diwali-group-${group.id}`}>{ar ? group.title.ar : group.title.en}</h3><p>{ar ? group.note.ar : group.note.en}</p></div>
            </div>
            <div className="diwali-grid">{DIWALI_GIFTS.filter((item) => item.group === group.id).map((item) => card(item))}</div>
          </section>
        ))}
      </section>

      <Packaging />
      <Plan />

      <div className="diwali-ending">
        <Lockup />
        <p>{t('Prepared by Maison Botanique for a conversation with Bikanervala. Product selection, packaging, availability and commercial terms await agreement.',
          'أعدّته ميزون بوتانيك للنقاش مع بيكانيرفالا. اختيار المنتجات والتغليف والتوفر والشروط التجارية بانتظار الاتفاق.')}</p>
        <p>{t('These gifts are not yet for sale.', 'هذه الهدايا غير متاحة للبيع بعد.')}</p>
      </div>

      {saved.length > 0 && (
        <aside className="diwali-shortlist" aria-label={t('Meeting shortlist', 'القائمة المختصرة للاجتماع')}>
          <div>
            <strong>♥ {t('Shortlist', 'القائمة المختصرة')}</strong>
            <div className="diwali-shortlist__items">
              {items.map((item) => <button key={item.id} type="button" onClick={() => setOpenId(item.id)}>{ar ? item.name.ar : item.name.en}</button>)}
            </div>
          </div>
          <span className="diwali-shortlist__actions">
            <button type="button" className="diwali-shortlist__review" onClick={() => setReviewOpen(true)}>{t('Review', 'مراجعة')}</button>
            <button type="button" className="diwali-shortlist__clear" onClick={() => saveList([])}>{t('Clear', 'مسح')}</button>
          </span>
        </aside>
      )}

      <IdeaDialog gift={gift} onClose={() => setOpenId(null)}
        onStep={(direction) => {
          if (!gift) return;
          const index = ORDERED.findIndex((item) => item.id === gift.id);
          setOpenId(ORDERED[(index + direction + ORDERED.length) % ORDERED.length].id);
        }}
        saved={Boolean(gift) && saved.includes(gift!.id)} onToggle={() => { if (gift) toggle(gift.id); }}
        note={gift ? notes[gift.id] ?? '' : ''} onNote={(value) => { if (gift) setNote(gift.id, value); }} />
      <ReviewDialog open={reviewOpen} onClose={() => setReviewOpen(false)} items={items} notes={notes} onNote={setNote}
        onRemove={(id) => saveList(saved.filter((item) => item !== id))} onOpenIdea={(id) => { setReviewOpen(false); setOpenId(id); }} onClear={() => saveList([])} />
    </>
  );
}
