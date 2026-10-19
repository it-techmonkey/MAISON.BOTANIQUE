// Website forms, stored in Shopify (server only).
//
// - Newsletter: the email becomes (or updates) a Shopify customer subscribed to
//   email marketing, so Shopify Email and other marketing tools can reach them.
// - Opening offer: the email or WhatsApp number becomes a newsletter customer
//   (tagged `newsletter`), subscribed to email or SMS marketing.
// - Contact and enquiry: the sender becomes a tagged customer, and the full
//   message is saved as a "Website enquiry" metaobject entry
//   (Shopify admin > Content > Metaobjects). Shopify Flow can email the team
//   when a customer receives the `website-enquiry` or `website-contact` tag.

import type { EnquiryInput } from '@/lib/enquiry';
import { adminFetch, assertNoUserErrors } from './admin';

export const ENQUIRY_METAOBJECT_TYPE = 'website_enquiry';

const TAGS: Record<EnquiryInput['kind'], string[]> = {
  newsletter: ['newsletter', 'website'],
  contact: ['website-contact', 'website'],
  enquiry: ['website-enquiry', 'website'],
  offer: ['newsletter', 'website'],
};

interface UserError { field?: string[] | null; message: string }

// No consentUpdatedAt: Shopify stamps its own time. Sending ours fails whenever
// the server clock runs slightly ahead ("must not be in the future").
const subscribedConsent = () => ({
  marketingState: 'SUBSCRIBED',
  marketingOptInLevel: 'SINGLE_OPT_IN',
});

function splitName(name: string) {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName: firstName || undefined, lastName: rest.join(' ') || undefined };
}

/** Launch offer by WhatsApp: finds or creates the customer by phone, subscribed to SMS marketing. */
async function upsertPhoneCustomer(input: EnquiryInput) {
  const tags = TAGS[input.kind];
  const smsConsent = subscribedConsent();
  const found = await adminFetch<{ customer: { id: string; smsMarketingConsent: { marketingState: string } | null } | null }>(`#graphql
    query OfferCustomer($phone: String!) {
      customer: customerByIdentifier(identifier: { phoneNumber: $phone }) { id smsMarketingConsent { marketingState } }
    }`, { phone: input.phone });
  if (!found.customer) {
    const created = await adminFetch<{ customerCreate: { customer: { id: string } | null; userErrors: UserError[] } }>(`#graphql
      mutation OfferCustomerCreate($input: CustomerInput!) {
        customerCreate(input: $input) { customer { id } userErrors { field message } }
      }`, { input: { phone: input.phone, locale: input.locale, tags, smsMarketingConsent: smsConsent } });
    assertNoUserErrors(created.customerCreate.userErrors, 'customerCreate');
    return created.customerCreate.customer!.id;
  }
  const { id } = found.customer;
  const tagged = await adminFetch<{ tagsAdd: { userErrors: UserError[] } }>(`#graphql
    mutation OfferCustomerTags($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }`, { id, tags });
  assertNoUserErrors(tagged.tagsAdd.userErrors, 'tagsAdd');
  if (found.customer.smsMarketingConsent?.marketingState !== 'SUBSCRIBED') {
    const consent = await adminFetch<{ customerSmsMarketingConsentUpdate: { userErrors: UserError[] } }>(`#graphql
      mutation OfferCustomerSms($input: CustomerSmsMarketingConsentUpdateInput!) {
        customerSmsMarketingConsentUpdate(input: $input) { userErrors { field message } }
      }`, { input: { customerId: id, smsMarketingConsent: smsConsent } });
    assertNoUserErrors(consent.customerSmsMarketingConsentUpdate.userErrors, 'customerSmsMarketingConsentUpdate');
  }
  return id;
}

