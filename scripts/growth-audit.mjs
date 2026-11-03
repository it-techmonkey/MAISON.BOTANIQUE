#!/usr/bin/env node
// Read-only, dependency-free checks of public HTML. This does not establish Google indexing or checkout success.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const LIVE = 'https://www.maisonbotaniqueflowers.com';
export const BASE_PATHS = ['/', '/shop', '/faq', '/delivery'];
export const GROWTH_PATHS = ['/occasions/birthday', '/occasions/love', '/journal', '/journal/birthday-card-messages', '/journal/send-flowers-to-dubai-from-abroad'];

export function safeBase(value) {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const publicSite = ['www.maisonbotaniqueflowers.com', 'maisonbotaniqueflowers.com'].includes(url.hostname)
    || /^maison-botanique-[a-z0-9-]+\.vercel\.app$/.test(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || !(local && ['http:', 'https:'].includes(url.protocol) || publicSite && url.protocol === 'https:')) {
    throw new Error('Use the Maison HTTPS origin, its Vercel preview origin, or a localhost origin.');
  }
  return url.origin;
}

const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(([, key, value]) => [key.toLowerCase(), value]));
const clean = (text) => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export function inspectHtml(html, path, indexable) {
  const title = clean(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => clean(match[1]));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const canonical = links.find((link) => link.rel === 'canonical')?.href ?? '';
  const robots = metas.filter((meta) => ['robots', 'googlebot'].includes(meta.name?.toLowerCase())).map((meta) => meta.content ?? '').join(',');
  const problems = [];
  if (!title) problems.push('missing_title');
  if (h1s.length !== 1 || !h1s[0]) problems.push('expected_one_h1');
  let canonicalPath;
  try { canonicalPath = new URL(canonical).pathname.replace(/\/$/, '') || '/'; } catch { /* reported below */ }
  if (canonicalPath !== path) problems.push('wrong_or_missing_canonical');
  if (indexable && /\bnoindex\b/i.test(robots)) problems.push('unexpected_noindex');
  if (!indexable && !/\bnoindex\b/i.test(robots)) problems.push('preview_missing_noindex');
  const languages = links.filter((link) => link.rel === 'alternate' && link.hreflang).map((link) => link.hreflang);
  if (path.startsWith('/ar/') || GROWTH_PATHS.includes(path)) {
    if (!['en-AE', 'ar-AE'].every((language) => languages.includes(language))) problems.push('missing_language_alternates');
    if (path.startsWith('/ar/') && !/[\u0600-\u06ff]/.test(h1s[0] ?? '')) problems.push('arabic_not_in_server_heading');
  }
  return { title, h1: h1s, canonical, robots, languages, problems };
}

async function readPage(base, path) {
  const response = await fetch(`${base}${path}`, { redirect: 'error', signal: AbortSignal.timeout(25_000), headers: { 'User-Agent': 'MaisonGrowthCheck/1.0 (public storefront health check)' } });
  if (Number(response.headers.get('content-length') ?? 0) > 3_000_000) throw new Error('Response exceeds the audit size limit.');
  const reader = response.body?.getReader();
  const chunks = [];
  let bytes = 0;
  if (reader) while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 3_000_000) { await reader.cancel(); throw new Error('Response exceeds the audit size limit.'); }
    chunks.push(Buffer.from(value));
  }
  const html = Buffer.concat(chunks).toString('utf8');
  return { response, html };
}

export async function runAudit({ base = LIVE, includeGrowth = false, indexable = base === LIVE } = {}) {
  base = safeBase(base);
  const paths = [...BASE_PATHS, ...(includeGrowth ? [...GROWTH_PATHS, ...GROWTH_PATHS.map((path) => `/ar${path}`)] : [])];
  const checks = [];
  for (const path of paths) {
    try {
      const { response, html } = await readPage(base, path);
      const result = inspectHtml(html, path, indexable);
      if (response.status !== 200) result.problems.unshift(`http_${response.status}`);
      if (indexable && /noindex/i.test(response.headers.get('x-robots-tag') ?? '')) result.problems.push('unexpected_header_noindex');
      checks.push({ path, status: response.status, ...result });
    } catch (error) {
      checks.push({ path, problems: ['fetch_failed'], detail: error.message });
      if (path === '/') return { checkedAt: new Date().toISOString(), base, scope: includeGrowth ? 'growth' : 'current-core', expectedIndexable: indexable, measurement: 'public server HTML only', ok: false, checks, skipped: paths.slice(1), limitation: 'Origin unreachable; remaining checks were not attempted.' };
    }
  }
  for (const path of ['/robots.txt', '/sitemap.xml']) {
    try {
      const { response, html } = await readPage(base, path);
      const problems = [];
      if (response.status !== 200) problems.push(`http_${response.status}`);
      if (path === '/robots.txt' && indexable && /^Disallow:\s*\/\s*$/mi.test(html)) problems.push('public_site_blocked');
      if (path === '/sitemap.xml' && includeGrowth) {
        for (const required of [...GROWTH_PATHS, ...GROWTH_PATHS.map((entry) => `/ar${entry}`)]) {
          if (!html.includes(`<loc>${LIVE}${required}</loc>`)) problems.push(`sitemap_missing:${required}`);
        }
      }
      checks.push({ path, status: response.status, problems });
    } catch (error) { checks.push({ path, problems: ['fetch_failed'], detail: error.message }); }
  }
  return { checkedAt: new Date().toISOString(), base, scope: includeGrowth ? 'growth' : 'current-core', expectedIndexable: indexable, measurement: 'public server HTML only', ok: checks.every((check) => !check.problems.length), checks };
}

async function main() {
  const args = process.argv.slice(2);
  const value = (flag) => args[args.indexOf(flag) + 1];
  const base = args.includes('--base') ? value('--base') : LIVE;
  const report = await runAudit({ base, includeGrowth: args.includes('--growth'), indexable: args.includes('--indexable') || base === LIVE });
  if (args.includes('--out')) {
    const file = resolve(value('--out'));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  }
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
