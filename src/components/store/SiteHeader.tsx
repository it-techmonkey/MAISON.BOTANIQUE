'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { liveCatalogGroups } from '@/lib/catalog-groups';
import { useStore } from './StoreProvider';

/** The storefront wordmark: small MAISON over a large BOTANIQUE. */
export function Logo() {
  return <span className="logo"><span>MAISON</span><strong>BOTANIQUE</strong></span>;
}

/**
 * A link into the home collection: `#roses` or `#occasion/birthday`. On the
 * home page it is a plain hash link (the collection listens for hash changes);
 * elsewhere it navigates to the home page with the hash.
 */
export function CollectionLink({ hash, onClick, children, className }: { hash: string; onClick?: () => void; children: ReactNode; className?: string }) {
  const onHome = usePathname() === '/';
  return onHome
    ? <a className={className} href={`#${hash}`} onClick={onClick}>{children}</a>
    : <Link className={className} href={`/#${hash}`} onClick={onClick}>{children}</Link>;
}

// The opening offer runs above the header; the whole ribbon opens the sign-up.
const OFFER = {
  en: ['Opening offer · 25% off for our first 100 customers', 'Free delivery in JVC', 'Delivering across Dubai', 'A scented candle with each of those first orders'],
  ar: ['عرض الافتتاح · خصم ٢٥٪ لأول ١٠٠ عميل', 'توصيل مجاني في JVC', 'التوصيل في جميع أنحاء دبي', 'شمعة معطّرة مع كل طلب من هذه الطلبات الأولى'],
};

function OfferBar() {
  const { ar, openOffer } = useStore();
  const items = OFFER[ar ? 'ar' : 'en'];
  const claim = ar ? 'احصل على رمزك ←' : 'Claim your code →';
  // Rendered twice so the loop is seamless; screen readers get the copy once from the label.
  const run = <span className="offer-bar__run" aria-hidden="true">{items.map((item) => <span key={item}>{item}</span>)}<span className="offer-bar__claim">{claim}</span></span>;
  return (
    <button type="button" className="offer-bar" data-track-location="offer_bar" onClick={openOffer} aria-label={`${items.join('. ')}. ${claim}`}>
      <span className="offer-bar__track">{run}{run}</span>
    </button>
  );
}

