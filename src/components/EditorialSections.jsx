import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import '../styles/editorial.css';

const CATEGORY_IDS = ['bouquets', 'gifts', 'preserved'];
const OCCASION_IDS = ['birthday', 'anniversary', 'thank-you', 'just-because'];

const COPY = {
  en: {
    occasions: {
      birthday: { name: 'A birthday', line: 'Something to make their day feel entirely theirs.' },
      anniversary: { name: 'An anniversary', line: 'For the love that keeps finding new ways to bloom.' },
      'thank-you': { name: 'A thank you', line: 'A small way to say what words cannot quite hold.' },
      'just-because': { name: 'Just because', line: 'No date on the calendar. Every reason in the world.' },
    },
    shopEyebrow: 'MAISON BOTANIQUE · DUBAI', shopTitle: 'The collection.',
    shopIntro: 'Flowers to give, to keep, and to remember. Find a piece by its form or by the occasion.',
    browseBy: 'Browse by', byType: 'Type', byOccasion: 'Occasion', all: 'All pieces',
    searchLabel: 'Search the collection', searchPlaceholder: 'Search flowers, gifts, occasions…', clearSearch: 'Clear search',
    categories: { bouquets: 'Bouquets', gifts: 'Gifts', preserved: 'Preserved' },
    view: 'Discover', galleryLabel: 'Explore the collection', previous: 'Previous pieces', next: 'Next pieces',
    showing: 'Showing', piece: 'piece', pieces: 'pieces',
    imageNote: 'Collection preview. Products and photography are provisional.',
    ritualEyebrow: 'A PERSONAL TOUCH', ritualTitle: 'A little more than flowers.',
    ritualIntro: 'The right arrangement is only the beginning. Make the gift feel like it came from you.',
    ritualSteps: [
      { title: 'Choose the piece', detail: 'Find the flowers that feel right for them.' },
      { title: 'Write your note', detail: 'Add your own words in the product details.' },
      { title: 'Choose a date', detail: 'Set a preferred delivery date. Availability will be confirmed when the store opens.' },
    ],
    ritualAction: 'Explore the collection', ritualNote: 'The best part is what you say.',
    noProducts: 'No pieces match your search.', resetFilters: 'Show all pieces',
  },
  ar: {
    occasions: {
      birthday: { name: 'عيد ميلاد', line: 'هدية تجعل يومهم خاصاً بهم وحدهم.' },
      anniversary: { name: 'ذكرى سنوية', line: 'للحب الذي يجد دائماً طريقة جديدة للتفتح.' },
      'thank-you': { name: 'شكر وامتنان', line: 'لفتة صغيرة تقول ما تعجز عنه الكلمات.' },
      'just-because': { name: 'من دون مناسبة', line: 'لا حاجة إلى تاريخ. يكفي أنهم في بالك.' },
    },
    shopEyebrow: 'ميزون بوتانيك · دبي', shopTitle: 'المجموعة.',
    shopIntro: 'زهور تُهدى وتُحفظ وتبقى في الذاكرة. ابحث حسب النوع أو المناسبة.',
    browseBy: 'تصفح حسب', byType: 'النوع', byOccasion: 'المناسبة', all: 'كل القطع',
    searchLabel: 'ابحث في المجموعة', searchPlaceholder: 'ابحث عن زهور أو هدايا أو مناسبة…', clearSearch: 'امسح البحث',
    categories: { bouquets: 'باقات', gifts: 'هدايا', preserved: 'زهور محفوظة' },
    view: 'اكتشف', galleryLabel: 'تصفّح المجموعة', previous: 'القطع السابقة', next: 'القطع التالية',
    showing: 'عدد القطع:', pieces: '',
    imageNote: 'عرض مبدئي. المنتجات والصور قابلة للتغيير.',
    ritualEyebrow: 'لمسة شخصية', ritualTitle: 'أكثر من مجرد زهور.',
    ritualIntro: 'التنسيق المناسب هو البداية فقط. اجعل الهدية تعبر عنك.',
    ritualSteps: [
      { title: 'اختر القطعة', detail: 'اعثر على الزهور التي تليق بهم.' },
      { title: 'اكتب رسالتك', detail: 'أضف كلماتك في تفاصيل المنتج.' },
      { title: 'اختر التاريخ', detail: 'حدد تاريخ التوصيل المفضّل. سيُؤكَّد التوفر عند إطلاق المتجر.' },
    ],
    ritualAction: 'تصفّح المجموعة', ritualNote: 'أجمل ما في الهدية ما تقوله.',
    noProducts: 'لا توجد قطع تطابق بحثك.', resetFilters: 'اعرض كل القطع',
  },
};

