/**
 * Admin API credentials for the local Shopify scripts.
 *
 * Client transfer stores created from a Partner account are not part of the
 * app's Dev Dashboard organization, so Shopify's client credentials grant is
 * refused there. Those stores use an app with *custom distribution*: the store
 * installs it, `npm run shopify:auth` completes the OAuth authorization code
 * grant once, and the resulting refresh token is saved to .env.local. Each run
 * then swaps the refresh token for a short-lived access token.
 *
 * Stores inside the app's own organization can skip `shopify:auth`: without a
 * refresh token, the client credentials grant is used instead.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shopifyConfig } from '../../src/lib/shopify/config.ts';

export const ENV_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env.local');

/** Scopes the seed script needs. They must match the scopes on the released app version. */
export const ADMIN_SCOPES = ['write_products', 'write_publications', 'write_translations', 'write_locales', 'write_files'];

/**
 * Scopes of the separate "forms" app, whose token lives on the host: customers
 * (newsletter consent, tags) and metaobjects (saved enquiries) only.
 */
export const FORMS_SCOPES = ['read_customers', 'write_customers', 'write_metaobject_definitions', 'write_metaobjects'];

export const { domain } = shopifyConfig;

const APPS = {
  seed: { id: 'SHOPIFY_ADMIN_CLIENT_ID', secret: 'SHOPIFY_ADMIN_CLIENT_SECRET', step: '5A' },
  forms: { id: 'SHOPIFY_FORMS_CLIENT_ID', secret: 'SHOPIFY_FORMS_CLIENT_SECRET', step: '13' },
};

/** Client credentials of the seed app (default) or the forms app. */
export function adminCredentials(app = 'seed') {
  const names = APPS[app];
  const clientId = process.env[names.id]?.trim();
  const clientSecret = process.env[names.secret]?.trim();
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
    throw new Error('Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN in .env.local to your *.myshopify.com domain.');
  }
  if (!clientId || !clientSecret) {
    throw new Error(`Set ${names.id} and ${names.secret} in .env.local (docs/SHOPIFY_SETUP.md, step ${names.step}).`);
  }
  return { clientId, clientSecret };
}

/** Replaces (or appends) one KEY=value line in .env.local, leaving everything else untouched. */
export async function saveEnvValue(key, value) {
  let contents = '';
  try { contents = await readFile(ENV_FILE, 'utf8'); } catch { /* Created below. */ }
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  contents = pattern.test(contents) ? contents.replace(pattern, line) : `${contents.replace(/\n*$/, '\n')}${line}\n`;
  await writeFile(ENV_FILE, contents);
  process.env[key] = value;
}

async function tokenRequest(fields) {
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(fields),
  });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* Non-JSON error page. */ }
  if (!response.ok || !json?.access_token) {
    const reason = json?.error_description || json?.error || json?.errors || text.slice(0, 200);
    const error = new Error(`Shopify refused the token request (${response.status}): ${typeof reason === 'string' ? reason : JSON.stringify(reason)}`);
    error.status = response.status;
    throw error;
  }
  return json;
}

/**
 * Authorization code grant. The seed app gets an expiring offline token (its
 * refresh token is kept in .env.local). The forms app gets a non-expiring
 * offline token, because a hosted server cannot store rotated refresh tokens.
 */
export async function exchangeAuthorizationCode(code, app = 'seed') {
  const { clientId, clientSecret } = adminCredentials(app);
  if (app === 'forms') {
    const token = await tokenRequest({ client_id: clientId, client_secret: clientSecret, code });
    await saveEnvValue('SHOPIFY_FORMS_ADMIN_TOKEN', token.access_token);
    return token;
  }
  const token = await tokenRequest({ client_id: clientId, client_secret: clientSecret, code, expiring: '1' });
  if (token.refresh_token) await saveEnvValue('SHOPIFY_ADMIN_REFRESH_TOKEN', token.refresh_token);
  return token;
}

/** Returns an Admin API access token for this run. */
export async function getAdminAccessToken() {
  const { clientId, clientSecret } = adminCredentials();
  const refreshToken = process.env.SHOPIFY_ADMIN_REFRESH_TOKEN?.trim();

  if (refreshToken) {
    try {
      const token = await tokenRequest({
        grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken,
      });
      // Shopify may rotate the refresh token; keep the newest one.
      if (token.refresh_token && token.refresh_token !== refreshToken) {
        await saveEnvValue('SHOPIFY_ADMIN_REFRESH_TOKEN', token.refresh_token);
      }
      return token.access_token;
    } catch (error) {
      if (error.status === 400 || error.status === 401) {
        throw new Error(`${error.message}\nThe saved authorization has expired or was revoked. Run \`npm run shopify:auth\` again.`);
      }
      throw error;
    }
  }

  try {
    const token = await tokenRequest({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret });
    return token.access_token;
  } catch (error) {
    throw new Error(`${error.message}\nNo saved authorization was found. For a client transfer store, run \`npm run shopify:auth\` first (docs/SHOPIFY_SETUP.md, step 5A).`);
  }
}
