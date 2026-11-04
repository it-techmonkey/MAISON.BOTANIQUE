'use client';

import { DELIVERY_FEES } from '@/lib/site';
import { JVC_FREE_DELIVERY } from '@/lib/jvc-delivery';
import Money from './Money';
import { useStore } from './StoreProvider';

/** The delivery fees as one line, read from DELIVERY_FEES so it can never differ from the bag note. JVC is named only while its free delivery is switched on. */
export default function DeliveryFeeLine({ className, elsewhere = false }: { className?: string; elsewhere?: boolean }) {
  const { ar } = useStore();
  const money = (amount: number) => <Money amount={amount} ar={ar} whole />;
  return ar ? (
    <p className={className}>رسوم التوصيل: {money(DELIVERY_FEES.dubai)} في دبي{JVC_FREE_DELIVERY ? '، ومجاني في JVC' : ''}{elsewhere ? <>، و{money(DELIVERY_FEES.otherEmirates)} في بقية الإمارات</> : ''}.</p>
  ) : (
    <p className={className}>Delivery {money(DELIVERY_FEES.dubai)} in Dubai{JVC_FREE_DELIVERY ? ', free in JVC' : ''}{elsewhere ? <>, {money(DELIVERY_FEES.otherEmirates)} elsewhere in the UAE</> : ''}.</p>
  );
}
