# Maison Botanique headless redirect theme

The storefront is the Next.js site. This theme keeps Shopify's own online store
(the `*.myshopify.com` address, and links Shopify sends from customer accounts
and emails, such as "Buy again" or "Continue shopping") from showing a default
theme: each page redirects to the matching page on the website.

| Shopify page | Website |
| --- | --- |
| `/products/<handle>` | `/shop/<handle>` |
| `/collections/all` | `/shop` |
| `/collections`, `/collections/<handle>` | the same path |
| `/search?q=…` | `/shop?q=…` |
| `/pages/contact`, `faq`, `delivery`, `about` | `/contact`, `/faq`, `/delivery`, `/atelier` |
| `/policies/privacy-policy`, `terms-of-service`, others | `/privacy`, `/terms`, `/delivery` |
| everything else, and the password page | home |

Gift card pages are not redirected; they show the card's code and balance.

**Website URL:** Online Store → Themes → Customize → Theme settings → *Website*.
It defaults to `https://maisonbotaniqueflowers.com`; change it there if the domain changes.

**Install or update:** `npm run theme:zip` writes `shopify-theme.zip`; then Online Store →
Themes → Add theme → Upload zip file → Publish.
