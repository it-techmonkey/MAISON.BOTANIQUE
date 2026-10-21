import test from 'node:test';
import assert from 'node:assert/strict';

const { createPostHogClient } = await import('../src/lib/analytics/posthog-client.ts');

function fakePostHog(log) {
  return {
    capture: (event) => log.push(`capture:${event}`),
    register: (props) => log.push(`register:${Object.keys(props).join(',')}`),
    get_distinct_id: () => 'visitor-1',
  };
}

test('calls made before PostHog loads run once it has loaded, in call order', async () => {
  const log = [];
  let loads = 0;
  const client = createPostHogClient(async () => { loads += 1; return fakePostHog(log); }, true);
  client.run((posthog) => posthog.register({ locale: 'ar' }));
  client.run((posthog) => posthog.capture('Product List Viewed'));
  client.run((posthog) => posthog.capture('Product Clicked'));
  assert.deepEqual(log, []);
  await Promise.all([client.start(), client.start()]);
  assert.equal(loads, 1);
  assert.deepEqual(log, ['register:locale', 'capture:Product List Viewed', 'capture:Product Clicked']);
  client.run((posthog) => posthog.capture('Product Added'));
  assert.equal(log.at(-1), 'capture:Product Added');
});

test('a task that throws does not stop the ones after it', async () => {
  const log = [];
  const client = createPostHogClient(async () => fakePostHog(log), true);
  const warn = console.warn;
  console.warn = () => {};
  client.run(() => { throw new Error('boom'); });
  client.run((posthog) => posthog.capture('After'));
  await client.start();
  console.warn = warn;
  assert.deepEqual(log, ['capture:After']);
});

test('cart attribution waits for PostHog, starting it if needed, and gives up after the timeout', async () => {
  const log = [];
  const ready = createPostHogClient(async () => fakePostHog(log), true);
  assert.equal((await ready.ready(1000)).get_distinct_id(), 'visitor-1');

  const slow = createPostHogClient(() => new Promise(() => {}), true);
  const started = Date.now();
  assert.equal(await slow.ready(30), null);
  assert.ok(Date.now() - started < 1000);
});

test('disabled or failed PostHog never loads and drops calls', async () => {
  let loads = 0;
  const off = createPostHogClient(async () => { loads += 1; return fakePostHog([]); }, false);
  off.run(() => assert.fail('should not run'));
  assert.equal(await off.start(), null);
  assert.equal(await off.ready(10), null);
  assert.equal(loads, 0);

  const warn = console.warn;
  console.warn = () => {};
  const broken = createPostHogClient(async () => { throw new Error('blocked'); }, true);
  broken.run(() => assert.fail('should not run'));
  assert.equal(await broken.start(), null);
  console.warn = warn;
  broken.run(() => assert.fail('should not run'));
  assert.equal(await broken.ready(10), null);
});
