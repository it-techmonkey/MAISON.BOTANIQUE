'use client';

import { postHog } from '@/lib/analytics/posthog-client';
import { useEffect } from 'react';

// Replaces the root layout when it fails, so it brings its own <html> and
// minimal inline styles in the brand colours.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    postHog.run((posthog) => posthog.captureException(error, { boundary: 'global' }));
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F5F2EB', color: '#26332B', fontFamily: 'Georgia, serif', textAlign: 'center', padding: 24 }}>
        <main>
          <p style={{ letterSpacing: '.16em', fontSize: 11, textTransform: 'uppercase' }}>Maison Botanique</p>
          <h1 style={{ fontWeight: 400, fontSize: 40 }}>Something went wrong.</h1>
          <p>Please try again in a moment.</p>
          <button type="button" onClick={() => retry()} style={{ marginTop: 16, padding: '12px 22px', border: 0, background: '#26332B', color: '#F5F2EB', cursor: 'pointer' }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
