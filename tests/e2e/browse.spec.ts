// Area: browsing and filters (home hero, /shop tabs, Refine drawer, search, quick-add).
import { test, expect, addToBag } from './fixtures';

const piecePrice = (piece: import('@playwright/test').Locator) =>
  piece.locator('.mbc-price > .money .money__n').innerText().then((text) => Number(text.replace(/[^\d.]/g, '')));

test('home page shows the approved hero headline and the collection @live', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Beautiful flowers\.\s*Thoughtfully delivered\./ }).first()).toBeVisible();
  await expect(page.locator('#shop .mbc-piece').first()).toBeVisible();
});

test('shop tabs filter the collection and update the link', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.locator('.mbc-piece').first()).toBeVisible();
  const roses = page.locator('.mbc-room', { hasText: /^Roses$/ });
  await roses.click();
  await expect(roses).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/#roses$/);
  await expect(page.locator('#mbc-title')).toHaveText('Roses');
  await expect(page.locator('.mbc-piece').first()).toBeVisible();
});

test('Refine by budget shows only pieces in that band', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.locator('.mbc-piece').first()).toBeVisible();
  await page.locator('.mbc-tools button', { hasText: 'Refine' }).click();
  const drawer = page.getByRole('dialog', { name: 'Refine' });
  await drawer.locator('.mbc-opt', { hasText: 'Under AED 300' }).click();
  await drawer.locator('.mbc-solid').click();
  await expect(drawer).toBeHidden();
  await expect(page.locator('.mbc-active button', { hasText: 'Under AED 300' })).toBeVisible();
  const pieces = page.locator('.mbc-piece');
  await expect(pieces.first()).toBeVisible();
  const count = Math.min(await pieces.count(), 12);
  for (let i = 0; i < count; i++) expect(await piecePrice(pieces.nth(i))).toBeLessThan(300);
});

test('search narrows the collection and offers a reset when nothing matches', async ({ page }) => {
  await page.goto('/shop');
  const search = page.locator('.mbc-search input');
  await search.fill('tulip');
  await expect(page.locator('.mbc-piece').first()).toBeVisible();
  await expect(page.locator('.mbc-piece h3').first()).toContainText(/tulip/i);
  await search.fill('zzqx no such flower');
  await expect(page.locator('.mbc-empty')).toBeVisible();
  await page.locator('.mbc-empty button').click();
  await expect(page.locator('.mbc-piece').first()).toBeVisible();
});

test('tapping a piece opens the quick-add sheet for it', async ({ page }) => {
  await page.goto('/shop');
  const first = page.locator('.mbc-piece').first();
  const name = (await first.locator('h3').innerText()).trim();
  await first.locator('.mbc-add').click();
  const sheet = page.getByRole('dialog', { name });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.qa-add')).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
});

for (const path of ['/', '/shop']) {
  test(`${path} grid links each piece to its product page, and a tap still opens the sheet`, async ({ page, request }) => {
    // Crawlers read the server HTML, so the links must be there before any script runs.
    const html = await (await request.get(path)).text();
    expect(html.match(/href="\/shop\/[^"]+"/g)?.length ?? 0).toBeGreaterThanOrEqual(12);

    await page.goto(path);
    const first = page.locator('#shop .mbc-piece').first();
    const link = first.locator('h3 a');
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/shop\/[\w-]+$/);
    await expect(first.locator('a.mbc-frame')).toHaveAttribute('href', href!);

    const url = page.url();
    const name = (await link.innerText()).trim();
    await link.click();
    const sheet = page.getByRole('dialog', { name });
    await expect(sheet).toBeVisible();
    expect(page.url()).toBe(url);
    await addToBag(page);
  });
}
