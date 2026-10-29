'use client';

import { isSeasonal } from '@/lib/seasonal';
import Money from './Money';
import { useStore } from './StoreProvider';

/** The 25% welcome offer is for eligible new customers only, so it is a separate line, not part of the sale tag. */
export default function FirstOrderPrice({ id, price, className = '' }: { id: string; price: number; className?: string }) {
  const { ar } = useStore();
  if (!(price > 0) || isSeasonal(id)) return null;
  const amount = Math.ceil(price * 0.75);
  return (
    <span className={`first-order${className ? ` ${className}` : ''}`}>
      {ar ? <>{'عند طلبك الأول: '}<Money amount={amount} ar whole /></> : <><Money amount={amount} ar={false} whole />{' on your first order'}</>}
    </span>
  );
}
