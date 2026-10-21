// PostHog loads after the page has (instrumentation-client.ts starts it), so
// its ~100KB library never competes with the first photo for the connection.
// Calls made before then wait in a queue and run in order once it is ready;
// each event keeps the time it happened.

import type { PostHog } from 'posthog-js';
import { POSTHOG_HOSTS, POSTHOG_KEY, POSTHOG_RELAY_PATH, isPostHogEnabled } from './config';

type Task = (posthog: PostHog) => void;

export function createPostHogClient(load: () => Promise<PostHog | null>, enabled: boolean) {
  let instance: PostHog | null = null;
  let pending: Promise<PostHog | null> | null = null;
  let failed = false;
  let queue: Task[] = [];

  const runTask = (task: Task, posthog: PostHog) => {
    try { task(posthog); } catch (error) { console.warn('[posthog]', error); }
  };

  /** Loads PostHog once; later calls return the same promise. */
  function start(): Promise<PostHog | null> {
    if (!enabled) return Promise.resolve(null);
    pending ??= load().catch((error) => { console.warn('[posthog] failed to load', error); return null; }).then((posthog) => {
      instance = posthog;
      failed = !posthog;
      const tasks = queue;
      queue = [];
      if (posthog) tasks.forEach((task) => runTask(task, posthog));
      return posthog;
    });
    return pending;
  }

  return {
    start,
    /** Runs now when PostHog is ready, otherwise once it has loaded, in call order. */
    run(task: Task) {
      if (!enabled || failed) return;
      if (instance) runTask(task, instance);
      else queue.push(task);
    },
    /** PostHog once ready, waiting at most `ms`; starts loading if it has not yet. */
    ready(ms: number): Promise<PostHog | null> {
      if (instance || !enabled || failed) return Promise.resolve(instance);
      return Promise.race([start(), new Promise<null>((resolve) => { setTimeout(() => resolve(null), ms); })]);
    },
  };
}

function initPostHog(posthog: PostHog): PostHog | null {
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
    return posthog.__loaded ? posthog : null;
  } catch (error) {
    console.warn('[posthog] init failed', error);
    return null;
  }
}

export const postHog = createPostHogClient(
  () => import('posthog-js').then(({ default: posthog }) => initPostHog(posthog)),
  isPostHogEnabled,
);
