import { OccasionLanding, contentMetadata } from '@/components/store/GrowthPages';
import { OCCASION_CONTENT, findOccasionContent } from '@/lib/growth-content';

export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = () => OCCASION_CONTENT.map(({ slug }) => ({ slug }));
export async function generateMetadata({ params }: PageProps<'/ar/occasions/[slug]'>) {
  const page = findOccasionContent((await params).slug);
  return page ? contentMetadata(`/occasions/${page.slug}`, page.title.ar, page.description.ar, 'ar') : {};
}
export default async function Page({ params }: PageProps<'/ar/occasions/[slug]'>) { return <OccasionLanding slug={(await params).slug} locale="ar" />; }
