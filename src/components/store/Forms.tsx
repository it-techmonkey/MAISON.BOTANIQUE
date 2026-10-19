'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { trackFormError, trackFormStarted, trackFormSubmitted } from '@/lib/analytics/track';
import { enquiryMailto, parseEnquiry, type EnquiryInput, type EnquiryKind } from '@/lib/enquiry';
import { SITE, type Bilingual } from '@/lib/site';
import { useTodayDubai } from '@/lib/use-today';
import { useStore } from './StoreProvider';

type Status =
  | { state: 'idle' | 'sending' | 'sent' }
  | { state: 'invalid'; field: string }
  | { state: 'fallback'; mailto: string }
  | { state: 'failed' };

const messages = {
  en: {
    failed: 'Something went wrong. Please try again, or email us directly.',
    fallback: 'We could not send this online just now. Your message is ready to send by email:',
    openEmail: 'Open in your email app',
    invalid: {
      email: 'Please enter a valid email address.', name: 'Please tell us your name.',
      message: 'Please add a few words about what you have in mind.', consent: 'Please confirm you would like to hear from us.',
    } as Record<string, string>,
  },
  ar: {
    failed: 'حدث خطأ ما. يرجى المحاولة مجدداً أو مراسلتنا عبر البريد الإلكتروني.',
    fallback: 'تعذّر إرسال الرسالة عبر الموقع الآن. رسالتك جاهزة للإرسال عبر البريد الإلكتروني:',
    openEmail: 'افتح في تطبيق البريد',
    invalid: {
      email: 'يرجى إدخال بريد إلكتروني صحيح.', name: 'يرجى كتابة اسمك.',
      message: 'يرجى إضافة بضع كلمات عمّا تفكر فيه.', consent: 'يرجى تأكيد رغبتك في تلقي رسائلنا.',
    } as Record<string, string>,
  },
};

function useSubmit(kind: EnquiryKind) {
  const { locale } = useStore();
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const started = useRef(false);
  const onFocus = () => {
    if (started.current) return;
    started.current = true;
    trackFormStarted(kind);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = {
      kind,
      name: form.get('name'), email: form.get('email'), phone: form.get('phone'),
      topic: form.get('topic'), date: form.get('date'), message: form.get('message'),
      consent: form.get('consent') === 'on', website: form.get('website'), locale,
    };
    const parsed = parseEnquiry(raw);
    if (!parsed.ok) {
      trackFormError(kind, 'invalid', parsed.field);
      setStatus({ state: 'invalid', field: parsed.field });
      return;
    }

    setStatus({ state: 'sending' });
    const fallback = (input: EnquiryInput) => {
      trackFormSubmitted(kind, input.topic || null, 'email_fallback');
      setStatus({ state: 'fallback', mailto: enquiryMailto(SITE.email, input) });
    };
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(raw),
      });
      if (response.ok) {
        trackFormSubmitted(kind, parsed.value.topic || null, 'shopify');
        setStatus({ state: 'sent' });
        return;
      }
      // Not connected (503) or Shopify unreachable (502): never lose the message.
      if (response.status === 503 || response.status === 502) { fallback(parsed.value); return; }
      const body = await response.json().catch(() => ({}));
      trackFormError(kind, body.field ? 'invalid' : 'failed', body.field ?? null);
      setStatus(body.field ? { state: 'invalid', field: body.field } : { state: 'failed' });
    } catch {
      trackFormError(kind, 'failed', null);
      setStatus({ state: 'failed' });
    }
  }
  return { status, submit, onFocus };
}

function FormStatus({ status }: { status: Status }) {
  const { ar } = useStore();
  const t = messages[ar ? 'ar' : 'en'];
  if (status.state === 'invalid') return <p className="form-error" role="alert">{t.invalid[status.field] ?? t.failed}</p>;
  if (status.state === 'failed') return <p className="form-error" role="alert">{t.failed}</p>;
  if (status.state === 'fallback') {
    return <p className="form-note" role="status">{t.fallback} <a href={status.mailto}>{t.openEmail}</a></p>;
  }
  return null;
}

/** Hidden from people; bots that fill every field are discarded by the API. */
function Honeypot() {
  return <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>;
}

