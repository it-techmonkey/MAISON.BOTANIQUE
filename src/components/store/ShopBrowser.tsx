'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { trackProductListViewed, trackProductsSearched } from '@/lib/analytics/track';
import { CATEGORIES, OCCASIONS, categoryIdOf, findOccasion } from '@/lib/site';
import type { Product } from '@/lib/types';
import { SearchIcon } from './icons';
import { ProductCard } from './ProductCard';
import { useStore } from './StoreProvider';
import '@/styles/shop.css';

const SORTS = ['featured', 'price-asc', 'price-desc'] as const;
type Sort = typeof SORTS[number];

interface Filters {
  type: string;
  occasion: string;
  collection: string;
  sort: Sort;
  q: string;
}
const DEFAULTS: Filters = { type: 'all', occasion: 'all', collection: 'all', sort: 'featured', q: '' };

const normalize = (value: string) => value.normalize('NFKD').toLocaleLowerCase();

function searchableText(product: Product) {
  const occasionNames = product.occasions.flatMap((id) => {
    const occasion = findOccasion(id);
    return occasion ? [occasion.name.en, occasion.name.ar] : [id];
  });
  return normalize([product.name, product.nameAr, product.description, product.descriptionAr,
    product.category, product.categoryAr, ...occasionNames].join(' '));
}

/** Shop page: filters live in the URL so results can be shared and survive the back button. */
export function UrlShopBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters: Filters = {
    type: params.get('type') ?? DEFAULTS.type,
    occasion: params.get('occasion') ?? DEFAULTS.occasion,
    collection: params.get('collection') ?? DEFAULTS.collection,
    sort: (params.get('sort') as Sort) ?? DEFAULTS.sort,
    q: params.get('q') ?? DEFAULTS.q,
  };
  const update = (next: Partial<Filters>) => {
    const search = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === DEFAULTS[key as keyof Filters]) search.delete(key);
      else search.set(key, value);
    });
    const query = search.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  return <ShopBrowser listId="shop" filters={filters} onChange={update} onReset={() => router.replace(pathname, { scroll: false })} />;
}

/** Home page: filters change in place, and a capped grid leads to the full shop. */
export function InlineShopBrowser({ limit }: { limit: number }) {
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  return <ShopBrowser listId="home" filters={filters} limit={limit}
    onChange={(next) => setFilters((current) => ({ ...current, ...next }))} onReset={() => setFilters(DEFAULTS)} />;
}

interface ShopBrowserProps {
  /** Analytics list identifier: `shop` or `home`. */
  listId: string;
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onReset: () => void;
  limit?: number;
}

/** Waits for filters and search to settle so each result set is reported once. */
const SETTLE_MS = 900;

