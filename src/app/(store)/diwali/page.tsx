import type { Metadata } from 'next';
import DiwaliEdition from '@/components/store/DiwaliEdition';
import { dubaiNow } from '@/lib/delivery';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Diwali flowers and marigold toran in Dubai',
  description: 'The Maison Botanique Diwali Edition: fresh marigold torans, rangoli, floating marigolds and gifts for the host. Pre-order now, delivered from 5 November in the UAE.',
  alternates: { canonical: '/diwali' },
};

export default function DiwaliPage() {
  return <div className="section--top"><DiwaliEdition initialDubaiDate={dubaiNow().date} /></div>;
}
