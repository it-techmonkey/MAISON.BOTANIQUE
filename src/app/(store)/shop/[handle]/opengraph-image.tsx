import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { getCatalog } from '@/lib/shopify/catalog';
import fallbackImage from '../../../opengraph-image.jpg';

// The link-preview photo for WhatsApp, iMessage, Facebook and others. Shopify's
// CDN sends WebP to any client that accepts it, and WhatsApp does not reliably
// show WebP previews, so the product photo is re-encoded here as a JPEG:
// the whole bouquet, centred on the product's paper background.
export const alt = 'Flowers from Maison Botanique, Dubai';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';
export const revalidate = 86400;

async function loadPhoto(src: string) {
  if (src.startsWith('/')) return readFile(join(process.cwd(), 'public', src));
  const response = await fetch(src, { headers: { Accept: 'image/jpeg,image/png,image/*' } });
  if (!response.ok) throw new Error(`Photo fetch failed: ${response.status} ${src}`);
  return Buffer.from(await response.arrayBuffer());
}

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  try {
    const { products } = await getCatalog();
    const product = products.find((item) => item.id === handle);
    if (!product || product.image.endsWith('.svg')) throw new Error(`No product photo for ${handle}`);
    const jpeg = await sharp(await loadPhoto(product.image))
      .resize(size.width, size.height, { fit: 'contain', background: product.bg })
      .flatten({ background: product.bg })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (error) {
    console.warn('[opengraph-image]', error);
    return new Response(null, { status: 307, headers: { Location: fallbackImage.src } });
  }
}
