'use client';

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { whatsappLink } from '@/lib/whatsapp';
import { ArrowLink, Bi } from './blocks';
import { useStore } from './StoreProvider';

// Teaser for Diwali (Sunday 8 November 2026), shown right after "A gift for every gesture". The wording promises
// no price or discount; pre-orders open once the Diwali range is confirmed. A marigold toran is drawn in SVG over
// a deep wine ground with a slowly turning rangoli, twinkling lights and hanging diyas. Everything moves on its
// own (the strands swing, the flowers ripple, a gust passes every few seconds, the flames flicker); the pointer
// leans the garland and a tap shakes petals loose. Reduced-motion visitors get it still.

const DIWALI = Date.UTC(2026, 10, 8);
const TOP = 14;             // y of the pins
const SAG = 30;             // how far a swag droops between two pins
const SEGMENT = 270;        // target width of one swag
const STEP = 19;            // spacing of flowers along a swag
const HEIGHT = 120;
const FS = 1.18;            // marigold size multiplier

type Spot = { x: number; y: number; rotate: number; scale: number; tone: number };

/** Whole days from today (Dubai) to Diwali. */
function daysToDiwali() {
  const now = new Date(Date.now() + 4 * 3_600_000);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((DIWALI - today) / 86_400_000);
}

function layout(width: number) {
  const left = 18;
  const right = width - 18;
  const segments = Math.max(2, Math.round((right - left) / SEGMENT));
  const pins = Array.from({ length: segments + 1 }, (_, i) => left + ((right - left) * i) / segments);
  const swags: string[] = [];
  const flowers: Spot[] = [];
  const leaves: Array<{ x: number; y: number; rotate: number }> = [];
  for (let i = 0; i < segments; i += 1) {
    const [x0, x1] = [pins[i], pins[i + 1]];
    const cx = (x0 + x1) / 2;
    const cy = TOP + SAG * 2;
    swags.push(`M${x0} ${TOP} Q${cx} ${cy} ${x1} ${TOP}`);
    const count = Math.max(5, Math.floor(((x1 - x0) * 1.08) / STEP));
    for (let k = 0; k < count; k += 1) {
      const t = (k + 0.5) / count;
      const u = 1 - t;
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
      const y = u * u * TOP + 2 * u * t * cy + t * t * TOP;
      // Tangent of the curve, for placing the mango leaves along the string.
      const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx);
      const dy = 2 * u * (cy - TOP) + 2 * t * (TOP - cy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      flowers.push({ x, y, rotate: (i * 37 + k * 53) % 360, scale: 0.94 + (((i + k) * 7) % 5) * 0.035, tone: (i + k) % 4 === 3 ? 1 : 0 });
      if (k % 2 === 0) leaves.push({ x, y, rotate: angle + (k % 4 === 0 ? 28 : -28) });
    }
  }
  const strands = pins.map((x, i) => {
    const kind: 'diya' | 'bud' = i % 3 === 1 ? 'diya' : 'bud';
    const length = kind === 'diya' ? 34 : 26 + (i % 3) * 8;
    const count = Math.floor((length - 4) / 17);
    return {
      x,
      kind,
      endY: TOP + length,
      flowers: Array.from({ length: count }, (_, k): Spot => ({ x, y: TOP + 17 * (k + 1), rotate: (i * 29 + k * 61) % 360, scale: 0.9, tone: 1 })),
    };
  });
  return { pins, swags, flowers, leaves, strands };
}

const PETALS = (count: number, radius: number, rx: number, ry: number) =>
  Array.from({ length: count }, (_, i) => ({ angle: (360 / count) * i, radius, rx, ry }));

