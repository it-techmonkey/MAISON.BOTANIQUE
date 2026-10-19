import PageNotFound from '@/components/analytics/PageNotFound';
import { ArrowLink } from '@/components/store/blocks';
import { T } from '@/components/store/StoreProvider';

export default function StoreNotFound() {
  return (
    <div className="not-found">
      <PageNotFound />
      <p className="eyebrow">404</p>
      <h1><T en="This stem seems to have wandered off." ar="يبدو أن هذه الزهرة ضلّت طريقها." /></h1>
      <p><T en="The piece or page you are looking for is not here. It may have finished its season." ar="القطعة أو الصفحة التي تبحث عنها غير موجودة. ربما انتهى موسمها." /></p>
      <div className="button-row">
        <ArrowLink href="/shop" label={{ en: 'Shop the collection', ar: 'تسوّق المجموعة' }} variant="button" />
        <ArrowLink href="/" label={{ en: 'Return home', ar: 'العودة للرئيسية' }} variant="ghost" />
      </div>
    </div>
  );
}
