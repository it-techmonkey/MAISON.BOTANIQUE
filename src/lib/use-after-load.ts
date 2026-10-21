'use client';

import { useEffect, useState } from 'react';

// Photos that are not on screen at first (hero slides 2 and 3, the grid below
// its first row, the tiles below the hero) wait for the page's load event, so
// they don't share the connection with the first hero photo. Any scroll, tap
// or key press starts them straight away.

const EARLY_EVENTS = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const;
let loaded = false;
const waiting = new Set<() => void>();

function markLoaded() {
  if (loaded) return;
  loaded = true;
  window.removeEventListener('load', markLoaded);
  for (const event of EARLY_EVENTS) window.removeEventListener(event, markLoaded);
  waiting.forEach((notify) => notify());
  waiting.clear();
}

/** False in the server render and until the page has loaded (or the visitor interacts). */
export function useAfterLoad(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (loaded || document.readyState === 'complete') {
      markLoaded();
      setReady(true);
      return undefined;
    }
    const notify = () => setReady(true);
    waiting.add(notify);
    window.addEventListener('load', markLoaded);
    for (const event of EARLY_EVENTS) window.addEventListener(event, markLoaded, { passive: true });
    return () => { waiting.delete(notify); };
  }, []);
  return ready;
}
