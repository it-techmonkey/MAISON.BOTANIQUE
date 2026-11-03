import { JournalIndex, contentMetadata } from '@/components/store/GrowthPages';
export const metadata = contentMetadata('/journal', 'عن الإهداء', 'أدلة إهداء الزهور ورسائل بطاقات عيد الميلاد ونصائح عملية لإرسال الزهور في دبي من ميزون بوتانيك.', 'ar');
export default function Page() { return <JournalIndex locale="ar" />; }
