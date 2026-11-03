'use client';

import Link from 'next/link';
import { useEffect, useState, type MouseEvent } from 'react';
import { hamperFromPrice } from '@/lib/hamper';
import { trackProductClicked, trackProductListViewed } from '@/lib/analytics/track';
import { DIWALI_GROUPS, DIWALI_HANDLES, DIWALI_USE, pick, seasonalExpired } from '@/lib/seasonal';
import { useDubaiNow } from '@/lib/use-today';
import type { Product } from '@/lib/types';
import { SYMBOLS } from './DiwaliSymbols';
import Money from './Money';
import SaleTag from './SaleTag';
import { useStore } from './StoreProvider';
import '@/styles/collection.css';
import '@/styles/diwali-edition.css';

const LIST = { listId: 'diwali' };
const fmt = (value: number, ar: boolean) => new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE', { maximumFractionDigits: 0 }).format(value);

function Piece({ product, index, onOpen }: { product: Product; index: number; onOpen: (product: Product, position: number) => void }) {
  const { ar, t } = useStore();
  const name = ar ? product.nameAr : product.name;
  const use = DIWALI_USE[product.id];
  const href = `/shop/${product.id}`;
  const many = product.sizes.length > 1;
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(product, index + 1);
  };
  return (
    <article className="mbc-piece dwe-piece">
      <a className="mbc-frame" href={href} onClick={open} aria-label={name}>
        <img src={product.imageSmall} srcSet={`${product.imageSmall} 480w, ${product.image} 960w`} sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
          alt={ar ? name : product.imageAlt} width="480" height="480" loading={index < 4 ? 'eager' : 'lazy'} fetchPriority={index < 4 ? 'high' : 'auto'} decoding="async" />
      </a>
      <div className="mbc-cap">
        {use && <span className="dwe-use">{ar ? use[1] : use[0]}</span>}
        <h3><a href={href} onClick={open} aria-label={name}>{name}</a></h3>
        <span className="mbc-line">{ar ? product.lineAr : product.line}</span>
        {product.sizes[0]?.detail && <span className="dwe-size">{ar ? product.sizes[0].detailAr : product.sizes[0].detail}</span>}
        <SaleTag className="mbc-sale" price={product.price} compareAtPrice={product.compareAtPrice} />
        <div className="mbc-row">
          <span className="mbc-price">
            {many && <small>{t('From', 'من')} </small>}<Money amount={product.price} ar={ar} whole />
            {product.compareAtPrice && <s aria-label={`${t('was', 'بدلاً من')} AED ${fmt(product.compareAtPrice, ar)}`}>{fmt(product.compareAtPrice, ar)}</s>}
          </span>
          <button type="button" className="mbc-add" onClick={() => onOpen(product, index + 1)} disabled={!product.available}
            aria-label={`${t('Add to bag', 'أضف إلى الحقيبة')}: ${name}`}>{product.available ? <>{t('Add', 'أضف')} <span aria-hidden="true">+</span></> : t('Sold out', 'نفدت الكمية')}</button>
        </div>
      </div>
    </article>
  );
}

/** The partner's hamper builder, as the last card of "For the host". It is not one product (it fills the bag with several), so it links out. */
function HostHamperCard() {
  const { ar, t } = useStore();
  const name = t('Build a host hamper', 'صمّموا هدية للمضيف');
  const href = '/conscious-curations#diwali';
  return (
    <article className="mbc-piece dwe-piece" data-track-location="diwali_host_hamper">
      <Link className="mbc-frame" href={href} aria-label={name}>
        <img src="/hamper/presets/card/festive.webp" alt={t('A Diwali hamper by Conscious Curations', 'سلة ديوالي من Conscious Curations')} width="480" height="480" loading="lazy" decoding="async" />
      </Link>
      <div className="mbc-cap">
        <span className="dwe-use">{t('With Conscious Curations', 'مع Conscious Curations')}</span>
        <h3><Link href={href}>{name}</Link></h3>
        <span className="mbc-line">{t('Pick a basket, handcrafted pieces and a treat.', 'اختاروا سلة وقطعاً يدوية وحلوى.')}</span>
        <div className="mbc-row">
          <span className="mbc-price"><small>{t('From', 'من')} </small><Money amount={hamperFromPrice()} ar={ar} whole /></span>
          <Link className="mbc-add" href={href} aria-label={name}>{t('Build', 'صمّم')} <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </article>
  );
}

