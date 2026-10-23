> Current context: read [current status](CURRENT_STATUS.md) and [catalogue ownership](DATA_FLOW.md). Setup instructions are not evidence of live configuration; catalogue seed commands require separate approval.

# Shopify setup guide

How to connect the Maison Botanique Next.js storefront to Shopify, from an empty store to a tested order. The store is a **client transfer store** created from the agency's Partner account: build and test everything there, then transfer it to the client (step 1).

Shopify moves admin menus from time to time. If a click path below has changed, search the admin for the setting's name.

**How the pieces fit.** The website (Next.js) shows products and the bag. Shopify stores the products, prices, stock, cart, discounts, checkout, payments and orders. The site talks to Shopify through the **Storefront API**, using a token from Shopify's **Headless** sales channel. Shoppers pay on Shopify's hosted checkout, and the order is attributed to the Headless channel.

---

## 1. Create the store

Maison Botanique uses a **client transfer store**: a store created from the agency's Shopify **Partner** account, built by the agency, and later transferred to the client, who then picks a paid plan. It behaves like a development store until the transfer, and test orders are free.

1. To open it: **Partner Dashboard** ([partners.shopify.com](https://partners.shopify.com)) → **Stores** → find the store → **Log in**.
2. Note the store's **`<name>.myshopify.com`** domain. The site always uses this domain, never the custom domain.
3. When the build is finished, transfer ownership from the Partner Dashboard (**Stores** → the store's menu → **Transfer ownership**). The agency keeps collaborator access. Apps installed before the transfer stay installed.

## 2. Core store settings

In the Shopify admin, under **Settings**:

| Setting | Value |
| --- | --- |
| *General → Store defaults* | Currency **AED**, time zone **(GMT+04:00) Dubai**, unit system metric |
| *General → Order ID* | Optional prefix such as `MB-` |
| *Markets* | **United Arab Emirates** as the primary market, currency AED. Remove or deactivate markets you will not sell to. |
| *Languages* | Add **Arabic**, **publish** it, and make sure it is enabled for the UAE market (*Markets → United Arab Emirates → Languages*). |
| *Taxes and duties* | UAE VAT is 5%. Enter the business's VAT registration and turn on tax collection for the UAE. Choose **"Include tax in prices"** if the prices on the site should be VAT-inclusive, which is usual for UAE retail. |
| *Policies* | Add the refund, privacy, terms of service and shipping policies. Checkout links to them. |
| *Store details* | Real business address, contact email and phone. These appear on receipts. |

Then install the free **Translate & Adapt** app (by Shopify) from the App Store. It is where Arabic product names and descriptions are entered.

## 3. Install the Headless channel and get the API tokens

1. Admin → **Sales channels** → **+** (or search the App Store for **"Headless"** by Shopify) → *Add sales channel*.
2. Open **Headless** → **Create storefront**. Name it, for example, "Maison Botanique website".
3. Open the storefront → **Storefront API** → **Manage** / **Permissions**. Keep the defaults, and make sure these are ticked:
   - Read products, variants and collections (`unauthenticated_read_product_listings`)
   - Read product inventory (`unauthenticated_read_product_inventory`)
   - Read product tags (`unauthenticated_read_product_tags`)
   - Read and modify checkouts/carts (`unauthenticated_read_checkouts`, `unauthenticated_write_checkouts`)
4. On the same page, copy:
   - the **Public access token**. This goes in `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` and is safe to expose in the browser.
   - the **Private access token** (optional, recommended). This goes in `SHOPIFY_STOREFRONT_PRIVATE_TOKEN`. It is server only and must never get a `NEXT_PUBLIC_` prefix.
5. Note the **storefront ID**. It is the number at the end of the storefront's admin URL (`…/headless_storefronts/<ID>`), or is shown on the storefront page. It goes in `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID`.

Get the **shop ID** (used for analytics) by running this, with your domain and public token filled in:

```sh
curl -s https://YOUR-STORE.myshopify.com/api/2026-10/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: YOUR_PUBLIC_TOKEN" \
  -d '{"query":"{ shop { id name } }"}'
```

The response contains `"id":"gid://shopify/Shop/1234567890"`. Use `1234567890`.

## 4. Configure the website locally

```sh
cp .env.example .env.local
```

| Variable | Needed | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Required | `your-store.myshopify.com` (step 1) |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | Required | Headless → Storefront API → Public access token (step 3) |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | Recommended | Same page → Private access token (step 3) |
| `SHOPIFY_WEBHOOK_SECRET` | Recommended | Webhook signing secret (steps 8 and 10) |
| `NEXT_PUBLIC_SHOPIFY_SHOP_ID`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID` | Shopify analytics | Step 3 |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_REGION` | PostHog | PostHog project settings (step 8) |
| `NEXT_PUBLIC_SITE_URL` | Site | The canonical website URL, `https://www.maisonbotaniqueflowers.com` |
| `SITE_INDEXABLE` | Launch switch | `false` until launch day |
| `SHOPIFY_ADMIN_CLIENT_ID`, `SHOPIFY_ADMIN_CLIENT_SECRET` | Seed script only | Dev Dashboard app (step 5A). Local only; never put these on the host. |
| `SHOPIFY_ADMIN_REFRESH_TOKEN` | Seed script only | Written automatically by `npm run shopify:auth` (step 5A). Local only. |
| `SHOPIFY_FORMS_CLIENT_ID`, `SHOPIFY_FORMS_CLIENT_SECRET` | Forms setup only | Second Dev Dashboard app (step 13). Local only. |
| `SHOPIFY_FORMS_ADMIN_TOKEN` | Website forms | Written by `npm run shopify:auth -- --forms` (step 13). **Goes on the host.** |

The API version (`2026-10`) and the 5-minute refresh interval are constants in `src/lib/shopify/config.ts` and `catalog.ts`, not settings. Leaving both required values empty runs the old sample preview. Filling in only one of them stops the build with an error on purpose, so a live site can never show sample prices.

## 5. Set up product data

Shopify is the website's only source of products. The site reads these fields (written by `npm run shopify:catalog`, and editable in the admin afterwards):

| Site feature | Where it lives in Shopify |
| --- | --- |
| Name, description | Product **title** and **description** |
| Arabic name and description | Metafields `maison.title_ar` and `maison.description_ar` (also registered as Arabic translations) |
| Sizes, prices, strikethrough prices | One variant per size (**Signature / Grand / Luxe**, or a single size), each with a **price** and a **compare-at price** |
| Size details ("51 roses", Arabic names) | Metafield `maison.size_details` (JSON, one entry per variant, in order) |
| Card line, "What's included" | Metafields `maison.card_line` / `card_line_ar`, `maison.composition` / `composition_ar` (one item per line) |
| Room (Roses, Bouquets, Vases & Boxes, …) | Metafield `maison.room` |
| Occasions | Tags `occasion:birthday`, `occasion:love`, `occasion:thanks`, `occasion:get-well`, `occasion:new-baby`, `occasion:congratulations`, `occasion:wedding`, `occasion:sorry`, `occasion:just-because` |
| Flowers and format (shop menu, tabs) | Tags `flower:rose` (lily, orchid, tulip, hydrangea, sunflower, carnation, mixed) and `format:bouquet` (box, vase, gift) |
| Stem filter | Metafield `maison.stem_count` |
| "Featured" order | Metafield `maison.sort_order` (lower first) |
| Home hero (3 products) | Tag **`featured`** plus metafield `maison.hero_order` (1–3) |
| Personalisation (letter, age) | Metafield `maison.custom_fields` |
| Photograph | The product's first image |
| Collections (`/collections`) | **Every** collection published to Headless. Empty collections are hidden. |
| Sold out | Variant availability. A variant priced 0 is never sold, and a product with no priced variant is hidden. |

### Catalog source and prices

- `catalog/shopify-export/` holds the catalog: `shopify-push.json` (318 products, 822 variants, ready `productSet` inputs), `images/`, and `DEVELOPER_HANDOFF.md`. `src/data/collection.json` (built by `scripts/build_collection.py`) adds the storefront fields above.
- **Prices** come from the competitor research data, and every strikethrough price is set so the selling price is 40-60% off it (a whole-number percentage fixed per product by `scripts/strikethrough_rule.py`; `python scripts/set_strikethrough.py` rewrites only those prices in the ledger, then `python scripts/sync_preview_prices.py` applies them to the preview catalogue): `npm run catalog:prices` (`scripts/match_prices.py`) matches each product's `reference_id` to `scraper/output/giftygram.csv` (`REF-GG-…`) or `scraper/output/uaeflowers.csv` (`REF-UAE-…`) and writes `catalog/shopify-export/variant-prices.csv`: the selling price and the strikethrough price for every SKU, with how it was matched. GiftyGram lists both prices per size; for UAEFlowers, Signature/Grand/Luxe use the Classic/Deluxe/Premium tiers and the larger tiers keep the base size's discount ratio. To set Maison's own prices later, edit the CSV (or the admin) and run the sync again.
- **Names and strikethrough prices:** `npm run shopify:names-prices` is a dry run (reads Shopify, writes nothing); `-- --apply` renames every product (title, handle with a redirect from the old URL, SEO, Arabic title, the metafields that quote the name) and sets the 40-60% compare-at prices. It leaves descriptions, images, tags, collections and selling prices alone, so it is the safe way to apply these two changes after the store is live. Image alt text still quotes the old names.
- **Sync:** `npm run shopify:catalog` creates the metafield definitions, enables Arabic as a store language (unpublished), uploads images, upserts every product as **Active** on the Headless channel, registers Arabic translations, rebuilds the 14 collections and **archives** (never deletes) products that are no longer in the catalog. It is safe to run again; images are only re-uploaded when they change (`-- --images` forces it). The report is written to `catalog/shopify-export/sync-report.json`.

### Admin API access for the catalog sync

The catalog sync talks to the **Admin API**.

**About Admin API access for a client transfer store.** Since 1 January 2026, Shopify no longer lets you create "custom apps" in the store admin, so there is no permanent `shpat_…` token to copy. A client transfer store also isn't part of your Dev Dashboard organization, so Shopify's simpler *client credentials* login is refused there (`shop_not_permitted`). The route that works:

- Create an app under your **Partner** organization.
- Give it **custom distribution**, which produces an install link for this one store.
- Install it on the store.
- Authorize it once with `npm run shopify:auth`.

That command runs Shopify's OAuth flow on your machine and saves a **refresh token** to `.env.local`. On every run, the sync script swaps the refresh token for a short-lived Admin access token, so you never copy an access token by hand. The refresh token lasts about 90 days; after that, run `npm run shopify:auth` again (no reinstall needed).

**Step by step:**

1. **Open the Dev Dashboard under your Partner organization.** Log in to [partners.shopify.com](https://partners.shopify.com), choose **Apps** in the left menu, and select **Create app**. You land in the **Dev Dashboard** with the Partner organization selected; the direct address is [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard). If you belong to several organizations, use the organization switcher (top left) to pick the Partner organization that created the store.
2. **Create the app.** **Apps** → **Create app** (top right) → **Start from Dev Dashboard**. Name it `Maison Botanique seed`, then select **Create**.
3. **Configure and release a version.** Open the app's **Versions** page and create a version with:
   - **App URL:** `http://localhost:3457/auth`
   - **Embed app in Shopify admin:** off
   - **Allowed redirection URL(s):** `http://localhost:3457/auth/callback`
   - **Webhooks API version:** `2026-10`
   - **Scopes:** `write_products,write_publications,write_translations,write_locales,write_files`. Each `write_` scope includes read access.

   Then select **Release**. Nothing else needs to be hosted: the app's only "server" is the helper you run locally in step 7.
4. **Choose custom distribution.** On the app's **Home** page, find the **Distribution** card → **Select distribution method** → **Custom distribution** → confirm. This choice is permanent for the app, which is fine; it's meant for one client.
5. **Generate the install link.** In the same card, enter the store's **permanent** myshopify domain, `maison-botanique-5zuwgyks.myshopify.com`. Don't use `maison-botanique-store`, the handle shown in the admin URL; the permanent domain is listed as `myshopify_domain` at `https://maison-botanique-store.myshopify.com/meta.json`. Leave the multi-store option off, select **Generate link**, and copy the link. It contains `install_custom_app`. Don't use the **Install app** button in the *Installs* card: for a client transfer store it fails with "The installation link for this app is invalid".
6. **Copy the credentials.** Open the app's **Settings** and, in the **Credentials** card, copy the **Client ID** and **Client secret** into `.env.local`:
   ```ini
   SHOPIFY_ADMIN_CLIENT_ID=<client id>
   SHOPIFY_ADMIN_CLIENT_SECRET=<client secret>
   ```
   Keep these on your machine only. Don't add them to Vercel and never prefix them with `NEXT_PUBLIC_`. The secret gives write access to products, so rotate it in the same card if it leaks.
7. **Install and authorize** (about two minutes):
   1. In a terminal, run `npm run shopify:auth`. It starts a temporary helper on `http://localhost:3457` and waits.
   2. In the **same browser**, log in to the store from the Partner Dashboard (**Stores** → **Log in**). Then open the **install link** from step 5, review the permissions and select **Install**.
   3. Shopify sends you to `localhost:3457`. The helper passes you to the approval screen and, once you approve, receives the one-time code and exchanges it for tokens. The browser shows **Authorized**, and the terminal confirms the shop name and the saved refresh token.

   If the app is already installed, you don't need the install link again: `npm run shopify:auth` prints a direct authorization link to open instead.
8. **Sync the catalog.** Make sure the **Headless** channel from step 3 exists, then run:
   ```sh
   npm run catalog:prices   # only after the research CSVs or the catalog change
   npm run shopify:catalog
   ```
   It is safe to run again; products are matched by handle and updated.

**If something goes wrong:**

| Message | Fix |
| --- | --- |
| `redirect_uri is not whitelisted` on Shopify's page | The version's **Allowed redirection URL(s)** must be exactly `http://localhost:3457/auth/callback`. Release the version again after changing it. |
| Browser can't reach `localhost:3457` | `npm run shopify:auth` isn't running, or it timed out after 15 minutes. Start it again, then open the link. |
| `The installation link for this app is invalid` or `This app can't be installed on this store` | Usually one of three things. (1) You used **Install app** in the *Installs* card, whose links contain `app/grant?access_change_uuid=`. That button only works for stores inside the app's own organization. Use the link from the **Distribution** card instead, which contains `install_custom_app`. (2) The link was generated for the store's display handle instead of its **permanent** myshopify domain. Find the permanent one at `https://<store>.myshopify.com/meta.json` (`myshopify_domain`) and regenerate the link with it. For Maison Botanique it is `maison-botanique-5zuwgyks.myshopify.com`, not `maison-botanique-store.myshopify.com`. (3) The app has no **Distribution** card, which means it was created in a non-Partner organization. Recreate it after switching to the Partner organization (step 1). |
| The sync says *Missing scopes* or a mutation is denied | Add the scope to a new app version, release it, approve the new permission in the store admin (*Settings → Apps*), then run `npm run shopify:auth` again. |
| The sync says the saved authorization expired | The refresh token is older than ~90 days or the app was uninstalled. Run `npm run shopify:auth` again. |

**After the store is transferred to the client,** the app stays installed and the saved refresh token should keep working. If the client uninstalls the app or Shopify revokes access, ask the client (or your collaborator account, with *Manage apps* permission) to reopen the install link, then run `npm run shopify:auth` again.

**The other tokens, for reference:**

| Token | What it is | How you get it |
| --- | --- | --- |
| Storefront **public** access token | Lets the website read products and manage carts; safe in the browser | Headless channel → storefront → Storefront API (step 3) |
| Storefront **private** access token | Same API, for server-side requests; keep secret | Same page (step 3) |
| Admin API client ID and secret | Identify the catalog app; local only | Dev Dashboard → app → Settings → Credentials (step 5A) |
| Admin API refresh token | Long-lived (~90 days) authorization for the catalog app; local only | Saved to `.env.local` by `npm run shopify:auth` |
| Admin API access token | Full store management; never on the website | Not stored: the sync script gets a fresh short-lived one from the refresh token on each run |
| Webhook signing secret | Proves webhook calls really come from Shopify | Settings → Notifications → Webhooks (step 10) |

### Option B: enter the real catalog in the admin (production)

1. **Settings → Custom data → Products → Add definition**, twice:
   - Name *Background colour*, namespace and key `custom.background_color`, type **Color**, with **Storefronts** access turned on.
   - Name *Accent colour*, namespace and key `custom.accent_color`, type **Color**, with **Storefronts** access turned on.
2. **Products → Add product** for each arrangement:
   - Title, description, one approved photograph, and **Product type** as in the table above.
   - **Variants:** add option **Presentation** with values such as `Signature` and `Grand`, then set each variant's price in AED.
   - **Inventory:** for made-to-order arrangements, untick *Track quantity*. For limited stock, track it and enter quantities.
   - **Tags:** the `occasion:*` tags, plus `featured` on three hero products.
   - **Metafields** (bottom of the page): background and accent colours.
   - **Publishing:** make sure **Headless** is selected under *Sales channels*. Status **Active**.
3. **Products → Collections:** create the collections you want shoppers to browse (for example *Signature bouquets*, *Gifts under AED 400*). Each one appears on `/collections` and in the shop's collection filter, in its own sort order. Make each collection available on the **Headless** channel; add a collection image and an Arabic title in Translate & Adapt if you like.
4. **Translate & Adapt → Arabic:** translate each product's title, description and the *Presentation* option values. Untranslated text falls back to English.

### Check the catalog

```sh
npm run dev
```

Open http://localhost:3000. The products should come from Shopify, and the "Sample price" and concept notices should be gone. Switch to Arabic to check the translations. Every product and collection published to the Headless channel is loaded; there is no special home-page collection.

## 6. Delivery, payments and checkout

1. **Settings → Locations:** add the Dubai studio as a location and make it fulfil online orders.
2. **Settings → Shipping and delivery:**
   - *Local delivery* from the Dubai location, with delivery zones (by distance or area) and a fee and minimum order for each zone. The delivery instructions field lets drivers see notes.
   - Optionally *Local pickup* from the studio.
   - Add a shipping rate for the rest of the UAE if the business delivers beyond its local zones.
3. **Settings → Payments:** set up the payment provider available to the UAE business (Shopify Payments if the business is eligible, otherwise a supported third-party gateway). On the development store, use the **Bogus gateway** or test mode for testing.
4. **Settings → Checkout:**
   - Customer contact: email or phone. Phone matters for flower delivery.
   - Ask for the recipient's address and phone in the shipping address form (*Company name* off, *Address line 2* optional).
   - Order processing: decide whether to auto-fulfil. Usually not, for made-to-order flowers.
   - Choose the abandoned checkout email timing.
5. **Gift note, delivery date and time:**
   - The gift note is a property on each cart line, **Gift message**, shown under the item on the order.
   - The delivery day and time window are chosen once per order (in the bag, required before checkout) and saved on the cart as **Delivery date** (`YYYY-MM-DD`) and **Delivery time** (e.g. `12:00 PM – 3:00 PM`). The same schedule is also written in words as the cart note (for example `Delivery: Tue 21 Oct (2026-10-21) · 9am – 12pm Dubai time`), so it shows as the order **Note** at the top of the order and on the packing slip, as well as under **Additional details**. The bag's checkout button stays closed until a day and a time window that can still be booked are chosen, and no checkout link is created without them. Shopify's hosted checkout cannot be locked from the website alone (that needs a Shopify Plus checkout validation), so an order that arrives without a schedule should be queried with the customer.
   - Windows: 9am–12pm, 12–3pm, 3–6pm and 6–9pm, Dubai time; today's windows close 1 hour before they start; bookings up to 60 days ahead; closed dates and weekdays can be set. Change them in `DELIVERY_RULES` in `src/lib/delivery.ts`.
   - The delivery day and time are chosen in the bag; the gift card text, signature (or "Anonymous") and any personalisation travel on each line as **Gift message**, **Card signed**, **Anonymous** and **Personalisation**.
   - Open **Settings → Notifications → Order confirmation** and the packing slip (*Shipping and delivery → Packing slips*) and make sure they print line item properties and order attributes (`{% for attribute in attributes %}`). Add them if they don't.
6. **Checkout appearance:** *Settings → Checkout → Customize* to add the logo and brand colours so the hand-off from the site feels seamless.

## 7. Domains

The website and checkout run on different domains:

- `maisonbotaniqueflowers.com` (and `www.`) point to the **Next.js host** (step 9).
- In **Settings → Domains**, connect a subdomain such as **`shop.maisonbotaniqueflowers.com`** to Shopify and make it the **primary domain**. Checkout URLs then use the brand domain instead of `myshopify.com`.
- The Shopify **Online Store** channel still exists, and Shopify links to it from customer accounts and emails ("Buy again", "Continue shopping"). The **Maison Botanique Headless** theme (`shopify-theme/`, step 15) redirects every online store page to the matching page on the website; keep it published.

## 8. Analytics (Shopify and PostHog)

### Shopify analytics

Set `NEXT_PUBLIC_SHOPIFY_SHOP_ID` and `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID` from step 3. The site then uses Shopify's own storefront scripts, the same ones Hydrogen uses (`@shopify/hydrogen` core):

| Piece | What it does |
| --- | --- |
| `src/proxy.ts` | Same-origin Storefront API proxy (`/api/2026-10/graphql.json`). Shopify sets its analytics and checkout-continuity cookies on this domain through it, which is how visits are linked to checkouts and orders since the `_shopify_y`/`_shopify_s` cookies were retired on 30 April 2026. The browser cart uses this proxy. |
| `ShopifyScriptTags` (root layout head) | The analytics bus, the Customer Privacy API (consent-tracking-api v0.2), Shopify's storefront analytics and performance scripts. |
| `ShopifyAnalytics` | Starts the scripts and publishes a page view per URL. |
| Product, collection, search pages | `product_viewed`, `collection_viewed`, `search_viewed`. |
| Cart | Shopify's `trackCartAnalytics` publishes `cart_updated`, `product_added_to_cart` and `product_removed_from_cart` from confirmed cart states; the bag drawer publishes `cart_viewed`. |

Consent mode is **no banner**: Shopify applies the default consent for the visitor's region from **Settings → Customer privacy** and delivers events only where that allows. Checkout and purchase events are recorded by Shopify itself. View results in **Analytics → Reports**, filtered by the **Headless** sales channel.

### PostHog

1. Create a PostHog Cloud project and copy its **Project API key** (`phc_…`). Note the region (US or EU).
2. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_REGION` (`us` or `eu`) in `.env.local` and on the host, then redeploy.
3. Add the order webhooks (below) so purchases reach PostHog.
4. Install the checkout pixel (below) so each Shopify checkout step reaches PostHog.

How the data stays accurate:

- **Relay through this domain.** The browser sends to `/mb-relay`, which `next.config.ts` rewrites to PostHog. Ad blockers routinely block `*.posthog.com`; without the relay a large share of events would silently disappear.
- **Pageviews** on every client-side path change (`history_change`) plus page leave. Filter and search changes on `/shop` change only the query string, so they aren't counted as extra pageviews.
- **Ecommerce events** (PostHog's ecommerce spec): `Product List Viewed`, `Product Clicked`, `Products Searched`, `Product Viewed`, `Product Size Selected`, `Gift Option Added`, `Product Added`, `Product Removed`, `Cart Viewed`, `Checkout Started`, `Checkout Failed`, `Cart Error`; from Shopify checkout (pixel) `Checkout Step Viewed`, `Checkout Step Completed`, `Checkout Completed`, `Checkout Alert Displayed`; from webhooks `Order Placed`, `Order Completed`, `Order Fulfilled`, `Order Cancelled`, `Order Refunded`. Cart events fire only after Shopify confirms the change; list and search events wait until filters settle; `Checkout Started` is sent with `sendBeacon` so it survives the redirect to checkout.
- **Purchases come from Shopify, not the browser.** The cart carries two hidden attributes (`_posthog_distinct_id`, `_posthog_session_id`), refreshed when checkout starts. The `orders/paid` webhook records `Order Completed` server-side for the same person and session, with a fixed event ID per order so Shopify's retries are never double counted. Test orders are recorded as `Order Completed (Test)`.
- **Customers:** an order with a Shopify customer merges the storefront visitor into the person `shopify_customer:<id>` (properties: `shopify_customer_id`, first/last order date and value; no names or emails), so repeat customers are one profile across devices. Guest orders stay anonymous.
- **Leads:** `Form Started`, `Form Error` (field name only), `Newsletter Subscribed` and `Enquiry Submitted` (only the topic, never the details).
- **Engagement:** `Hero Arrangement Changed`, `Hero CTA Clicked`, `Section Viewed` (elements with `data-track-section`), `Navigation Clicked` (header, footer, bag), `Contact Clicked` (email, phone, WhatsApp, Instagram), `Page Not Found`, `Language Changed`.
- **Autocapture:** clicks, heatmaps (clicks, mouse movement, scroll depth), dead and rage clicks, web vitals (LCP, CLS, FCP, INP), page leave with scroll depth, JavaScript exceptions, and session replay with console logs and network timing.
- **Every event** carries `locale` and `catalog_source`. Localhost traffic is flagged as internal by PostHog.
- **Privacy:** no names, emails, phone numbers or gift notes are sent. Session replay masks every input and the gift notes and dates shown in the bag.

In PostHog, set **Revenue analytics** (or a revenue insight) to use the `revenue` property of `Order Completed` and `Order Refunded` (refunds carry negative revenue).

### Order webhook

**Settings → Notifications → Webhooks → Create webhook**, once for each event, all to `https://maisonbotaniqueflowers.com/api/webhooks/orders` (JSON, 2026-10):

| Event | Topic | PostHog event |
| --- | --- | --- |
| *Order creation* | `orders/create` | `Order Placed` (also unpaid / cash on delivery; no revenue) |
| *Order payment* | `orders/paid` | `Order Completed` (the revenue event) |
| *Order fulfillment* | `orders/fulfilled` | `Order Fulfilled` (with hours to fulfil) |
| *Order cancellation* | `orders/cancelled` | `Order Cancelled` |
| *Refund create* | `refunds/create` | `Order Refunded` (negative revenue) |

They use the same signing secret as the catalog webhook (`SHOPIFY_WEBHOOK_SECRET`, step 10). Use **Send test notification**: the host logs should show `POST /api/webhooks/orders 200`.

### Checkout pixel

Shopify's checkout runs on Shopify, out of reach of the PostHog script, so a custom pixel reports each step:

1. Open [`docs/shopify-checkout-pixel.js`](shopify-checkout-pixel.js) and replace `phc_REPLACE_WITH_PROJECT_KEY` with the PostHog project key (`NEXT_PUBLIC_POSTHOG_KEY`). After launch, set `POSTHOG_HOST` to `https://maisonbotaniqueflowers.com/mb-relay` so ad blockers don't drop checkout events.
2. **Settings → Customer events → Add custom pixel**, name it *PostHog checkout*, and paste the file. Shopify only accepts `analytics.subscribe` with a literal event name, so keep one call per event.
3. Customer privacy: **Permission → Required: Analytics** only (with the no-banner consent mode, UAE visitors are covered by default; visitors from opt-in regions are tracked only after consenting), **Data sale → Data collected does not qualify as data sale**.
4. **Save**, then **Connect**.

Checkout events join the storefront visitor through the `_posthog_distinct_id` cart attribute. `Checkout Completed` carries no `revenue`; revenue comes only from the `orders/paid` webhook, so totals never double.

### Dashboards

PostHog project *Maison Botanique* (time zone Asia/Dubai) has two dashboards: **Maison Botanique store** (checkout funnel by step, revenue, AOV, coupons, top products, list clicks, abandonment, order lifecycle, checkout problems, gifting, delivery lead time, revenue by language, repeat purchase) and **Maison Botanique engagement** (home page reach, hero, searches and zero-result searches, language split, forms, contact clicks, navigation, web vitals, dead/rage clicks, 404s, JavaScript errors). Cohorts: *Customers (paid orders)* and *Repeat customers*. Test-account filtering excludes localhost, setup seed events and the internal-users cohort.

Mention Shopify analytics and PostHog (including session replay) in the privacy policy.

## Changing the domain

The site is set up for `maisonbotaniqueflowers.com`. If the final domain is different, change it in these places (nothing else in the code names the domain):

**Hosting**
- [ ] `NEXT_PUBLIC_SITE_URL` on the host (and in `.env.local`), then redeploy. Canonical URLs, Open Graph links, `robots.txt` and `sitemap.xml` all come from it.
- [ ] Connect the new domain in the host's domain settings and DNS.

**Shopify admin**
- [ ] **Settings → Notifications → Webhooks:** edit the URL of all 12 webhooks (`…/api/webhooks/orders` ×5, `…/api/revalidate` ×7). The signing secret does not change.
- [ ] **Settings → Domains:** connect the checkout subdomain (e.g. `shop.<new-domain>`) and make it primary.
- [ ] **Settings → Customer events → PostHog checkout:** if `POSTHOG_HOST` was switched to the relay, update it to `https://<new-domain>/mb-relay`.
- [ ] **Sales channels → Headless → storefront → Customer Account API → Application setup:** callback `https://<new-domain>/account/authorize`, JavaScript origin `https://<new-domain>`, logout URIs `https://<new-domain>` and `https://<new-domain>/`.
- [ ] **Online Store → Themes → Customize → Theme settings → Website:** the new URL (the redirect theme).

**PostHog** (project settings)
- [ ] **Web analytics → Web analytics domains** (and **Session replay → Authorized domains**, if set): replace the old domain.

**Content**
- [ ] `src/lib/site.ts`: `email` (`hello@maisonbotaniqueflowers.com`), if the mailbox moves to the new domain, and the `SITE_URL` fallback.
- [ ] The privacy and terms pages read the email from `src/lib/site.ts`; review their wording.
- [ ] Docs only: `README.md`, `.env.example`, this guide and `docs/shopify-checkout-pixel.js` comments.

## 9. Deploy

Any Next.js host works. On **Vercel**:

1. Import the repository. The framework is detected as Next.js; keep the default build command (`npm run build`).
2. *Settings → Environment Variables:* add every variable from `.env.local` **except** `SHOPIFY_ADMIN_*`, `SHOPIFY_FORMS_CLIENT_ID` and `SHOPIFY_FORMS_CLIENT_SECRET`, which belong only on the machine that runs the scripts. `SHOPIFY_FORMS_ADMIN_TOKEN` **does** go on the host (step 13).
3. Deploy. `NEXT_PUBLIC_*` values are built into the site, so **redeploy after changing any of them**.
4. Connect `maisonbotaniqueflowers.com` in the host's domain settings. Keep `SITE_INDEXABLE=false` until launch day.

## 10. Instant catalog updates (webhook)

The home page refreshes product data every 5 minutes on its own. To refresh immediately when a product changes:

1. **Settings → Notifications → Webhooks → Create webhook**, once for each event: *Product creation*, *Product update*, *Product deletion*, *Collection creation*, *Collection update*, *Collection deletion*, and *Inventory level update* if inventory is tracked.
   - Format **JSON**, URL `https://maisonbotaniqueflowers.com/api/revalidate`, API version **2026-10**.
2. Below the list, Shopify shows *"Your webhooks will be signed with …"*. Copy that secret into the host's environment as **`SHOPIFY_WEBHOOK_SECRET`** and redeploy.
3. Use **Send test notification**. The host's logs should show `POST /api/revalidate 200`. A 401 means the secret does not match.

## 11. Welcome offer code

The welcome offer is set up in step 17. Customers enter the code on Shopify's checkout page. For shareable links that apply the code automatically (for example from a QR code), the cart can apply it through the Storefront API (`cartDiscountCodesUpdate`); that small addition to `src/lib/shopify/cart.ts` isn't built yet.

## 12. Test before launch

Use the development store, or the production store with test payments turned on:

- [ ] Products, prices, sold-out sizes, filters, search and the hero gallery match Shopify, in English and Arabic.
- [ ] Add two sizes of a product with different gift notes. They stay separate lines, and quantities and removal work.
- [ ] Reload the page: the bag is still there. Open the site in another browser: the bag is empty (carts belong to a browser).
- [ ] Checkout totals, VAT, delivery fees (AED 30 Dubai, AED 50 elsewhere in the UAE) and the `BLOOM25` discount are correct. Arabic checkout opens in Arabic.
- [ ] Delivery: the product page and the bag require a day and a window; today's windows that start within 2 hours are unavailable; checkout is blocked until one is chosen.
- [ ] Place a test order. In the admin: the order is attributed to **Headless**, *Gift message* appears on the item, and *Delivery date* and *Delivery time* appear under Additional details and the delivery is in the order Note, in the confirmation email and on the packing slip.
- [ ] Customer accounts: Account → Sign in sends a code by email, returns to `/account` showing orders and addresses, checkout opens signed in, and Sign out returns to the home page.
- [ ] WhatsApp button opens a chat with the right number (and the product's link on product pages).
- [ ] Visit `<store>.myshopify.com/products/<handle>`: it redirects to `/shop/<handle>` on the website.
- [ ] After the order, return to the site: the bag is empty, because Shopify closes the completed cart.
- [ ] Change a price in the admin. The site shows it within seconds (webhook) or within 5 minutes.
- [ ] Cancel and refund the test order, and confirm the abandoned checkout email for an unfinished checkout.
- [ ] Shopify reports (Analytics → Reports, Headless channel) show sessions, product views and add-to-carts from the site.
- [ ] Launch day: set `SITE_INDEXABLE=true`, redeploy, remove the Online Store password if it is not needed, and switch payments out of test mode.

## 13. Website forms (newsletter, contact, enquiries)

Every form on the site is stored in Shopify; there is no other service.

| Form | Where it lands in Shopify |
| --- | --- |
| Newsletter and welcome offer (email or WhatsApp number) | **Customers**: the email is created or updated with *Email subscribed* (single opt-in) and tagged `newsletter`. Reach them with Shopify Email or any marketing app. |
| Contact (`/contact`) | **Customers**: tagged `website-contact`. **Content → Metaobjects → Website enquiry**: the full message. |
| Events enquiry (`/services`) | **Customers**: tagged `website-enquiry`. **Content → Metaobjects → Website enquiry**: message, topic and event date. |

The Storefront API has no contact-form or (stable) newsletter mutation, so the site uses the Admin API on the server. To keep product-editing credentials off the host, the forms use **their own app** with customer and metaobject scopes only.

1. In the Dev Dashboard, create a second app, for example *Maison website forms*, with **custom distribution** for this store (same steps as 5A).
   - **App URL** `http://localhost:3457/auth`, **Redirect URL** `http://localhost:3457/auth/callback`.
   - **Scopes:** `read_customers,write_customers,write_metaobject_definitions,write_metaobjects`.
   - **Protected customer data:** request access and select **Name**, **Email** and **Phone**. Shopify blocks customer reads and writes until this is approved.
   - Release the version and install it on the store.
2. In `.env.local`, set `SHOPIFY_FORMS_CLIENT_ID` and `SHOPIFY_FORMS_CLIENT_SECRET` from that app's credentials.
3. Run `npm run shopify:auth -- --forms` and approve. It saves `SHOPIFY_FORMS_ADMIN_TOKEN` to `.env.local`.
4. Add `SHOPIFY_FORMS_ADMIN_TOKEN` to the host's environment variables and redeploy.
5. Send a test message from `/contact`. The "Website enquiry" metaobject definition is created automatically on the first message.
6. **Be told about new messages:** in **Shopify Flow**, create a workflow *Customer tags added* → condition *tags include `website-enquiry` or `website-contact`* → **Send internal email** to the team.

If the token is missing or Shopify cannot be reached, the forms never lose a message: they show a prefilled email to `hello@maisonbotaniqueflowers.com` instead (`src/lib/site.ts`).

## 14. Customer accounts

Shoppers sign in with Shopify's customer accounts (email and a one-time code; no passwords). The website shows their orders, delivery times and addresses at `/account`, carts are attached to the signed-in customer, and checkout opens with their details filled in.

1. **Settings → Customer accounts:** *Customer accounts* (not legacy), with **Show sign-in links** on.
2. **Sales channels → Headless → your storefront → Customer Account API:**
   - Client type **Public**. Copy the **Client ID** into `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID`.
   - Permissions: `customer_read_customers` and `customer_read_orders` at least.
   - **Application setup:** callback URI `https://maisonbotaniqueflowers.com/account/authorize`, JavaScript origin `https://maisonbotaniqueflowers.com`, logout URIs `https://maisonbotaniqueflowers.com` and `https://maisonbotaniqueflowers.com/`.
3. Set **`CUSTOMER_ACCOUNT_SESSION_SECRET`** on the host to 36+ random characters (`node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"`). It encrypts the session cookie; changing it signs everyone out. `NEXT_PUBLIC_SHOPIFY_SHOP_ID` must be set too.
4. Redeploy. Sign-in only works over HTTPS on a registered origin, so test it on the live domain (or add a tunnel's HTTPS URL to the three fields above for local testing). On `http://localhost`, *Sign in* returns to `/account?login=failed`.

How it works: `src/proxy.ts` runs Hydrogen's `/account/login`, `/account/authorize`, `/account/refresh` and `/account/logout` handlers and the endpoints in `src/lib/account/routes.ts`. Tokens live only in the encrypted HttpOnly `mb_account.*` cookies. The browser cart attaches itself to the signed-in customer through `POST /api/account/cart` (once per cart per session), and signing out clears the bag on that device. PostHog links the visitor to `shopify_customer:<id>` on the account page (the same person the order webhook uses) and resets on sign-out.

## 15. Online store redirect theme

`shopify-theme/` is a minimal theme that sends every online store page (product, collection, search, pages, policies, home, password page) to the matching page on the website. Gift card pages are kept so customers can use their cards.

1. `npm run theme:zip` writes `shopify-theme.zip`.
2. **Online Store → Themes → Import → Upload zip file**, or `npx @shopify/cli theme push --path shopify-theme --store <store>.myshopify.com --unpublished`.
3. Publish **Maison Botanique Headless**. The website address is a theme setting (*Customize → Theme settings → Website*).

## 16. WhatsApp button

Set **`NEXT_PUBLIC_WHATSAPP_NUMBER`** (digits, international format, e.g. `9715XXXXXXXX`) and redeploy. A floating *Need help?* button appears on every page (on product pages the message includes the product link), and the footer and contact page show WhatsApp links. Clicks are tracked as `Contact Clicked` with channel `whatsapp`.

## 17. Welcome offer (25% off the first order, on top of up to 60% off)

Every price already shows a strikethrough price 40-60% above it (`scripts/strikethrough_rule.py`); the code takes a further 25% off the selling price. The site says "25% + up to 60% off" and does not add them up.

The offer ribbon above the header and the pop-up on arrival ask for a WhatsApp number or an email. The sign-up is saved in Shopify as a newsletter customer: an email is subscribed to email marketing, a WhatsApp number to SMS marketing, and both are tagged `newsletter`. The visitor then sees the code. The code itself must exist in Shopify:

1. **Discounts → Create discount → Amount off products**: code **`BLOOM25`**, **25%**, all products.
2. **Usage limits:** **one use per customer**. There is no limit on the total number of uses, and no free gift: the site no longer mentions a first-100 limit or a candle.
3. Set the start date (and an end date if the offer has one), then **Save**.
4. If you choose a different code, set **`NEXT_PUBLIC_LAUNCH_OFFER_CODE`** on the host and redeploy.

Sign-ups need `SHOPIFY_FORMS_ADMIN_TOKEN` (step 13); without it the visitor still sees the code, but nothing is saved.

## 18. Delivery fees and coverage

Same-day delivery is offered across the whole UAE, for **AED 30 in Dubai** and **AED 50 elsewhere in the UAE**. The website states this in the footer, the residences page, the delivery page and the FAQ; the bag and product pages leave the fee to checkout. Shopify must charge the same amounts, or customers will see a different fee at checkout:

1. **Settings → Shipping and delivery → General shipping rates** (or the delivery profile for these products).
2. A **Dubai** zone with a flat rate of **AED 30**, and a **rest of the UAE** zone with a flat rate of **AED 50**. Set them up as shipping zones by emirate, or as local delivery zones if the team delivers itself.
3. No free-shipping threshold and no free-delivery rate or discount for any area or building: every order pays AED 30 or AED 50. Check that no free-shipping rate or automatic discount exists in Shopify.
4. Test an address in Dubai and one in Abu Dhabi at checkout: the totals should add AED 30 and AED 50.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Build fails with "Shopify is misconfigured" | Domain is not the `*.myshopify.com` one, or one of domain/token is missing. |
| Site still shows sample products | Shopify variables not set in this environment, or the site was not rebuilt after setting them. |
| Products missing | Product not **Active**, or not published to the **Headless** channel. |
| Collection missing | Collection not published to **Headless**, or none of its products are. |
| Forms offer "send by email" | `SHOPIFY_FORMS_ADMIN_TOKEN` not set on the host, or Shopify rejected the request: check the host logs for `[enquiry]`. |
| Forms log "access denied" for customers | Protected customer data access is not approved for the forms app (step 13, point 1). |
| Colours ignored | Metafield definition lacks **Storefronts** access, or the metafield type is not *Color*. |
| Arabic shows English | Arabic not published, not enabled for the UAE market, or not translated in Translate & Adapt. |
| "Your bag could not be updated" | Token lacks the cart/checkout permissions, or the variant is unavailable in the UAE market. |
| Webhook returns 401 | `SHOPIFY_WEBHOOK_SECRET` doesn't match the secret shown under Settings → Notifications → Webhooks. |
