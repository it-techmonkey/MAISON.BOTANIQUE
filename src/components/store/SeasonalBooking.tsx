'use client';

import { formatDeliveryDate, hourLabel, lastOrderTime, type DeliveryRange } from '@/lib/delivery';
import { useDubaiNow } from '@/lib/use-today';
import { useStore } from './StoreProvider';

/** Copy follows the existing delivery rules; it does not create a new campaign deadline. */
export default function SeasonalBooking({ range }: { range: DeliveryRange }) {
  const { ar, t } = useStore();
  const now = useDubaiNow();
  const cutoff = lastOrderTime(range.to, { date: range.to, minutes: 0 }, range);
  const closed = now && lastOrderTime(range.to, now, range) === null;
  return <div className="seasonal-booking">
    {cutoff !== null && <p>{closed ? t('Bookings closed', 'انتهى الحجز') : <>
      <span>{t('Last orders:', 'آخر موعد للطلب:')}</span>{' '}
      <bdi>{formatDeliveryDate(range.to, ar)} · {hourLabel(cutoff, ar)}</bdi>{' '}{t('(Dubai time)', '(بتوقيت دبي)')}
    </>}</p>}
    <p><span>{t('Delivery:', 'التوصيل:')}</span>{' '}<bdi>{formatDeliveryDate(range.from, ar)} – {formatDeliveryDate(range.to, ar)}</bdi></p>
  </div>;
}
