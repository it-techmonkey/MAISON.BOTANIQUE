import { revalidatePath, revalidateTag } from 'next/cache';
import { CATALOG_CACHE_TAG } from '@/lib/shopify/catalog';
import { verifyShopifyWebhook } from '@/lib/shopify/webhook';

// Shopify webhook target for products/create, products/update,
// products/delete, collections/create, collections/update, collections/delete
// and inventory changes. Each delivery is verified with the webhook signing
// secret before the catalog cache is purged.

export async function POST(request: Request) {
  const check = await verifyShopifyWebhook(request);
  if (!check.ok) return check.response;

  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });
  // Every store page reads the catalog through the shared store layout.
  revalidatePath('/', 'layout');
  return Response.json({ revalidated: true, topic: check.topic });
}
