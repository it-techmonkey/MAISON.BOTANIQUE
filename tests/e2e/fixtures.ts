// Shared setup for the buying-flow smoke tests.
// - Analytics (PostHog relay) is blocked so test visits never count as shoppers.
// - The welcome-offer popup is snoozed, except in the offer test.
// - The welcome offer is never opted into and no form is ever submitted.
import { test as base, expect, type Page } from '@playwright/test';

/** A best-selling flower product with Signature, Grand and Luxe sizes. Override with E2E_PRODUCT. */
export const PRODUCT = process.env.E2E_PRODUCT || 'eloise-pink-and-white-rose-bouquet';
/** Production live check: a disconnected checkout or a missing WhatsApp number is a failure, not a note. */
export const EXPECT_LIVE = process.env.E2E_EXPECT_LIVE === '1';
export const CHECKOUT_HOST = process.env.E2E_CHECKOUT_HOST || 'shop.maisonbotaniqueflowers.com';

export const test = base.extend<{ showOffer: boolean }>({
  showOffer: [false, { option: true }],
  page: async ({ page, showOffer }, use) => {
    await page.route(/\/mb-relay\/|posthog\.com/, (route) => route.abort());
    if (!showOffer) {
      await page.addInitScript(() => {
        try { localStorage.setItem('mb-launch-offer-v1', JSON.stringify({ dismissedAt: Date.now() })); } catch { /* storage blocked */ }
      });
    }
    await use(page);
  },
});
export { expect };

/** Opens a product page and waits for the purchase options to hydrate. */
export async function openProduct(page: Page, handle = PRODUCT) {
  const response = await page.goto(`/shop/${handle}`);
  expect(response?.status(), `product page /shop/${handle}`).toBe(200);
  await expect(page.locator('.purchase h1')).toBeVisible();
  // The delivery row fills in once the Dubai clock has hydrated.
  await expect(page.locator('.qa-delivery .pd-value')).toBeVisible();
}

/** The header bag button, in either language. */
export const bagButton = (page: Page) => page.locator('.site-header .header-action', { hasText: /Bag|الحقيبة/ });

/** "Use this time": takes the earliest open delivery window, whatever the hour. */
export async function useEarliestDelivery(page: Page) {
  await page.locator('.qa-delivery .pd-link').click();
  await expect(page.locator('.qa-delivery strong.pd-value')).toBeVisible();
}

export async function addToBag(page: Page) {
  const before = await bagCount(page);
  await page.locator('.qa-add').click();
  await expect.poll(() => bagCount(page)).toBe(before + 1);
}

export async function bagCount(page: Page) {
  const text = await bagButton(page).innerText();
  return Number(text.match(/\((\d+)\)/)?.[1] ?? NaN);
}

export async function openBag(page: Page) {
  await bagButton(page).click();
  const bag = page.locator('.ll-shop-panel--cart');
  await expect(bag).toBeVisible();
  return bag;
}

/** Live means the deployment is connected to Shopify (the bag offers the secure checkout). */
export async function isLiveCheckout(page: Page) {
  const label = await page.locator('.ll-shop-primary').innerText();
  return /secure checkout|الدفع الآمن/i.test(label);
}

/** Notes, or in the live check fails, when a deployment is missing a connection the test needs. */
export function notConnected(what: string) {
  const message = `${what} is not connected on this deployment, so this part was not exercised.`;
  expect(EXPECT_LIVE, message).toBe(false);
  test.info().annotations.push({ type: 'not exercised', description: message });
  // Shown on the GitHub check summary, so a green run does not hide the gap.
  if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Not exercised::${test.info().title}: ${message}`);
}

/** The page never scrolls sideways. */
export async function expectNoHorizontalScroll(page: Page, where: string) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return { scroll: Math.max(root.scrollWidth, document.body.scrollWidth), width: root.clientWidth };
  });
  expect(overflow.scroll, `${where}: page is ${overflow.scroll}px wide in a ${overflow.width}px viewport`).toBeLessThanOrEqual(overflow.width);
}

/** Decodes the message in a wa.me link, with non-breaking spaces made plain. */
export function whatsappText(href: string) {
  const url = new URL(href);
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toMatch(/^\/971\d{8,9}$/);
  return (url.searchParams.get('text') ?? '').replace(/[  ]/g, ' ');
}
