import type { Metadata } from 'next';
import Turntable from '@/components/Turntable';
import HeroPromises from '@/components/store/HeroPromises';
import CollectionBrowser from '@/components/store/CollectionBrowser';
import HomeSections from '@/components/store/HomeSections';
import { ResidencesBand } from '@/components/store/Residences';
import '@/styles/home.css';
import shareImage from '../opengraph-image.jpg';

// Rebuild at most every five minutes; the Shopify product webhook
// (/api/revalidate) refreshes the catalog immediately after an edit.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: 'Flower Delivery in Dubai | Maison Botanique' },
  description: 'Explore bouquets and thoughtful gifts from Maison Botanique, with a handwritten card and delivery across the UAE.',
  alternates: { canonical: '/' },
  // Replaces the layout's openGraph (and its file-based photo), so the shared fields and the photo are repeated.
  openGraph: {
    images: [{ url: shareImage.src, width: shareImage.width, height: shareImage.height, type: 'image/jpeg', alt: 'Wrapped flower gifts from Maison Botanique, Dubai' }],
    type: 'website',
    url: '/',
    siteName: 'Maison Botanique',
    locale: 'en_AE',
    alternateLocale: ['ar_AE'],
    title: 'Flower Delivery in Dubai | Maison Botanique',
    description: 'Explore bouquets and thoughtful gifts from Maison Botanique, with a handwritten card and delivery across the UAE.',
  },
};

// The complete shopping journey, with the standalone /shop kept for direct links.
export default function HomePage() {
  return (
    <>
      <Turntable />
      <HeroPromises />
      <HomeSections />
      <CollectionBrowser listId="home" showOccasions={false} />
      <ResidencesBand />
    </>
  );
}
