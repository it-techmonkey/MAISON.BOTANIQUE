import type { Product } from './types';

export function productSchema(product: Product, siteUrl: string) {
  const businessId = `${siteUrl}/#business`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'LocalBusiness', '@id': businessId, name: 'Maison Botanique', url: siteUrl, areaServed: { '@type': 'Country', name: 'United Arab Emirates' } },
      {
        '@type': 'Product', name: product.name, image: [product.image],
        description: product.answerSummary || product.description,
        url: `${siteUrl}/shop/${product.id}`, brand: { '@type': 'Brand', name: 'Maison Botanique' },
        offers: product.sizes.map((size) => ({
          '@type': 'Offer', name: size.name, url: `${siteUrl}/shop/${product.id}`,
          price: size.price, priceCurrency: product.currencyCode, seller: { '@id': businessId },
          ...(product.shopifyId ? { availability: `https://schema.org/${size.available ? 'InStock' : 'OutOfStock'}` } : {}),
          ...(size.compareAtPrice ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: size.compareAtPrice, priceCurrency: product.currencyCode, priceType: 'https://schema.org/StrikethroughPrice' } } : {}),
        })),
      },
    ],
  };
}
