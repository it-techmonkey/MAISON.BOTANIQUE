'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { T } from '@/components/store/StoreProvider';

/** Shown inside the store layout when a page fails to render; the header, bag and footer keep working. */
export default function StoreError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    if (posthog.__loaded) posthog.captureException(error, { boundary: 'store' });
  }, [error]);

  return (
    <div className="not-found">
      <p className="eyebrow"><T en="Something went wrong" ar="حدث خطأ ما" /></p>
      <h1><T en="This page did not open as it should." ar="لم تُفتح هذه الصفحة كما ينبغي." /></h1>
      <p><T en="Please try again. Your bag is safe." ar="يرجى المحاولة مجدداً. حقيبتك محفوظة." /></p>
      <div className="button-row">
        <button className="button" type="button" onClick={() => retry()}><span><T en="Try again" ar="حاول مجدداً" /></span><span aria-hidden="true">↻</span></button>
        <a className="button button--ghost" href="/"><T en="Return home" ar="العودة للرئيسية" /></a>
      </div>
    </div>
  );
}
