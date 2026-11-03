// Area: welcome-offer signup UI. Checks the popup, wording and validation only.
// Nothing is ever submitted: any request to the signup endpoint fails the test.
import { test, expect } from './fixtures';

test.use({ showOffer: true });

test('welcome offer opens on arrival with the approved wording and validates without sending', async ({ page }) => {
  const sent: string[] = [];
  await page.route('**/api/enquiry', (route) => { sent.push(route.request().method()); return route.abort(); });
  await page.goto('/');
  const offer = page.getByRole('dialog', { name: '25% off your first order' });
  await expect(offer).toBeVisible({ timeout: 10_000 });
  await expect(offer).toContainText('Sign up and get 25% off your first order.');
  await expect(offer).toContainText('One use per customer');
  // Marketing consent is optional and starts unticked.
  await expect(offer.locator('#lo-consent')).not.toBeChecked();
  // WhatsApp is the default channel with a +971 prefix; email is the alternative.
  await expect(offer.getByRole('radio', { name: 'WhatsApp' })).toHaveAttribute('aria-checked', 'true');
  await expect(offer.locator('.lo-field--phone')).toContainText('+971');
  await offer.locator('#lo-input').fill('12');
  await offer.locator('.lo-cta').click();
  await expect(offer.locator('#lo-error')).toHaveText('Enter a UAE mobile number, for example 50 123 4567.');
  await offer.getByRole('radio', { name: 'Email' }).click();
  await offer.locator('#lo-input').fill('not-an-email');
  await offer.locator('.lo-cta').click();
  await expect(offer.locator('#lo-error')).toHaveText('Enter a valid email address.');
  expect(sent, 'the offer form must not be submitted by tests').toEqual([]);

  await offer.locator('.lo-no').click();
  await expect(offer).toBeHidden();
  await expect(page.locator('.lo-tab')).toBeVisible();
});

test('the offer stays closed after "No thanks" on the next visit', async ({ page }) => {
  await page.goto('/');
  const offer = page.getByRole('dialog', { name: '25% off your first order' });
  await expect(offer).toBeVisible({ timeout: 10_000 });
  await offer.locator('.lo-no').click();
  await page.reload();
  await page.waitForTimeout(2500); // the popup opens 1.5 s after arrival
  await expect(offer).toBeHidden();
});

test('the offer does not cover a product page, and "Ask us" sits beside Add to bag', async ({ page }) => {
  await page.goto('/shop/aimee-red-rose-bouquet?utm_source=meta&utm_medium=paid_social');
  await expect(page.locator('.qa-add')).toBeVisible();
  await page.waitForTimeout(3000); // the offer opens 1.5 s after arrival elsewhere
  await expect(page.getByRole('dialog', { name: '25% off your first order' })).toHaveCount(0);
  await expect(page.locator('.qa-foot .qa-ask')).toHaveAttribute('href', /^https:\/\/wa\.me\//);
});
