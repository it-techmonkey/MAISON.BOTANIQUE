import type { Metadata } from 'next';
import HamperBuilder from '@/components/store/HamperBuilder';
import '@/styles/pages.css';
import '@/styles/hamper.css';

export const metadata: Metadata = {
  title: 'Diwali hampers · Conscious Curations',
  description: 'Build your own Diwali hamper: a handwoven basket, three to five handcrafted pieces and a festive treat, curated by Conscious Curations.',
  alternates: { canonical: '/conscious-curations/diwali' },
};

export default function DiwaliHampersPage() {
  return <HamperBuilder />;
}
