// Area: WhatsApp links. The wa.me message must name the product, size, price and product link.
import { test, expect, PRODUCT, openProduct, useEarliestDelivery, addToBag, openBag, notConnected, whatsappText } from './fixtures';

test('product enquiry link carries name, size, price, delivery and product link @live', async ({ page }) => {
  await openProduct(page);
  const ask = page.locator('.qa-delivery .pd-ask');
  if (!(await ask.count())) return notConnected('WhatsApp number');
  const name = (await page.locator('.purchase h1').innerText()).trim();
  await page.locator('.qa-size', { hasText: 'Grand' }).click();
  const price = (await page.locator('.qa-size', { hasText: 'Grand' }).locator('.qa-size-price > .money .money__n').innerText()).trim();
  await useEarliestDelivery(page);

  const text = whatsappText((await ask.getAttribute('href'))!);
  expect(text).toContain(`"${name}"`);
  expect(text).toContain('(Grand, AED ');
  expect(text).toContain(`AED ${price})`);
  expect(text).toMatch(/\nDelivery: .+ · \d+(am|pm) – \d+(am|pm)\n/);
  expect(text).toMatch(new RegExp(`https://[^\\s]+/shop/${PRODUCT}$`));
});

test('bag "Order on WhatsApp" link lists the line and the delivery', async ({ page }) => {
  await openProduct(page);
  if (!(await page.locator('.qa-delivery .pd-ask').count())) return notConnected('WhatsApp number');
  const name = (await page.locator('.purchase h1').innerText()).trim();
  await useEarliestDelivery(page);
  await addToBag(page);
  const bag = await openBag(page);
  const text = whatsappText((await bag.locator('.ll-cart-wa').getAttribute('href'))!);
  expect(text).toContain("I'd like to order:");
  expect(text).toContain(`• 1 × ${name} (Signature)`);
  expect(text).toMatch(/Delivery: .+ · \d+(am|pm) – \d+(am|pm)$/);
});

test('floating WhatsApp button opens a chat with the general greeting', async ({ page }) => {
  await page.goto('/delivery');
  const button = page.locator('.wa-float');
  if (!(await button.count())) return notConnected('WhatsApp number');
  expect(whatsappText((await button.getAttribute('href'))!)).toBe('Hello Maison Botanique, I have a question about an order.');
  await expect(button).toHaveAttribute('target', '_blank');
});

test('footer and contact page link to the same WhatsApp number', async ({ page }) => {
  await page.goto('/contact');
  const floatHref = await page.locator('.wa-float').getAttribute('href');
  if (!floatHref) return notConnected('WhatsApp number');
  const number = new URL(floatHref).pathname;
  const footerLinks = page.locator('footer a[href^="https://wa.me/"]');
  await expect(footerLinks).toHaveCount(2);
  for (const link of await footerLinks.all()) expect(new URL((await link.getAttribute('href'))!).pathname).toBe(number);
  const contact = page.locator('.contact-details a[href^="https://wa.me/"]');
  await expect(contact).toBeVisible();
  expect(new URL((await contact.getAttribute('href'))!).pathname).toBe(number);
});
