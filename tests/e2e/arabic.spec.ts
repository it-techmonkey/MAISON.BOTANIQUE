// Area: Arabic and right-to-left layout.
import { test, expect, openProduct, addToBag, openBag, expectNoHorizontalScroll, notConnected } from './fixtures';

test('switching to Arabic turns the page right-to-left and translates the shop', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-header').getByRole('button', { name: 'التبديل إلى العربية' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('.site-header').getByRole('button', { name: 'Switch to English' })).toHaveText('EN');
  await expect(page.getByRole('heading', { name: /زهور جميلة/ }).first()).toBeVisible();
  await expectNoHorizontalScroll(page, 'Arabic home');
});

test('Arabic choice is remembered and the product page and bag are in Arabic', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('maison-botanique-locale', 'ar'));
  await openProduct(page);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const arabic = /[؀-ۿ]/;
  await expect(page.locator('.purchase h1')).toHaveText(arabic);
  await expect(page.locator('.qa-size-name strong').first()).toHaveText('سيغنتشر');
  await expect(page.locator('.qa-add')).toContainText('أضف إلى الحقيبة');
  await expectNoHorizontalScroll(page, 'Arabic product page');
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag).toHaveAttribute('dir', 'rtl');
  await expect(bag.locator('h2')).toHaveText('حقيبتك');
  await expect(bag.locator('.ll-cart-line h3')).toHaveText(arabic);
});

test('the WhatsApp button sits on the left in Arabic', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('maison-botanique-locale', 'ar'));
  await page.goto('/delivery');
  const button = page.locator('.wa-float');
  if (!(await button.count())) return notConnected('WhatsApp number');
  const box = await button.boundingBox();
  const width = page.viewportSize()!.width;
  expect(box!.x + box!.width / 2).toBeLessThan(width / 2);
});
