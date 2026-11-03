import type { Metadata } from 'next';
import FlagDayPage from '@/components/store/FlagDay';
import { dubaiNow } from '@/lib/delivery';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'UAE flag roses in a heart or round box, Dubai',
  description: 'Red, white, green and black roses laid out as the UAE flag, in a heart box or a round box with a handwritten card. Made to order in Dubai, delivered from 4 November.',
  alternates: { canonical: '/flag-day' },
};

export default function FlagDayRoute() {
  return <div className="section--top"><FlagDayPage initialDubaiDate={dubaiNow().date} /></div>;
}