export default function SiteHeader() {
  const { ar, t, setLocale, cart, setCartOpen, products } = useStore();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [occasionsOpen, setOccasionsOpen] = useState(false);
  const { groups, occasions, findGroup } = useMemo(() => liveCatalogGroups(products), [products]);
  const kind = (value: string) => groups.filter((group) => group.kind === value);
  const direct = ['roses', 'grand-gestures', 'under-300'].map(findGroup).filter((group) => group !== null);

  // Over the home hero the header stays transparent for the whole pinned
  // scene, and takes its paper background once the hero has moved past it.
  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      const hero = document.getElementById('turntable');
      setScrolled(hero ? hero.getBoundingClientRect().bottom <= 150 : window.scrollY > 24);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  const closeMenus = () => { setMenuOpen(false); setShopOpen(false); setOccasionsOpen(false); };

  // Close everything after navigating.
  useEffect(() => { closeMenus(); }, [pathname]);

  // Outside clicks and Escape close the dropdowns.
  useEffect(() => {
    if (!menuOpen && !shopOpen && !occasionsOpen) return undefined;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.('.nav-occasions')) setOccasionsOpen(false);
      if (!target?.closest?.('.nav-shop')) setShopOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeMenus(); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, [menuOpen, shopOpen, occasionsOpen]);

  const label = (item: { en: string; ar: string }) => (ar ? item.ar : item.en);
  const groupLink = (group: { id: string; en: string; ar: string }) => (
    <CollectionLink key={group.id} hash={group.id} onClick={closeMenus}>{label(group)}</CollectionLink>
  );

  return (
    <>
      <OfferBar />
      <header data-track-location="header" className={`site-header${scrolled || menuOpen || pathname !== '/' ? ' site-header--solid' : ''}`}>
        <Link href="/" className="site-header__brand" onClick={closeMenus} aria-label={t('Maison Botanique home', 'ميزون بوتانيك، الرئيسية')}>
          <Logo />
        </Link>
        <nav id="site-menu" className={`site-nav primary-nav${menuOpen ? ' site-nav--open' : ''}`} aria-label={t('Main navigation', 'التنقل الرئيسي')}>
          <div className="site-nav__primary">
            <div className="nav-shop">
              <button type="button" aria-expanded={shopOpen} aria-controls="nav-shop-panel" onClick={() => { setShopOpen(!shopOpen); setOccasionsOpen(false); }}>
                {t('Shop', 'تسوّق')} <span aria-hidden="true">▾</span>
              </button>
              <div id="nav-shop-panel" className={`nav-shop__panel${shopOpen ? ' is-open' : ''}`}>
                <div className="nav-shop__col">
                  <h2>{t('By occasion', 'حسب المناسبة')}</h2>
                  {occasions.map((occasion) => <CollectionLink key={occasion.id} hash={`occasion/${occasion.id}`} onClick={closeMenus}>{label(occasion)}</CollectionLink>)}
                </div>
                <div className="nav-shop__col">
                  <h2>{t('By flower', 'حسب الزهرة')}</h2>
                  {kind('flower').map(groupLink)}
                </div>
                <div className="nav-shop__col">
                  <h2>{t('By format', 'حسب الشكل')}</h2>
                  {[...kind('format'), ...kind('curated')].map(groupLink)}
                  <h2>{t('By budget', 'حسب الميزانية')}</h2>
                  {kind('budget').map(groupLink)}
                </div>
                <CollectionLink className="nav-shop__all" hash="shop" onClick={closeMenus}>{t('Shop everything', 'تسوّق الكل')} →</CollectionLink>
              </div>
            </div>
            {direct.slice(0, 1).map(groupLink)}
            <div className="nav-occasions">
              <button type="button" aria-expanded={occasionsOpen} aria-controls="nav-occasions-list" onClick={() => { setOccasionsOpen(!occasionsOpen); setShopOpen(false); }}>
                {t('Occasions', 'المناسبات')} <span aria-hidden="true">▾</span>
              </button>
              <div id="nav-occasions-list" className={`nav-occasions__list${occasionsOpen ? ' is-open' : ''}`}>
                {occasions.map((occasion) => <CollectionLink key={occasion.id} hash={`occasion/${occasion.id}`} onClick={closeMenus}>{label(occasion)}</CollectionLink>)}
              </div>
            </div>
            {direct.slice(1).map(groupLink)}
          </div>
          <div className="site-nav__secondary">
            <Link href="/services">{t('Events & gifting', 'المناسبات والإهداء')}</Link>
            <Link href="/delivery">{t('Delivery & care', 'التوصيل والعناية')}</Link>
            <Link href="/contact">{t('Contact', 'تواصل معنا')}</Link>
            <Link href="/account">{t('Your account', 'حسابي')}</Link>
          </div>
        </nav>
        <div className="site-header__actions">
          <CollectionLink className="header-action search-link" hash="search" onClick={closeMenus}>{t('Search', 'بحث')}</CollectionLink>
          <button className="header-action" type="button" onClick={() => setLocale(ar ? 'en' : 'ar')}
            aria-label={ar ? 'Switch to English' : 'التبديل إلى العربية'}>
            {ar ? 'EN' : 'عربي'}
          </button>
          <Link className="header-action header-action--account" href="/account" aria-current={pathname === '/account' ? 'page' : undefined}>
            {t('Account', 'حسابي')}
          </Link>
          <button className="header-action" type="button" onClick={() => { closeMenus(); setCartOpen(true); }}>
            {t('Bag', 'الحقيبة')} <span aria-live="polite">({cart.cartCount})</span>
          </button>
          <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="site-menu"
            aria-label={t('Menu', 'القائمة')} onClick={() => setMenuOpen((open) => !open)}>
            <span /><span />
          </button>
        </div>
      </header>
    </>
  );
}
