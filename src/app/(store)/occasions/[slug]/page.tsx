import { OccasionLanding, contentMetadata } from '@/components/store/GrowthPages';
import { OCCASION_CONTENT, findOccasionContent } from '@/lib/growth-content';

export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = () => OCCASION_CONTENT.map(({ slug }) => ({ slug }));
export async function generateMetadata({ params }: PageProps<'/occasions/[slug]'>) {
  const page = findOccasionContent((await params).slug);
  return page ? contentMetadata(`/occasions/${page.slug}`, page.title.en, page.description.en, 'en') : {};
}
export default async function Page({ params }: PageProps<'/occasions/[slug]'>) { return <OccasionLanding slug={(await params).slug} />; }
