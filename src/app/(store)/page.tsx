import CollectionBrowser from '@/components/store/CollectionBrowser';
import Turntable from '@/components/Turntable';
import '@/styles/home.css';

// Rebuild at most every five minutes; the Shopify product webhook
// (/api/revalidate) refreshes the catalog immediately after an edit.
export const revalidate = 300;

// The hero, then the whole collection. Header and footer links filter the
// collection in place (/#roses, /#occasion/birthday, /#search).
export default function HomePage() {
  return (
    <>
      <Turntable />
      <CollectionBrowser listId="home" />
    </>
  );
}
