'use client';

import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { whatsappLink } from '@/lib/whatsapp';
import { ArrowLink, Bi } from './blocks';

// Teaser for Diwali (8 November 2026), shown right after "A gift for every gesture". The wording promises
// no price or discount; pre-orders open once the Diwali range is confirmed. The garland is drawn in SVG,
// hung over the top of the band like a toran over a doorway: it sways, leans toward the pointer and drops
// a few petals when tapped. Reduced-motion visitors get it still.

const FLOWER = 11;          // marigold radius, px
const STEP = 15;            // spacing of flowers along a swag
const SAG = 22;             // how far a swag droops between two pins
const TOP = 9;              // y of the pins
const SEGMENT = 230;        // target width of one swag

type Spot = { x: number; y: number; rotate: number; scale: number };
type Strand = { x: number; flowers: Spot[]; endY: number };

/** Positions of every flower on the swags, and the hanging strands at each pin. */
function layout(width: number) {
  const left = 16;
  const right = width - 16;
  const segments = Math.max(2, Math.round((right - left) / SEGMENT));
  const pins = Array.from({ length: segments + 1 }, (_, i) => left + ((right - left) * i) / segments);
  const swags: string[] = [];
  const flowers: Spot[] = [];
  for (let i = 0; i < segments; i += 1) {
    const [x0, x1] = [pins[i], pins[i + 1]];
    const cx = (x0 + x1) / 2;
    const cy = TOP + SAG * 2;
    swags.push(`M${x0} ${TOP} Q${cx} ${cy} ${x1} ${TOP}`);
    const count = Math.max(4, Math.floor(((x1 - x0) * 1.06) / STEP));
    for (let k = 0; k < count; k += 1) {
      const t = (k + 0.5) / count;
      const u = 1 - t;
      flowers.push({
        x: u * u * x0 + 2 * u * t * cx + t * t * x1,
        y: u * u * TOP + 2 * u * t * cy + t * t * TOP,
        rotate: (i * 37 + k * 53) % 360,
        scale: 0.92 + (((i + k) * 7) % 5) * 0.04,
      });
    }
  }
  const strands: Strand[] = pins.map((x, i) => {
    const length = 26 + (i % 3) * 11;
    const count = Math.floor(length / 14);
    return {
      x,
      endY: TOP + length + 8,
      flowers: Array.from({ length: count }, (_, k) => ({ x, y: TOP + 14 * (k + 1), rotate: (i * 29 + k * 61) % 360, scale: 0.86 })),
    };
  });
  return { pins, swags, flowers, strands };
}

