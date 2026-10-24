'use client';

import Link from 'next/link';
import { useEffect, useRef, type MouseEvent } from 'react';
import { trackProductClicked } from '@/lib/analytics/track';
import { DIWALI_HANDLES, HALLOWEEN_HANDLES, TORAN_HANDLE, pick } from '@/lib/seasonal';
import type { Product } from '@/lib/types';
import Money from './Money';
import SaleTag from './SaleTag';
import { useStore } from './StoreProvider';
import '@/styles/collection.css';
import '@/styles/seasonal.css';

const fmt = (value: number, ar: boolean) => new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE', { maximumFractionDigits: 0 }).format(value);

/** Animations only run while the band is on screen. */
function usePauseOffscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([entry]) => el.classList.toggle('is-paused', !entry.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

// ---------------------------------------------------------------------------
// Diwali: the approved round 5 band (owner, 24 Oct 2026), a little shorter.
// Night sky with fireworks, the real toran hanging top right, diyas at the foot.
// ---------------------------------------------------------------------------

const BURSTS: Array<[number, number, number, string, number]> = [
  [800, 320, 34, '#F6C35B', 0], [620, 70, 38, '#F07A8C', 1.1], [690, 260, 44, '#FFE9C2', 2.3], [930, 270, 50, '#F59A14', .6],
  [1260, 300, 40, '#E6B2FF', 1.8], [1150, 250, 30, '#F6C35B', 3.2], [560, 300, 28, '#E6B2FF', 2.9], [1290, 40, 26, '#F07A8C', .2],
];

function Burst({ x, y, r, color, delay }: { x: number; y: number; r: number; color: string; delay: number }) {
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return { x1: Math.cos(a) * r * .28, y1: Math.sin(a) * r * .28, x2: Math.cos(a) * r, y2: Math.sin(a) * r };
  });
  return (
    <g transform={`translate(${x} ${y})`} style={{ ['--d' as string]: `${-delay}s` }}>
      <line className="sea-trail" x1="0" y1={r * 3} x2="0" y2="0" stroke={color} strokeWidth="1.4" strokeLinecap="round" pathLength={1} />
      <g className="sea-burst">
        {rays.map((ray, i) => <line key={i} {...ray} stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity=".85" />)}
        {rays.map((ray, i) => <circle key={`d${i}`} cx={ray.x2 * 1.08} cy={ray.y2 * 1.08} r="2.2" fill={color} />)}
        <circle r={r * .12} fill={color} opacity=".5" />
      </g>
    </g>
  );
}

function Diya({ x, i }: { x: number; i: number }) {
  return (
    <g transform={`translate(${x} ${78 + (i % 2) * 4}) scale(${i % 2 ? 1 : .9})`} style={{ ['--d' as string]: `${-((i * .37) % 1.6)}s`, ['--t' as string]: `${1.3 + (i % 4) * .17}s` }}>
      <circle className="sea-halo" r="46" cy="-18" fill="url(#sea-halo)" />
      <path d="M-19 -2 Q0 17 19 -2 Q17 -6 0 -6 Q-17 -6 -19 -2Z" fill="#A9492A" />
      <path d="M-19 -2 Q0 4 19 -2 Q17 -6 0 -6 Q-17 -6 -19 -2Z" fill="#D88049" />
      <path d="M13 -5 Q20 -9 24 -6 Q20 -3 15 -3Z" fill="#A9492A" />
      <path className="sea-flame" d="M0 -30 C7 -18 6 -9 0 -6 C-6 -9 -7 -18 0 -30Z" fill="url(#sea-flame)" />
    </g>
  );
}

const PETALS = ['#F59A14', '#FAB82B', '#C2405A', '#FFF1DA'];

