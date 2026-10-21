'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackProductClicked, trackProductListViewed, trackProductsSearched } from '@/lib/analytics/track';
import { BUDGET_BANDS, GROUP_ALIASES, TAB_IDS, budgetOf, liveCatalogGroups, type LiveCatalogGroups } from '@/lib/catalog-groups';
import type { Product } from '@/lib/types';
import { useStore } from './StoreProvider';
import { isMostLoved } from '@/lib/most-loved';
import { occasionHash } from '@/lib/site';
import { imageAt, imageSrcSet } from '@/lib/images';
import { useAfterLoad } from '@/lib/use-after-load';
import SaleTag from './SaleTag';
import Money from './Money';

const PAGE = 24;
/** List and search events wait until the visitor stops typing or clicking. */
const SETTLE_MS = 900;

const STEMS = [
  { id: 's1', test: (n: number | null) => n != null && n <= 25 }, { id: 's2', test: (n: number | null) => n != null && n > 25 && n <= 60 },
  { id: 's3', test: (n: number | null) => n != null && n > 60 },
] as const;
const SORTS = ['featured', 'low', 'high'] as const;
type Sort = typeof SORTS[number];
type StemsId = typeof STEMS[number]['id'];

interface State { group: string; occasion: string[]; budget: string[]; stems: string[]; query: string }
const EMPTY: State = { group: 'all', occasion: [], budget: [], stems: [], query: '' };

const COPY = {
  en: {
    title: 'The Collection',
    search: 'Search the collection', searchPlaceholder: 'Search roses, lilies, birthday…',
    shopBy: 'Shop by occasion', refine: 'Refine', sort: 'Sort', clear: 'Clear all', close: 'Close',
    show: 'Show pieces',
    sorts: { featured: 'Featured', low: 'Price, low to high', high: 'Price, high to low' },
    groups: { occasion: 'Occasion', budget: 'Budget, AED', stems: 'Number of stems' },
    stems: { s1: 'Up to 25', s2: '26 – 60', s3: 'More than 60' },
    personalised: 'Personalised', from: 'From', sizes: 'sizes', add: 'Add', addFull: 'Add to bag', was: 'was',
    more: 'Show more', soldOut: 'Sold out',
    empty: 'Nothing matches all of that yet.', reset: 'Clear the refinements',
  },
  ar: {
    title: 'المجموعة',
    search: 'ابحث في المجموعة', searchPlaceholder: 'ابحث عن ورود، زنبق، عيد ميلاد…',
    shopBy: 'تسوّق حسب المناسبة', refine: 'تصفية', sort: 'ترتيب', clear: 'مسح الكل', close: 'إغلاق',
    show: 'اعرض القطع',
    sorts: { featured: 'مختارات', low: 'السعر من الأقل', high: 'السعر من الأعلى' },
    groups: { occasion: 'المناسبة', budget: 'الميزانية بالدرهم', stems: 'عدد السيقان' },
    stems: { s1: 'حتى 25', s2: '26 – 60', s3: 'أكثر من 60' },
    personalised: 'مخصص', from: 'من', sizes: 'أحجام', add: 'أضف', addFull: 'أضف إلى الحقيبة', was: 'بدلاً من',
    more: 'اعرض المزيد', soldOut: 'نفدت الكمية',
    empty: 'لا توجد قطع تطابق كل هذه الخيارات.', reset: 'امسح الخيارات',
  },
};
type Copy = typeof COPY.en;

const fmt = (value: number, ar: boolean) => new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE', { maximumFractionDigits: 0 }).format(value);
const bandLabel = (id: string, ar: boolean) => { const band = BUDGET_BANDS.find((item) => item.id === id); return band ? (ar ? band.ar : band.en) : id; };
const stemsOf = (p: Product) => STEMS.find((s) => s.test(p.stems))?.id;

