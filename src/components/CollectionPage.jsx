import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { liveGroups, liveOccasions, findGroup, TAB_IDS, GROUP_ALIASES } from '../data/catalog.js';
import '../styles/collection.css';

const PAGE = 24;

const BUDGETS = [
  { id: 'b1', test: (v) => v < 300 }, { id: 'b2', test: (v) => v >= 300 && v < 500 },
  { id: 'b3', test: (v) => v >= 500 && v < 1000 }, { id: 'b4', test: (v) => v >= 1000 },
];
const STEMS = [
  { id: 's1', test: (n) => n != null && n <= 25 }, { id: 's2', test: (n) => n != null && n > 25 && n <= 60 },
  { id: 's3', test: (n) => n != null && n > 60 },
];
const SORTS = ['featured', 'low', 'high'];
const EMPTY = { group: 'all', occasion: [], budget: [], stems: [], query: '' };

const COPY = {
  en: {
    title: 'The Collection', sample: 'Sample prices',
    search: 'Search the collection', searchPlaceholder: 'Search roses, lilies, birthday…',
    shopBy: 'Shop by occasion', refine: 'Refine', sort: 'Sort', clear: 'Clear all', close: 'Close',
    show: 'Show pieces',
    sorts: { featured: 'Featured', low: 'Price, low to high', high: 'Price, high to low' },
    groups: { occasion: 'Occasion', budget: 'Budget, AED', stems: 'Number of stems' },
    budgets: { b1: 'Under 300', b2: '300 – 500', b3: '500 – 1,000', b4: '1,000 and above' },
    stems: { s1: 'Up to 25', s2: '26 – 60', s3: 'More than 60' },
    personalised: 'Personalised', from: 'From', sizes: 'sizes', add: 'Add', addFull: 'Add to bag',
    more: 'Show more',
    empty: 'Nothing matches all of that yet.', reset: 'Clear the refinements',
    trust: ['Hand-tied in Dubai', 'A handwritten card with every gift', 'Delivering across Dubai · free in JVC', 'No prices travel with the gift'],
  },
  ar: {
    title: 'المجموعة', sample: 'أسعار تجريبية',
    search: 'ابحث في المجموعة', searchPlaceholder: 'ابحث عن ورود، زنبق، عيد ميلاد…',
    shopBy: 'تسوّق حسب المناسبة', refine: 'تصفية', sort: 'ترتيب', clear: 'مسح الكل', close: 'إغلاق',
    show: 'اعرض القطع',
    sorts: { featured: 'مختارات', low: 'السعر من الأقل', high: 'السعر من الأعلى' },
    groups: { occasion: 'المناسبة', budget: 'الميزانية بالدرهم', stems: 'عدد السيقان' },
    budgets: { b1: 'أقل من 300', b2: '300 – 500', b3: '500 – 1,000', b4: '1,000 فأكثر' },
    stems: { s1: 'حتى 25', s2: '26 – 60', s3: 'أكثر من 60' },
    personalised: 'مخصص', from: 'من', sizes: 'أحجام', add: 'أضف', addFull: 'أضف إلى الحقيبة',
    more: 'اعرض المزيد',
    empty: 'لا توجد قطع تطابق كل هذه الخيارات.', reset: 'امسح الخيارات',
    trust: ['تُنسَّق يدوياً في دبي', 'بطاقة بخط اليد مع كل هدية', 'التوصيل في دبي · مجاناً في JVC', 'لا تُرفق الأسعار مع الهدية'],
  },
};

const fmt = (value, ar) => new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE', { maximumFractionDigits: 0 }).format(value);
const budgetOf = (p) => BUDGETS.find((b) => b.test(p.price))?.id;
const stemsOf = (p) => STEMS.find((s) => s.test(p.stems))?.id;