export function DiwaliBar() {
  const { ar, t, products } = useStore();
  const ref = usePauseOffscreen<HTMLElement>();
  const toran = pick(products, DIWALI_HANDLES).find((product) => product.id === TORAN_HANDLE);
  if (!toran) return null;
  return (
    <section ref={ref} className="sea sea-dw" aria-labelledby="sea-dw-title" data-track-section="home_diwali" data-track-location="home_diwali">
      <svg className="sea-sky" viewBox="0 0 1320 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {Array.from({ length: 60 }, (_, i) => (
          <circle key={i} className="sea-twinkle" cx={(i * 97) % 1320} cy={(i * 53) % 260} r={i % 5 ? 1 : 1.6} fill="#FFE9C2" style={{ animationDelay: `${(i % 7) * .4}s` }} />
        ))}
        {BURSTS.map(([x, y, r, color, delay]) => <Burst key={`${x}-${y}`} x={x} y={y} r={r} color={color} delay={delay} />)}
      </svg>
      <img className="sea-toran" src="/seasonal/toran-cut-1200.webp" srcSet="/seasonal/toran-cut-600.webp 600w, /seasonal/toran-cut-1200.webp 1200w"
        sizes="(max-width: 860px) 100vw, 42vw" alt={t('Fresh orange and yellow marigold toran', 'إكليل قطيفة برتقالي وأصفر طازج')} width="1200" height="418" loading="lazy" decoding="async" />
      <div className="sea-dw-copy">
        <p className="sea-kicker">{t('Diwali · ', 'ديوالي · ')}<span className="sea-wide">{t('Sunday ', 'الأحد ')}</span>{t('8 November · Pre-orders open', '8 نوفمبر · الطلب المسبق مفتوح')}</p>
        <h2 id="sea-dw-title">{t('Ghar wali Diwali, here in Dubai.', 'ديوالي بدفء البيت، هنا في دبي.')}</h2>
        <p className="sea-dw-line">{t('Fresh marigold torans for your door, delivered from 5 November.', 'أكاليل قطيفة طازجة لباب بيتكم، التوصيل ابتداءً من 5 نوفمبر.')}</p>
        <div className="sea-dw-act">
          <Link className="sea-cta" href={`/shop/${toran.id}`}>
            <span>{t('Pre-order the toran', 'اطلب الإكليل مسبقاً')}</span><span className="flip-rtl" aria-hidden="true">→</span>
          </Link>
          <span className="sea-from">{t('From', 'من')} <Money amount={toran.price} ar={ar} whole /></span>
        </div>
      </div>
      <svg className="sea-lamps" viewBox="0 0 1320 96" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="sea-halo"><stop offset="0" stopColor="#FFC861" stopOpacity=".7" /><stop offset=".45" stopColor="#F59A14" stopOpacity=".2" /><stop offset="1" stopColor="#F59A14" stopOpacity="0" /></radialGradient>
          <linearGradient id="sea-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#F0761A" /><stop offset=".55" stopColor="#FFC33D" /><stop offset="1" stopColor="#FFF4C9" /></linearGradient>
        </defs>
        {Array.from({ length: 26 }, (_, i) => {
          const x = 20 + i * 51 + (i % 3) * 7, y = 84 + (i % 4) * 4;
          return <ellipse key={`p${i}`} cx={x} cy={y} rx="5" ry="3" fill={PETALS[i % 4]} opacity=".7" transform={`rotate(${i * 37} ${x} ${y})`} />;
        })}
        {Array.from({ length: 11 }, (_, i) => <Diya key={i} x={60 + i * 120} i={i} />)}
      </svg>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Halloween: the four products on a night panel, as ordinary catalogue cards.
// ---------------------------------------------------------------------------

const BAT = 'M0 0 C-6 -8 -16 -10 -26 -4 C-20 -3 -18 2 -20 6 C-14 2 -8 4 -6 8 C-4 4 -2 2 0 4 C2 2 4 4 6 8 C8 4 14 2 20 6 C18 2 20 -3 26 -4 C16 -10 6 -8 0 0Z';

function Bat({ top, width, duration, delay }: { top: number; width: number; duration: number; delay: number }) {
  return (
    <div className="sea-bat" style={{ top, ['--dur' as string]: `${duration}s`, ['--d' as string]: `${delay}s` }}>
      <i style={{ width }}><svg viewBox="-28 -12 56 24"><path d={BAT} fill="#07050A" /></svg></i>
    </div>
  );
}

