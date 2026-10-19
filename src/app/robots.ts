import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Matches the noindex rule in the root layout: closed until SITE_INDEXABLE=true.
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_INDEXABLE !== 'true') return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/'] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
