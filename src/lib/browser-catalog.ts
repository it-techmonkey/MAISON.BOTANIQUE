import type { Catalog, Product } from './types';

type DetailField = 'description' | 'descriptionAr' | 'feature' | 'answerSummary' | 'answerSummaryAr' | 'faq';
export type BrowserProduct = Omit<Product, DetailField> & Partial<Pick<Product, DetailField>>;
export type BrowserCatalog = Omit<Catalog, 'products'> & { products: BrowserProduct[] };

/** Keep search, price, size and personalisation facts; long page-only text stays on the server. */
export function browserCatalog(catalog: Catalog): BrowserCatalog {
  return { ...catalog, products: catalog.products.map((product) => {
    const { description, descriptionAr, feature: _feature, answerSummary: _summary, answerSummaryAr: _summaryAr, faq: _faq, ...card } = product;
    return { ...card, ...(!product.composition.length ? { description } : {}), ...(!product.compositionAr.length ? { descriptionAr } : {}) };
  }) };
}

export function hydrateBrowserCatalog(catalog: BrowserCatalog): Catalog {
  return { ...catalog, products: catalog.products.map((product) => ({
    description: '', descriptionAr: '', feature: '', answerSummary: '', answerSummaryAr: '', faq: [], ...product,
  })) };
}
