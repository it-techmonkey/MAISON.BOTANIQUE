import { BUSINESS, SITE_URL } from './site';

/** Shared identity for pages and product sellers. Add public contact/profile links only after verification. */
export function siteSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Maison Botanique',
        legalName: BUSINESS.legalName.en,
        url: `${SITE_URL}/`,
        address: { '@type': 'PostalAddress', streetAddress: BUSINESS.streetAddress, addressLocality: 'Dubai', addressCountry: 'AE' },
        areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Maison Botanique',
        url: `${SITE_URL}/`,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-AE',
      },
    ],
  };
}
