import type { Metadata } from 'next';
import { ResidencesPage } from '@/components/store/Residences';
import '@/styles/home.css';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Flowers for your building',
  description: 'Premium flowers delivered to your apartment, across all seven emirates, with same-day delivery in Dubai.',
  alternates: { canonical: '/residences' },
};

export default function ResidencesRoute() {
  return <ResidencesPage />;
}