function matches(p: Product, state: State, catalog: LiveCatalogGroups, skip?: 'occasion' | 'budget' | 'stems') {
  const group = catalog.findGroup(state.group);
  if (group && !group.test(p)) return false;
  if (skip !== 'occasion' && state.occasion.length && !p.occasions.some((o) => state.occasion.includes(o))) return false;
  if (skip !== 'budget' && state.budget.length && !state.budget.includes(budgetOf(p.price) ?? '')) return false;
  if (skip !== 'stems' && state.stems.length && !state.stems.includes(stemsOf(p) ?? '')) return false;
  if (state.query) {
    const hay = [p.name, p.nameAr, p.line, p.lineAr, ...p.composition, ...p.compositionAr, p.category, p.categoryAr, ...p.occasions].join(' ').toLowerCase();
    if (!state.query.toLowerCase().split(/\s+/).every((word) => hay.includes(word))) return false;
  }
  return true;
}

/** Shareable links: #roses, #occasion/birthday, #search. */
function stateFromHash(hash: string, catalog: LiveCatalogGroups): State | null {
  const value = decodeURIComponent((hash || '').replace(/^#/, ''));
  if (value.startsWith('occasion/')) {
    const id = value.slice(9) === 'gifts-for-her' ? 'just-because' : value.slice(9);
    return catalog.occasions.some((o) => o.id === id) ? { ...EMPTY, occasion: [id] } : null;
  }
  if (value.startsWith('budget/')) {
    const id = value.slice(7);
    return BUDGET_BANDS.some((band) => band.id === id) ? { ...EMPTY, budget: [id] } : null;
  }
  const id = GROUP_ALIASES[value] || value;
  return catalog.findGroup(id) ? { ...EMPTY, group: id } : null;
}

function RefineDrawer({ open, onClose, state, setState, products, catalog, t, ar }: {
  open: boolean; onClose: () => void; state: State; setState: (fn: (s: State) => State) => void;
  products: Product[]; catalog: LiveCatalogGroups; t: Copy; ar: boolean;
}) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('button')?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;

  type GroupKey = 'occasion' | 'budget' | 'stems';
  const toggle = (group: GroupKey, id: string) => setState((s) => ({ ...s, [group]: s[group].includes(id) ? s[group].filter((x) => x !== id) : [...s[group], id] }));
  const count = (group: GroupKey, test: (p: Product) => boolean) => products.filter((p) => matches(p, state, catalog, group) && test(p)).length;
  const groups: Array<[GroupKey, Array<[string, string, (p: Product) => boolean]>]> = [
    ['occasion', catalog.occasions.map((o) => [o.id, ar ? o.ar : o.en, (p: Product) => p.occasions.includes(o.id)])],
    ['budget', BUDGET_BANDS.map((b) => [b.id, ar ? b.ar : b.en, (p: Product) => budgetOf(p.price) === b.id])],
    ['stems', STEMS.map((s) => [s.id, t.stems[s.id as StemsId], (p: Product) => stemsOf(p) === s.id])],
  ];

  return (
    <div className="mbc-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="mbc-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-label={t.refine} dir={ar ? 'rtl' : 'ltr'}>
        <div className="mbc-drawer-head"><span className="mbc-sc">{t.refine}</span><button type="button" className="mbc-sc" onClick={onClose}>{t.close}</button></div>
        <div className="mbc-drawer-body">
          {groups.map(([group, options]) => (
            <div className="mbc-fgroup" key={group}>
              <h3 className="mbc-sc">{t.groups[group]}</h3>
              <div className="mbc-opts">{options.map(([id, label, test]) => {
                const n = count(group, test);
                const on = state[group].includes(id);
                return <button type="button" key={id} className="mbc-opt" aria-pressed={on} disabled={!n && !on} onClick={() => toggle(group, id)}><span>{label}</span></button>;
              })}</div>
            </div>
          ))}
        </div>
        <div className="mbc-drawer-foot">
          <button type="button" className="mbc-solid" onClick={onClose}>{t.show}</button>
          <button type="button" className="mbc-ghost" onClick={() => setState((s) => ({ ...s, occasion: [], budget: [], stems: [] }))}>{t.clear}</button>
        </div>
      </aside>
    </div>
  );
}

/** Grid photos: two columns on phones, three on tablets, four on desktop. */
const PIECE_WIDTHS = [240, 360, 480, 720, 960];
const PIECE_SIZES = '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw';

function Piece({ product, index, eager, t, ar, onOpen }: { product: Product; index: number; eager: boolean; t: Copy; ar: boolean; onOpen: (product: Product, position: number) => void }) {
  const name = ar ? product.nameAr : product.name;
  // Photos past the first row wait for the page to load (see useAfterLoad).
  const show = useAfterLoad() || eager;
  const many = product.sizes.length > 1;
  return (
    <article className="mbc-piece">
      <button type="button" className="mbc-frame" onClick={() => onOpen(product, index + 1)} aria-label={name}>
        <img src={show ? imageAt(product.image, 480) : undefined} srcSet={show ? imageSrcSet(product.image, PIECE_WIDTHS) : undefined} sizes={PIECE_SIZES}
          alt={show ? (ar ? name : product.imageAlt) : ''} width="480" height="480"
          loading={eager ? 'eager' : 'lazy'} fetchPriority={eager && index === 0 ? 'high' : 'auto'} decoding="async" />
        {isMostLoved(product.id) ? <span className="mbc-badge mbc-badge--loved">{ar ? 'الأكثر حباً' : 'Most loved'}</span>
          : product.custom && <span className="mbc-badge">{t.personalised}</span>}
      </button>
      <div className="mbc-cap">
        <h3><button type="button" onClick={() => onOpen(product, index + 1)}>{name}</button></h3>
        <span className="mbc-line">{ar ? product.lineAr : product.line}</span>
        <SaleTag className="mbc-sale" price={product.price} compareAtPrice={product.compareAtPrice} />
        <div className="mbc-row">
          <span className="mbc-price">
            {many && <small>{t.from} </small>}<Money amount={product.price} ar={ar} whole />
            {product.compareAtPrice && <s aria-label={`${t.was} AED ${fmt(product.compareAtPrice, ar)}`}>{fmt(product.compareAtPrice, ar)}</s>}
          </span>
          <button type="button" className="mbc-add" onClick={() => onOpen(product, index + 1)} disabled={!product.available}
            aria-label={`${t.addFull}: ${name}`}>{product.available ? <>{t.add} <span aria-hidden="true">+</span></> : t.soldOut}</button>
        </div>
      </div>
    </article>
  );
}

/**
 * The collection: occasion tiles, tabs, search, a Refine drawer (occasion,
 * budget, stems), sorting and a grid that loads 24 at a time. Every piece
 * opens the quick-add sheet.
 */
export default function CollectionBrowser({ listId = 'home', initialOccasion, showOccasions = true, eagerImages = 0 }: {
  listId?: string; initialOccasion?: string; showOccasions?: boolean;
  /** Grid photos loaded straight away: the first row when the grid starts on screen, none below the home hero. */
  eagerImages?: number;
}) {
  const { ar, live, products, openProduct } = useStore();
  const t = COPY[ar ? 'ar' : 'en'];
  const catalog = useMemo(() => liveCatalogGroups(products), [products]);
  const [state, setState] = useState<State>(() => (initialOccasion ? { ...EMPTY, occasion: [initialOccasion] } : EMPTY));
  const [sort, setSort] = useState<Sort>('featured');
  const [shown, setShown] = useState(PAGE);
  const [refineOpen, setRefineOpen] = useState(false);
  const afterLoad = useAfterLoad();
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const roomsRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeRefine = useCallback(() => setRefineOpen(false), []);
  const refineState = useCallback((fn: (s: State) => State) => { setState(fn); setShown(PAGE); }, []);

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollToGrid = useCallback(() => {
    requestAnimationFrame(() => roomsRef.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }));
  }, []);

  // Header links, footer links and shared URLs all arrive as hash changes.
  useEffect(() => {
    if (initialOccasion) return undefined;
    const apply = () => {
      if (window.location.hash === '#search') {
        sectionRef.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        window.setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 400);
        return;
      }
      if (window.location.hash === '#shop') { scrollToGrid(); return; }
      const next = stateFromHash(window.location.hash, catalog);
      if (!next) return;
      setState(next);
      setShown(PAGE);
      scrollToGrid();
    };
    const timer = stateFromHash(window.location.hash, catalog) || ['#search', '#shop'].includes(window.location.hash)
      ? window.setTimeout(apply, 600) : 0;
    window.addEventListener('hashchange', apply);
    return () => { window.clearTimeout(timer); window.removeEventListener('hashchange', apply); };
  }, [catalog, scrollToGrid, initialOccasion]);

  // The phone Refine/Sort bar only appears while the collection is on screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '-35% 0px -25% 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const setHash = (hash: string) => { if (!initialOccasion) history.replaceState(null, '', hash); };
  const setGroup = (group: string) => {
    setState((s) => ({ ...s, group }));
    setShown(PAGE);
    setHash(group === 'all' ? '#shop' : `#${group}`);
  };
  const setOccasion = (id: string) => {
    const on = state.occasion.length === 1 && state.occasion[0] === id;
    setState((s) => ({ ...s, occasion: on ? [] : [id] }));
    setShown(PAGE);
    setHash(on ? '#shop' : `#${occasionHash(id)}`);
    scrollToGrid();
  };

  // The main tabs, plus the current group when it came from the menu (e.g. Lilies).
  const tabs = useMemo(() => {
    const ids = TAB_IDS.filter((id) => catalog.findGroup(id));
    if (!ids.includes(state.group) && catalog.findGroup(state.group)) ids.push(state.group);
    return ids.map((id) => catalog.findGroup(id)!);
  }, [catalog, state.group]);
  const currentGroup = catalog.findGroup(state.group);
  // Each occasion tile gets its own photo: the first matching piece not already used.
  const occasionTiles = useMemo(() => {
    const used = new Set<string>();
    return catalog.occasions.map((o) => {
      const items = products.filter((p) => p.occasions.includes(o.id));
      const pick = items.find((p) => !used.has(p.id)) ?? items[0];
      if (pick) used.add(pick.id);
      return { ...o, image: pick?.imageSmall };
    });
  }, [catalog, products]);
  const list = useMemo(() => {
    const filtered = products.filter((p) => matches(p, state, catalog));
    const by = { featured: (a: Product, b: Product) => a.order - b.order, low: (a: Product, b: Product) => a.price - b.price, high: (a: Product, b: Product) => b.price - a.price }[sort];
    return filtered.sort(by);
  }, [products, state, sort, catalog]);
  const refinements = state.occasion.length + state.budget.length + state.stems.length;
  const visible = list.slice(0, shown);
  const nextSort = () => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]);
  const occasionLabel = (id: string) => { const o = catalog.occasions.find((x) => x.id === id); return o ? (ar ? o.ar : o.en) : id; };
  const chips: Array<['occasion' | 'budget' | 'stems', string, string]> = [
    ...state.occasion.map((id): ['occasion', string, string] => ['occasion', id, occasionLabel(id)]),
    ...state.budget.map((id): ['budget', string, string] => ['budget', id, bandLabel(id, ar)]),
    ...state.stems.map((id): ['stems', string, string] => ['stems', id, t.stems[id as StemsId]]),
  ];

  // Analytics: one list view per settled filter state; searches once the visitor stops typing.
  const listContext = useMemo(() => ({ listId: state.group === 'all' ? listId : `${listId}:${state.group}`, filters: { group: state.group, occasion: state.occasion, budget: state.budget, stems: state.stems, sort, search: state.query || null } }), [listId, state, sort]);
  const listKey = `${JSON.stringify(listContext)}|${list.length}`;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      trackProductListViewed(listContext, list);
      if (state.query.trim()) trackProductsSearched(state.query.trim(), list.length, listContext.listId);
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
    // `listKey` captures the filters, sort, query and result count.
  }, [listKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (product: Product, position: number) => {
    trackProductClicked(product, listContext, position);
    openProduct(product);
  };

  return (
    <section className="mbc" id="shop" ref={sectionRef} aria-labelledby="mbc-title" data-track-section={`${listId}_collection`}>
      <div className="mbc-in mbc-head">
        <div className="mbc-head-title">
          <h2 id="mbc-title">{currentGroup && currentGroup.id !== 'all' ? (ar ? currentGroup.ar : currentGroup.en) : t.title}</h2>
        </div>
        <label className="mbc-search"><span className="mbc-sr">{t.search}</span>
          <input ref={searchRef} type="search" value={state.query} placeholder={t.searchPlaceholder}
            onChange={(event) => { const query = event.target.value; setState((s) => ({ ...s, query })); setShown(PAGE); }} />
        </label>
      </div>

      {showOccasions && <div className="mbc-in">
        <h3 className="mbc-sc mbc-occ-title">{t.shopBy}</h3>
        <div className="mbc-occasions">{occasionTiles.map((o) => {
          const on = state.occasion.length === 1 && state.occasion[0] === o.id;
          return (
            <button type="button" key={o.id} className="mbc-occ" aria-pressed={on} onClick={() => setOccasion(o.id)}>
              <span className="mbc-occ-img">{o.image && afterLoad && <img src={imageAt(o.image, 240)} alt="" loading="lazy" width="96" height="96" />}</span>
              <span className="mbc-occ-name">{ar ? o.ar : o.en}</span>
            </button>
          );
        })}</div>
      </div>}

      <nav className="mbc-rooms" ref={roomsRef} aria-label={t.title}>
        <div className="mbc-in mbc-rooms-in">
          <div className="mbc-room-list">{tabs.map((g) => (
            <button type="button" key={g.id} className="mbc-room" aria-pressed={state.group === g.id} onClick={() => setGroup(g.id)}>{ar ? g.ar : g.en}</button>
          ))}</div>
          <div className="mbc-tools">
            <button type="button" onClick={() => setRefineOpen(true)}>{t.refine}{refinements ? <span className="mbc-n"> ({fmt(refinements, ar)})</span> : null}</button>
            <button type="button" onClick={nextSort}>{t.sort} · {t.sorts[sort]}</button>
          </div>
        </div>
      </nav>

      <div className="mbc-in mbc-body">
        <div className="mbc-active" aria-live="polite">
          {chips.map(([group, id, label]) => (
            <button type="button" key={`${group}-${id}`} onClick={() => { setState((s) => ({ ...s, [group]: s[group].filter((x) => x !== id) })); if (group === 'occasion') setHash('#shop'); }}>{label}</button>
          ))}
        </div>
        <div className="mbc-grid">
          {visible.length ? visible.map((product, index) => <Piece key={product.id} product={product} index={index} eager={index < eagerImages} t={t} ar={ar} onOpen={open} />)
            : <div className="mbc-empty">{t.empty}<button type="button" onClick={() => setState(EMPTY)}>{t.reset}</button></div>}
        </div>
        {list.length > 0 && (
          <div className="mbc-more">
            <div className="mbc-bar"><i style={{ width: `${Math.min(100, (visible.length / list.length) * 100)}%` }} /></div>
            {visible.length < list.length && <button type="button" className="mbc-go" onClick={() => setShown((n) => n + PAGE)}>{t.more}</button>}
          </div>
        )}
      </div>

      <div className={`mbc-mbar${inView && !refineOpen ? ' is-on' : ''}`}>
        <button type="button" onClick={() => setRefineOpen(true)}>{t.refine}{refinements ? ` (${fmt(refinements, ar)})` : ''}</button>
        <button type="button" onClick={nextSort}>{t.sort} · {t.sorts[sort]}</button>
      </div>

      <RefineDrawer open={refineOpen} onClose={closeRefine} state={state} setState={refineState} products={products} catalog={catalog} t={t} ar={ar} />
    </section>
  );
}