function SeasonCard({ product, index, onOpen }: { product: Product; index: number; onOpen: (product: Product, position: number) => void }) {
  const { ar, t } = useStore();
  const name = ar ? product.nameAr : product.name;
  const href = `/shop/${product.id}`;
  const many = product.sizes.length > 1;
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(product, index + 1);
  };
  return (
    <article className="mbc-piece">
      <a className="mbc-frame" href={href} onClick={open} aria-label={name}>
        <img src={product.imageSmall} srcSet={`${product.imageSmall} 480w, ${product.image} 960w`} sizes="(max-width: 760px) 60vw, 22vw"
          alt={ar ? name : product.imageAlt} width="480" height="480" loading="lazy" decoding="async" />
        <span className="mbc-badge sea-badge">{t('Halloween', 'هالوين')}</span>
      </a>
      <div className="mbc-cap">
        <h3><a href={href} onClick={open}>{name}</a></h3>
        <span className="mbc-line">{ar ? product.lineAr : product.line}</span>
        <SaleTag className="mbc-sale" price={product.price} compareAtPrice={product.compareAtPrice} />
        <div className="mbc-row">
          <span className="mbc-price">
            {many && <small>{t('From', 'من')} </small>}<Money amount={product.price} ar={ar} whole />
            {product.compareAtPrice && <s aria-label={`${t('was', 'بدلاً من')} AED ${fmt(product.compareAtPrice, ar)}`}>{fmt(product.compareAtPrice, ar)}</s>}
          </span>
          <button type="button" className="mbc-add" onClick={() => onOpen(product, index + 1)} disabled={!product.available}
            aria-label={`${t('Add to bag', 'أضف إلى الحقيبة')}: ${name}`}>{product.available ? <>{t('Add', 'أضف')} <span aria-hidden="true">+</span></> : t('Sold out', 'نفدت الكمية')}</button>
        </div>
      </div>
    </article>
  );
}

export function HalloweenShelf() {
  const { ar, t, products, openProduct } = useStore();
  const ref = usePauseOffscreen<HTMLElement>();
  const items = pick(products, HALLOWEEN_HANDLES);
  if (!items.length) return null;
  const onOpen = (product: Product, position: number) => {
    trackProductClicked(product, { listId: 'home_halloween' }, position);
    openProduct(product);
  };
  return (
    <section ref={ref} className="sea sea-hw mbc" aria-labelledby="sea-hw-title" data-track-section="home_halloween" data-track-location="home_halloween">
      <div className="sea-hw-deco" aria-hidden="true">
        <svg className="sea-moon" viewBox="0 0 240 240">
          <defs>
            <radialGradient id="sea-mglow"><stop offset=".35" stopColor="#FFB15C" stopOpacity=".35" /><stop offset="1" stopColor="#FFB15C" stopOpacity="0" /></radialGradient>
            <radialGradient id="sea-mdisc" cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#FFF3D6" /><stop offset=".55" stopColor="#F9CF86" /><stop offset="1" stopColor="#E9933F" /></radialGradient>
          </defs>
          <circle cx="120" cy="120" r="118" fill="url(#sea-mglow)" /><circle cx="120" cy="120" r="62" fill="url(#sea-mdisc)" />
          <g fill="#D9863A" opacity=".28"><circle cx="100" cy="104" r="10" /><circle cx="138" cy="132" r="7" /><circle cx="114" cy="146" r="5" /></g>
        </svg>
        <svg className="sea-branch" viewBox="0 0 420 200">
          <g fill="none" stroke="#07050A" strokeLinecap="round">
            <path d="M430 24 C360 34 300 52 250 84 C210 110 180 114 140 108" strokeWidth="12" />
            <path d="M300 56 C290 34 300 18 322 6" strokeWidth="5" /><path d="M250 84 C240 114 250 140 238 172" strokeWidth="6" />
            <path d="M196 106 C170 84 150 80 120 60" strokeWidth="4.5" /><path d="M140 108 C110 112 86 124 60 116" strokeWidth="4.5" />
            <path d="M60 116 C40 110 30 102 14 104" strokeWidth="2.5" /><path d="M360 34 C372 62 392 76 418 82" strokeWidth="4.5" />
          </g>
        </svg>
        <Bat top={22} width={36} duration={22} delay={0} />
        <Bat top={58} width={24} duration={28} delay={-9} />
        <Bat top={10} width={20} duration={25} delay={-17} />
        <div className="sea-fog" /><div className="sea-fog sea-fog--2" />
      </div>
      <div className="sea-hw-head">
        <p className="sea-kicker">{t('Halloween · Saturday 31 October', 'الهالوين · السبت 31 أكتوبر')}</p>
        <h2 id="sea-hw-title"><span className="sea-boo">{t('Boo.', 'بوو.')}</span> {t('We brought flowers.', 'أحضرنا الزهور.')}</h2>
        <p className="sea-hw-line">{t('Fresh flowers in pumpkins, for the host, the neighbours or someone you’d like to surprise.', 'زهور طازجة في يقطين، للمضيف أو للجيران أو لمن تحب أن تفاجئه.')}</p>
      </div>
      <div className="sea-hw-row" role="region" aria-label={t('Halloween flowers', 'زهور الهالوين')} tabIndex={0}>
        {items.map((product, index) => <SeasonCard key={product.id} product={product} index={index} onOpen={onOpen} />)}
      </div>
    </section>
  );
}
