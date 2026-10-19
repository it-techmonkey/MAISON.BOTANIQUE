import Turntable from '@/components/Turntable';
import HeroPromises from '@/components/store/HeroPromises';
import HomeSections from '@/components/store/HomeSections';
import { ResidencesBand } from '@/components/store/Residences';
import '@/styles/home.css';

// Rebuild at most every five minutes; the Shopify product webhook
// (/api/revalidate) refreshes the catalog immediately after an edit.
export const revalidate = 300;

// The hero, ways to shop (occasion, budget, most loved) and the residences
// band. The full collection, with search and filters, lives on /shop.
export default function HomePage() {
  return (
    <>
      <Turntable />
      <HeroPromises />
      <HomeSections />
      <ResidencesBand />
    </>
  );
}
