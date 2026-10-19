// Customer account endpoints, served by Hydrogen's route handling in
// src/proxy.ts next to its /account/login, /account/authorize,
// /account/refresh and /account/logout handlers. Server only.
//
// GET  /api/account/status   { enabled, loggedIn } for the header and checkout
// GET  /api/account/summary  profile, addresses and recent orders for /account
// POST /api/account/cart     attaches the signed-in customer to the `cart` cookie's cart

import { createShopifyRouteHandler, getCartId, type ShopifyRouteHandlerContext, type ShopifyRouteHandlerGroup } from '@shopify/hydrogen';
import { createCustomerAccountClient, gql } from '@shopify/hydrogen/customer-account';
import { shopifyConfig } from '@/lib/shopify/config';
import { storefrontFetch } from '@/lib/shopify/storefront';
import { customerSession } from './session';

const NO_STORE = { 'cache-control': 'private, no-store' };

const CUSTOMER_QUERY = gql(`#graphql
  query MaisonCustomer {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress { emailAddress }
      phoneNumber { phoneNumber }
      defaultAddress { id }
      addresses(first: 6) { nodes { id formatted(withName: true, withCompany: false) } }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice { amount currencyCode }
          statusPageUrl
          customAttributes { key value }
          lineItems(first: 4) { nodes { title variantTitle quantity image { url } } }
        }
      }
    }
  }
`);

const CART_BUYER_IDENTITY_UPDATE = `#graphql
  mutation AttachCustomer($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) { cart { id } userErrors { message } }
  }
`;

/** Commits the session (a refreshed token) onto the handler's response. */
async function withSession(context: ShopifyRouteHandlerContext, data: unknown) {
  const sessionHeaders = new Headers((await context.sessionManager.commit?.()) ?? undefined);
  for (const [name, value] of Object.entries(NO_STORE)) sessionHeaders.set(name, value);
  return { type: 'json' as const, data, headers: sessionHeaders };
}

const sameOrigin = (request: Request) => {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
};

interface RawOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  totalPrice: { amount: string; currencyCode: string };
  statusPageUrl: string;
  customAttributes: Array<{ key: string; value: string | null }>;
  lineItems: { nodes: Array<{ title: string; variantTitle: string | null; quantity: number; image: { url: string } | null }> };
}

export function createAccountRouteHandlers(): ShopifyRouteHandlerGroup {
  const session = customerSession;
  if (!session) return {};

  return {
    status: createShopifyRouteHandler('/api/account/status', 'GET', async (context) => {
      const loggedIn = await session.isLoggedIn(context.sessionManager, context.requestContext);
      return { type: 'json', data: { enabled: true, loggedIn }, headers: NO_STORE };
    }),

    summary: createShopifyRouteHandler('/api/account/summary', 'GET', async (context) => {
      const accessToken = await session.getOrRefreshAccessToken(context.sessionManager, context.requestContext);
      if (!accessToken) return withSession(context, { loggedIn: false });
      const client = createCustomerAccountClient({ shopId: shopifyConfig.shopId, requestContext: context.requestContext });
      const result = await client.graphql(CUSTOMER_QUERY, { accessToken });
      if (result.errors || !result.data) {
        console.error('[account] customer query', result.errors);
        return withSession(context, { loggedIn: true, error: true });
      }
      const customer = (result.data as { customer: Record<string, unknown> & { orders: { nodes: RawOrder[] } } }).customer;
      return withSession(context, {
        loggedIn: true,
        accountUrl: `https://shopify.com/${shopifyConfig.shopId}/account`,
        customer: {
          ...customer,
          orders: customer.orders.nodes.map((order) => ({
            ...order,
            customAttributes: Object.fromEntries(order.customAttributes.map((attribute) => [attribute.key, attribute.value ?? ''])),
            lineItems: order.lineItems.nodes,
          })),
        },
      });
    }),

    cart: createShopifyRouteHandler('/api/account/cart', 'POST', async (context) => {
      if (!sameOrigin(context.request)) return { type: 'error', status: 403, error: { code: 'forbidden', message: 'Cross-origin request' } };
      const cartId = getCartId(context.request);
      const accessToken = cartId ? await session.getOrRefreshAccessToken(context.sessionManager, context.requestContext) : undefined;
      if (!cartId || !accessToken) return withSession(context, { attached: false });
      try {
        const data = await storefrontFetch<{ cartBuyerIdentityUpdate: { userErrors: Array<{ message: string }> } }>(
          CART_BUYER_IDENTITY_UPDATE,
          { cartId, buyerIdentity: { customerAccessToken: accessToken, countryCode: shopifyConfig.country } },
          { cache: 'no-store' },
        );
        const errors = data.cartBuyerIdentityUpdate.userErrors;
        if (errors.length) console.warn('[account] attach cart', errors.map((error) => error.message).join('; '));
        return withSession(context, { attached: errors.length === 0 });
      } catch (error) {
        console.error('[account] attach cart', error);
        return withSession(context, { attached: false });
      }
    }),
  };
}