/** Finds the customer for this email, or creates one. Returns the customer ID. */
async function upsertCustomer(input: EnquiryInput) {
  if (input.kind === 'offer' && input.phone) return upsertPhoneCustomer(input);
  const tags = TAGS[input.kind];
  const subscribe = (input.kind === 'newsletter' || input.kind === 'offer') && input.consent;

  const found = await adminFetch<{ customer: { id: string; emailMarketingConsent: { marketingState: string } | null } | null }>(`#graphql
    query FormCustomer($email: String!) {
      customer: customerByIdentifier(identifier: { emailAddress: $email }) {
        id
        emailMarketingConsent { marketingState }
      }
    }`, { email: input.email });

  if (!found.customer) {
    const created = await adminFetch<{ customerCreate: { customer: { id: string } | null; userErrors: UserError[] } }>(`#graphql
      mutation FormCustomerCreate($input: CustomerInput!) {
        customerCreate(input: $input) { customer { id } userErrors { field message } }
      }`, {
      input: {
        email: input.email,
        ...splitName(input.name),
        locale: input.locale,
        tags,
        ...(subscribe ? { emailMarketingConsent: subscribedConsent() } : {}),
      },
    });
    assertNoUserErrors(created.customerCreate.userErrors, 'customerCreate');
    return created.customerCreate.customer!.id;
  }

  const { id } = found.customer;
  const tagged = await adminFetch<{ tagsAdd: { userErrors: UserError[] } }>(`#graphql
    mutation FormCustomerTags($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
    }`, { id, tags });
  assertNoUserErrors(tagged.tagsAdd.userErrors, 'tagsAdd');

  if (subscribe && found.customer.emailMarketingConsent?.marketingState !== 'SUBSCRIBED') {
    const consent = await adminFetch<{ customerEmailMarketingConsentUpdate: { userErrors: UserError[] } }>(`#graphql
      mutation FormCustomerConsent($input: CustomerEmailMarketingConsentUpdateInput!) {
        customerEmailMarketingConsentUpdate(input: $input) { userErrors { field message } }
      }`, { input: { customerId: id, emailMarketingConsent: subscribedConsent() } });
    assertNoUserErrors(consent.customerEmailMarketingConsentUpdate.userErrors, 'customerEmailMarketingConsentUpdate');
  }
  return id;
}

const ENQUIRY_FIELDS = [
  { key: 'kind', name: 'Form', type: 'single_line_text_field' },
  { key: 'name', name: 'Name', type: 'single_line_text_field' },
  { key: 'email', name: 'Email', type: 'single_line_text_field' },
  { key: 'phone', name: 'Phone', type: 'single_line_text_field' },
  { key: 'topic', name: 'Topic', type: 'single_line_text_field' },
  { key: 'event_date', name: 'Event date', type: 'date' },
  { key: 'message', name: 'Message', type: 'multi_line_text_field' },
  { key: 'language', name: 'Language', type: 'single_line_text_field' },
  { key: 'customer', name: 'Customer', type: 'customer_reference' },
  { key: 'received_at', name: 'Received', type: 'date_time' },
];

let definitionReady: Promise<void> | null = null;

/** Creates the "Website enquiry" metaobject definition the first time it is needed. */
function ensureEnquiryDefinition() {
  definitionReady ??= (async () => {
    const existing = await adminFetch<{ metaobjectDefinitionByType: { id: string } | null }>(`#graphql
      query EnquiryDefinition($type: String!) { metaobjectDefinitionByType(type: $type) { id } }`,
    { type: ENQUIRY_METAOBJECT_TYPE });
    if (existing.metaobjectDefinitionByType) return;

    const created = await adminFetch<{ metaobjectDefinitionCreate: { userErrors: UserError[] } }>(`#graphql
      mutation EnquiryDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) { metaobjectDefinition { id } userErrors { field message } }
      }`, {
      definition: {
        type: ENQUIRY_METAOBJECT_TYPE,
        name: 'Website enquiry',
        description: 'Messages sent from the contact and services forms on the website.',
        displayNameKey: 'email',
        access: { admin: 'MERCHANT_READ_WRITE', storefront: 'NONE' },
        fieldDefinitions: ENQUIRY_FIELDS,
      },
    });
    assertNoUserErrors(created.metaobjectDefinitionCreate.userErrors, 'metaobjectDefinitionCreate');
  })().catch((error) => {
    definitionReady = null; // Try again on the next submission.
    throw error;
  });
  return definitionReady;
}

async function saveEnquiry(input: EnquiryInput, customerId: string) {
  await ensureEnquiryDefinition();
  const values: Record<string, string> = {
    kind: input.kind,
    name: input.name,
    email: input.email,
    phone: input.phone,
    topic: input.topic,
    event_date: input.date,
    message: input.message,
    language: input.locale === 'ar' ? 'Arabic' : 'English',
    customer: customerId,
    received_at: new Date().toISOString(),
  };
  const created = await adminFetch<{ metaobjectCreate: { userErrors: UserError[] } }>(`#graphql
    mutation EnquiryCreate($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) { metaobject { id } userErrors { field message } }
    }`, {
    metaobject: {
      type: ENQUIRY_METAOBJECT_TYPE,
      fields: Object.entries(values).filter(([, value]) => value).map(([key, value]) => ({ key, value })),
    },
  });
  assertNoUserErrors(created.metaobjectCreate.userErrors, 'metaobjectCreate');
}

/** Stores a validated form submission in Shopify. */
export async function submitToShopify(input: EnquiryInput) {
  const customerId = await upsertCustomer(input);
  if (input.kind === 'enquiry' || input.kind === 'contact') await saveEnquiry(input, customerId);
}
