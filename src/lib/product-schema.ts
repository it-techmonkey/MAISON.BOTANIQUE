import type { Product } from './types';

export function productSchema(product: Product, siteUrl: string, faqs?: { question: string; answer: string }[]) {
  const businessId = `${siteUrl}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Shop', item: `${siteUrl}/shop` },
          { '@type': 'ListItem', position: 2, name: product.name, item: `${siteUrl}/shop/${product.id}` },
        ],
      },
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
      ...(faqs && faqs.length ? [{
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
      }] : []),
    ],
  };
}
