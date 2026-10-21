// Responsive product photos without an image optimiser: Shopify's CDN resizes
// on request (`&width=`), and the bundled preview photos come in 480 and 960.

const SHOPIFY_CDN = /^https:\/\/cdn\.shopify\.com\//;
// The Storefront API's `url(transform: { maxWidth })` bakes the size into the
// file name (`…_1200x.webp`), and the CDN then ignores `width=`.
const SHOPIFY_SIZE_SUFFIX = /_(?:\d+x\d*|x\d+)(?=\.[a-z0-9]+(?:\?|$))/i;
const LOCAL_SIZES = /-(480|960)\.webp$/;

/** The photo at roughly `width` pixels wide (never wider than the original). */
export function imageAt(url: string, width: number): string {
  if (SHOPIFY_CDN.test(url)) {
    const [path, query = ''] = url.replace(SHOPIFY_SIZE_SUFFIX, '').split('?');
    const params = new URLSearchParams(query);
    params.set('width', String(width));
    return `${path}?${params.toString()}`;
  }
  if (LOCAL_SIZES.test(url)) return url.replace(LOCAL_SIZES, width <= 480 ? '-480.webp' : '-960.webp');
  return url;
}

/** A `srcSet` across the given widths, or undefined for photos that only come in one size. */
export function imageSrcSet(url: string, widths: number[]): string | undefined {
  if (SHOPIFY_CDN.test(url)) return widths.map((width) => `${imageAt(url, width)} ${width}w`).join(', ');
  if (LOCAL_SIZES.test(url)) return `${imageAt(url, 480)} 480w, ${imageAt(url, 960)} 960w`;
  return undefined;
}
