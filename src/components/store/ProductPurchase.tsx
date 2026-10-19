'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { trackProductViewed } from '@/lib/analytics/track';
import { occasionPath, findOccasion } from '@/lib/site';
import type { Product } from '@/lib/types';
import { PurchaseOptions, formatAED } from './ShopSheets';
import { useStore } from './StoreProvider';
import '@/styles/shop.css';

/** Name, price and the purchase options on the product page (the same options as the quick-add sheet). */
export default function ProductPurchase({ handle }: { handle: string }) {
  const { products } = useStore();
  const product = products.find((item) => item.id === handle);
  // The page only renders for products in the catalog, so this is a safeguard.
  if (!product) return null;
  return <Purchase key={product.id} product={product} />;
}

function Purchase({ product }: { product: Product }) {
  const { ar, t, addToBag } = useStore();
  const name = ar ? product.nameAr : product.name;
  const composition = ar ? product.compositionAr : product.composition;
  const many = product.sizes.length > 1;

  // Once per product page, with the variant shown first (as Shopify expects).
  const viewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (viewedRef.current === product.id) return;
    viewedRef.current = product.id;
    trackProductViewed(product, product.sizes.find((size) => size.available) ?? product.sizes[0]);
  }, [product]);

  return (
    <div className="purchase">
      <p className="eyebrow">{product.no ? `N° ${String(product.no).padStart(3, '0')} · ` : ''}{ar ? product.categoryAr : product.category}</p>
      <h1>{name}</h1>
      <p className="purchase__price">
        <strong>{many ? `${t('From', 'من')} ` : ''}{formatAED(product.price, ar)}</strong>
        {product.compareAtPrice && <s>{formatAED(product.compareAtPrice, ar)}</s>}
      </p>
      {(ar ? product.lineAr : product.line) && <p className="purchase__line">{ar ? product.lineAr : product.line}</p>}
      {composition.length > 0
        ? <ul className="purchase__composition">{composition.map((item) => <li key={item}>{item}</li>)}</ul>
        : <p className="purchase__description">{ar ? product.descriptionAr : product.description}</p>}

      {product.occasions.length > 0 && (
        <p className="purchase__occasions">
          <span>{t('Lovely for', 'مناسبة لـ')}</span>
          {product.occasions.map((occasionId) => {
            const occasion = findOccasion(occasionId);
            return occasion ? <Link key={occasionId} href={occasionPath(occasionId)}>{ar ? occasion.name.ar : occasion.name.en}</Link> : null;
          })}
        </p>
      )}

      <div className="qa-page">
        <PurchaseOptions product={product} compact onAdd={(options) => addToBag(product, { ...options, source: 'product_page' })} />
      </div>
    </div>
  );
}
