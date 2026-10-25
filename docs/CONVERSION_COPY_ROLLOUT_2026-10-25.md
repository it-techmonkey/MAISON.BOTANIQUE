# Conversion copy rollout — 25 October 2026

## Agreed scope

Static welcome bar with claimed-code state; truthful Halloween and Diwali deadline/delivery lines; plain same-day Dubai cutoff near the delivery picker. Preserve pricing, offer eligibility, photos, hero, seasonal art direction and operational delivery dates. No countdown, new analytics tool, customer messages or paid calls.

Source baseline: `origin/main` at `5a3809a`. The owner explicitly retained toran delivery 5–15 November in the seasonal chat. Halloween is 25–31 October. Last orders follow the existing final window (6–9pm) and one-hour lead: 5pm Dubai time on 31 October / 15 November respectively. No separate marketing expiry or new delivery date was invented. Deadlines are calculated from the shared availability rules. Their precision does not imply live capacity integration; operations can close availability through the existing controls.

## Acceptance checks

- Top bar stationary, one message, claim and view-code states; no unverified “applied” state. Uses the existing validated saved code and existing signup flow.
- Deadline and delivery dates on separate lines in each seasonal section and relevant product/bag picker. Last-order text switches to bookings closed after the final bookable window. Existing home-section expiry removes Halloween after its last delivery date.
- Daily cutoff only while a same-day slot remains bookable. Omitted for selected future dates and out-of-range preorders. Existing checkout date enforcement stays unchanged.
- English and Arabic, 1440/1280/1024/768/414/390/360/320 widths, reduced motion, no whole-page horizontal overflow; new message type at least 12px. Existing hero/category/promise layout preserved.

## Observation boundary — checked in code, not the live account

- PostHog client instrumentation supports storefront replay, heatmaps and performance. It does not establish a replay of hosted Shopify checkout.
- `trackCheckoutStarted` records the storefront checkout handoff. `src/app/api/webhooks/orders/route.ts` supports order lifecycle events; `orders/paid` emits `Order Completed` with stable event identity and test-order separation.
- `docs/shopify-checkout-pixel.js` already exists for intermediate checkout events. `docs/SHOPIFY_SETUP.md` describes connecting it under Shopify Customer events. No account connection or live pixel receipt was verified in this rollout. Do not install a duplicate or infer intermediate step abandonment from handoff/purchase events alone.
- Use Shopify checkout reports for inside-checkout diagnosis until the existing pixel's connection and actual events are confirmed. Do not count pixel `Checkout Completed` as additional revenue on top of the paid-order webhook.

## Customer follow-up — Business phone app, owner-confirmed

The owner confirmed the WhatsApp Business phone app only. The approved-template/24-hour rules in the linked policy are specifically Business Platform/API terms; no Meta template submission or API migration is needed for these manual app quick replies. Permission, reasonable frequency and opt-outs still apply. No customer contact list or sending automation was created.

### Manual quick reply: `/review`

> Hello [first name], thank you for ordering from Maison Botanique. We'd appreciate your honest feedback on your order: [verified Google review link]. If anything needs attention, reply here and we'll help. If you'd rather not receive follow-ups, please let us know.

Offer the same neutral review opportunity to all eligible genuine customers, whether their feedback was positive or negative. Handle any issue in parallel. No incentives, five-star wording or satisfaction-screening step. Verify the real review link before saving the quick reply; the placeholder is not a working link and must never be sent.

### Manual quick reply: `/checkouthelp`

> Hello [first name], this is Maison Botanique. Would you like help completing your flower order? You can continue here: [that customer's verified saved checkout link]. Delivery availability is confirmed when you complete checkout. If you've already ordered, please disregard this message. If you'd rather not receive follow-ups, please let us know.

Only use for a customer who gave permission for this follow-up. Check that the order is still incomplete and the gift is still available. Send at most one initial reminder; stop on opt-out. The phone app cannot automatically obtain Shopify abandoned checkout links or prove messaging consent. Do not copy a link from another customer's order, paste customer links into Git, or claim an item/date is reserved. Do not add another discount.

Sources checked 25 October: [WhatsApp Business Messaging Policy](https://business.whatsapp.com/policy), section 2 for Platform-only template/window terms; [Google review policy](https://support.google.com/contributionpolicy/answer/7400114) for neutral, non-incentivised solicitation. Drafts were not installed or sent.

## Release

### Verified locally

| Check | Result |
| --- | --- |
| Unit/data tests | 45 passed, including cutoff boundaries and seasonal restrictions |
| Python tooling tests | 5 passed |
| Typecheck and production build | Passed, bundled catalogue; no live Shopify credentials |
| Full buying-flow suite | 37 passed, 1 existing time-dependent skip |
| Focused conversion/visual suite | 4 passed; includes claimed-code state, daily/future cutoff, seasonal dates and closure |
| Responsive/RTL/reduced motion | EN/AR at 1440, 1280, 1024, 768, 414, 390, 360, 320px; no whole-page overflow; stationary bar copy fits |
| Readability | New bar text 13px desktop / 12px mobile; new deadline text 13px EN / 14px AR; bar contrast 8.3:1 |
| Visual review | Desktop and mobile inspected; separate Halloween/Diwali dates legible; sampled preview console had no errors |

The initial sandbox run could not launch Chromium; checks above use the approved outside-sandbox run. A screenshot rerun exposed a test assertion that counted finite resize transitions as marquee motion; the corrected check counts running infinite animation and passed. This did not require a product-code change.

Not established by local preview: real payments, live Shopify pixel connection, current PostHog account delivery, native Arabic editorial approval, or live capacity beyond the existing availability rules. Owner's earlier real-order confirmations remain in force; no new payment was attempted.

Review branch and Vercel preview first. Main/production merge remains a separate owner approval. No Shopify product, discount, analytics account or delivery-setting changes are part of this branch. Local preview uses the bundled catalogue without live checkout credentials; deployed preview verification must report which live connections were exercised.