function matches(p, state, skip) {
  const group = findGroup(state.group);
  if (group && !group.test(p)) return false;
  if (skip !== 'occasion' && state.occasion.length && !p.occasions.some((o) => state.occasion.includes(o))) return false;
  if (skip !== 'budget' && state.budget.length && !state.budget.includes(budgetOf(p))) return false;
  if (skip !== 'stems' && state.stems.length && !state.stems.includes(stemsOf(p))) return false;
  if (state.query) {
    const hay = [p.name, p.nameAr, p.line, p.lineAr, ...p.composition, ...p.compositionAr, p.category, p.categoryAr, ...p.occasions].join(' ').toLowerCase();
    if (!state.query.toLowerCase().split(/\s+/).every((word) => hay.includes(word))) return false;
  }
  return true;
}

// Shareable links: #roses, #occasion/birthday, #search. No separate pages.
function stateFromHash(hash) {
  const value = decodeURIComponent((hash || '').replace(/^#/, ''));
  if (value.startsWith('occasion/')) {
    const id = value.slice(9);
    return liveOccasions.some((o) => o.id === id) ? { ...EMPTY, occasion: [id] } : null;
  }
  const id = GROUP_ALIASES[value] || value;
  return findGroup(id) ? { ...EMPTY, group: id } : null;
}

function RefineDrawer({ open, onClose, state, setState, products, t, ar }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('button')?.focus();
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;

  const toggle = (group, id) => setState((s) => ({ ...s, [group]: s[group].includes(id) ? s[group].filter((x) => x !== id) : [...s[group], id] }));
  const count = (group, test) => products.filter((p) => matches(p, state, group) && test(p)).length;
  const groups = [
    ['occasion', liveOccasions.map((o) => [o.id, ar ? o.ar : o.en, (p) => p.occasions.includes(o.id)])],
    ['budget', BUDGETS.map((b) => [b.id, t.budgets[b.id], (p) => budgetOf(p) === b.id])],
    ['stems', STEMS.map((s) => [s.id, t.stems[s.id], (p) => stemsOf(p) === s.id])],
  ];

  return <div className="mbc-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="mbc-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-label={t.refine} dir={ar ? 'rtl' : 'ltr'}>
      <div className="mbc-drawer-head"><span className="mbc-sc">{t.refine}</span><button type="button" className="mbc-sc" onClick={onClose}>{t.close}</button></div>
      <div className="mbc-drawer-body">
        {groups.map(([group, options]) => <div className="mbc-fgroup" key={group}>
          <h3 className="mbc-sc">{t.groups[group]}</h3>
          <div className="mbc-opts">{options.map(([id, label, test]) => {
            const n = count(group, test);
            const on = state[group].includes(id);
            return <button type="button" key={id} className="mbc-opt" aria-pressed={on} disabled={!n && !on} onClick={() => toggle(group, id)}>
              <span>{label}</span>
            </button>;
          })}</div>
        </div>)}
      </div>
      <div className="mbc-drawer-foot">
        <button type="button" className="mbc-solid" onClick={onClose}>{t.show}</button>
        <button type="button" className="mbc-ghost" onClick={() => setState((s) => ({ ...s, occasion: [], budget: [], stems: [] }))}>{t.clear}</button>
      </div>
    </aside>
  </div>;
}

function Piece({ product, index, t, ar, onOpen }) {
  const name = ar ? product.nameAr : product.name;
  const many = product.sizes.length > 1;
  return <article className="mbc-piece">
    <button type="button" className="mbc-frame" onClick={() => onOpen(product)} aria-label={name}>
      <img src={product.imageSmall} srcSet={`${product.imageSmall} 480w, ${product.image} 960w`}
        sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
        alt={ar ? name : product.alt} width="480" height="480"
        loading={index < 4 ? 'eager' : 'lazy'} fetchPriority={index < 4 ? 'high' : 'auto'} decoding="async" />
      {product.custom && <span className="mbc-badge">{t.personalised}</span>}
    </button>
    <div className="mbc-cap">
      <h3><button type="button" onClick={() => onOpen(product)}>{name}</button></h3>
      <span className="mbc-line">{ar ? product.lineAr : product.line}</span>
      <div className="mbc-row">
        <span className="mbc-price"><small>{many ? `${t.from} ` : ''}AED</small> {fmt(product.price, ar)}{many && <em> · {fmt(product.sizes.length, ar)} {t.sizes}</em>}</span>
        <button type="button" className="mbc-add" onClick={() => onOpen(product)} aria-label={`${t.addFull}: ${name}`}>{t.add} <span aria-hidden="true">+</span></button>
      </div>
    </div>
  </article>;
}

export default function CollectionPage({ products = [], locale = 'en', onProductClick }) {
  const ar = locale === 'ar';
  const t = COPY[ar ? 'ar' : 'en'];
  const [state, setState] = useState(() => stateFromHash(typeof window !== 'undefined' ? window.location.hash : '') || EMPTY);
  const [sort, setSort] = useState('featured');
  const [shown, setShown] = useState(PAGE);
  const [refineOpen, setRefineOpen] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);
  const roomsRef = useRef(null);
  const searchRef = useRef(null);
  const closeRefine = useCallback(() => setRefineOpen(false), []);
  const refineState = useCallback((fn) => { setState(fn); setShown(PAGE); }, []);

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollToGrid = useCallback(() => {
    requestAnimationFrame(() => roomsRef.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }));
  }, []);

  // Header links, footer links and shared URLs all arrive as hash changes.
  useEffect(() => {
    const apply = () => {
      if (window.location.hash === '#search') {
        sectionRef.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 400);
        return;
      }
      const next = stateFromHash(window.location.hash);
      if (!next) return;
      setState(next);
      setShown(PAGE);
      scrollToGrid();
    };
    if (stateFromHash(window.location.hash) || window.location.hash === '#search') setTimeout(apply, 600);
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [scrollToGrid]);

  // The phone Refine/Sort bar only appears while the collection is on screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '-35% 0px -25% 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const setGroup = (group) => {
    setState((s) => ({ ...s, group }));
    setShown(PAGE);
    history.replaceState(null, '', group === 'all' ? '#shop' : `#${group}`);
  };
  const setOccasion = (id) => {
    const on = state.occasion.length === 1 && state.occasion[0] === id;
    setState((s) => ({ ...s, occasion: on ? [] : [id] }));
    setShown(PAGE);
    history.replaceState(null, '', on ? '#shop' : `#occasion/${id}`);
    scrollToGrid();
  };

  // The main tabs, plus the current group when it came from the menu (e.g. Lilies).
  const tabs = useMemo(() => {
    const ids = TAB_IDS.filter((id) => findGroup(id));
    if (!ids.includes(state.group) && findGroup(state.group)) ids.push(state.group);
    return ids.map(findGroup);
  }, [state.group]);
  const currentGroup = findGroup(state.group);
  // Each occasion tile gets its own photo: the first matching piece not already used.
  const occasionTiles = useMemo(() => {
    const used = new Set();
    return liveOccasions.map((o) => {
      const items = products.filter((p) => p.occasions.includes(o.id));
      const pick = items.find((p) => !used.has(p.id)) || items[0];
      if (pick) used.add(pick.id);
      return { ...o, count: items.length, image: pick?.imageSmall };
    });
  }, [products]);
  const list = useMemo(() => {
    const filtered = products.filter((p) => matches(p, state));
    const by = { featured: (a, b) => a.order - b.order, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price }[sort];
    return filtered.sort(by);
  }, [products, state, sort]);
  const refinements = state.occasion.length + state.budget.length + state.stems.length;
  const visible = list.slice(0, shown);
  const nextSort = () => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]);
  const occasionLabel = (id) => { const o = liveOccasions.find((x) => x.id === id); return o ? (ar ? o.ar : o.en) : id; };
  const chips = [
    ...state.occasion.map((id) => ['occasion', id, occasionLabel(id)]),
    ...state.budget.map((id) => ['budget', id, t.budgets[id]]),
    ...state.stems.map((id) => ['stems', id, t.stems[id]]),
  ];

  return <section className="mbc" id="shop" ref={sectionRef} aria-labelledby="mbc-title" dir={ar ? 'rtl' : 'ltr'}>
    <div className="mbc-in mbc-head">
      <div className="mbc-head-title">
        <h2 id="mbc-title">{currentGroup && currentGroup.id !== 'all' ? (ar ? currentGroup.ar : currentGroup.en) : t.title}</h2>
        <span className="mbc-head-count">{t.sample}</span>
      </div>
      <label className="mbc-search"><span className="mbc-sr">{t.search}</span>
        <input ref={searchRef} type="search" value={state.query} placeholder={t.searchPlaceholder}
          onChange={(event) => { const query = event.target.value; setState((s) => ({ ...s, query })); setShown(PAGE); }} />
      </label>
    </div>

    <div className="mbc-in">
      <h3 className="mbc-sc mbc-occ-title">{t.shopBy}</h3>
      <div className="mbc-occasions">{occasionTiles.map((o) => {
        const on = state.occasion.length === 1 && state.occasion[0] === o.id;
        return <button type="button" key={o.id} className="mbc-occ" aria-pressed={on} onClick={() => setOccasion(o.id)}>
          <span className="mbc-occ-img">{o.image && <img src={o.image} alt="" loading="lazy" width="96" height="96" />}</span>
          <span className="mbc-occ-name">{ar ? o.ar : o.en}</span>
        </button>;
      })}</div>
    </div>

    <nav className="mbc-rooms" ref={roomsRef} aria-label={t.title}>
      <div className="mbc-in mbc-rooms-in">
        <div className="mbc-room-list">{tabs.map((g) => <button type="button" key={g.id} className="mbc-room" aria-pressed={state.group === g.id} onClick={() => setGroup(g.id)}>
          {ar ? g.ar : g.en}
        </button>)}</div>
        <div className="mbc-tools">
          <button type="button" onClick={() => setRefineOpen(true)}>{t.refine}{refinements ? <span className="mbc-n"> ({fmt(refinements, ar)})</span> : null}</button>
          <button type="button" onClick={nextSort}>{t.sort} · {t.sorts[sort]}</button>
        </div>
      </div>
    </nav>

    <div className="mbc-in mbc-body">
      <div className="mbc-active" aria-live="polite">
        {chips.map(([group, id, label]) => <button type="button" key={`${group}-${id}`} onClick={() => { setState((s) => ({ ...s, [group]: s[group].filter((x) => x !== id) })); if (group === 'occasion') history.replaceState(null, '', '#shop'); }}>{label}</button>)}
      </div>
      <div className="mbc-grid">
        {visible.length ? visible.map((product, index) => <Piece key={product.id} product={product} index={index} t={t} ar={ar} onOpen={onProductClick} />)
          : <div className="mbc-empty">{t.empty}<button type="button" onClick={() => setState(EMPTY)}>{t.reset}</button></div>}
      </div>
      {list.length > 0 && <div className="mbc-more">
        <div className="mbc-bar"><i style={{ width: `${Math.min(100, (visible.length / list.length) * 100)}%` }} /></div>
        {visible.length < list.length && <button type="button" className="mbc-go" onClick={() => setShown((n) => n + PAGE)}>{t.more}</button>}
      </div>}
    </div>

    <ul className="mbc-trust mbc-in">{t.trust.map((line) => <li key={line}>{line}</li>)}</ul>

    <div className={`mbc-mbar${inView && !refineOpen ? ' is-on' : ''}`}>
      <button type="button" onClick={() => setRefineOpen(true)}>{t.refine}{refinements ? ` (${fmt(refinements, ar)})` : ''}</button>
      <button type="button" onClick={nextSort}>{t.sort} · {t.sorts[sort]}</button>
    </div>

    <RefineDrawer open={refineOpen} onClose={closeRefine} state={state} setState={refineState} products={products} t={t} ar={ar} />
  </section>;
}
