'use client';

import { hamperFromPrice } from '@/lib/hamper';
import Money from './Money';
import { useStore } from './StoreProvider';

/** "Ready-made hampers from AED 135", so the price is on the first screen. */
export default function HamperFromPrice() {
  const { ar, t } = useStore();
  return <p className="hamper-from">{t('Ready-made hampers from', 'سلال جاهزة تبدأ من')} <Money amount={hamperFromPrice()} ar={ar} /></p>;
}