function Marigold({ id, outer, mid, inner, core }: { id: string; outer: string; mid: string; inner: string; core: string }) {
  return (
    <g id={id}>
      <circle r="12" fill={outer} />
      {PETALS(13, 8.2, 3.7, 6).map((p) => <ellipse key={`o${p.angle}`} cx="0" cy={-p.radius} rx={p.rx} ry={p.ry} fill={outer} stroke={core} strokeOpacity=".35" strokeWidth=".5" transform={`rotate(${p.angle})`} />)}
      {PETALS(9, 5.2, 3, 4.6).map((p) => <ellipse key={`m${p.angle}`} cx="0" cy={-p.radius} rx={p.rx} ry={p.ry} fill={mid} stroke={core} strokeOpacity=".3" strokeWidth=".5" transform={`rotate(${p.angle + 14})`} />)}
      {PETALS(6, 2.4, 2.4, 3.4).map((p) => <ellipse key={`i${p.angle}`} cx="0" cy={-p.radius} rx={p.rx} ry={p.ry} fill={inner} transform={`rotate(${p.angle + 7})`} />)}
      <circle r="1.5" fill={core} />
      <ellipse cx="-3.6" cy="-4.6" rx="3.4" ry="2" fill="#FFE29A" opacity=".5" transform="rotate(-35 -3.6 -4.6)" />
    </g>
  );
}

const PEEK = [
  { en: 'Marigold toran', ar: 'توران القطيفة', icon: <><path d="M3 8 Q16 22 29 8" /><circle cx="8" cy="13" r="1.6" /><circle cx="16" cy="17" r="1.6" /><circle cx="24" cy="13" r="1.6" /><path d="M16 19 V27" /></> },
  { en: 'Diya sets', ar: 'مجموعات الديا', icon: <><path d="M5 17 Q16 14 27 17 Q24 27 16 27 Q8 27 5 17Z" /><path d="M16 14 C12 9 15 5 16 3 C17 5 20 9 16 14Z" /></> },
  { en: 'Mithai & bloom hampers', ar: 'سلال الحلوى والزهور', icon: <><rect x="5" y="14" width="22" height="13" rx="1.5" /><path d="M4 14 H28 V10 H4Z" /><path d="M16 10 V27" /><path d="M16 10 C12 4 8 7 11 9 M16 10 C20 4 24 7 21 9" /></> },
  { en: 'Family name tags', ar: 'بطاقات اسم العائلة', icon: <><path d="M6 8 H26 V24 H6Z" /><path d="M10 14 H22 M10 19 H18" /><path d="M16 3 V8" /></> },
] as const;

const LIGHTS = [[6, 14], [14, 62], [24, 28], [33, 80], [44, 18], [53, 70], [63, 30], [72, 84], [82, 22], [91, 60], [97, 36], [9, 90], [38, 52], [68, 56]];