/** The Diwali Edition page: its own night theme, the whole range grouped by where it goes, the everyday shop one tap away. */
export default function DiwaliEdition({ initialDubaiDate }: { initialDubaiDate: string }) {
  const { ar, t, products, openProduct } = useStore();
  const today = useDubaiNow()?.date ?? initialDubaiDate;
  const groups = DIWALI_GROUPS.map((group) => ({ ...group, items: pick(products, group.handles) })).filter((group) => group.items.length);
  const all = groups.flatMap((group) => group.items);
  const [active, setActive] = useState('all');

  useEffect(() => {
    const read = () => { const id = window.location.hash.slice(1); setActive(groups.some((group) => group.id === id) ? id : 'all'); };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);
  useEffect(() => { if (all.length) trackProductListViewed(LIST, all); }, [all.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id: string) => { setActive(id); window.history.replaceState(null, '', id === 'all' ? window.location.pathname : `#${id}`); };
  const onOpen = (product: Product, position: number) => { trackProductClicked(product, LIST, position); openProduct(product); };
  const ended = DIWALI_HANDLES.every((handle) => seasonalExpired(handle, today));

  return (
    <>
      <section className="mbc dwe" aria-labelledby="dwe-title" data-track-section="diwali_edition">
        <div className="dwe-stars" aria-hidden="true" />
        <div className="dwe-in">
          <p className="dwe-kicker">{t('Diwali Edition 2026 · ', 'إصدار ديوالي 2026 · ')}{t('Sunday 8 November', 'الأحد 8 نوفمبر')}</p>
          <h1 id="dwe-title">{t('Ghar wali Diwali, here in Dubai.', 'ديوالي بدفء البيت، هنا في دبي.')}</h1>
          <p className="dwe-sub">{t('Fresh marigold for your door, doorstep and table. Pre-order now, delivered from 5 November, before Diwali.', 'قطيفة طازجة لباب بيتكم وعتبته ومائدتكم. اطلبوا مسبقاً، التوصيل من 5 نوفمبر، قبل ديوالي.')}</p>
          <ol className="dwe-steps" aria-label={t('How it works', 'كيف يعمل')}>
            <li>{t('Pre-order now', 'اطلبوا الآن')}</li><li>{t('Delivered from 5 Nov', 'التوصيل من 5 نوفمبر')}</li><li>{t('Diwali · 8 Nov', 'ديوالي · 8 نوفمبر')}</li>
          </ol>
          <p className="dwe-fee">{t('Delivery: AED 30 in Dubai · AED 65 elsewhere in the UAE.', 'رسوم التوصيل: ٣٠ درهماً في دبي، و٦٥ درهماً في بقية الإمارات.')}</p>
          {ended ? (
            <p className="dwe-ended">{t('Diwali delivery has ended for this year. ', 'انتهى توصيل ديوالي لهذا العام. ')}<Link href="/shop">{t('Shop everyday flowers', 'تسوقوا زهور كل يوم')} →</Link></p>
          ) : (
            <>
              <div className="dwe-chips" role="group" aria-label={t('Choose where it goes', 'اختاروا مكانه')}>
                <button type="button" className="dwe-chip" aria-pressed={active === 'all'} onClick={() => choose('all')}><b>{t('All Diwali', 'كل ديوالي')}</b></button>
                {groups.map((group) => (
                  <button type="button" key={group.id} className="dwe-chip" aria-pressed={active === group.id} onClick={() => choose(group.id)}>
                    <span className="dwe-sym">{SYMBOLS[group.id]}</span><b>{ar ? group.ar : group.en}</b>
                  </button>
                ))}
              </div>
              {groups.map((group) => (active === 'all' || active === group.id) && (
                <div className="dwe-group" key={group.id} id={group.id}>
                  <div className="dwe-gh"><span className="dwe-sym dwe-sym--ring">{SYMBOLS[group.id]}</span>
                    <div><h2>{ar ? group.ar : group.en}</h2><p>{ar ? group.lineAr : group.lineEn}</p></div></div>
                  <div className="dwe-grid">
                    {group.items.map((product) => <Piece key={product.id} product={product} index={all.indexOf(product)} onOpen={onOpen} />)}
                    {group.id === 'host' && <HostHamperCard />}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
      <section className="dwe-return" aria-label={t('Everyday flowers', 'زهور كل يوم')}>
        <div><span className="dwe-ret-kicker">{t('Everyday flowers', 'زهور كل يوم')}</span><h2>{t('Shop the full collection', 'تسوقوا المجموعة الكاملة')}</h2></div>
        <Link className="dwe-ret-link" href="/shop">{t('All flowers and gifts', 'كل الزهور والهدايا')} <span className="flip-rtl" aria-hidden="true">→</span></Link>
      </section>
    </>
  );
}
