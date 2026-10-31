import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CollectionBrowser from './CollectionBrowser';
import { GuideHero, GuideProducts } from './GuideVisuals';
import { T } from './StoreProvider';
import { contentHref } from '@/lib/content-locale';
import { guideHeroImage } from '@/lib/guide-visuals';
import { JOURNAL, OCCASION_CONTENT, ORDER_QUESTIONS, findJournalEntry, findOccasionContent, type Question } from '@/lib/growth-content';
import { SITE_URL } from '@/lib/site';
import type { Locale } from '@/lib/types';
import '@/styles/pages.css';
import '@/styles/growth.css';

export function contentMetadata(path: string, title: string, description: string, locale: Locale): Metadata {
  return {
    title, description,
    alternates: {
      canonical: contentHref(path, locale),
      languages: { 'en-AE': path, 'ar-AE': `/ar${path}`, 'x-default': path },
    },
    openGraph: { title, description, url: contentHref(path, locale), type: 'website', ...(guideHeroImage(path) ? { images: [guideHeroImage(path)!] } : {}), locale: locale === 'ar' ? 'ar_AE' : 'en_AE', alternateLocale: [locale === 'ar' ? 'en_AE' : 'ar_AE'] },
  };
}

export function OrderQuestions({ questions = ORDER_QUESTIONS }: { questions?: Question[] }) {
  return <section className="growth-questions" aria-labelledby="ordering-questions">
    <h2 id="ordering-questions"><T en="Before you order" ar="قبل أن تطلب" /></h2>
    <div className="faq">{questions.map(({ question, answer }) => <details key={question.en}>
      <summary><T {...question} /></summary><p><T {...answer} /></p>
    </details>)}</div>
    <p><Link href="/faq"><T en="More ordering questions" ar="المزيد من الأسئلة حول الطلب" /></Link> · <Link href="/delivery"><T en="Delivery and flower care" ar="التوصيل والعناية بالزهور" /></Link></p>
  </section>;
}

export function OccasionLanding({ slug, locale = 'en' }: { slug: string; locale?: Locale }) {
  const page = findOccasionContent(slug);
  if (!page) notFound();
  const guide = findJournalEntry(page.journalSlug)!;
  return <div className="section--top growth-page" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <header className="section growth-opening">
      <nav className="breadcrumbs" aria-label={locale === 'ar' ? 'مسار التصفح' : 'Breadcrumb'}>
        <Link href="/"><T en="Home" ar="الرئيسية" /></Link><span aria-hidden="true">/</span><span aria-current="page"><T {...page.heading} /></span>
      </nav>
      <h1><T {...page.heading} /></h1>
      <p><T {...page.intro} /></p>
      <a className="arrow-link" href="#occasion-collection"><T en="Choose your flowers" ar="اختر زهورك" /><span aria-hidden="true">↓</span></a>
    </header>
    <div id="occasion-collection"><CollectionBrowser key={slug} initialOccasion={page.occasion} showOccasions={false} listId={`occasion:${slug}`} /></div>
    <div className="section growth-reading">
      <section className="growth-advice"><h2><T {...page.advice.heading} /></h2>
        {page.advice.paragraphs.map((text) => <p key={text.en}><T {...text} /></p>)}
        <Link className="arrow-link" href={contentHref(`/journal/${guide.slug}`, locale)}><T {...guide.title} /><span aria-hidden="true">↗</span></Link>
      </section>
      <OrderQuestions />
      <nav aria-label={locale === 'ar' ? 'مناسبات أخرى' : 'Other occasions'} className="growth-related">
        {OCCASION_CONTENT.filter((item) => item.slug !== slug).map((item) => <Link key={item.slug} href={contentHref(`/occasions/${item.slug}`, locale)}><T {...item.heading} /></Link>)}
        <Link href="/collections/rose-bouquets"><T en="Rose bouquets" ar="باقات الورد" /></Link>
      </nav>
    </div>
  </div>;
}

export function JournalIndex({ locale = 'en' }: { locale?: Locale }) {
  return <div className="section section--top growth-page" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <header className="growth-opening growth-opening--contained">
      <h1><T en="Notes on giving" ar="عن الإهداء" /></h1>
      <p><T en="Words for the card, help choosing flowers and the details that make a gift feel considered." ar="كلمات للبطاقة ومساعدة في اختيار الزهور وتفاصيل تمنح الهدية معناها." /></p>
    </header>
    <div className="growth-journal-list">{JOURNAL.map((entry) => <article key={entry.slug}>
      <h2><Link href={contentHref(`/journal/${entry.slug}`, locale)}><T {...entry.title} /></Link></h2>
      <p><T {...entry.description} /></p>
      <Link className="arrow-link" href={contentHref(`/journal/${entry.slug}`, locale)}><T en="Read the guide" ar="اقرأ الدليل" /><span aria-hidden="true">↗</span></Link>
    </article>)}</div>
  </div>;
}

export function JournalArticle({ slug, locale = 'en' }: { slug: string; locale?: Locale }) {
  const entry = findJournalEntry(slug);
  if (!entry) notFound();
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: entry.title[locale], description: entry.description[locale], inLanguage: locale === 'ar' ? 'ar-AE' : 'en-AE', mainEntityOfPage: `${SITE_URL}${contentHref(`/journal/${slug}`, locale)}`, author: { '@type': 'Organization', name: 'Maison Botanique', url: SITE_URL }, ...(guideHeroImage(`/journal/${slug}`) ? { image: `${SITE_URL}${guideHeroImage(`/journal/${slug}`)}` } : {}) };
  return <article className="section section--top growth-page growth-article" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <nav className="breadcrumbs" aria-label={locale === 'ar' ? 'مسار التصفح' : 'Breadcrumb'}>
      <Link href={contentHref('/journal', locale)}><T en="Notes on giving" ar="عن الإهداء" /></Link>
    </nav>
    <header className="growth-opening growth-opening--contained"><h1><T {...entry.title} /></h1><p><T {...entry.intro} /></p></header>
    <GuideHero path={`/journal/${slug}`} />
    <div className="growth-prose">{entry.sections.map((section) => <section key={section.heading.en}>
      <h2><T {...section.heading} /></h2>{section.paragraphs.map((text) => <p key={text.en}><T {...text} /></p>)}
    </section>)}</div>
    <GuideProducts path={`/journal/${slug}`} />
    <aside className="growth-related">
      <Link className="button" href={contentHref(`/occasions/${entry.occasion}`, locale)}><T {...entry.occasionLabel} /><span aria-hidden="true">↗</span></Link>
      <Link href="/delivery"><T en="Delivery information" ar="معلومات التوصيل" /></Link>
      <Link href="/contact"><T en="Ask the flower desk" ar="اسأل مكتب الزهور" /></Link>
    </aside>
    <nav className="growth-related" aria-label={locale === 'ar' ? 'دليل آخر' : 'Another guide'}>{JOURNAL.filter((item) => item.slug !== slug).map((item) => <Link key={item.slug} href={contentHref(`/journal/${item.slug}`, locale)}><T {...item.title} /></Link>)}</nav>
  </article>;
}
