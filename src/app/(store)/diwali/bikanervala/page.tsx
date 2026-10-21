import type { Metadata } from 'next';
import DiwaliBikanervala from '@/components/store/DiwaliBikanervala';
import '@/styles/diwali.css';

// Reached only by its direct link: it is in no menu, collection or sitemap, and
// it asks search engines to skip it even once the rest of the site is indexable.
export const metadata: Metadata = {
  title: 'Maison Botanique × Bikanervala · Diwali',
  description: 'Maison Botanique flowers, Bikanervala sweets, one Diwali gift.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function DiwaliBikanervalaPage() {
  return <DiwaliBikanervala />;
}
