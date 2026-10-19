import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/store/blocks';
import CollectionViewed from '@/components/analytics/CollectionViewed';
import { CatalogGrid } from '@/components/store/ProductCard';
import { T } from '@/components/store/StoreProvider';
import { getCatalog } from '@/lib/shopify/catalog';
import '@/styles/pages.css';

export const revalidate = 300;

async function findCollection(handle: string) {
  const { collections } = await getCatalog();
  return collections.find((collection) => collection.id === handle);
}

export async function generateStaticParams() {
  const { collections } = await getCatalog();
  return collections.map((collection) => ({ handle: collection.id }));
}

export async function generateMetadata({ params }: PageProps<'/collections/[handle]'>): Promise<Metadata> {
  const collection = await findCollection((await params).handle);
  if (!collection) return {};
  return {
    title: collection.title,
    description: collection.description || `${collection.title} from Maison Botanique, Dubai.`,
    alternates: { canonical: `/collections/${collection.id}` },
  };
}

export default async function CollectionPage({ params }: PageProps<'/collections/[handle]'>) {
  const collection = await findCollection((await params).handle);
  if (!collection) notFound();

  return (
    <div className="section section--top">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/collections"><T en="Collections" ar="المجموعات" /></Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page"><T en={collection.title} ar={collection.titleAr} /></span>
      </nav>
      <PageHero
        eyebrow={{ en: 'Collection', ar: 'مجموعة' }}
        title={{ en: collection.title, ar: collection.titleAr }}
        intro={collection.description ? { en: collection.description, ar: collection.descriptionAr } : undefined}
        image={collection.image ?? undefined} />
      <CatalogGrid collection={collection.id} listId={`collection:${collection.id}`} />
      <CollectionViewed handle={collection.id} />
    </div>
  );
}