export default function DiwaliBand() {
  const { ar } = useStore();
  const wall = useRef<HTMLDivElement>(null);
  const garland = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [gusting, setGusting] = useState(false);
  const gustTimer = useRef(0);
  const [days, setDays] = useState<number | null>(null);
  const [family, setFamily] = useState('');
  const [petals, setPetals] = useState<Array<{ id: number; x: number; delay: number; drift: number }>>([]);
  const name = family.trim().slice(0, 22);
  const notify = whatsappLink(`Hello Maison Botanique, please tell me when the Diwali pre-orders open.${name ? ` I would like a toran name tag for the ${name} family.` : ''}`);
  const label = { en: 'Tell me when it opens', ar: 'أخبروني عند الفتح' };
  const number = (n: number) => (ar ? n.toLocaleString('ar-AE') : String(n));

  useLayoutEffect(() => {
    const element = wall.current;
    if (!element) return undefined;
    const measure = () => setWidth(Math.round(element.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { setDays(daysToDiwali()); }, []);

  // A gust passes along the garland every few seconds, on its own. Dropping the class for a frame restarts it.
  const blow = () => {
    window.clearTimeout(gustTimer.current);
    setGusting(false);
    window.requestAnimationFrame(() => {
      setGusting(true);
      gustTimer.current = window.setTimeout(() => setGusting(false), 2400);
    });
  };
  const blowRef = useRef(blow);
  blowRef.current = blow;
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => blowRef.current(), 6500);
    const first = window.setTimeout(() => blowRef.current(), 1800);
    return () => { window.clearInterval(timer); window.clearTimeout(first); window.clearTimeout(gustTimer.current); };
  }, []);

  const { pins, swags, flowers, leaves, strands } = width ? layout(width) : { pins: [], swags: [], flowers: [], leaves: [], strands: [] };

  // The family-name tag hangs from the middle swag (a preview of a possible personalised toran).
  const tag = (() => {
    if (pins.length < 2) return null;
    const m = Math.floor((pins.length - 1) / 2);
    const [x0, x1] = [pins[m], pins[m + 1]];
    const cx = (x0 + x1) / 2;
    const text = name ? (ar ? `عائلة ${name}` : `The ${name} family`) : (ar ? 'اسم عائلتكم هنا' : 'Your family name');
    const plateW = Math.min(width < 520 ? 150 : 250, Math.max(130, text.length * 11 + 44));
    const yAt = (x: number) => { const t = (x - x0) / (x1 - x0); return TOP + 4 * SAG * t * (1 - t); };
    const left = cx - plateW / 2 + 22;
    const right = cx + plateW / 2 - 22;
    return { cx, plateW, text, left, right, yLeft: yAt(left), yRight: yAt(right), top: Math.max(yAt(left), yAt(right)) + 24 };
  })();

  const lean = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    garland.current?.style.setProperty('--lean', String(((event.clientX - box.left) / box.width - 0.5) * 2));
  };
  const settle = () => garland.current?.style.setProperty('--lean', '0');
  const shake = () => {
    blow();
    const base = Date.now();
    setPetals(pins.filter((_, i) => i % 2 === 0).map((x, i) => ({ id: base + i, x: x + ((i * 17) % 30) - 15, delay: (i % 4) * 90, drift: ((i * 23) % 40) - 20 })));
    window.setTimeout(() => setPetals([]), 2200);
  };

  const flower = (spot: Spot, key: string | number, wave: number) => (
    <g key={key} transform={`translate(${spot.x} ${spot.y}) rotate(${spot.rotate}) scale(${spot.scale * FS})`}>
      <use href={spot.tone ? '#diw-m2' : '#diw-m1'} className="diw__ripple" style={{ animationDelay: `${wave}s` }} />
    </g>
  );

  return (
    <section className="diw" aria-labelledby="diw-title" data-track-section="home_diwali_teaser" data-track-location="home_diwali_teaser">
      <div className="diw__wall" ref={wall} onPointerMove={lean} onPointerLeave={settle}>
        <svg className="diw__rangoli" viewBox="-100 -100 200 200" aria-hidden="true">
          <g fill="none" stroke="#E4B861" strokeWidth=".7">
            {[92, 70, 46, 24].map((r) => <circle key={r} r={r} strokeDasharray={r > 60 ? '1 3' : undefined} />)}
            {Array.from({ length: 16 }, (_, i) => <path key={`a${i}`} transform={`rotate(${i * 22.5})`} d="M0 -48 Q11 -64 0 -90 Q-11 -64 0 -48Z" />)}
            {Array.from({ length: 16 }, (_, i) => <path key={`b${i}`} transform={`rotate(${i * 22.5 + 11.25})`} d="M0 -26 Q7 -36 0 -46 Q-7 -36 0 -26Z" />)}
            {Array.from({ length: 8 }, (_, i) => <path key={`c${i}`} transform={`rotate(${i * 45})`} d="M0 -92 L5 -98 L0 -104 L-5 -98Z" />)}
          </g>
        </svg>
        {LIGHTS.map(([x, y], i) => <span key={i} className="diw__light" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i * 0.7) % 4}s`, animationDuration: `${2.6 + (i % 4)}s` }} aria-hidden="true" />)}
        {width > 0 && (
          <svg ref={garland} className={`diw__garland${gusting ? ' is-gust' : ''}`} width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden="true" onClick={shake}>
            <defs>
              <Marigold id="diw-m1" outer="#F59A14" mid="#EE8410" inner="#DD690A" core="#9E4306" />
              <Marigold id="diw-m2" outer="#FBBE2B" mid="#F7A91C" inner="#EE8E10" core="#B35208" />
              <radialGradient id="diw-glow"><stop offset="0" stopColor="#FFD878" stopOpacity=".85" /><stop offset=".45" stopColor="#FFB23E" stopOpacity=".3" /><stop offset="1" stopColor="#FF9A1F" stopOpacity="0" /></radialGradient>
              <path id="diw-leaf" d="M0 0 C5 -5 13 -5 18 0 C13 5 5 5 0 0Z" fill="#5F8040" stroke="#3F5A28" strokeWidth=".5" />
            </defs>
            <g className="diw__lean">
              {swags.map((d) => <path key={d} d={d} fill="none" stroke="#C9A25A" strokeWidth="1.4" />)}
              {leaves.map((leaf, i) => <use key={i} href="#diw-leaf" transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate})`} />)}
              {flowers.map((spot, i) => flower(spot, i, -(spot.x / width) * 3.2))}
              {strands.map((strand, i) => (
                <g key={strand.x} className="diw__swing" style={{ transformOrigin: `${strand.x}px ${TOP}px`, animationDelay: `${-(i % 5) * 0.65}s` }}>
                  <g className="diw__gust" style={{ transformOrigin: `${strand.x}px ${TOP}px`, animationDelay: `${i * 0.09}s` }}>
                    <line x1={strand.x} y1={TOP} x2={strand.x} y2={strand.endY} stroke="#C9A25A" strokeWidth="1.4" />
                    {strand.flowers.map((spot, k) => flower(spot, k, -i * 0.3 - k * 0.2))}
                    {strand.kind === 'bud' ? (
                      <>
                        <g transform={`translate(${strand.x} ${strand.endY + 6}) scale(1.28)`}><use href="#diw-m1" /></g>
                        <circle cx={strand.x} cy={strand.endY + 19} r="3.4" fill="#E4B861" />
                        <path d={`M${strand.x - 2.6} ${strand.endY + 21} L${strand.x} ${strand.endY + 31} L${strand.x + 2.6} ${strand.endY + 21}Z`} fill="#E4B861" />
                      </>
                    ) : (
                      <g transform={`translate(${strand.x} ${strand.endY})`}>
                        <circle className="diw__halo" cy="12" r="30" fill="url(#diw-glow)" />
                        <path d="M-1 0 L1 0 L1 6 L-1 6Z" fill="#C9A25A" />
                        <path d="M-15 8 Q0 5 15 8 Q13 24 0 26 Q-13 24 -15 8Z" fill="#B5531C" stroke="#E4B861" strokeWidth="1.1" />
                        <path d="M-15 8 Q0 11 15 8" fill="none" stroke="#E4B861" strokeWidth="1.1" />
                        <path className="diw__flame" d="M0 7 C-5 1 -2 -6 0 -10 C2 -6 5 1 0 7Z" fill="#FFC244" />
                        <path className="diw__flame" d="M0 6 C-2.4 2 -1 -2 0 -5 C1 -2 2.4 2 0 6Z" fill="#FFF3C4" />
                      </g>
                    )}
                  </g>
                </g>
              ))}
              {tag && (
                <g className="diw__swing diw__tag" style={{ transformOrigin: `${tag.cx}px ${tag.top - 24}px`, animationDelay: '-1.1s' }}>
                  <line x1={tag.left} y1={tag.yLeft} x2={tag.cx - tag.plateW / 2 + 12} y2={tag.top} stroke="#C9A25A" strokeWidth="1.2" />
                  <line x1={tag.right} y1={tag.yRight} x2={tag.cx + tag.plateW / 2 - 12} y2={tag.top} stroke="#C9A25A" strokeWidth="1.2" />
                  <rect x={tag.cx - tag.plateW / 2} y={tag.top} width={tag.plateW} height="40" rx="3" fill="#FBF3E4" stroke="#E4B861" strokeWidth="1.6" />
                  <rect x={tag.cx - tag.plateW / 2 + 4} y={tag.top + 4} width={tag.plateW - 8} height="32" rx="2" fill="none" stroke="#E4B861" strokeWidth=".6" strokeOpacity=".7" />
                  <text x={tag.cx} y={tag.top + 22} textAnchor="middle" className={`diw__tagname${name ? '' : ' is-empty'}`}>{tag.text}</text>
                  <text x={tag.cx} y={tag.top + 33} textAnchor="middle" className="diw__tagyear">{ar ? 'ديوالي ٢٠٢٦' : 'Diwali 2026'}</text>
                </g>
              )}
              <circle cx={pins[0]} cy={TOP} r="3.4" fill="#E4B861" />
              <circle cx={pins[pins.length - 1]} cy={TOP} r="3.4" fill="#E4B861" />
            </g>
            {petals.map((petal) => (
              <ellipse key={petal.id} className="diw__petal" cx={petal.x} cy={TOP + 22} rx="6" ry="3.4" fill="#F59A14" style={{ animationDelay: `${petal.delay}ms`, ['--drift' as string]: `${petal.drift}px` }} />
            ))}
          </svg>
        )}
        <div className="diw__copy">
          <p className="diw__eyebrow"><Bi text={{ en: 'Coming soon · Diwali', ar: 'قريباً · ديوالي' }} /></p>
          <h2 id="diw-title"><Bi text={{ en: 'Diwali, the Maison way.', ar: 'ديوالي على طريقة ميزون.' }} /></h2>
          <p className="diw__text"><Bi text={{ en: 'Pre-orders open soon, starting with a marigold toran for your doorway.', ar: 'يفتح الحجز المسبق قريباً، ونبدأ بتوران من القطيفة لمدخل بيتكم.' }} /></p>
          <div className="diw__form">
            <label className="diw__field">
              <span className="diw__sr">{ar ? 'اسم العائلة' : 'Family name'}</span>
              <input id="diw-name" type="text" inputMode="text" autoComplete="off" maxLength={22} value={family} onChange={(event) => setFamily(event.target.value)}
                placeholder={ar ? 'شاهدوا اسم عائلتكم على التوران' : 'See your family name on the toran'} />
            </label>
            {notify
              ? <a className="diw__cta" href={notify} target="_blank" rel="noopener noreferrer"><span><Bi text={label} /></span><span aria-hidden="true">↗</span></a>
              : <ArrowLink href="/contact" variant="button" label={label} />}
          </div>
        </div>
        <div className="diw__count" aria-live="polite">
          {days !== null && days > 0 ? (
            <>
              <p className="diw__number">{number(days)}</p>
              <p className="diw__unit">{ar ? 'يوماً على ديوالي' : days === 1 ? 'day to Diwali' : 'days to Diwali'}</p>
            </>
          ) : (
            <p className="diw__number diw__number--word"><Bi text={{ en: 'Diwali', ar: 'ديوالي' }} /></p>
          )}
          <p className="diw__date"><Bi text={{ en: 'Sunday 8 November', ar: 'الأحد ٨ نوفمبر' }} /></p>
        </div>
        <div className="diw__peek">
          <p className="diw__peekhead"><Bi text={{ en: 'Sneak peek · the range is still being chosen', ar: 'لمحة أولى · ما زلنا نختار المجموعة' }} /></p>
          <ul>
            {PEEK.map((item) => (
              <li key={item.en}>
                <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" fill="none" stroke="#E9C173" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                <span><Bi text={item} /></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
