'use client';

import Link from 'next/link';
import { useEffect, type MouseEvent } from 'react';
import { trackProductClicked, trackProductListViewed } from '@/lib/analytics/track';
import { FLAGDAY_HANDLES, FLAG_DAY_DATE, pick, seasonalExpired } from '@/lib/seasonal';
import { useDubaiNow } from '@/lib/use-today';
import type { Product } from '@/lib/types';
import Money from './Money';
import SaleTag from './SaleTag';
import { useStore } from './StoreProvider';
import '@/styles/collection.css';
import '@/styles/flag-day.css';

const LIST = { listId: 'flag_day' };
const fmt = (value: number, ar: boolean) => new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE', { maximumFractionDigits: 0 }).format(value);

function Piece({ product, index, onOpen }: { product: Product; index: number; onOpen: (product: Product, position: number) => void }) {
  const { ar, t } = useStore();
  const name = ar ? product.nameAr : product.name;
  const href = `/shop/${product.id}`;
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(product, index + 1);
  };
  return (
    <article className="mbc-piece">
      <a className="mbc-frame" href={href} onClick={open} aria-label={name}>
        <img src={product.imageSmall} srcSet={`${product.imageSmall} 480w, ${product.image} 960w`} sizes="(max-width: 760px) 50vw, 26vw"
          alt={ar ? name : product.imageAlt} width="480" height="480" loading="lazy" decoding="async" />
      </a>
      <div className="mbc-cap">
        <h3><a href={href} onClick={open} aria-label={name}>{name.split(' — ')[0]}</a></h3>
        <span className="mbc-line">{ar ? product.lineAr : product.line}</span>
        <SaleTag className="mbc-sale" price={product.price} compareAtPrice={product.compareAtPrice} />
        <div className="mbc-row">
          <span className="mbc-price">
            <small>{t('From', 'من')} </small><Money amount={product.price} ar={ar} whole />
            {product.compareAtPrice && <s aria-label={`${t('was', 'بدلاً من')} AED ${fmt(product.compareAtPrice, ar)}`}>{fmt(product.compareAtPrice, ar)}</s>}
          </span>
          <button type="button" className="mbc-add" onClick={() => onOpen(product, index + 1)} disabled={!product.available}
            aria-label={`${t('Add to bag', 'أضف إلى الحقيبة')}: ${name}`}>{product.available ? <>{t('Add', 'أضف')} <span aria-hidden="true">+</span></> : t('Sold out', 'نفدت الكمية')}</button>
        </div>
      </div>
    </article>
  );
}

/** The two flag boxes. page = the /flag-day page (h1, shop link); otherwise the home shelf, shown on Flag Day only. */
export function FlagDaySection({ today, page = false }: { today: string; page?: boolean }) {
  const { t, products, openProduct } = useStore();
  const items = pick(products, FLAGDAY_HANDLES);
  const ended = seasonalExpired(FLAGDAY_HANDLES[0], today);
  useEffect(() => { if (page && items.length) trackProductListViewed(LIST, items); }, [page, items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!items.length || ended || (!page && today !== FLAG_DAY_DATE)) return null;
  const onOpen = (product: Product, position: number) => { trackProductClicked(product, LIST, position); openProduct(product); };
  const Title = page ? 'h1' : 'h2';
  const isToday = today === FLAG_DAY_DATE;
  return (
    <section className="fd mbc" aria-labelledby="fd-title" data-track-section={page ? 'flag_day_page' : 'home_flag_day'} data-track-location={page ? 'flag_day_page' : 'home_flag_day'}>
      <div className="fd-copy">
        <p className="fd-pill"><i aria-hidden="true" />{isToday ? t('Today · UAE Flag Day', 'اليوم · يوم العلم') : t('UAE Flag Day', 'يوم العلم')}</p>
        <Title id="fd-title">{isToday ? t('Happy Flag Day', 'يوم العلم مبارك') : t('Our flag, in roses.', 'علمنا، بالورد.')}</Title>
        <p className="fd-tagline">{t('One Flag, One Nation, Endless Pride.', 'علم واحد، وطن واحد، فخر بلا حدود.')}</p>
        <p className="fd-line">{t('The UAE flag in roses, in a heart box or a round box, with a handwritten card.', 'علم الإمارات بالورد، في صندوق قلب أو صندوق مستدير، مع بطاقة بخط اليد.')}</p>
        <p className="fd-deliver">{isToday ? t('Made to order. Delivered today in Dubai.', 'صُنع حسب الطلب. التوصيل اليوم في دبي.') : t('Made to order. Delivered on the day you choose.', 'صُنع حسب الطلب. التوصيل في اليوم الذي تختارونه.')}</p>
        <p className="fd-note">{t('The green and black roses are colour-sprayed.', 'الورود الخضراء والسوداء ملوّنة بالرش.')}</p>
      </div>
      <div className="fd-grid">{items.map((product, index) => <Piece key={product.id} product={product} index={index} onOpen={onOpen} />)}</div>
      {page && <p className="fd-more"><Link href="/shop">{t('Shop the full collection', 'تسوقوا المجموعة الكاملة')} <span className="flip-rtl" aria-hidden="true">→</span></Link></p>}
    </section>
  );
}

export default function FlagDayPage({ initialDubaiDate }: { initialDubaiDate: string }) {
  const today = useDubaiNow()?.date ?? initialDubaiDate;
  return <FlagDaySection today={today} page />;
}