function categoryOf(product) {
  const value = String(product?.category || '').toLowerCase();
  if (value.includes('preserv')) return 'preserved';
  if (value.includes('gift')) return 'gifts';
  return 'bouquets';
}

function priceLabel(price, isArabic) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return String(price ?? '');
  return new Intl.NumberFormat(isArabic ? 'ar-AE' : 'en-AE', {
    style: 'currency', currency: 'AED', maximumFractionDigits: 0,
  }).format(amount);
}

function searchableText(product) {
  const occasionNames = (product.occasions || []).flatMap((id) => [COPY.en.occasions[id]?.name, COPY.ar.occasions[id]?.name]);
  return [product.name, product.nameAr, product.description, product.descriptionAr,
    product.category, product.categoryAr, ...occasionNames].filter(Boolean).join(' ').normalize('NFKD').toLocaleLowerCase();
}

export default function EditorialSections({ products = [], locale = 'en', requestedCategory, categoryRequestSeq, onProductClick }) {
  const isArabic = locale === 'ar';
  const copy = COPY[isArabic ? 'ar' : 'en'];
  const shopRef = useRef(null);
  const rootRef = useRef(null);
  const railRef = useRef(null);
  const railFrame = useRef(0);
  const [browseMode, setBrowseMode] = useState('type');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [railIndex, setRailIndex] = useState(0);
  const [railProgress, setRailProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const query = search.trim().normalize('NFKD').toLocaleLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesFilter = filter === 'all' || (browseMode === 'type'
      ? categoryOf(product) === filter : product.occasions?.includes(filter));
    return matchesFilter && (!query || searchableText(product).includes(query));
  });
  useEffect(() => {
    if (!requestedCategory || !['all', 'occasion', ...CATEGORY_IDS].includes(requestedCategory)) return;
    setBrowseMode(requestedCategory === 'occasion' ? 'occasion' : 'type');
    setFilter(requestedCategory === 'occasion' ? 'all' : requestedCategory);
    setSearch('');
  }, [requestedCategory, categoryRequestSeq]);

  const updateRail = () => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = [...rail.querySelectorAll('.ed-piece')];
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const distance = Math.min(max, Math.abs(rail.scrollLeft));
    const edge = isArabic ? rail.getBoundingClientRect().right : rail.getBoundingClientRect().left;
    let closest = 0;
    let nearest = Infinity;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const delta = Math.abs((isArabic ? rect.right : rect.left) - edge);
      if (delta < nearest) { closest = index; nearest = delta; }
    });
    setRailIndex(closest);
    setRailProgress(max ? distance / max : 0);
    setCanPrev(distance > 4);
    setCanNext(distance < max - 4);
  };
  const queueRailUpdate = () => {
    cancelAnimationFrame(railFrame.current);
    railFrame.current = requestAnimationFrame(updateRail);
  };
  const moveRail = (step) => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = [...rail.querySelectorAll('.ed-piece')];
    const target = cards[Math.max(0, Math.min(cards.length - 1, railIndex + step))];
    target?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'nearest', inline: 'start',
    });
  };

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      setRailIndex(0);
      setRailProgress(0);
      setCanPrev(false);
      setCanNext(false);
      return undefined;
    }
    rail.scrollLeft = 0;
    const frame = requestAnimationFrame(updateRail);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(queueRailUpdate);
    observer?.observe(rail);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(railFrame.current);
      observer?.disconnect();
    };
  }, [browseMode, filter, query, locale, filteredProducts.length]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const targets = root.querySelectorAll('[data-ed-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('ed-in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    targets.forEach((target) => {
      target.classList.add('ed-will-reveal');
      observer.observe(target);
    });
    return () => {
      observer.disconnect();
      targets.forEach((target) => target.classList.remove('ed-will-reveal'));
    };
  }, []);

  const scrollToShop = () => requestAnimationFrame(() => shopRef.current?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  }));
  const selectCategory = (category, scroll = false) => {
    setBrowseMode('type');
    setFilter(category);
    setSearch('');
    if (scroll) scrollToShop();
  };

  return (
    <div className="ed-root" dir={isArabic ? 'rtl' : 'ltr'} ref={rootRef}>
      <section className="ed-shop" id="shop" ref={shopRef} aria-labelledby="ed-shop-title">
        <div className="ed-wrap">
          <div className="ed-shop-heading" data-ed-reveal>
            <div><span className="ed-kicker">{copy.shopEyebrow}</span><h2 id="ed-shop-title">{copy.shopTitle}</h2></div>
            <p>{copy.shopIntro}</p>
          </div>
          <div className="ed-browse-bar">
            <div className="ed-browse-group"><span className="ed-browse-label">{copy.browseBy}</span>
              <div className="ed-browse-modes" role="group" aria-label={copy.browseBy}>
                <button type="button" aria-pressed={browseMode === 'type'} className={browseMode === 'type' ? 'is-active' : ''} onClick={() => { setBrowseMode('type'); setFilter('all'); }}>{copy.byType}</button>
                <button type="button" aria-pressed={browseMode === 'occasion'} className={browseMode === 'occasion' ? 'is-active' : ''} onClick={() => { setBrowseMode('occasion'); setFilter('all'); }}>{copy.byOccasion}</button>
              </div>
            </div>
            <div className="ed-search"><label htmlFor="ed-collection-search" className="ed-sr-only">{copy.searchLabel}</label><span className="ed-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.6" stroke="currentColor" strokeWidth="1.5"/><path d="m15.8 15.8 4.4 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span><input id="ed-collection-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setSearch(''); }} placeholder={copy.searchPlaceholder} dir="auto" /><span className="ed-search-shortcut">{search && <button type="button" onClick={() => setSearch('')} aria-label={copy.clearSearch}>×</button>}</span></div>
          </div>
          <div className="ed-filters" role="group" aria-label={isArabic ? 'تصفية المنتجات' : 'Filter products'}>
            {['all', ...(browseMode === 'type' ? CATEGORY_IDS : OCCASION_IDS)].map((id) => (
              <button type="button" key={id} className={`ed-filter${filter === id ? ' is-active' : ''}`} aria-pressed={filter === id}
                onClick={() => setFilter(id)}>
                {id === 'all' ? copy.all : browseMode === 'type' ? copy.categories[id] : copy.occasions[id].name}
              </button>
            ))}
          </div>
          <div className="ed-collection-tools">
            <span className="ed-results-line" aria-live="polite">{copy.showing} {new Intl.NumberFormat(isArabic ? 'ar-AE' : 'en-AE').format(filteredProducts.length)} {filteredProducts.length === 1 ? (copy.piece ?? copy.pieces) : copy.pieces}</span>
            <div className="ed-rail-navigation">
              <span className="ed-rail-count" aria-live="polite" dir="ltr">{String(filteredProducts.length ? railIndex + 1 : 0).padStart(2, '0')} <i>/</i> {String(filteredProducts.length).padStart(2, '0')}</span>
              <button type="button" disabled={!canPrev} onClick={() => moveRail(-1)} aria-label={copy.previous}>{isArabic ? '→' : '←'}</button>
              <button type="button" disabled={!canNext} onClick={() => moveRail(1)} aria-label={copy.next}>{isArabic ? '←' : '→'}</button>
            </div>
          </div>
          {filteredProducts.length > 0 ? (
            <div className="ed-rail-shell">
              <div className="ed-product-rail" ref={railRef} role="region" aria-label={copy.galleryLabel} tabIndex={0}
                onScroll={queueRailUpdate}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === (isArabic ? 'ArrowLeft' : 'ArrowRight')) { event.preventDefault(); moveRail(1); }
                  if (event.key === (isArabic ? 'ArrowRight' : 'ArrowLeft')) { event.preventDefault(); moveRail(-1); }
                }}>
                {filteredProducts.map((product, index) => {
                  const name = (isArabic && product.nameAr) || product.name || '';
                  return <article key={product.id} data-product-id={product.id} className={`ed-piece ed-piece--${index % 3}`}>
                    <button className="ed-piece-photo" type="button" onClick={() => onProductClick?.(product)} aria-label={`${copy.view}: ${name}`}>
                      <img src={product.image} alt="" loading={index < 3 ? 'eager' : 'lazy'} />
                      <span className="ed-piece-photo-action" aria-hidden="true">↗</span>
                    </button>
                    <div className="ed-piece-meta"><span>{copy.categories[categoryOf(product)]}</span><span>{priceLabel(product.price, isArabic)}</span></div>
                    <button type="button" className="ed-piece-title" onClick={() => onProductClick?.(product)}>{name}<span aria-hidden="true">↗</span></button>
                    <p>{(isArabic && product.descriptionAr) || product.description}</p>
                  </article>;
                })}
              </div>
              <div className="ed-rail-progress" aria-hidden="true"><span style={{ transform: `scaleX(${filteredProducts.length <= 1 ? 1 : Math.max(.16, railProgress)})` }} /></div>
            </div>
          ) : <div className="ed-empty"><p>{copy.noProducts}</p><button type="button" onClick={() => { setFilter('all'); setSearch(''); }}>{copy.resetFilters} <span aria-hidden="true">↗</span></button></div>}
          <p className="ed-image-note">{copy.imageNote}</p>
        </div>
      </section>

      <section className="ed-ritual" id="our-world" aria-labelledby="ed-ritual-title">
        <div className="ed-ritual-photo" data-ed-reveal><img src="/assets/dark-editorial-concept.jpg" alt="" loading="lazy" /><span>MAISON BOTANIQUE / THE GIFT</span></div>
        <div className="ed-ritual-content" data-ed-reveal>
          <span className="ed-kicker">{copy.ritualEyebrow}</span>
          <h2 id="ed-ritual-title">{copy.ritualTitle}</h2>
          <p className="ed-ritual-intro">{copy.ritualIntro}</p>
          <div className="ed-ritual-steps">
            {copy.ritualSteps.map((step, index) => <div className={`ed-ritual-step${activeStep === index ? ' is-active' : ''}`} key={step.title}>
              <button type="button" aria-expanded={activeStep === index} aria-controls={`ed-step-${index}`} onClick={() => setActiveStep(index)}>
                <span>0{index + 1}</span><strong>{step.title}</strong><span aria-hidden="true">{activeStep === index ? '−' : '+'}</span>
              </button>
              <div id={`ed-step-${index}`} hidden={activeStep !== index}><p>{step.detail}</p></div>
            </div>)}
          </div>
          <button type="button" className="ed-ritual-action" onClick={() => selectCategory('all', true)}>{copy.ritualAction}<span aria-hidden="true">↗</span></button>
        </div>
        <p className="ed-ritual-quote">{copy.ritualNote}</p>
      </section>
    </div>
  );
}
