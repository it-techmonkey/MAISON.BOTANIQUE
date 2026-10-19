// Runs before the app hydrates (Next.js client instrumentation), so the first
// pageview and everything after it are captured.

import posthog from 'posthog-js';
import { POSTHOG_HOSTS, POSTHOG_KEY, POSTHOG_RELAY_PATH } from '@/lib/analytics/config';

if (POSTHOG_KEY) {
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_RELAY_PATH,
      ui_host: POSTHOG_HOSTS.ui,
      // Dated defaults: pageviews on every client-side path change
      // ('history_change'), and localhost marked as internal traffic.
      defaults: '2026-08-30',
      // Pageleave carries time on page and scroll depth for the previous page.
      capture_pageleave: true,
      capture_exceptions: true,
      // Click, rage-click, mouse-move and scroll-depth maps per page.
      capture_heatmaps: true,
      // Clicks on things that look interactive but do nothing.
      capture_dead_clicks: true,
      // LCP, CLS, FCP and INP per pageview; network timing in recordings.
      capture_performance: { web_vitals: true, network_timing: true },
      // Console warnings and errors alongside session recordings.
      enable_recording_console_log: true,
      // Anonymous visitors are counted without creating person profiles.
      person_profiles: 'identified_only',
      session_recording: {
        maskAllInputs: true,
        // Gift notes, delivery dates and other personal text shown back to the visitor.
        maskTextSelector: '[data-ph-mask]',
      },
    });
    posthog.register({ storefront: 'maison-botanique' });
  } catch (error) {
    console.warn('[posthog] init failed', error);
  }
}
