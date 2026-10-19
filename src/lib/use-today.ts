'use client';

import { useEffect, useState } from 'react';
import { dubaiNow, type DubaiNow } from './delivery';
import { todayDubai } from './format';

/**
 * Today's date in Dubai, read after hydration. Pages are prerendered, so the
 * build date must not end up in date-input `min` attributes.
 */
export function useTodayDubai() {
  const [today, setToday] = useState<string | undefined>(undefined);
  useEffect(() => { setToday(todayDubai()); }, []);
  return today;
}

/** Dubai's date and time, read after hydration and refreshed every minute. */
export function useDubaiNow() {
  const [now, setNow] = useState<DubaiNow | null>(null);
  useEffect(() => {
    setNow(dubaiNow());
    const timer = window.setInterval(() => setNow(dubaiNow()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
