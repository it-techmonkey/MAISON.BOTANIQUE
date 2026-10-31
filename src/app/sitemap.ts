import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/shopify/catalog';
import { SITE_URL } from '@/lib/site';
import { JOURNAL, OCCASION_CONTENT } from '@/lib/growth-content';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, collections } = await getCatalog();
  const pages = ['', '/shop', '/collections', '/residences', '/services', '/atelier', '/contact', '/delivery', '/faq', '/privacy', '/terms', '/refund-policy', '/guides/flower-care-air-conditioning'];
  return [
    ...['/journal', ...JOURNAL.map(({ slug }) => `/journal/${slug}`), ...OCCASION_CONTENT.map(({ slug }) => `/occasions/${slug}`)]
      .flatMap((path) => [path, `/ar${path}`].map((localized) => ({ url: `${SITE_URL}${localized}`, alternates: { languages: { 'en-AE': `${SITE_URL}${path}`, 'ar-AE': `${SITE_URL}/ar${path}`, 'x-default': `${SITE_URL}${path}` } } }))),
    ...pages.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...collections.filter((collection) => collection.id !== 'frontpage' && collection.productIds.length > 0)
      .map((collection) => ({ url: `${SITE_URL}/collections/${collection.id}`, lastModified: collection.updatedAt })),
    ...products.map((product) => ({ url: `${SITE_URL}/shop/${product.id}`, lastModified: product.updatedAt })),
  ];
}
