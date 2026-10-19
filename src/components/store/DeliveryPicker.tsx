'use client';

import { useEffect, useId, useState } from 'react';
import {
  DELIVERY_SLOTS, MAX_DAYS_AHEAD, SAME_DAY_LEAD_MINUTES, addDays, dubaiNow, earliestDate, slotsFor,
  type DeliverySchedule, type ScheduleProblem,
} from '@/lib/delivery';
import { useStore } from './StoreProvider';

/** Dubai's date and time, read after hydration and refreshed every minute. */
export function useDubaiNow() {
  const [now, setNow] = useState<ReturnType<typeof dubaiNow> | null>(null);
  useEffect(() => {
    setNow(dubaiNow());
    const timer = window.setInterval(() => setNow(dubaiNow()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export const scheduleMessages = {
  missing_date: { en: 'Please choose a delivery date.', ar: 'يرجى اختيار تاريخ التوصيل.' },
  missing_slot: { en: 'Please choose a delivery time.', ar: 'يرجى اختيار وقت التوصيل.' },
  date_passed: { en: 'That date has passed. Please choose another.', ar: 'انقضى هذا التاريخ. يرجى اختيار تاريخ آخر.' },
  slot_passed: { en: 'That time is no longer available today. Please choose another.', ar: 'لم يعد هذا الوقت متاحاً اليوم. يرجى اختيار وقت آخر.' },
} satisfies Record<ScheduleProblem, { en: string; ar: string }>;

interface DeliveryPickerProps {
  value: Partial<DeliverySchedule>;
  onChange: (next: Partial<DeliverySchedule>) => void;
  problem?: ScheduleProblem | null;
  /** Smaller heading for the bag. */
  compact?: boolean;
}

/** Delivery date (today, tomorrow or a chosen day) and a three-hour time slot, Dubai time. */
export default function DeliveryPicker({ value, onChange, problem, compact = false }: DeliveryPickerProps) {
  const { ar, t } = useStore();
  const id = useId();
  const now = useDubaiNow();
  const today = now?.date;
  const tomorrow = today ? addDays(today, 1) : undefined;
  const open = now && value.date ? slotsFor(value.date, now) : [];
  const sameDayOpen = now ? slotsFor(now.date, now).length > 0 : true;

  const chooseDate = (date: string) => {
    if (!now) return;
    const stillOpen = value.slotId && slotsFor(date, now).some((slot) => slot.id === value.slotId);
    onChange({ date, slotId: stillOpen ? value.slotId : undefined });
  };

  const dateProblem = problem === 'missing_date' || problem === 'date_passed';
  const slotProblem = problem === 'missing_slot' || problem === 'slot_passed';

  return (
    <fieldset className={`delivery-picker${compact ? ' delivery-picker--compact' : ''}`} data-ph-mask>
      <legend>{t('Delivery date & time', 'تاريخ ووقت التوصيل')}</legend>

      <div className="delivery-picker__dates" role="group" aria-label={t('Delivery date', 'تاريخ التوصيل')}>
        {sameDayOpen && today && (
          <button type="button" className={`chip${value.date === today ? ' is-selected' : ''}`} aria-pressed={value.date === today} onClick={() => chooseDate(today)}>
            {t('Today', 'اليوم')}
          </button>
        )}
        {tomorrow && (
          <button type="button" className={`chip${value.date === tomorrow ? ' is-selected' : ''}`} aria-pressed={value.date === tomorrow} onClick={() => chooseDate(tomorrow)}>
            {t('Tomorrow', 'غداً')}
          </button>
        )}
        <label className="delivery-picker__calendar">
          <span className="sr-only">{t('Choose a date', 'اختر تاريخاً')}</span>
          <input id={`${id}-date`} type="date" value={value.date ?? ''} min={now ? earliestDate(now) : undefined}
            max={today ? addDays(today, MAX_DAYS_AHEAD) : undefined} aria-invalid={dateProblem || undefined}
            onChange={(event) => { if (event.target.value) chooseDate(event.target.value); }} />
        </label>
      </div>

      <div className="delivery-picker__slots" role="radiogroup" aria-label={t('Delivery time', 'وقت التوصيل')} aria-invalid={slotProblem || undefined}>
        {DELIVERY_SLOTS.map((slot) => {
          const available = open.some((item) => item.id === slot.id);
          const selected = value.slotId === slot.id;
          return (
            <label key={slot.id} className={`slot-option${selected ? ' is-selected' : ''}${available ? '' : ' is-unavailable'}`}>
              <input type="radio" name={`${id}-slot`} value={slot.id} checked={selected} disabled={!available}
                onChange={() => onChange({ date: value.date, slotId: slot.id })} />
              <bdi>{ar ? slot.label.ar : slot.label.en}</bdi>
            </label>
          );
        })}
      </div>

      {problem
        ? <p className="form-error" role="alert">{ar ? scheduleMessages[problem].ar : scheduleMessages[problem].en}</p>
        : <p className="field__hint">{value.date
          ? t(`Same-day slots close ${SAME_DAY_LEAD_MINUTES / 60} hours before they start. One delivery per order.`, 'تُغلق مواعيد التوصيل في اليوم نفسه قبل بدايتها بساعتين. توصيل واحد لكل طلب.')
          : t('Choose a day to see the available times.', 'اختر يوماً لعرض الأوقات المتاحة.')}</p>}
    </fieldset>
  );
}
