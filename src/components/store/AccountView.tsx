'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { identifyCustomer, resetIdentity } from '@/lib/analytics/track';
import { forgetCart } from '@/lib/cart/use-shop-cart';
import { DELIVERY_DATE_KEY, DELIVERY_TIME_KEY, formatDeliveryDate } from '@/lib/delivery';
import { useStore } from './StoreProvider';
import Money from './Money';

interface AccountOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  totalPrice: { amount: string; currencyCode: string };
  statusPageUrl: string;
  customAttributes: Record<string, string>;
  lineItems: Array<{ title: string; variantTitle: string | null; quantity: number; image: { url: string } | null }>;
}
interface AccountCustomer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: { emailAddress: string } | null;
  phoneNumber: { phoneNumber: string } | null;
  defaultAddress: { id: string } | null;
  addresses: { nodes: Array<{ id: string; formatted: string[] }> };
  orders: AccountOrder[];
}
type Summary =
  | { state: 'loading' }
  | { state: 'unavailable' }
  | { state: 'signed-out' }
  | { state: 'error' }
  | { state: 'signed-in'; customer: AccountCustomer; accountUrl: string };

const FINANCIAL: Record<string, { en: string; ar: string }> = {
  PAID: { en: 'Paid', ar: 'مدفوع' },
  PENDING: { en: 'Payment pending', ar: 'بانتظار الدفع' },
  AUTHORIZED: { en: 'Payment authorised', ar: 'تم تفويض الدفع' },
  PARTIALLY_PAID: { en: 'Partly paid', ar: 'مدفوع جزئياً' },
  REFUNDED: { en: 'Refunded', ar: 'تم الاسترداد' },
  PARTIALLY_REFUNDED: { en: 'Partly refunded', ar: 'مسترد جزئياً' },
  VOIDED: { en: 'Cancelled', ar: 'ملغى' },
};
const FULFILMENT: Record<string, { en: string; ar: string }> = {
  FULFILLED: { en: 'Delivered', ar: 'تم التوصيل' },
  IN_PROGRESS: { en: 'On its way', ar: 'في الطريق' },
  PARTIALLY_FULFILLED: { en: 'Partly delivered', ar: 'تم توصيل جزء' },
  UNFULFILLED: { en: 'Being prepared', ar: 'قيد التجهيز' },
  SCHEDULED: { en: 'Scheduled', ar: 'مجدول' },
  ON_HOLD: { en: 'On hold', ar: 'معلّق' },
  OPEN: { en: 'Being prepared', ar: 'قيد التجهيز' },
};

const signInHref = '/account/login?return_to=%2Faccount';

function useAccountSummary(): Summary {
  const [summary, setSummary] = useState<Summary>({ state: 'loading' });
  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/summary', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (response) => {
        if (response.status === 404) return { state: 'unavailable' } as const;
        if (!response.ok) return { state: 'error' } as const;
        const body = await response.json();
        if (!body.loggedIn) return { state: 'signed-out' } as const;
        if (body.error || !body.customer) return { state: 'error' } as const;
        return { state: 'signed-in', customer: body.customer, accountUrl: body.accountUrl } as const;
      })
      .catch(() => ({ state: 'error' }) as const)
      .then((next) => { if (!cancelled) setSummary(next); });
    return () => { cancelled = true; };
  }, []);
  return summary;
}

function LoginNotice() {
  const { t } = useStore();
  const failed = useSearchParams().get('login') === 'failed';
  if (!failed) return null;
  return <p className="form-error" role="alert">{t('Sign-in did not finish. Please try again.', 'لم يكتمل تسجيل الدخول. يرجى المحاولة مجدداً.')}</p>;
}

