// Shopify Cart API, called from the browser with the public Storefront token.
// Shopify owns prices, discounts, stock and the hosted checkout; this module
// only creates and edits the cart and returns its checkout URL.

import type { Locale, Money } from '@/lib/types';
import { shopifyConfig } from './config';
import { StorefrontError, storefrontFetch } from './storefront';

export const GIFT_NOTE_ATTRIBUTE = 'Gift message';
/** Card signature; "Anonymous" when the sender keeps it a secret. */
export const SIGNED_ATTRIBUTE = 'Card signed';
export const ANONYMOUS_ATTRIBUTE = 'Anonymous';
/** Personalisation the product asks for, e.g. a letter or an age number. */
export const CUSTOM_ATTRIBUTE = 'Personalisation';
/** Per-line delivery date used by carts made before order-level scheduling (see lib/delivery). */
export const DELIVERY_DATE_ATTRIBUTE = 'Preferred delivery date';

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  variantId: string;
  productId: string;
  productHandle: string;
  productTitle: string;
  productType: string;
  vendor: string;
  sku: string | null;
  variantTitle: string;
  image: string | null;
  attributes: Record<string, string>;
  unitPrice: Money;
  total: Money;
}

export interface ShopifyCart {
  id: string;
  /** Changes on every confirmed cart mutation; Shopify cart analytics keys on it. */
  updatedAt: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: Money;
  /** Cart-level attributes: the delivery schedule and the analytics IDs. */
  attributes: Record<string, string>;
  lines: ShopifyCartLine[];
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
}

const CART_FIELDS = `#graphql
  fragment CartFields on Cart {
    id
    updatedAt
    checkoutUrl
    totalQuantity
    attributes { key value }
    cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
    lines(first: 100) {
      nodes {
        id
        quantity
        attributes { key value }
        cost {
          amountPerQuantity { amount currencyCode }
          totalAmount { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            sku
            image { url(transform: { maxWidth: 400 }) }
            product { id handle title vendor productType }
          }
        }
      }
    }
  }
`;

const CONTEXT = '@inContext(country: $country, language: $language)';
const CONTEXT_VARS = '$country: CountryCode!, $language: LanguageCode!';

const CART_QUERY = `#graphql
  query Cart($id: ID!, ${CONTEXT_VARS}) ${CONTEXT} { cart(id: $id) { ...CartFields } }
  ${CART_FIELDS}
`;

const USER_ERRORS = 'userErrors { field message } warnings { code message }';

const CART_ATTRIBUTES_UPDATE = `#graphql
  mutation CartAttributesUpdate($cartId: ID!, $attributes: [AttributeInput!]!, ${CONTEXT_VARS}) ${CONTEXT} {
    cartAttributesUpdate(cartId: $cartId, attributes: $attributes) { cart { ...CartFields } ${USER_ERRORS} }
  }
  ${CART_FIELDS}
`;

const CART_CREATE = `#graphql
  mutation CartCreate($input: CartInput!, ${CONTEXT_VARS}) ${CONTEXT} {
    cartCreate(input: $input) { cart { ...CartFields } ${USER_ERRORS} }
  }
  ${CART_FIELDS}
`;

const CART_LINES_ADD = `#graphql
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, ${CONTEXT_VARS}) ${CONTEXT} {
    cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } ${USER_ERRORS} }
  }
  ${CART_FIELDS}
`;

const CART_LINES_UPDATE = `#graphql
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, ${CONTEXT_VARS}) ${CONTEXT} {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } ${USER_ERRORS} }
  }
  ${CART_FIELDS}
`;

const CART_LINES_REMOVE = `#graphql
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!, ${CONTEXT_VARS}) ${CONTEXT} {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } ${USER_ERRORS} }
  }
  ${CART_FIELDS}
`;

interface RawMoney { amount: string; currencyCode: string }
interface RawCart {
  id: string;
  updatedAt: string;
  checkoutUrl: string;
  totalQuantity: number;
  attributes: Array<{ key: string; value: string | null }>;
  cost: { subtotalAmount: RawMoney; totalAmount: RawMoney };
  lines: {
    nodes: Array<{
      id: string;
      quantity: number;
      attributes: Array<{ key: string; value: string | null }>;
      cost: { amountPerQuantity: RawMoney; totalAmount: RawMoney };
      merchandise: {
        id?: string;
        title?: string;
        sku?: string | null;
        image?: { url: string } | null;
        product?: { id: string; handle: string; title: string; vendor: string; productType: string };
      };
    }>;
  };
}
interface MutationResult {
  cart: RawCart | null;
  userErrors: Array<{ field: string[] | null; message: string }>;
  warnings?: Array<{ code: string; message: string }>;
}

