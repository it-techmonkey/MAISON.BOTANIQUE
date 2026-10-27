import assert from 'node:assert/strict';
import test from 'node:test';
import { metaPageView } from '../src/lib/analytics/meta-pixel.ts';

test('Meta Pixel initializes once and queues a PageView for each route', () => {
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) },
  };

  metaPageView();
  metaPageView();

  assert.deepEqual(window.fbq.queue, [
    ['init', '1111065858477795'],
    ['track', 'PageView'],
    ['track', 'PageView'],
  ]);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
});