export function NewsletterForm() {
  const { t } = useStore();
  const id = useId();
  const { status, submit, onFocus } = useSubmit('newsletter');

  if (status.state === 'sent') {
    return <p className="newsletter__done" role="status">{t('Thank you. Something lovely is on its way, now and then.', 'شكراً لك. ستصلك أشياء جميلة بين حين وآخر.')}</p>;
  }
  return (
    <form className="newsletter" onSubmit={submit} onFocus={onFocus} noValidate>
      <div className="newsletter__row">
        <label className="sr-only" htmlFor={`${id}-email`}>{t('Email address', 'البريد الإلكتروني')}</label>
        <input id={`${id}-email`} name="email" type="email" autoComplete="email" required
          placeholder={t('Your email address', 'بريدك الإلكتروني')} dir="ltr" />
        <button type="submit" disabled={status.state === 'sending'}>
          {status.state === 'sending' ? t('Sending…', 'جارٍ الإرسال…') : t('Join the list', 'انضم إلى القائمة')}
        </button>
      </div>
      <label className="checkbox">
        <input type="checkbox" name="consent" required />
        <span>{t(
          'I would like to receive emails from Maison Botanique. I can unsubscribe at any time.',
          'أرغب في تلقي رسائل من ميزون بوتانيك، ويمكنني إلغاء الاشتراك في أي وقت.',
        )}</span>
      </label>
      <Honeypot />
      <FormStatus status={status} />
    </form>
  );
}

interface EnquiryFormProps {
  kind: 'enquiry' | 'contact';
  topics: Array<{ value: string; label: Bilingual }>;
  defaultTopic?: string;
  showDate?: boolean;
}

export function EnquiryForm({ kind, topics, defaultTopic, showDate = false }: EnquiryFormProps) {
  const { ar, t } = useStore();
  const id = useId();
  const today = useTodayDubai();
  const { status, submit, onFocus } = useSubmit(kind);
  const invalid = status.state === 'invalid' ? status.field : '';

  if (status.state === 'sent') {
    return (
      <div className="form-success" role="status">
        <h3>{t('Thank you. Your note has reached us.', 'شكراً لك. وصلتنا رسالتك.')}</h3>
        <p>{t('We will reply by email as soon as we can.', 'سنرد عليك عبر البريد الإلكتروني في أقرب وقت ممكن.')}</p>
      </div>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={submit} onFocus={onFocus} noValidate>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-name`}>{t('Your name', 'اسمك')}</label>
          <input id={`${id}-name`} name="name" autoComplete="name" required aria-invalid={invalid === 'name' || undefined} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-email`}>{t('Email', 'البريد الإلكتروني')}</label>
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" required dir="ltr" aria-invalid={invalid === 'email' || undefined} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-phone`}>{t('Phone (optional)', 'الهاتف (اختياري)')}</label>
          <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" dir="ltr" />
        </div>
        <div className="field">
          <label htmlFor={`${id}-topic`}>{t('About', 'الموضوع')}</label>
          <select id={`${id}-topic`} name="topic" defaultValue={defaultTopic ?? topics[0]?.value}>
            {topics.map((topic) => <option key={topic.value} value={topic.value}>{ar ? topic.label.ar : topic.label.en}</option>)}
          </select>
        </div>
      </div>
      {showDate && (
        <div className="field field--half">
          <label htmlFor={`${id}-date`}>{t('Event date, if known', 'تاريخ المناسبة إن وُجد')}</label>
          <input id={`${id}-date`} name="date" type="date" min={today} />
        </div>
      )}
      <div className="field">
        <label htmlFor={`${id}-message`}>{t('Tell us a little more', 'أخبرنا المزيد')}</label>
        <textarea id={`${id}-message`} name="message" rows={5} required aria-invalid={invalid === 'message' || undefined}
          placeholder={kind === 'enquiry'
            ? t('The occasion, the place, the number of guests, the feeling you would like…', 'المناسبة والمكان وعدد الضيوف والشعور الذي تودّه…')
            : t('How can we help?', 'كيف يمكننا مساعدتك؟')} />
      </div>
      <Honeypot />
      <div className="enquiry-form__footer">
        <p className="form-hint">{t('We use your details only to reply to this message.', 'نستخدم بياناتك فقط للرد على هذه الرسالة.')}</p>
        <button className="button" type="submit" disabled={status.state === 'sending'}>
          <span>{status.state === 'sending' ? t('Sending…', 'جارٍ الإرسال…') : t('Send enquiry', 'أرسل الاستفسار')}</span><span aria-hidden="true">↗</span>
        </button>
      </div>
      <FormStatus status={status} />
    </form>
  );
}
