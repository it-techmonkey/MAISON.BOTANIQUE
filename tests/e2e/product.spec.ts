// Area: product page, sizes and add to bag.
import { test, expect, PRODUCT, openProduct, addToBag, openBag } from './fixtures';

test('product page shows name, price, struck price, off tag and the three sizes', async ({ page }) => {
  await openProduct(page);
  await expect(page.locator('.purchase__price strong')).toContainText(/\d/);
  await expect(page.locator('.purchase__price s')).toBeVisible();
  await expect(page.locator('.purchase__price .sale-tag')).toHaveText(/^\d+% off$/);
  await expect(page.locator('.qa-size-name strong')).toHaveText(['Signature', 'Grand', 'Luxe']);
});

test('choosing a size updates the add-to-bag price', async ({ page }) => {
  await openProduct(page);
  const price = (size: string) => page.locator('.qa-size', { hasText: size }).locator('.qa-size-price > .money .money__n').innerText();
  const signature = await price('Signature');
  const grand = await price('Grand');
  expect(Number(grand.replace(/\D/g, ''))).toBeGreaterThan(Number(signature.replace(/\D/g, '')));
  await expect(page.locator('.qa-add')).toContainText(signature);
  await page.locator('.qa-size', { hasText: 'Grand' }).click();
  await expect(page.locator('.qa-size', { hasText: 'Grand' })).toHaveClass(/is-selected/);
  await expect(page.locator('.qa-add')).toContainText(grand);
});

test('add to bag puts the chosen size and gift note in the bag @live', async ({ page }) => {
  await openProduct(page);
  const name = (await page.locator('.purchase h1').innerText()).trim();
  await page.locator('.qa-size', { hasText: 'Grand' }).click();
  await page.locator(`#gift-note-${PRODUCT}`).fill('Happy birthday');
  await addToBag(page);
  await expect(page.locator('.bag-toast')).toContainText('is in your bag');
  const bag = await openBag(page);
  const line = bag.locator('.ll-cart-line');
  await expect(line).toHaveCount(1);
  await expect(line.locator('h3')).toHaveText(name);
  await expect(line).toContainText('Grand');
  // The note is an editable box on each bag line (it used to be read-only text).
  const note = line.locator('.ll-line-note textarea');
  await expect(note).toHaveValue('Happy birthday');

  // Editing it saves to the bag and survives a reload. Where the cart is Shopify's, the save is a
  // network call that lands a moment after the box loses focus, so reload until it has.
  await note.fill('Happy birthday, Mum');
  await note.press('Tab'); // leaving the box is what saves it, as when a shopper taps elsewhere
  await expect(async () => {
    await page.reload();
    const again = await openBag(page);
    await expect(again.locator('.ll-cart-line .ll-line-note textarea')).toHaveValue('Happy birthday, Mum', { timeout: 3000 });
  }).toPass({ timeout: 25_000 });
});
