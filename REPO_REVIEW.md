# Original repository review

Reviewed 16 October 2026 against `main` at `7b3199b`. This branch contains the newer Maison Botanique review storefront. The original Next.js implementation remains available on `main`; no original content has been treated as an approved business fact.

## What the original site contains

- A Next.js 16 / React 19 / TypeScript / Tailwind storefront with a hero, occasion links, six product cards, an atelier story, services, testimonials, and a newsletter form.
- Eight floral and interior images under `public/images/`.
- Centralized content modules in `data/site.ts`, `data/home.ts`, and `data/products.ts`.
- Placeholder commerce and newsletter functions in `lib/cart.ts` and `lib/newsletter.ts`.

## Section-by-section decision

| Original section | Review | Recommendation |
| --- | --- | --- |
| Hero | Strong, dark floral photography, but its “Est. 2014,” Dubai atelier, and concierge claims are not verified. | Keep the photographic mood as a reference. Keep the current scroll-led product hero as the site starting point. |
| Marquee | Repeats same-day delivery and service claims. | Omit until delivery rules and services are confirmed. |
| Occasions | Eight tiles all link to the same collection anchor and do not apply an occasion filter. | Keep the working occasion filters in the current collection; revise the taxonomy only with approved products. |
| Collections | Six photographs, names, AED prices, and a hover-only scent overlay in a conventional grid. | Study image art direction. Keep the current horizontal collection and visible shopping information. |
| Atelier | Adds a studio photograph, “10 years” badge, and detailed sourcing story without verification. | Use only if the real business story and genuine studio imagery become available. |
| Services | Events, bridal, subscriptions, and concierge delivery are presented as operating services; every enquiry link goes to the same contact anchor. | Add only confirmed services with a real enquiry path. |
| Testimonials | Three attributed customer quotations have no supporting source in the repository. | Do not publish them without evidence and approval. |
| Almanac / newsletter | Form displays a success message, while the subscribe function is empty. | Omit until an email provider, consent language, and delivery are implemented. |
| Footer | Contains a placeholder address, phone numbers, email, hours, and legal links to `#`. | Replace with verified contact information and real policy pages. |

## Product review

The original catalog lists `50 Shades of Pink` (AED 635), `Scorching Hot` (AED 850), `Cotton Candy Clouds` (AED 1,075), `To You, With Love` (AED 695), `Forever Yours` (AED 1,250), and `Garden of Eden` (AED 790). Each has a single image, alt text, scent notes, and emotion labels. There are no sizes, stock states, variant IDs, Arabic fields, or real checkout mappings. The images are visually coherent, but their rights, origin, and relationship to actual inventory are undocumented. Treat the entire catalog as a concept, including its prices and flower descriptions.

## Code review notes

- The page is a coherent, small Next.js component tree, and its content/data separation is useful. It does not contain a difficult integration that needs to be transferred.
- `AddToCurationButton` calls an empty function, so the prominent purchase action produces no visible result. The newsletter form similarly announces success without saving the email.
- The product overlay is shown on hover; touch users cannot reveal its scent notes through the card UI. The product name and price remain visible outside the overlay.
- The `Reveal` component initially applies `opacity-0` and waits for `IntersectionObserver`. Content can remain hidden if JavaScript or the observer fails. The static page should remain readable without that effect.
- The site has no Arabic content or RTL layout. Its mobile menu omits the separate desktop Order action, though Collections remains in the menu.
- Metadata and copy describe unverified production operations, and the original page does not mark itself as a concept review. These should not be carried into a public final build.

## What is worth carrying forward

| Candidate | Useful part | Condition before using it |
| --- | --- | --- |
| Product and hero photography | Several images have strong floral silhouettes and a cohesive, moody treatment. They are useful references for a final shoot. | Confirm source rights and that each image depicts the actual item sold. The atelier image must not be presented as the Dubai workspace without verification. |
| Structured content modules | Separating product data, site details, and page copy makes catalog changes easier to review. | Keep one English/Arabic product record and bind prices, availability, and options to the real commerce catalog. |
| Typed product model | TypeScript could help prevent mismatched product fields as the catalog grows. | Decide the final stack first; migrate the current bilingual shopping flow as a whole if adopting Next.js. |
| Occasion and service ideas | The original taxonomy suggests possible discovery paths and future service pages. | Confirm actual offerings, routes, terms, and Arabic wording with the owner. Keep occasion browsing inside the current collection until there is real content for more pages. |
| Image optimization | The Next.js image component gives responsive image sizing and format handling. | Adopt if the final site uses Next.js; otherwise add an equivalent image pipeline to Vite. |

## Do not import as facts or live features

- `data/site.ts` lists an unverified Dubai Marina address, placeholder phone numbers and email, and marketing claims such as white-glove delivery across the Emirates.
- `data/home.ts` claims same-day or two-hour delivery, a decade of grower relationships, and services such as bridal couture and subscriptions. These need operational confirmation.
- `data/products.ts` contains six unverified names, prices, ingredients, and descriptions. It is a design catalog, not inventory.
- `data/home.ts` contains three testimonials without evidence of real customers. They should not appear on the final site unless verified and approved.
- `lib/cart.ts` does nothing when a visitor clicks Add to Curation. `lib/newsletter.ts` does nothing while its form shows a success message. Neither can be treated as a working integration.
- The original site is English only, while the agreed storefront needs English and Arabic with RTL. Its product grid and additional sections also differ from the owner's current preference for a horizontal, photo-led collection and focused page order.

## Recommended path to a production site

1. Keep this branch as the reviewable baseline for the approved browsing direction. Compare visual assets from `main` only as references until rights and product accuracy are confirmed.
2. Obtain final SKU and variant data, prices, inventory rules, product photographs, logo, contact details, and delivery policies. Replace the provisional catalog and both sites' unsupported claims.
3. Connect the selected Shopify store, map real variants and hosted checkout, and test an English and Arabic purchase end to end. The current Shopify adapter is a starting point, not a live store.
4. Review Arabic copy with a native editor, verify responsive and accessible behavior, and only then decide whether the final deployment benefits from a Next.js migration or should remain on Vite.
5. Connect the purchased domain and enable indexing only after the production information, checkout, policies, and support path are verified.
