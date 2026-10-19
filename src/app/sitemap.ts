import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/shopify/catalog';
import { OCCASIONS, SITE_URL } from '@/lib/site';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, collections } = await getCatalog();
  const pages = ['', '/shop', '/collections', '/occasions', '/residences', '/services', '/atelier', '/contact', '/delivery', '/faq', '/privacy', '/terms'];
  return [
    ...pages.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...OCCASIONS.map((occasion) => ({ url: `${SITE_URL}/occasions/${occasion.id}` })),
    ...collections.map((collection) => ({ url: `${SITE_URL}/collections/${collection.id}` })),
    ...products.map((product) => ({ url: `${SITE_URL}/shop/${product.id}` })),
  ];
}
