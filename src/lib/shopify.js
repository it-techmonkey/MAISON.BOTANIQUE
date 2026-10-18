// Shopify's public Storefront API can be called from a browser. Never put an
// Admin API token or private Storefront token in VITE_* environment variables.
// The sample catalog intentionally has no variant IDs, so this adapter cannot
// create a live cart until a real Shopify catalog is mapped explicitly.
// Before enabling production checkout, reconcile displayed prices with Shopify
// merchandise prices. This preview's subtotals are sample estimates only.

const CART_CREATE = `mutation CreateCart($input: CartInput) {
  cartCreate(input: $input) {
    cart { id checkoutUrl }
    userErrors { field message }
  }
}`;

export function readShopifyConfig() {
  return {
    domain: import.meta.env.VITE_SHOPIFY_DOMAIN?.trim() || '',
    publicToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN?.trim() || '',
    apiVersion: import.meta.env.VITE_SHOPIFY_API_VERSION?.trim() || '2026-10',
  };
}

export function getCheckoutReadiness(cart, products, config = readShopifyConfig()) {
  if (!Array.isArray(cart) || cart.length === 0) return { ready: false, reason: 'empty' };
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  if (cart.some((line) => line.deliveryDate && (
    !/^\d{4}-\d{2}-\d{2}$/.test(line.deliveryDate) || line.deliveryDate < today
  ))) return { ready: false, reason: 'date' };
  const domain = config.domain?.toLowerCase();
  const validDomain = typeof domain === 'string' &&
    /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain);
  if (!validDomain || !config.publicToken) return { ready: false, reason: 'store' };
  const variantsReady = cart.every((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product?.shopifyVariants?.[line.sizeId]?.startsWith('gid://shopify/ProductVariant/');
  });
  if (!variantsReady) return { ready: false, reason: 'variants' };
  return { ready: true, reason: null };
}

export async function createShopifyCheckout(cart, products, config = readShopifyConfig()) {
  const readiness = getCheckoutReadiness(cart, products, config);
  if (!readiness.ready) throw new Error(`Shopify checkout unavailable: ${readiness.reason}`);
  if (!/^20\d\d-(01|04|07|10)$/.test(config.apiVersion)) {
    throw new Error('Invalid Storefront API version');
  }

  const lines = cart.map((line) => {
    const product = products.find((item) => item.id === line.productId);
    const attributes = [];
    if (line.note) attributes.push({ key: 'Gift message', value: line.note.slice(0, 280) });
    if (line.anonymous) attributes.push({ key: 'Card signed', value: 'Anonymous' });
    else if (line.signedAs) attributes.push({ key: 'Card signed', value: line.signedAs.slice(0, 60) });
    if (line.custom) attributes.push({ key: 'Personalisation', value: line.custom.slice(0, 24) });
    if (line.deliveryDate) attributes.push({ key: 'Preferred delivery date', value: line.deliveryDate });
    return {
      merchandiseId: product.shopifyVariants[line.sizeId],
      quantity: Math.min(99, Math.max(1, Number(line.quantity) || 1)),
      attributes,
    };
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`https://${config.domain}/api/${config.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.publicToken,
      },
      body: JSON.stringify({ query: CART_CREATE, variables: { input: { lines } } }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('The store is temporarily unavailable. Please try again.');
    const payload = await response.json();
    const error = payload.errors?.[0]?.message || payload.data?.cartCreate?.userErrors?.[0]?.message;
    if (error) throw new Error(error);
    const checkoutUrl = payload.data?.cartCreate?.cart?.checkoutUrl;
    if (!checkoutUrl || new URL(checkoutUrl).protocol !== 'https:') {
      throw new Error('The store did not return a valid checkout.');
    }
    return checkoutUrl;
  } finally {
    clearTimeout(timeout);
  }
}
