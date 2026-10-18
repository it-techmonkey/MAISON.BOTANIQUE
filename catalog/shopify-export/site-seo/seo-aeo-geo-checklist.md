# Basic SEO / AEO / GEO checklist (launch level)

Already done in products.json: SEO title (<= ~62 chars) and meta description (<= 155) in English and Arabic, descriptive image alt text,
clean URL handles, factual descriptions with contents and sizes, an `answer_summary` metafield and two FAQ pairs per product.

## Shopify settings (once)
1. Online Store > Preferences: set the homepage title and meta description; confirm the primary domain; turn on the sitemap (automatic).
2. Languages: add Arabic and publish with the Translate & Adapt app. Import `translations.ar.*` (title, body_html, seo, alt text) and the Arabic
   option names. Make sure the theme outputs `hreflang` links (Shopify does this when Markets/Languages are set up) and RTL layout for Arabic.
3. Collections (use the product tags): Rose bouquets, Named-flower bouquets, Boxes & baskets, Vase arrangements, Grand gestures, Preserved & plants,
   Flowers & treats, Chocolate gifts, Hampers, Beauty gifts, Teddy & celebration, plus an Occasions collection from the `occasion-seasonal` tag.
   Give every collection a 80-150 word intro written for people (what it is, who it is for, delivery area) and a meta description.
4. Verify the theme prints Product structured data (JSON-LD) with name, image, description, brand, sku, price, currency AED and availability.
   Add review stars to the schema only when real reviews exist. Do not publish fake ratings.
5. Submit the sitemap to Google Search Console and Bing Webmaster Tools. Connect the Google & YouTube channel so products reach Google Merchant Center
   (free product listings) and add the Google Business Profile for the Dubai business.
6. Page speed: keep hero images ~150-300 KB WebP; lazy-load below the fold.

## AEO (answer engines: featured snippets, voice assistants)
- Keep the first sentence of each description a plain factual answer (the `answer_summary` metafield does this).
- Add a store FAQ page and, once the facts are decided, an FAQPage schema: delivery areas, cut-off time, delivery fees, how to choose a size
  (Signature / Grand / Luxe), substitutions, how to add a gift message. Use real answers only (see faq-store-draft.md).
- Use question-style headings on collection pages ("Which roses are best for an anniversary?") with a short direct answer underneath.

## GEO (generative engines: ChatGPT, Gemini, Perplexity, Google AI Overviews)
- Be consistent about who you are: same business name (Maison Botanique), same description sentence and contact details on the site, Google Business Profile,
  Instagram, and any directory listing. Fill organization-schema.json and publish it on the homepage.
- Publish `llms.txt` at the site root (draft in this folder) summarising what you sell, sizes, delivery area and key pages.
- Write clear, specific, quotable facts (counts, sizes, what is included) rather than slogans. Add a short "About" and "How sizes work" page.
- Earn mentions: Google reviews, local Dubai directories, florist/gift roundups, Instagram. Reviews and citations matter more than any tag.
