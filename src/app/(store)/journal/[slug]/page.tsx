import { JournalArticle, contentMetadata } from '@/components/store/GrowthPages';
import { JOURNAL, findJournalEntry } from '@/lib/growth-content';
export const dynamicParams = false;
export const generateStaticParams = () => JOURNAL.map(({ slug }) => ({ slug }));
export async function generateMetadata({ params }: PageProps<'/journal/[slug]'>) {
  const entry = findJournalEntry((await params).slug);
  return entry ? contentMetadata(`/journal/${entry.slug}`, entry.title.en, entry.description.en, 'en') : {};
}
export default async function Page({ params }: PageProps<'/journal/[slug]'>) { return <JournalArticle slug={(await params).slug} />; }
