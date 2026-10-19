import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bi, PageHero } from '@/components/store/blocks';
import CollectionBrowser from '@/components/store/CollectionBrowser';
import { T } from '@/components/store/StoreProvider';
import { OCCASIONS, findOccasion } from '@/lib/site';
import '@/styles/shop.css';
import '@/styles/pages.css';

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return OCCASIONS.map((occasion) => ({ occasion: occasion.id }));
}

export async function generateMetadata({ params }: PageProps<'/occasions/[occasion]'>): Promise<Metadata> {
  const occasion = findOccasion((await params).occasion);
  if (!occasion) return {};
  return {
    title: `${occasion.name.en} flowers`,
    description: occasion.intro.en,
    alternates: { canonical: `/occasions/${occasion.id}` },
  };
}

export default async function OccasionPage({ params }: PageProps<'/occasions/[occasion]'>) {
  const occasion = findOccasion((await params).occasion);
  if (!occasion) notFound();

  return (
    <>
      <div className="section section--top">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/occasions"><T en="Occasions" ar="المناسبات" /></Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page"><Bi text={occasion.name} /></span>
        </nav>
        <PageHero eyebrow={{ en: 'Flowers for', ar: 'زهور لـ' }} title={occasion.name} intro={occasion.intro} image={occasion.image} />
      </div>
      <CollectionBrowser listId={`occasion:${occasion.id}`} initialOccasion={occasion.id} />
      <nav className="section occasion-switch" aria-label="Other occasions">
        <p className="eyebrow"><T en="Other occasions" ar="مناسبات أخرى" /></p>
        <ul>
          {OCCASIONS.filter((item) => item.id !== occasion.id).map((item) => (
            <li key={item.id}><Link href={`/occasions/${item.id}`}><Bi text={item.name} /></Link></li>
          ))}
        </ul>
      </nav>
    </>
  );
}
