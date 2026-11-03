'use client';

import { isSeasonal } from '@/lib/seasonal';
import Money from './Money';
import { useStore } from './StoreProvider';

/** The 25% welcome offer is for eligible new customers only, so it is a separate line, not part of the sale tag. */
export default function FirstOrderPrice({ id, price, compact = false, className = '' }: { id: string; price: number; compact?: boolean; className?: string }) {
  const { ar } = useStore();
  if (!(price > 0)) return null;
  // Seasonal pieces get an empty line of the same height on cards, so the Add buttons in a row stay level.
  if (isSeasonal(id)) return compact ? <span className="first-order" aria-hidden="true">&nbsp;</span> : null;
  const amount = Math.ceil(price * 0.75);
  return (
    <span className={`first-order${className ? ` ${className}` : ''}`}>
      {ar ? <>{compact ? 'طلبك الأول: ' : 'عند طلبك الأول: '}<Money amount={amount} ar whole /></> : <><Money amount={amount} ar={false} whole />{compact ? ' first order' : ' on your first order'}</>}
    </span>
  );
}
