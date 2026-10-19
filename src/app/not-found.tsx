import Link from 'next/link';
import PageNotFound from '@/components/analytics/PageNotFound';
import '@/styles/global.css';

// Unmatched URLs render outside the store layout, so this page is English
// only and links straight back to the shop.
export default function NotFound() {
  return (
    <main className="not-found">
      <PageNotFound />
      <p className="eyebrow">Maison Botanique · 404</p>
      <h1>This stem seems to have wandered off.</h1>
      <p>The page you are looking for is not here. Let us take you back to the flowers.</p>
      <div className="button-row">
        <Link className="button" href="/">Return home</Link>
        <Link className="button button--ghost" href="/shop">Shop the collection</Link>
      </div>
    </main>
  );
}
