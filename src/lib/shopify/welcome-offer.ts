import { createHmac } from 'node:crypto';
import { OFFER_CODE } from '../site';
import { adminFetch, assertNoUserErrors } from './admin';
import { SHOPIFY_API_VERSION, shopifyConfig } from './config';

export class WelcomeNotEligible extends Error {}

export function welcomeCode(customerId: string, secret: string) {
  return `MB25-${createHmac('sha256', secret).update(customerId).digest('hex').slice(0, 20).toUpperCase()}`;
}

/** No PII in codes; repeat signups return the same customer-bound, single-use code. */
export async function assertWelcomeEligible(customerId: string) {
  const data = await adminFetch<{ customer: { numberOfOrders: string } | null }>(
    'query WelcomeEligibility($id: ID!) { customer(id: $id) { numberOfOrders } }', { id: customerId },
  );
  if (!data.customer) throw new Error('Customer unavailable');
  if (Number(data.customer.numberOfOrders) !== 0) throw new WelcomeNotEligible();
}

export async function getWelcomeCode(customerId: string) {
  await assertWelcomeEligible(customerId);
  const secret = process.env.OFFER_CODE_SECRET?.trim();
  const token = process.env.SHOPIFY_DISCOUNTS_ADMIN_TOKEN?.trim();
  if (!secret || secret.length < 32 || !token) return OFFER_CODE;
  const code = welcomeCode(customerId, secret);
  async function discounts<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(`https://${shopifyConfig.domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token! },
      body: JSON.stringify({ query, variables }), cache: 'no-store', signal: AbortSignal.timeout(12_000),
    });
    const body = await response.json();
    if (!response.ok || body.errors?.length || !body.data) throw new Error('Discount service unavailable');
    return body.data as T;
  }
  const lookup = () => discounts<{ codeDiscountNodeByCode: { id: string } | null }>(
    'query WelcomeCode($code: String!) { codeDiscountNodeByCode(code: $code) { id } }', { code },
  );
  try { if ((await lookup()).codeDiscountNodeByCode) return code; } catch { return OFFER_CODE; }
  try {
    const result = await discounts<{ discountCodeBasicCreate: { userErrors: Array<{ message: string }> } }>(
      `mutation WelcomeDiscount($input: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $input) { userErrors { message } }
      }`, {
        input: {
          title: 'Maison welcome offer', code, startsAt: new Date().toISOString(), endsAt: null,
          context: { customers: { add: [customerId] } },
          customerGets: { value: { percentage: .25 }, items: { all: true } },
          appliesOncePerCustomer: true, usageLimit: 1,
          combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: true },
        },
      },
    );
    assertNoUserErrors(result.discountCodeBasicCreate.userErrors, 'welcomeDiscount');
  } catch {
    // A parallel request or a timeout may have created it already. Never mint another code.
    if (!(await lookup()).codeDiscountNodeByCode) return OFFER_CODE;
  }
  return code;
}