const money = (value: RawMoney): Money => ({ amount: Number(value.amount), currencyCode: value.currencyCode });

function normalizeCart(raw: RawCart): ShopifyCart {
  return {
    id: raw.id,
    updatedAt: raw.updatedAt,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    subtotal: money(raw.cost.subtotalAmount),
    attributes: Object.fromEntries(raw.attributes.map((attribute) => [attribute.key, attribute.value ?? ''])),
    lines: raw.lines.nodes.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      variantId: line.merchandise.id ?? '',
      productId: line.merchandise.product?.id ?? '',
      productHandle: line.merchandise.product?.handle ?? '',
      productTitle: line.merchandise.product?.title ?? '',
      productType: line.merchandise.product?.productType ?? '',
      vendor: line.merchandise.product?.vendor ?? '',
      sku: line.merchandise.sku ?? null,
      variantTitle: line.merchandise.title ?? '',
      image: line.merchandise.image?.url ?? null,
      attributes: Object.fromEntries(line.attributes.map((attribute) => [attribute.key, attribute.value ?? ''])),
      unitPrice: money(line.cost.amountPerQuantity),
      total: money(line.cost.totalAmount),
    })),
  };
}

function contextVariables(locale: Locale) {
  return { country: shopifyConfig.country, language: locale === 'ar' ? 'AR' : 'EN' };
}

async function mutate(document: string, field: string, variables: Record<string, unknown>, locale: Locale) {
  const data = await storefrontFetch<Record<string, MutationResult>>(
    document, { ...variables, ...contextVariables(locale) }, { cache: 'no-store' },
  );
  const result = data[field];
  if (result.userErrors.length) throw new StorefrontError(result.userErrors[0].message, 'user');
  if (!result.cart) throw new StorefrontError('Shopify did not return a cart', 'graphql');
  if (result.warnings?.length) console.warn('[cart]', result.warnings.map((warning) => warning.message).join('; '));
  return normalizeCart(result.cart);
}

/** Returns null when the cart no longer exists (for example, after its checkout completed). */
export async function fetchCart(cartId: string, locale: Locale) {
  const data = await storefrontFetch<{ cart: RawCart | null }>(
    CART_QUERY, { id: cartId, ...contextVariables(locale) }, { cache: 'no-store' },
  );
  return data.cart ? normalizeCart(data.cart) : null;
}

export type CartAttribute = { key: string; value: string };

export function createCart(lines: CartLineInput[], locale: Locale, attributes: CartAttribute[] = []) {
  return mutate(CART_CREATE, 'cartCreate', {
    input: { lines, attributes, buyerIdentity: { countryCode: shopifyConfig.country } },
  }, locale);
}

/**
 * Replaces all cart-level attributes (delivery schedule and analytics IDs; gift
 * notes live on lines). Pass the full set: Shopify drops keys left out.
 */
export function updateCartAttributes(cartId: string, attributes: CartAttribute[], locale: Locale) {
  return mutate(CART_ATTRIBUTES_UPDATE, 'cartAttributesUpdate', { cartId, attributes }, locale);
}

export function addCartLines(cartId: string, lines: CartLineInput[], locale: Locale) {
  return mutate(CART_LINES_ADD, 'cartLinesAdd', { cartId, lines }, locale);
}

export function updateCartLines(cartId: string, lines: Array<{ id: string; quantity: number }>, locale: Locale) {
  return mutate(CART_LINES_UPDATE, 'cartLinesUpdate', { cartId, lines }, locale);
}

export function removeCartLines(cartId: string, lineIds: string[], locale: Locale) {
  return mutate(CART_LINES_REMOVE, 'cartLinesRemove', { cartId, lineIds }, locale);
}

/**
 * Re-reads the cart in the shopper's current language so Shopify returns a
 * checkout URL localized to English or Arabic.
 */
export async function getCheckoutUrl(cartId: string, locale: Locale) {
  const cart = await fetchCart(cartId, locale);
  if (!cart) throw new StorefrontError('The cart has expired', 'user');
  const url = new URL(cart.checkoutUrl);
  if (url.protocol !== 'https:') throw new StorefrontError('Shopify returned an invalid checkout URL', 'graphql');
  return url.toString();
}
