import test from 'node:test';
import assert from 'node:assert/strict';
import { contentLocale, translatedContentPath } from '../src/lib/content-locale.ts';
import { JOURNAL, OCCASION_CONTENT } from '../src/lib/growth-content.ts';
import { inspectHtml, safeBase } from '../scripts/growth-audit.mjs';

test('translated editorial URLs preserve identity and do not translate checkout or arbitrary routes', () => {
  assert.equal(contentLocale('/ar/occasions/birthday'), 'ar');
  assert.equal(contentLocale('/journal'), 'en');
  assert.equal(translatedContentPath('/ar/journal/birthday-card-messages', 'en'), '/journal/birthday-card-messages');
  assert.equal(translatedContentPath('/occasions/love', 'ar'), '/ar/occasions/love');
  for (const path of ['/shop/rose', '/account', '/checkout', '//evil.example/journal', '/occasions/thanks']) assert.equal(contentLocale(path), null);
  assert.equal(new Set(JOURNAL.map(({ slug }) => slug)).size, JOURNAL.length);
  for (const page of OCCASION_CONTENT) assert.ok(JOURNAL.some(({ slug }) => slug === page.journalSlug));
});

test('health audit detects noindex and canonical regressions without pretending to measure indexing', () => {
  const html = '<title>Birthday flowers</title><h1>Birthday flowers</h1><link rel="canonical" href="https://www.maisonbotaniqueflowers.com/occasions/birthday"><meta name="robots" content="noindex, nofollow">';
  const report = inspectHtml(html, '/occasions/birthday', true);
  assert.ok(report.problems.includes('unexpected_noindex'));
  assert.ok(report.problems.includes('missing_language_alternates'));
  assert.ok(!report.problems.includes('wrong_or_missing_canonical'));
  assert.ok(inspectHtml(html, '/journal', false).problems.includes('wrong_or_missing_canonical'));
  assert.equal(safeBase('http://localhost:3012'), 'http://localhost:3012');
  for (const url of ['https://evil.example', 'http://www.maisonbotaniqueflowers.com', 'https://user:secret@www.maisonbotaniqueflowers.com', 'https://www.maisonbotaniqueflowers.com?token=secret']) assert.throws(() => safeBase(url));
});
