'use client';

import { useEffect, useState } from 'react';
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
