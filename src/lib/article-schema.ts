import { SITE_URL } from './site';

/** Article schema for journal/guide pages. Shares the site Organization from site-schema.ts. */
export function articleSchema(path: string, headline: string, description: string, image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: `${SITE_URL}${path}`,
    mainEntityOfPage: `${SITE_URL}${path}`,
    inLanguage: 'en-AE',
    ...(image ? { image: `${SITE_URL}${image}` } : {}),
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}