export default function DiwaliBand() {
  const wall = useRef<HTMLDivElement>(null);
  const garland = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [rustle, setRustle] = useState(0);
  const [petals, setPetals] = useState<Array<{ id: number; x: number; delay: number; drift: number }>>([]);
  const notify = whatsappLink('Hello Maison Botanique, please tell me when the Diwali pre-orders open.');
  const label = { en: 'Tell me when it opens', ar: 'أخبروني عند الفتح' };

  useLayoutEffect(() => {
    const element = wall.current;
    if (!element) return undefined;
    const measure = () => setWidth(Math.round(element.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { pins, swags, flowers, strands } = width ? layout(width) : { pins: [], swags: [], flowers: [], strands: [] };

  const lean = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    garland.current?.style.setProperty('--lean', String(((event.clientX - box.left) / box.width - 0.5) * 2));
  };
  const settle = () => garland.current?.style.setProperty('--lean', '0');
  const shake = () => {
    setRustle((n) => n + 1);
    const base = Date.now();
    setPetals(pins.filter((_, i) => i % 2 === 0).map((x, i) => ({ id: base + i, x: x + ((i * 17) % 30) - 15, delay: (i % 4) * 90, drift: ((i * 23) % 40) - 20 })));
    window.setTimeout(() => setPetals([]), 2200);
  };

  return (
    <section className="diw" aria-labelledby="diw-title" data-track-section="home_diwali_teaser" data-track-location="home_diwali_teaser">
      <div className="diw__wall" ref={wall} onPointerMove={lean} onPointerLeave={settle}>
        {width > 0 && (
          <svg ref={garland} className="diw__garland" width={width} height="92" viewBox={`0 0 ${width} 92`} aria-hidden="true" onClick={shake}>
            <defs>
              <g id="diw-marigold">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <circle key={angle} cx="0" cy={-FLOWER * 0.58} r={FLOWER * 0.42} fill="#F2A31B" transform={`rotate(${angle})`} />
                ))}
                <circle r={FLOWER * 0.62} fill="#E27B12" />
                <circle r={FLOWER * 0.28} fill="#B9520F" />
              </g>
            </defs>
            <g className="diw__lean">
              {swags.map((d) => <path key={d} d={d} fill="none" stroke="#8B6B3E" strokeWidth="1.2" />)}
              {flowers.map((spot, i) => (
                <use key={i} href="#diw-marigold" transform={`translate(${spot.x} ${spot.y}) rotate(${spot.rotate}) scale(${spot.scale})`} />
              ))}
              {strands.map((strand, i) => (
                <g key={strand.x} className={`diw__strand${rustle ? ` is-rustling-${rustle % 2}` : ''}`} style={{ transformOrigin: `${strand.x}px ${TOP}px`, animationDelay: `${(i % 5) * -0.9}s` }}>
                  <line x1={strand.x} y1={TOP} x2={strand.x} y2={strand.endY} stroke="#8B6B3E" strokeWidth="1.2" />
                  {strand.flowers.map((spot, k) => (
                    <use key={k} href="#diw-marigold" transform={`translate(${spot.x} ${spot.y}) rotate(${spot.rotate}) scale(${spot.scale})`} />
                  ))}
                  <circle cx={strand.x} cy={strand.endY} r="4" fill="#D9A441" />
                  <path d={`M${strand.x - 3} ${strand.endY + 3} L${strand.x} ${strand.endY + 13} L${strand.x + 3} ${strand.endY + 3} Z`} fill="#D9A441" />
                </g>
              ))}
              <circle cx={pins[0]} cy={TOP} r="3" fill="#D9A441" />
              <circle cx={pins[pins.length - 1]} cy={TOP} r="3" fill="#D9A441" />
            </g>
            {petals.map((petal) => (
              <ellipse key={petal.id} className="diw__petal" cx={petal.x} cy={TOP + 18} rx="5" ry="3" fill="#F2A31B" style={{ animationDelay: `${petal.delay}ms`, ['--drift' as string]: `${petal.drift}px` }} />
            ))}
          </svg>
        )}
        <div className="diw__copy">
          <p className="eyebrow"><Bi text={{ en: 'Coming soon · Diwali', ar: 'قريباً · ديوالي' }} /></p>
          <h2 id="diw-title"><Bi text={{ en: 'Diwali, the Maison way.', ar: 'ديوالي على طريقة ميزون.' }} /></h2>
          <p><Bi text={{ en: 'Marigold and thoughtful gifting are on their way. Pre-orders open soon, beginning with a marigold toran for your doorway.', ar: 'القطيفة وهدايا مدروسة في الطريق إليكم. يفتح الحجز المسبق قريباً، ونبدأ بتوران من القطيفة لمدخل بيتكم.' }} /></p>
        </div>
        <div className="diw__aside">
          <p className="diw__date"><Bi text={{ en: '8 November', ar: '٨ نوفمبر' }} /></p>
          {notify
            ? <a className="button button--ghost" href={notify} target="_blank" rel="noopener noreferrer"><span><Bi text={label} /></span><span aria-hidden="true">↗</span></a>
            : <ArrowLink href="/contact" variant="ghost" label={label} />}
        </div>
      </div>
    </section>
  );
}
