import Turntable from '@/components/Turntable';
import HeroPromises from '@/components/store/HeroPromises';
import CollectionBrowser from '@/components/store/CollectionBrowser';
import HomeSections from '@/components/store/HomeSections';
import { ResidencesBand } from '@/components/store/Residences';
import '@/styles/home.css';

// Rebuild at most every five minutes; the Shopify product webhook
// (/api/revalidate) refreshes the catalog immediately after an edit.
export const revalidate = 300;

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
