#!/usr/bin/env node
/**
 * One-time Admin API authorization for a client transfer store.
 *
 *   npm run shopify:auth
 *
 * Starts a temporary server on http://localhost:3457 and prints an
 * authorization link. Open it while logged in to the store, approve the app,
 * and Shopify redirects back here with a one-time code. The code is exchanged
 * for an expiring offline token, and its refresh token is saved to
 * .env.local as SHOPIFY_ADMIN_REFRESH_TOKEN for `npm run shopify:seed`.
 *
 *   npm run shopify:auth -- --forms
 *
 * Authorizes the separate forms app instead (customer and metaobject scopes
 * only) and saves its non-expiring token as SHOPIFY_FORMS_ADMIN_TOKEN, the one
 * Admin value that also goes on the host (docs/SHOPIFY_SETUP.md, step 13).
 *
 * In the Dev Dashboard app version, set:
 *   App URL        http://localhost:3457/auth
 *   Redirect URLs  http://localhost:3457/auth/callback
 */
import crypto from 'node:crypto';
import http from 'node:http';
import { ADMIN_SCOPES, FORMS_SCOPES, adminCredentials, domain, exchangeAuthorizationCode } from './lib/admin-auth.mjs';
import { SHOPIFY_API_VERSION } from '../src/lib/shopify/config.ts';

const PORT = 3457;
const ENTRY_PATH = '/auth';
const CALLBACK_PATH = '/auth/callback';
const REDIRECT_URI = `http://localhost:${PORT}${CALLBACK_PATH}`;
const TIMEOUT_MS = 15 * 60 * 1000;
const APP = process.argv.includes('--forms') ? 'forms' : 'seed';
const SCOPES = APP === 'forms' ? FORMS_SCOPES : ADMIN_SCOPES;

let credentials;
try { credentials = adminCredentials(APP); } catch (error) {
  console.error(`\n✖ ${error.message}\n`);
  process.exit(1);
}

const state = crypto.randomBytes(16).toString('hex');
const authorizeUrl = `https://${domain}/admin/oauth/authorize?${new URLSearchParams({
  client_id: credentials.clientId,
  scope: SCOPES.join(','),
  redirect_uri: REDIRECT_URI,
  state,
})}`;

/** Shopify signs OAuth redirects: HMAC-SHA256 of the sorted query string, keyed with the client secret. */
function validHmac(params) {
  const received = params.get('hmac') ?? '';
  const message = [...params.entries()]
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const expected = crypto.createHmac('sha256', credentials.clientSecret).update(message).digest('hex');
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

function page(response, status, title, body) {
  response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="font:16px/1.5 system-ui;max-width:560px;margin:80px auto;padding:0 20px;color:#26332b">
<h1 style="font-weight:500">${title}</h1><p>${body}</p></body>`);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);
  const params = url.searchParams;

  // App URL: Shopify sends the store here right after the app is installed.
  if (url.pathname === ENTRY_PATH) {
    if (params.get('shop') && params.get('shop') !== domain) {
      page(response, 400, 'Wrong store', `This helper is set up for ${domain}, not ${params.get('shop')}.`);
      return;
    }
    response.writeHead(302, { Location: authorizeUrl });
    response.end();
    return;
  }

  if (url.pathname !== CALLBACK_PATH) {
    page(response, 404, 'Not found', 'Open the authorization link printed in the terminal.');
    return;
  }

  if (params.get('state') !== state || params.get('shop') !== domain || !validHmac(params)) {
    page(response, 400, 'Authorization rejected', 'The response did not come from this session. Use the link printed in the terminal.');
    return;
  }

  try {
    const token = await exchangeAuthorizationCode(params.get('code'), APP);
    const check = await fetch(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token.access_token },
      body: JSON.stringify({ query: '{ shop { name } }' }),
    }).then((result) => result.json());
    const shopName = check?.data?.shop?.name ?? domain;

    page(response, 200, 'Authorized', `${APP === 'forms' ? 'The website forms' : 'The seed script'} can now use <strong>${shopName}</strong>. You can close this tab and return to the terminal.`);
    console.log(`\n✓ Authorized for ${shopName}. Granted scopes: ${token.scope}`);
    if (APP === 'forms') {
      console.log('✓ SHOPIFY_FORMS_ADMIN_TOKEN saved to .env.local. Add the same value to your host\'s environment variables.');
      if (token.expires_in) console.warn(`! Shopify issued an expiring token (${token.expires_in}s). The forms will stop working when it expires; check the app's token settings.`);
    } else if (token.refresh_token) {
      const days = Math.round(Number(token.refresh_token_expires_in) / 86400);
      console.log(`✓ Refresh token saved to .env.local (valid ~${days} days; run this again after that).`);
    } else {
      console.warn('! Shopify returned no refresh token. Check that the app version uses expiring offline tokens.');
    }
    // Shopify reports a write scope without the read scope it implies.
    const granted = String(token.scope).split(',');
    const missing = SCOPES.filter((scope) => !granted.includes(scope) && !granted.includes(scope.replace('read_', 'write_')));
    if (missing.length) console.warn(`! Missing scopes: ${missing.join(', ')}. Add them to the app version, release it and run this again.`);
    console.log(APP === 'forms' ? '\nNext: restart the site and send a test message from /contact.\n' : '\nNext: npm run shopify:seed\n');
  } catch (error) {
    page(response, 500, 'Token exchange failed', 'See the terminal for details.');
    console.error(`\n✖ ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    server.close();
    clearTimeout(timer);
  }
});

const timer = setTimeout(() => {
  console.error('\n✖ Timed out after 15 minutes without an authorization. Run the command again.\n');
  server.close();
  process.exitCode = 1;
}, TIMEOUT_MS);

server.on('error', (error) => {
  console.error(`\n✖ Could not listen on port ${PORT}: ${error.message}\n`);
  process.exit(1);
});

server.listen(PORT, 'localhost', () => {
  console.log(`Waiting for Shopify on http://localhost:${PORT} (store: ${domain})\n`);
  console.log('If the app is already installed on the store, open this link while logged in to the store admin:\n');
  console.log(`  ${authorizeUrl}\n`);
  console.log('If it is not installed yet, open the custom distribution install link from the Dev Dashboard instead;');
  console.log('after you approve the install, Shopify sends you back here automatically.\n');
});
