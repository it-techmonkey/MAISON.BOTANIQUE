import {
  createShopifyRequestContext,
  createStorefrontClient,
  handleShopifyRoutes,
} from '@shopify/hydrogen';
import { createCustomerAccountServerHandlers } from '@shopify/hydrogen/customer-account';
import { NextResponse, type NextRequest } from 'next/server';
import { createAccountRouteHandlers } from '@/lib/account/routes';
import { createAccountSessionManager, customerSession } from '@/lib/account/session';
import { SHOPIFY_API_VERSION, isShopifyConfigured, shopifyConfig } from '@/lib/shopify/config';

// Runs Shopify's storefront routes before Next routing. The important one is
// the same-origin Storefront API proxy (/api/<version>/graphql.json): through
// it Shopify sets its analytics and checkout-continuity cookies on this
// domain, which is how storefront visits are stitched to checkouts and orders
// now that the old _shopify_y/_shopify_s cookies are gone (April 2026).
// Hydrogen also serves /checkout, cart permalinks and /admin from here, and,
// when customer accounts are configured, sign-in (/account/login,
// /account/authorize, /account/refresh, /account/logout) and the account
// endpoints in src/lib/account/routes.ts.

type SessionManager = Parameters<typeof handleShopifyRoutes>[0]['sessionManager'];

// Without customer accounts nothing is stored in a session; Hydrogen still
// requires the interface.
const statelessSession = (request: NextRequest): SessionManager => ({
  getSessionOrigin: () => request.nextUrl.origin,
  getSessionItem: () => undefined,
  setSessionItem: () => undefined,
  removeSessionItem: () => undefined,
});

// The bag is attached to the signed-in customer by POST /api/account/cart
// (src/lib/account/routes.ts), called from the browser cart, and forgotten
// on sign-out. Hydrogen's cartServerHandlers option is not used: its check
// fails under `next dev`, where the core and customer-account entry points
// load separate copies of Hydrogen's cart module.
const accountHandlers = customerSession
  ? [
    createCustomerAccountServerHandlers({
      customerSession,
      defaultPostLoginRedirectPathname: '/account',
      loginFailedRedirectPath: '/account?login=failed',
      postLogoutRedirectUri: '/',
    }),
    createAccountRouteHandlers(),
  ]
  : [];

export async function proxy(request: NextRequest) {
  // next.config.ts turns off Next's trailing-slash redirect for the PostHog
  // relay; keep it for site URLs (/shop/ -> /shop).
  const { pathname } = request.nextUrl;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    // A plain URL: NextURL would keep the trailing slash.
    const url = new URL(request.url);
    url.pathname = pathname.replace(/\/+$/, '') || '/';
    return NextResponse.redirect(url.toString(), 308);
  }

  if (!isShopifyConfigured) return NextResponse.next();

  const requestContext = createShopifyRequestContext({
    request,
    i18n: { country: shopifyConfig.country, language: 'EN' },
  });
  const storefrontClient = createStorefrontClient({
    type: 'public',
    requestContext,
    config: {
      storeDomain: shopifyConfig.domain,
      publicStorefrontToken: shopifyConfig.publicToken,
      apiVersion: SHOPIFY_API_VERSION,
      storefrontId: shopifyConfig.storefrontId || undefined,
    },
  });

  const shopifyRoute = handleShopifyRoutes({
    request,
    requestContext,
    sessionManager: customerSession ? createAccountSessionManager(request, request.nextUrl.origin) : statelessSession(request),
    storefrontClient,
    handlers: accountHandlers,
  });
  if (shopifyRoute) {
    // A failed sign-in step (for example an HTTP origin in local development,
    // or Shopify unreachable) returns to the account page instead of an error page.
    if (!pathname.startsWith('/account/')) return shopifyRoute;
    return shopifyRoute.catch((error: unknown) => {
      console.error('[account]', error);
      return NextResponse.redirect(new URL('/account?login=failed', request.url), 303);
    });
  }

  const response = NextResponse.next({ request: { headers: requestContext.getForwardedRequestHeaders() } });
  requestContext.applyResponseHeaders(response.headers);
  // Like `poweredByHeader: false` in next.config.ts.
  response.headers.delete('powered-by');
  return response;
}

export const config = {
  // Everything except Next's static output, public files and the PostHog relay.
  matcher: ['/((?!_next/static|_next/image|_next/data|assets/|brand/|favicon\\.(?:svg|ico)|icon\\.png|apple-icon\\.png|mb-relay/).*)'],
};
