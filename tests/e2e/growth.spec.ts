import { test, expect, expectNoHorizontalScroll, bagCount } from './fixtures';

test('selling pages are real routes with products, questions, language alternates and a working bag', async ({ page }) => {
  const response = await page.goto('/occasions/birthday');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Birthday flowers in Dubai');
  await expect(page.locator('.mbc-piece').first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/occasions\/birthday$/);
  await expect(page.locator('link[hreflang="ar-AE"]')).toHaveAttribute('href', /\/ar\/occasions\/birthday$/);
  await page.getByText('Can I choose a delivery time?', { exact: true }).click();
  await expect(page.getByText(/Dubai same-day windows close one hour/)).toBeVisible();
  await page.locator('.mbc-piece').first().getByRole('button', { name: /Add to bag:/ }).click();
  await expect(page.locator('.qa-add')).toBeVisible();
  await page.locator('.qa-add').click();
  await expect.poll(() => bagCount(page)).toBe(1);
  await page.getByRole('button', { name: 'التبديل إلى العربية', exact: true }).click();
  await expect(page).toHaveURL(/\/ar\/occasions\/birthday$/);
  await expect(page.locator('h1')).toHaveText('ورود عيد الميلاد في دبي');
  await expect.poll(() => bagCount(page)).toBe(1);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
  await expect(page).toHaveURL(/\/occasions\/birthday$/);
});

test('Arabic pages render Arabic and translated metadata without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const path of ['/ar/occasions/love', '/ar/journal', '/ar/journal/birthday-card-messages']) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toContainText(/[\u0600-\u06ff]/);
      await expect(page).toHaveTitle(/[\u0600-\u06ff]/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}$`));
      await expect(page.locator('link[hreflang="en-AE"]')).toHaveAttribute('href', new RegExp(`${path.replace(/^\/ar/, '')}$`));
      await expect(page.locator('main')).toBeVisible();
    }
  } finally { await context.close(); }
});

test('journal guides link to the matching shopping task and unknown guides return 404', async ({ page }) => {
  await page.goto('/journal');
  await page.getByRole('heading', { name: 'What to write in a birthday card' }).getByRole('link').click();
  await expect(page.locator('h1')).toHaveText('What to write in a birthday card');
  await page.getByRole('link', { name: /Choose birthday flowers/ }).click();
  await expect(page).toHaveURL(/\/occasions\/birthday$/);
  const response = await page.goto('/journal/not-a-real-guide');
  expect(response?.status()).toBe(404);
  await page.goto('/occasions/thanks');
  await expect(page).toHaveURL(/\/shop#occasion\/thanks$/);
});

test('switching a shared guide preserves its campaign tags', async ({ page }) => {
  await page.goto('/journal?utm_source=instagram&utm_campaign=note_first_01');
  await page.getByRole('button', { name: 'التبديل إلى العربية', exact: true }).click();
  await expect(page).toHaveURL(/\/ar\/journal\?utm_source=instagram&utm_campaign=note_first_01$/);
});

test('new pages fit narrow screens and preserve reduced-motion access in both languages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 414, 390, 360, 320]) {
    await page.setViewportSize({ width, height: width > 1000 ? 900 : 844 });
    for (const path of ['/occasions/love', '/ar/occasions/birthday', '/journal/send-flowers-to-dubai-from-abroad', '/ar/journal/birthday-card-messages']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expectNoHorizontalScroll(page, `${path} at ${width}px`);
    }
  }
});
