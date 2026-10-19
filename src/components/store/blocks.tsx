import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Bilingual } from '@/lib/site';
import { T } from './StoreProvider';

// Server-rendered building blocks shared by the content pages.

export function Bi({ text }: { text: Bilingual }) {
  return <T en={text.en} ar={text.ar} />;
}

interface PageHeroProps {
  eyebrow: Bilingual;
  title: Bilingual;
  intro?: Bilingual;
  image?: string;
  children?: ReactNode;
}

/** Page opening: a quiet editorial title, with an optional photograph alongside. */
export function PageHero({ eyebrow, title, intro, image, children }: PageHeroProps) {
  return (
    <header className={`page-hero${image ? ' page-hero--image' : ''}`}>
      <div className="page-hero__copy">
        <p className="eyebrow"><Bi text={eyebrow} /></p>
        <h1><Bi text={title} /></h1>
        {intro && <p className="page-hero__intro"><Bi text={intro} /></p>}
        {children}
      </div>
      {image && (
        <div className="page-hero__media">
          <Image src={image} alt="" fill priority sizes="(max-width: 900px) 100vw, 50vw" />
        </div>
      )}
    </header>
  );
}

interface SectionHeadingProps {
  eyebrow: Bilingual;
  title: Bilingual;
  intro?: Bilingual;
  link?: { href: string; label: Bilingual };
  id?: string;
}

export function SectionHeading({ eyebrow, title, intro, link, id }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow"><Bi text={eyebrow} /></p>
        <h2 id={id}><Bi text={title} /></h2>
      </div>
      <div className="section-heading__aside">
        {intro && <p><Bi text={intro} /></p>}
        {link && <Link className="arrow-link" href={link.href}><Bi text={link.label} /><span aria-hidden="true">↗</span></Link>}
      </div>
    </div>
  );
}

export function ArrowLink({ href, label, variant = 'link' }: { href: string; label: Bilingual; variant?: 'link' | 'button' | 'ghost' }) {
  const className = variant === 'link' ? 'arrow-link' : variant === 'button' ? 'button' : 'button button--ghost';
  return <Link className={className} href={href}><span><Bi text={label} /></span><span aria-hidden="true">↗</span></Link>;
}

export interface InfoSection {
  title: Bilingual;
  paragraphs: Bilingual[];
}

/** Delivery, questions, privacy and terms share this layout. */
export function InfoPage({ hero, sections, draft = false, asQuestions = false }: {
  hero: PageHeroProps;
  sections: InfoSection[];
  /** Shows a notice that the text still needs owner or legal review. */
  draft?: boolean;
  /** Renders each section as an expandable question. */
  asQuestions?: boolean;
}) {
  return (
    <div className="section section--top">
      <PageHero {...hero} />
      {draft && (
        <p className="draft-note"><T
          en="Draft for review. This text will be confirmed by Maison Botanique before the store opens."
          ar="مسودة للمراجعة. ستؤكد ميزون بوتانيك هذا النص قبل افتتاح المتجر." /></p>
      )}
      <div className={asQuestions ? 'faq' : 'info-sections'}>
        {sections.map((section) => asQuestions ? (
          <details key={section.title.en}>
            <summary><Bi text={section.title} /></summary>
            {section.paragraphs.map((paragraph) => <p key={paragraph.en}><Bi text={paragraph} /></p>)}
          </details>
        ) : (
          <section key={section.title.en}>
            <h2><Bi text={section.title} /></h2>
            <div>{section.paragraphs.map((paragraph) => <p key={paragraph.en}><Bi text={paragraph} /></p>)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
