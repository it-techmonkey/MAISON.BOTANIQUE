'use client';

import { useEffect, useRef } from 'react';
import { publishCollectionViewed } from '@/lib/analytics/shopify';
import { useStore } from '@/components/store/StoreProvider';

/** Shopify `collection_viewed`, once per collection page. */
export default function CollectionViewed({ handle }: { handle: string }) {
  const { collections } = useStore();
  const reported = useRef<string | null>(null);
  useEffect(() => {
    const collection = collections.find((item) => item.id === handle);
    if (!collection || reported.current === handle) return;
    reported.current = handle;
    publishCollectionViewed(collection);
  }, [collections, handle]);
  return null;
}
