# Design merge: deployment settings to verify

These are setup instructions, not evidence that live settings were changed.

## Preview and production

Use the `design-merge` review branch and a pull request. Production `main` must not be merged without the owner's approval. The laptop's old `.vercel` link must not be used to deploy.

Use Node 22.18 or newer. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`. The build runs the price validator automatically. With no Storefront credentials it validates the approved price ledger and explicitly reports that live Shopify was not checked.

## Vercel environment

- `NEXT_PUBLIC_WHATSAPP_NUMBER`: preserve the existing customer-facing number from the working WhatsApp link. The ignored local preview environment migrates the old `VITE_WHATSAPP_NUMBER`; do not commit the environment file.
- `NEXT_PUBLIC_LAUNCH_OFFER_CODE=MAISON25` or leave unset.
- Existing Storefront and forms credentials remain necessary for live commerce.
- `SHOPIFY_DISCOUNTS_ADMIN_TOKEN`: separate server-only token, `read_discounts` and `write_discounts`. Do not broaden the product-seeding token or expose an admin token publicly.
- `OFFER_CODE_SECRET`: stable independent random secret of at least 32 characters; changing it changes generated customer codes.
- `OFFER_SESSION_SECRET`: independent random secret of at least 32 characters; encrypts an HttpOnly, SameSite=Lax cookie carrying the contact to checkout. Production uses Secure cookies. Cookie retention is 30 days; the coupon itself has no expiry.

Without the discount token/code secret the server uses MAISON25. Without the session secret it cannot retain contact details for checkout. The fallback code can still be applied from the browser's saved offer code. None of this confirms that MAISON25 is correctly configured in Shopify.

## Shopify discount settings

Owner approval is required before changing live Shopify settings or making test customer/discount records.

Personal codes target the customer's Shopify ID, give 25% off products, allow one total redemption, have no minimum spend or expiry, and do not combine with other discount codes. Signup checks lifetime order count and repeats return the same code. Applying a personal code checks eligibility again. Checkout remains Shopify's authority for whether it accepts a code.

**Before launch:** verify MAISON25 is restricted to genuinely new customers (a once-per-customer limit alone does not mean first-order-only). The customer-specific personal code must also be tested for the case where a customer signs up, completes a different order, and then tries the old code directly in Shopify checkout. The website rejects it when reapplying after an order, but a customer-ID-bound Shopify basic discount alone does not enforce order history at redemption. Strict enforcement in hosted checkout needs a supported Shopify eligibility rule/discount validation. Do not claim that this edge case is verified.

Money bouquet cash value must be collected separately from the online arrangement fee. Only that fee is discountable. Do not publish a cash-value product that would receive a percentage discount on the cash principal.

## Delivery

No area or building gets free delivery: the website says AED 30 in Dubai and AED 40 elsewhere in the UAE. Shopify checkout shipping must charge the same. Verify that a Dubai address (for example Marina) is AED 30 and another emirate is AED 40 before release, and that no free-shipping rate or automatic discount exists.

Approved picker rules: 9am–noon, noon–3pm, 3–6pm, 6–9pm; three-hour lead; daily; up to 60 days ahead. Same-day delivery is offered across the whole UAE; only the fee differs (AED 30 Dubai, AED 40 elsewhere).

## Enquiry firewall

The route has a bounded, salted-IP limiter allowing five attempts per ten minutes per server instance and a streamed 16 KB body limit. Serverless instances do not share memory.

In the correct techmonkeys Vercel project, prepare a WAF rate-limit rule for POST `/api/enquiry`, keyed on the platform's trusted client IP, five requests per 600 seconds, with a 429 response. Verify available plan support and cost before activation; do not purchase a plan or service without approval. Test across concurrent instances. The route limiter is a backstop, not a claim of a distributed limit.

## GitHub protection

For `it-techmonkey/MAISON.BOTANIQUE`, prepare a main-branch rule requiring a pull request, blocking force pushes and deletion, including administrators. Avoid requiring someone other than the owner to approve unless the team wants that restriction. Add required build checks only after their exact check names exist and are passing. Confirm the rule can be enforced on this repository's plan before claiming success.

## Webhooks

After owner approval, register existing endpoints on the new project:

- Product create/update/delete → `/api/revalidate`.
- Order create/paid/cancelled and refund events → `/api/webhooks/orders`, limited to topics the existing handler supports.
- Configure `SHOPIFY_WEBHOOK_SECRET` consistently; inspect current handler topic handling and HMAC validation before registering.

Do not register duplicate subscriptions or point Shopify to a protected preview URL. Verify delivery with signed test payloads and confirm no customer details appear in logs.

## Public business markup

Owner requested no public street address. LocalBusiness markup therefore includes only approved name, URL and served country. No invented address, reviews or ratings. Omitting an address may limit eligibility for Google's LocalBusiness features.

## API references

- [Shopify basic discount input](https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DiscountCodeBasicInput)
- [Shopify customer order count](https://shopify.dev/docs/api/admin-graphql/latest/objects/Customer)
- [Cart discount codes](https://shopify.dev/docs/api/storefront/latest/mutations/cartDiscountCodesUpdate)
- [Cart buyer identity](https://shopify.dev/docs/api/storefront/latest/mutations/cartBuyerIdentityUpdate)
