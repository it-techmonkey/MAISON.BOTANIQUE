const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');

async function check() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const pages = ['index.html', 'history/01-department-overview/index.html',
      'history/02-founders-briefing/index.html', 'history/03-claude-reference/index.html',
      'history/04-dense-workbench/index.html', 'current/index.html'];
    for (const name of pages) {
      await page.goto(pathToFileURL(path.join(root, name)).href);
      assert.ok((await page.locator('body').innerText()).length > 100, name);
    }
    const layout = [];
    for (const width of [1440, 1280, 1024, 768, 414, 390, 360, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const result = await page.evaluate(() => {
        const visibleText = [...document.querySelectorAll('#mb-clear *')]
          .filter(el => el.getClientRects().length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          height: Math.round(document.querySelector('#mb-clear').getBoundingClientRect().height),
          minFont: Math.min(...visibleText.map(el => parseFloat(getComputedStyle(el).fontSize))),
        };
      });
      assert.equal(result.overflow, false, `overflow at ${width}`);
      assert.ok(result.minFont >= 12, `text below 12px at ${width}`);
      layout.push({ width, ...result });
    }
    await page.setViewportSize({ width: 1024, height: 900 });
    const screenshots = path.join(root, 'qa/screenshots');
    fs.mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: path.join(screenshots, 'business.png'), fullPage: true });
    await page.getByRole('button', { name: 'See what’s missing', exact: false }).click();
    await page.getByRole('heading', { name: 'What is stopping the pilot?', exact: true }).waitFor();
    await page.screenshot({ path: path.join(screenshots, 'blockers.png'), fullPage: true });
    await page.getByRole('button', { name: 'Open next step', exact: false }).first().click();
    await page.getByRole('heading', { name: 'Review the ad bouquet’s costs', exact: true }).waitFor();
    const review = page.getByRole('button', { name: 'Request review', exact: true });
    assert.equal(await review.isEnabled(), false);
    for (const box of await page.getByRole('checkbox').all()) await box.check();
    assert.equal(await review.isEnabled(), true);
    await review.click();
    assert.equal(await page.getByRole('button', { name: 'Review requested', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: '← Back to Marketing', exact: true }).click();
    await page.getByRole('heading', { name: 'Marketing', exact: true }).waitFor();
    await page.getByRole('button', { name: 'My day', exact: true }).click();
    await page.getByRole('button', { name: 'Sam', exact: true }).click();
    assert.equal(await page.locator('.row').count(), 2);
    await page.getByRole('button', { name: 'Reference', exact: true }).click();
    await page.getByText('First-order offer', { exact: true }).click();
    assert.match(await page.locator('details[open]').innerText(), /20%/);
    await page.getByRole('button', { name: 'Business', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(screenshots, 'mobile.png'), fullPage: true });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.screenshot({ path: path.join(screenshots, 'dark.png'), fullPage: true });
    assert.deepEqual(errors, []);
    const result = {
      checkpoint: '2026-10-25', scope: 'Fictional public review copies',
      archivePagesLoaded: pages.length, layout, runtimeErrors: errors,
      passed: ['blocker-to-action route', 'review requires completed checklist',
        'review does not verify completion', 'return keeps originating department',
        'personal work filter', 'collapsed reference', 'dark/reduced-motion render'],
      notVerified: ['unassisted usability', 'Arabic', 'shared editing', 'live source access', 'production behavior'],
    };
    fs.writeFileSync(path.join(root, 'qa/latest.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

check().catch(error => { console.error(error); process.exitCode = 1; });
