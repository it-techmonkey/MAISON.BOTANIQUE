import { test, expect, openProduct, expectNoHorizontalScroll } from './fixtures';

test('stationary offer bar shows a claimed code without claiming it is applied', async ({ page }) => {
  await page.goto('/');
  const bar = page.locator('.offer-bar');
  await expect(bar).toHaveText('25% off your first order·Claim →');
  await expect(bar.locator('.offer-bar__track')).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem('mb-launch-offer-v1', JSON.stringify({ code: 'MB25-0123456789ABCDEF0123' }));
    window.dispatchEvent(new Event('maison-offer-changed'));
  });
  await expect(bar).toContainText('Your 25% code is ready');
  await expect(bar).not.toContainText(/applied/i);
  await bar.click();
  await expect(page.getByRole('dialog', { name: 'Your code is ready' })).toBeVisible();
  await expect(page.locator('.lo-code strong')).toHaveText('MB25-0123456789ABCDEF0123');
});

test('daily cutoff disappears for future delivery and after the last available window', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T08:00:00Z') });
  await openProduct(page);
  const picker = page.locator('.dl-picker-product');
  await expect(picker.locator('.dl-cutoff')).toContainText('order by 5pm (Dubai time)');
  await picker.locator('.qa-day').filter({ hasText: 'Tomorrow' }).click();
  await expect(picker.locator('.dl-cutoff')).toHaveCount(0);
  await picker.locator('.qa-day').filter({ hasText: 'Today' }).click();
  await expect(picker.locator('.dl-cutoff')).toBeVisible();
  await page.clock.fastForward(5 * 60 * 60 * 1000 + 61_000);
  await expect(picker.locator('.dl-cutoff')).toHaveCount(0);
});

test('seasonal deadlines and delivery dates are separate and the ended shelf stays hidden', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T08:00:00Z') });
  await page.goto('/');
  await expect(page.locator('.sea-hw .seasonal-booking p').first()).toContainText('Sat 31 Oct · 5pm');
  await expect(page.locator('.sea-dw .seasonal-booking p').first()).toContainText('Sun 15 Nov · 5pm');
  await expect(page.locator('.sea-dw .seasonal-booking p').last()).toHaveText('Delivery: Thu 5 Nov – Sun 15 Nov');
  await openProduct(page, 'marigold-toran');
  await expect(page.locator('.dl-picker-product .seasonal-booking')).toContainText('Last orders:');
  await expect(page.locator('.dl-cutoff')).toHaveCount(0);
  await page.clock.setFixedTime(new Date('2026-11-01T08:00:00Z'));
  await page.goto('/');
  await expect(page.locator('.sea-hw')).toHaveCount(0);
  await expect(page.locator('.sea-dw')).toBeVisible();
});

test('offer and seasonal deadline copy fit English and Arabic at all review widths', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T08:00:00Z') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const ar of [false, true]) {
    if (ar) await page.getByRole('button', { name: 'التبديل إلى العربية' }).click();
    for (const width of [1440, 1280, 1024, 768, 414, 390, 360, 320]) {
      await page.setViewportSize({ width, height: width > 760 ? 900 : 844 });
      await expectNoHorizontalScroll(page, `${ar ? 'Arabic' : 'English'} ${width}`);
      const metrics = await page.locator('.offer-bar__text').evaluate((el) => ({
        width: el.getBoundingClientRect().width,
        available: el.parentElement!.clientWidth - 16,
        fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
        moving: el.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running' && animation.effect?.getComputedTiming().iterations === Infinity).length,
      }));
      expect(metrics.width).toBeLessThanOrEqual(metrics.available);
      expect(metrics.fontSize).toBeGreaterThanOrEqual(12);
      expect(metrics.moving).toBe(0);
      await expect(page.locator('.sea-hw .seasonal-booking')).toBeVisible();
      await expect(page.locator('.sea-dw .seasonal-booking')).toBeVisible();
      if ([1440, 390, 320].includes(width)) {
        await page.screenshot({ path: test.info().outputPath(`home-${ar ? 'ar' : 'en'}-${width}.png`), fullPage: true, animations: 'disabled' });
        await page.locator('.sea-hw').screenshot({ path: test.info().outputPath(`halloween-${ar ? 'ar' : 'en'}-${width}.png`), animations: 'disabled' });
        await page.locator('.sea-dw').screenshot({ path: test.info().outputPath(`diwali-${ar ? 'ar' : 'en'}-${width}.png`), animations: 'disabled' });
      }
    }
  }
});
