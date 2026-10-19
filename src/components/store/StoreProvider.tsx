'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { useShopCart, type AddItemOptions, type ShopCart } from '@/lib/cart/use-shop-cart';
import { setShopifyLocale } from '@/lib/analytics/shopify';
import { registerCatalogSource, trackLocale } from '@/lib/analytics/track';
import type { Catalog, Collection, Locale, Product } from '@/lib/types';

/** Read by the inline script in the root layout, before the first paint. */
export const LOCALE_STORAGE_KEY = 'maison-botanique-locale';

interface StoreValue {
  locale: Locale;
  ar: boolean;
  setLocale: (locale: Locale) => void;
  /** Picks the English or Arabic string for the current locale. */
  t: <T,>(en: T, ar: T) => T;
  products: Product[];
  collections: Collection[];
  live: boolean;
  cart: ShopCart;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToBag: (product: Product, options?: AddItemOptions) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside <StoreProvider>.');
  return value;
}

/** Bilingual text leaf, so server-rendered pages can stay server components. */
export function T({ en, ar }: { en: ReactNode; ar: ReactNode }) {
  return <>{useStore().ar ? ar : en}</>;
}

// Runs the locale layout effect only in the browser.
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function StoreProvider({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useShopCart(catalog.products, locale);

  useBrowserLayoutEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(LOCALE_STORAGE_KEY); } catch { /* Storage unavailable. */ }
    if (saved === 'ar') setLocaleState('ar');
  }, []);

  useBrowserLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === 'ar' ? 'rtl' : 'ltr';
    // The root layout hides the page for Arabic visitors until this point.
    root.classList.remove('mb-locale-pending');
  }, [locale]);

  // Every analytics event carries the language the visitor is browsing in.
  useEffect(() => {
    setShopifyLocale(locale);
    trackLocale(locale, false);
  }, [locale]);

  useEffect(() => { registerCatalogSource(catalog.source); }, [catalog.source]);

  const setLocale = useCallback((next: Locale) => {
    // Only a visitor's own switch counts as a change (not restoring a saved choice).
    trackLocale(next, true);
    setLocaleState(next);
    try { localStorage.setItem(LOCALE_STORAGE_KEY, next); } catch { /* Private browsing may block storage. */ }
  }, []);

  const { addItem } = cart;
  const addToBag = useCallback((product: Product, options?: AddItemOptions) => {
    void addItem(product, options);
    setCartOpen(true);
  }, [addItem]);

  const value = useMemo<StoreValue>(() => ({
    locale,
    ar: locale === 'ar',
    setLocale,
    t: (en, ar) => (locale === 'ar' ? ar : en),
    products: catalog.products,
    collections: catalog.collections,
    live: catalog.source === 'shopify',
    cart,
    cartOpen,
    setCartOpen,
    addToBag,
  }), [locale, setLocale, catalog, cart, cartOpen, addToBag]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
