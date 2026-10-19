import { getShopifyScriptTags, type ShopifyScriptTagDescriptor } from '@shopify/hydrogen';
import { SHOPIFY_CONSENT, shopifyScriptsShop } from '@/lib/analytics/shopify-config';

// Shopify's storefront scripts, rendered once in the document head: the
// analytics bus, the Customer Privacy API (consent-tracking-api v0.2), the
// storefront analytics and performance scripts. The browser half is
// <ShopifyAnalytics>, which starts them after hydration.

function toReactAttributes(attributes: Record<string, unknown> = {}) {
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    props[name === 'crossorigin' ? 'crossOrigin' : name] = value;
  }
  return props;
}

function Tag({ descriptor }: { descriptor: ShopifyScriptTagDescriptor }) {
  const props = toReactAttributes(descriptor.attributes);
  if (descriptor.tagName === 'link') return <link {...props} />;
  return descriptor.innerHTML
    ? <script {...props} dangerouslySetInnerHTML={{ __html: descriptor.innerHTML }} />
    : <script {...props} />;
}

export default function ShopifyScriptTags() {
  const shop = shopifyScriptsShop();
  if (!shop) return null;
  const { tags } = getShopifyScriptTags({
    shop,
    i18n: { country: 'AE', language: 'EN', currency: 'AED' },
    consent: SHOPIFY_CONSENT,
    analytics: { channel: 'headless' },
  });
  return <>{tags.map((descriptor, index) => <Tag key={`${descriptor.tagName}-${index}`} descriptor={descriptor} />)}</>;
}