function ShopBrowser({ listId, filters, onChange, onReset, limit }: ShopBrowserProps) {
  const { ar, t, products, collections, live } = useStore();
  const [searchText, setSearchText] = useState(filters.q);
  const pick = (value: { en: string; ar: string }) => (ar ? value.ar : value.en);

  const type = CATEGORIES.some((category) => category.id === filters.type) ? filters.type : 'all';
  const occasion = findOccasion(filters.occasion)?.id ?? 'all';
  const collection = collections.find((item) => item.id === filters.collection);
  const sort: Sort = SORTS.includes(filters.sort) ? filters.sort : 'featured';

  const results = useMemo(() => {
    const needle = normalize(filters.q.trim());
    let pool = products;
    if (collection) {
      const byId = new Map(products.map((product) => [product.id, product]));
      pool = collection.productIds.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
    }
    const filtered = pool.filter((product) => (type === 'all' || categoryIdOf(product.category) === type)
      && (occasion === 'all' || product.occasions.includes(occasion))
      && (!needle || searchableText(product).includes(needle)));
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [products, collection, type, occasion, filters.q, sort]);

  const shown = limit ? results.slice(0, limit) : results;

  const query = filters.q.trim();
  const activeFilters = { type, occasion, collection: collection?.id ?? 'all', sort };
  const resultKey = `${JSON.stringify(activeFilters)}|${query}|${results.map((product) => product.id).join(',')}`;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      trackProductListViewed({ listId, filters: { ...activeFilters, search: query || null } }, results);
      if (query) trackProductsSearched(query, results.length, listId);
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
    // `resultKey` captures the filters, query and results.
  }, [resultKey, listId]);
  const filtersActive = type !== 'all' || occasion !== 'all' || Boolean(collection) || filters.q !== '';
  const format = (value: number) => new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE').format(value);
  const reset = () => { setSearchText(''); onReset(); };
  // The full shop keeps the same filters when leaving the capped home grid.
  const shopHref = `/shop${(() => {
    const search = new URLSearchParams();
    if (type !== 'all') search.set('type', type);
    if (occasion !== 'all') search.set('occasion', occasion);
    if (collection) search.set('collection', collection.id);
    if (filters.q) search.set('q', filters.q);
    const query = search.toString();
    return query ? `?${query}` : '';
  })()}`;

  return (
    <div className="shop-browser">
      <div className="shop-filters">
        <div className="shop-filters__search">
          <label htmlFor="shop-search">{t('Search the collection', 'ابحث في المجموعة')}</label>
          <div className="search-field">
            <SearchIcon />
            <input id="shop-search" type="search" value={searchText} dir="auto"
              placeholder={t('Search by flower, piece or occasion', 'ابحث بالزهرة أو القطعة أو المناسبة')}
              onChange={(event) => { setSearchText(event.target.value); onChange({ q: event.target.value.trim() }); }} />
          </div>
        </div>
        <div className="shop-filters__types">
          <span className="shop-filters__label" id="shop-type-label">{t('What would you like to give?', 'ماذا تودّ أن تهدي؟')}</span>
          <div className="chip-group" role="group" aria-labelledby="shop-type-label">
            {[{ id: 'all', name: { en: 'Everything', ar: 'الكل' } }, ...CATEGORIES].map((category) => (
              <button key={category.id} type="button" className="chip" aria-pressed={type === category.id}
                onClick={() => onChange({ type: category.id })}>{pick(category.name)}</button>
            ))}
          </div>
        </div>
        <label className="select-field">
          <span>{t('What is the occasion?', 'ما المناسبة؟')}</span>
          <select value={occasion} onChange={(event) => onChange({ occasion: event.target.value })}>
            <option value="all">{t('Any occasion', 'أي مناسبة')}</option>
            {OCCASIONS.map((item) => <option key={item.id} value={item.id}>{pick(item.name)}</option>)}
          </select>
        </label>
      </div>

      <div className="shop-subfilters">
        <p aria-live="polite">{format(results.length)} {t(results.length === 1 ? 'piece' : 'pieces', 'قطعة')}</p>
        <div className="shop-subfilters__fields">
          {collections.length > 0 && (
            <label className="inline-select">
              <span>{t('Collection', 'المجموعة')}</span>
              <select value={collection?.id ?? 'all'} onChange={(event) => onChange({ collection: event.target.value })}>
                <option value="all">{t('All collections', 'كل المجموعات')}</option>
                {collections.map((item) => <option key={item.id} value={item.id}>{ar ? item.titleAr : item.title}</option>)}
              </select>
            </label>
          )}
          <label className="inline-select">
            <span>{t('Sort', 'الترتيب')}</span>
            <select value={sort} onChange={(event) => onChange({ sort: event.target.value as Sort })}>
              <option value="featured">{t('Most loved', 'الأكثر طلباً')}</option>
              <option value="price-asc">{t('Price, low to high', 'السعر، من الأقل')}</option>
              <option value="price-desc">{t('Price, high to low', 'السعر، من الأعلى')}</option>
            </select>
          </label>
          {filtersActive && <button type="button" className="text-button" onClick={reset}>{t('Clear filters', 'امسح عوامل التصفية')}</button>}
        </div>
      </div>

      {shown.length ? (
        <div className="product-grid">
          {shown.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={!limit && index < 4}
              list={{ listId, filters: activeFilters }} position={index + 1} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{products.length ? t('Nothing matches just yet.', 'لا توجد نتائج مطابقة بعد.') : t('The collection is being arranged.', 'المجموعة قيد التنسيق.')}</h2>
          <p>{products.length
            ? t('Try another occasion or a different word, or ask us for something bespoke.', 'جرّب مناسبة أخرى أو كلمة مختلفة، أو اطلب منا تنسيقاً خاصاً.')
            : t('New pieces will appear here shortly. In the meantime, we are happy to arrange something for you.', 'ستظهر القطع الجديدة هنا قريباً. وحتى ذلك الحين، يسعدنا أن ننسق لك شيئاً خاصاً.')}</p>
          <div className="empty-state__actions">
            {filtersActive && <button type="button" className="button button--ghost" onClick={reset}>{t('Show everything', 'اعرض الكل')}</button>}
            <Link className="button" href="/contact">{t('Ask the flower desk', 'اسأل مكتب الزهور')} <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      )}

      {limit && results.length > shown.length && (
        <div className="shop-more">
          <Link className="button button--ghost" href={shopHref}>
            {t(`View all ${format(results.length)} pieces`, `اعرض كل القطع (${format(results.length)})`)} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}
      {!live && shown.length > 0 && <p className="concept-note">{t('Collection preview. Products, photography and prices are provisional.', 'عرض مبدئي. المنتجات والصور والأسعار قابلة للتغيير.')}</p>}
    </div>
  );
}