export default function AccountView() {
  const { ar, t } = useStore();
  const summary = useAccountSummary();

  useEffect(() => {
    if (summary.state === 'signed-in') identifyCustomer(summary.customer.id);
  }, [summary]);

  if (summary.state === 'loading') {
    return <div className="account account--loading" aria-busy="true"><p className="eyebrow">{t('Your account', 'حسابك')}</p><p role="status">{t('Loading your account…', 'جارٍ تحميل حسابك…')}</p></div>;
  }

  if (summary.state === 'unavailable') {
    return (
      <div className="account account--panel">
        <p className="eyebrow">{t('Your account', 'حسابك')}</p>
        <h1>{t('Accounts open soon.', 'الحسابات قريباً.')}</h1>
        <p>{t('You can order as a guest in the meantime; your confirmation email has a link to follow your order.', 'يمكنك الطلب كضيف في الوقت الحالي، وتحتوي رسالة التأكيد على رابط لمتابعة طلبك.')}</p>
        <Link className="button" href="/shop"><span>{t('Shop the collection', 'تسوّق المجموعة')}</span><span aria-hidden="true">↗</span></Link>
      </div>
    );
  }

  if (summary.state === 'signed-out' || summary.state === 'error') {
    return (
      <div className="account account--panel">
        <p className="eyebrow">{t('Your account', 'حسابك')}</p>
        <h1>{t('Welcome back.', 'أهلاً بعودتك.')}</h1>
        <p>{t('Sign in with your email to see your orders, follow a delivery and check out faster. No password needed: we will send you a code.', 'سجّل الدخول ببريدك الإلكتروني لعرض طلباتك ومتابعة التوصيل وإتمام الطلب بسرعة أكبر. لا حاجة لكلمة مرور، سنرسل لك رمزاً.')}</p>
        <Suspense fallback={null}><LoginNotice /></Suspense>
        {summary.state === 'error' && <p className="form-error" role="alert">{t('We could not load your account just now. Please sign in again.', 'تعذّر تحميل حسابك الآن. يرجى تسجيل الدخول مجدداً.')}</p>}
        {/* A full-page link: sign-in redirects to Shopify's hosted login page. */}
        <a className="button" href={signInHref}><span>{t('Sign in or create an account', 'سجّل الدخول أو أنشئ حساباً')}</span><span aria-hidden="true">↗</span></a>
      </div>
    );
  }

  const { customer, accountUrl } = summary;
  const name = customer.firstName || customer.displayName;
  return (
    <div className="account" data-ph-mask>
      <header className="account__header">
        <div>
          <p className="eyebrow">{t('Your account', 'حسابك')}</p>
          <h1>{name ? t(`Hello, ${name}.`, `مرحباً، ${name}.`) : t('Hello.', 'مرحباً.')}</h1>
        </div>
        <form method="post" action="/account/logout" onSubmit={() => { resetIdentity(); forgetCart(); }}>
          <button className="button button--ghost" type="submit">{t('Sign out', 'تسجيل الخروج')}</button>
        </form>
      </header>

      <div className="account__layout">
        <section className="account__orders" aria-labelledby="account-orders">
          <h2 id="account-orders">{t('Your orders', 'طلباتك')}</h2>
          {customer.orders.length === 0 ? (
            <div className="account__empty">
              <p>{t('No orders yet. When you order, it will appear here with its delivery time.', 'لا توجد طلبات بعد. عند الطلب سيظهر هنا مع موعد التوصيل.')}</p>
              <Link className="arrow-link" href="/shop">{t('Shop the collection', 'تسوّق المجموعة')}<span aria-hidden="true">↗</span></Link>
            </div>
          ) : (
            <ul className="account-orders">
              {customer.orders.map((order) => {
                const deliveryDate = order.customAttributes[DELIVERY_DATE_KEY];
                const deliveryTime = order.customAttributes[DELIVERY_TIME_KEY];
                const financial = order.financialStatus ? FINANCIAL[order.financialStatus] : null;
                const fulfilment = FULFILMENT[order.fulfillmentStatus];
                return (
                  <li key={order.id} className="account-order">
                    <div className="account-order__head">
                      <strong>{t('Order', 'الطلب')} {order.name}</strong>
                      <span>{new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-AE', { dateStyle: 'medium', timeZone: 'Asia/Dubai' }).format(new Date(order.processedAt))}</span>
                    </div>
                    <ul className="account-order__items">
                      {order.lineItems.map((item, index) => (
                        <li key={`${item.title}-${index}`}>
                          {item.image && <img src={item.image.url} alt="" loading="lazy" />}
                          <span>{item.quantity} × {item.title}{item.variantTitle && item.variantTitle !== 'Default Title' ? ` · ${item.variantTitle}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                    {deliveryDate && (
                      <p className="account-order__delivery">
                        {t('Delivery', 'التوصيل')}: {formatDeliveryDate(deliveryDate, ar)}{deliveryTime ? <> · <bdi>{deliveryTime}</bdi></> : null}
                      </p>
                    )}
                    <div className="account-order__foot">
                      <span className="account-order__status">
                        {[fulfilment, financial].filter(Boolean).map((status) => (ar ? status!.ar : status!.en)).join(' · ')}
                      </span>
                      <strong><Money amount={Number(order.totalPrice.amount)} currency={order.totalPrice.currencyCode} ar={ar} /></strong>
                      <a className="arrow-link" href={order.statusPageUrl} target="_blank" rel="noopener">
                        {t('Order details', 'تفاصيل الطلب')}<span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="account__details">
          <section aria-labelledby="account-details">
            <h2 id="account-details">{t('Your details', 'بياناتك')}</h2>
            <dl>
              {(customer.firstName || customer.lastName) && <><dt>{t('Name', 'الاسم')}</dt><dd>{[customer.firstName, customer.lastName].filter(Boolean).join(' ')}</dd></>}
              {customer.emailAddress && <><dt>{t('Email', 'البريد الإلكتروني')}</dt><dd dir="ltr">{customer.emailAddress.emailAddress}</dd></>}
              {customer.phoneNumber && <><dt>{t('Phone', 'الهاتف')}</dt><dd dir="ltr">{customer.phoneNumber.phoneNumber}</dd></>}
            </dl>
          </section>
          <section aria-labelledby="account-addresses">
            <h2 id="account-addresses">{t('Saved addresses', 'العناوين المحفوظة')}</h2>
            {customer.addresses.nodes.length === 0
              ? <p>{t('Addresses you use at checkout are saved here.', 'تُحفظ هنا العناوين التي تستخدمها عند الدفع.')}</p>
              : (
                <ul className="account-addresses">
                  {customer.addresses.nodes.map((address) => (
                    <li key={address.id}>
                      {address.id === customer.defaultAddress?.id && <span className="eyebrow">{t('Default', 'الافتراضي')}</span>}
                      <address>{address.formatted.map((line) => <span key={line}>{line}</span>)}</address>
                    </li>
                  ))}
                </ul>
              )}
          </section>
          <a className="arrow-link" href={accountUrl} target="_blank" rel="noopener">
            {t('Edit details and addresses', 'تعديل البيانات والعناوين')}<span aria-hidden="true">↗</span>
          </a>
        </aside>
      </div>
    </div>
  );
}
