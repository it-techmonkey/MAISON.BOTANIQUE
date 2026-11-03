import { JournalArticle, contentMetadata } from '@/components/store/GrowthPages';
import { JOURNAL, findJournalEntry } from '@/lib/growth-content';
export const dynamicParams = false;
export const generateStaticParams = () => JOURNAL.map(({ slug }) => ({ slug }));
export async function generateMetadata({ params }: PageProps<'/ar/journal/[slug]'>) {
  const entry = findJournalEntry((await params).slug);
  return entry ? contentMetadata(`/journal/${entry.slug}`, entry.title.ar, entry.description.ar, 'ar') : {};
}
export default async function Page({ params }: PageProps<'/ar/journal/[slug]'>) { return <JournalArticle slug={(await params).slug} locale="ar" />; }
