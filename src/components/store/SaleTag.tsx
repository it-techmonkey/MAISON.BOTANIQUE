'use client';

import { discountPercent, percentLabel } from '@/lib/discount';
import { useStore } from './StoreProvider';

/**
 * "52% off" beside a struck-through price. Worked out from the two prices,
 * so it always matches what the shopper sees; hidden below a 5% saving.
 */
export default function SaleTag({ price, compareAtPrice, className = '' }: { price: number; compareAtPrice: number | null | undefined; className?: string }) {
  const { ar } = useStore();
  const percent = discountPercent(price, compareAtPrice);
  if (percent < 5) return null;
  const label = ar ? `خصم ${percentLabel(percent, true)}` : `${percentLabel(percent, false)} off`;
  return <span className={`sale-tag${className ? ` ${className}` : ''}`}>{label}</span>;
}
