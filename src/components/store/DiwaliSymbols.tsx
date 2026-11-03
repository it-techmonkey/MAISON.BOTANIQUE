import Link from 'next/link';
import type { ReactNode } from 'react';
import { DIWALI_GROUPS } from '@/lib/seasonal';
import '@/styles/diwali-edition.css';

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">{children}</svg>
);
export const SYMBOLS: Record<string, ReactNode> = {
  door: <Svg><path d="M6 28V14a10 10 0 0 1 20 0v14M2.5 28h27M11 28V15.5a5 5 0 0 1 10 0V28" /></Svg>,
  doorstep: <Svg><path d="M4 19c2 7 22 7 24 0z" /><path d="M16 6c3.5 4 3.5 7.5 0 10-3.5-2.5-3.5-6 0-10z" /><path d="M9 27h14" /></Svg>,
  host: <Svg><rect x="5" y="14" width="22" height="13" /><path d="M5 19h22M16 14v13M16 14c-3-6-9-5-7-1.5M16 14c3-6 9-5 7-1.5" /></Svg>,
};


/** The three places a Diwali piece goes, as links under the home band. Text is passed in so the band keeps its own language switch. */
export function DiwaliSymbolRow({ ar }: { ar: boolean }) {
  return (
    <nav className="dwe-sym-row" aria-label={ar ? 'ديوالي حسب المكان' : 'Diwali by place'}>
      {DIWALI_GROUPS.map((group) => (
        <Link key={group.id} href={`/diwali#${group.id}`}><span className="dwe-sym">{SYMBOLS[group.id]}</span><b>{ar ? group.ar : group.en}</b></Link>
      ))}
    </nav>
  );
}
