import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/shopify/catalog';
import { SITE_URL } from '@/lib/site';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, collections } = await getCatalog();
  const pages = ['', '/shop', '/collections', '/residences', '/services', '/atelier', '/contact', '/delivery', '/faq', '/privacy', '/terms', '/refund-policy', '/guides/flower-care-air-conditioning', '/guides/flowers-for-a-dinner-host', '/guides/congratulations-flowers-dubai'];
  return [
    ...pages.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...collections.filter((collection) => collection.id !== 'frontpage' && collection.productIds.length > 0)
      .map((collection) => ({ url: `${SITE_URL}/collections/${collection.id}`, lastModified: collection.updatedAt })),
    ...products.map((product) => ({ url: `${SITE_URL}/shop/${product.id}`, lastModified: product.updatedAt })),
  ];
}
