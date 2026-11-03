'use client';

import Link from 'next/link';
import { DIWALI_HANDLES, seasonalExpired } from '@/lib/seasonal';
import { useDubaiNow } from '@/lib/use-today';
import { useStore } from './StoreProvider';

/** "Also for the host" link to the Diwali page. Shown only while that page is selling; it ends with Diwali, the hampers stay. */
export default function HostGiftsLink() {
  const { t } = useStore();
  const today = useDubaiNow()?.date;
  if (!today || DIWALI_HANDLES.every((handle) => seasonalExpired(handle, today))) return null;
  return (
    <p className="hamper-from">
      <Link href="/diwali#host">{t('Also for the host: Maison marigold gifts', 'وأيضاً للمضيف: هدايا القطيفة من ميزون')} <span className="flip-rtl" aria-hidden="true">→</span></Link>
    </p>
  );
}
