const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'current/index.html',
  'history/01-department-overview/index.html', 'history/02-founders-briefing/index.html',
  'history/03-claude-reference/index.html', 'history/04-dense-workbench/index.html'];

test('all design checkpoints are standalone and have compilable scripts', () => {
  for (const page of pages) {
    const source = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(source, /<!doctype html>/i, page);
    assert.match(source, /<meta name="viewport"/, page);
    assert.match(source, /fictional/i, page);
    for (const [, script] of source.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      new vm.Script(script, { filename: page });
      assert.doesNotMatch(script, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/, page);
    }
  }
});

test('committed review copies exclude owner-machine paths and private references', () => {
  for (const page of pages) {
    const source = fs.readFileSync(path.join(root, page), 'utf8');
    assert.ok(!/\/Users\/|private\/|MBQA-|Bikanervala|2,686|2,720|first 100 contacted/i.test(source), `${page}: private reference found`);
    assert.ok(!/(?:sk_live_|shpat_|ghp_)[a-zA-Z0-9]+/.test(source), `${page}: credential-shaped value found`);
  }
});

test('relative gallery and back links resolve within the design archive', () => {
  for (const page of pages) {
    const source = fs.readFileSync(path.join(root, page), 'utf8');
    for (const [, href] of source.matchAll(/href="([^"]+)"/g)) {
      if (/^(?:https?:|#)/.test(href)) continue;
      const dest = path.resolve(root, path.dirname(page), href);
      assert.ok(dest.startsWith(root + path.sep), `${page}: ${href}`);
      assert.ok(fs.existsSync(dest), `${page}: ${href}`);
    }
  }
});

test('private archive and generated screenshots are ignored', () => {
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.match(ignore, /^\.local\/$/m);
  assert.match(ignore, /^qa\/screenshots\/$/m);
});
