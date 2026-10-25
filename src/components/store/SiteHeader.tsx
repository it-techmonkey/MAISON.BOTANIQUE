'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BUDGET_BANDS, liveCatalogGroups } from '@/lib/catalog-groups';
import { SearchIcon } from './icons';
import { readState } from './LaunchOffer';
import { useStore } from './StoreProvider';

/** The storefront wordmark: small MAISON over a large BOTANIQUE. */
export function Logo() {
  return <span className="logo"><span>MAISON</span><strong>BOTANIQUE</strong></span>;
}

/**
 * A link into the shop's collection: `#roses`, `#occasion/birthday`, `#budget/b2`.
 * On /shop it is a plain hash link (the collection listens for hash changes);
 * elsewhere it navigates to /shop with the hash.
 */
export function CollectionLink({ hash, onClick, children, className, 'aria-label': ariaLabel }: { hash: string; onClick?: () => void; children: ReactNode; className?: string; 'aria-label'?: string }) {
  const pathname = usePathname();
  const onShop = pathname === '/' || pathname === '/shop';
  return onShop
    ? <a className={className} href={`#${hash}`} onClick={onClick} aria-label={ariaLabel}>{children}</a>
    : <Link className={className} href={`/shop#${hash}`} onClick={onClick} aria-label={ariaLabel}>{children}</Link>;
}

function OfferBar() {
  const { t, openOffer } = useStore();
  const [claimed, setClaimed] = useState(false);
  useEffect(() => {
    const sync = () => setClaimed(Boolean(readState().code));
    sync();
    window.addEventListener('maison-offer-changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('maison-offer-changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const message = claimed ? t('Your 25% code is ready', 'رمز خصمك ٢٥٪ جاهز') : t('25% off your first order', 'خصم ٢٥٪ على طلبك الأول');
  const action = claimed ? t('View code', 'عرض الرمز') : t('Claim', 'احصل عليه');
  return (
    <button type="button" className="offer-bar" data-track-location="offer_bar" onClick={openOffer}>
      <span className="offer-bar__text"><span>{message}</span><span aria-hidden="true">·</span><strong>{action} <span className="flip-rtl" aria-hidden="true">→</span></strong></span>
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
  const direct = ['roses', 'gifts', 'grand-gestures', 'under-300'].map(findGroup).filter((group) => group !== null);

  // Over the home hero the header stays transparent for the whole pinned
  // scene, and takes its paper background once the hero has moved past it,
  // or as soon as the hero's text would slide up underneath it (phones).
  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      const hero = document.getElementById('turntable');
      if (!hero) { setScrolled(window.scrollY > 24); return; }
      const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
      const copyTop = hero.querySelector('.tt-copy')?.getBoundingClientRect().top ?? Infinity;
      setScrolled(hero.getBoundingClientRect().bottom <= 150 || copyTop < headerBottom);
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
                  {BUDGET_BANDS.map((band) => <CollectionLink key={band.id} hash={`budget/${band.id}`} onClick={closeMenus}>{label(band)}</CollectionLink>)}
                </div>
                <CollectionLink className="nav-shop__all" hash="shop" onClick={closeMenus}>{t('Shop everything', 'تسوّق الكل')} →</CollectionLink>
              </div>
            </div>
            {direct.filter((group) => group.id === 'roses').map(groupLink)}
            <div className="nav-occasions">
              <button type="button" aria-expanded={occasionsOpen} aria-controls="nav-occasions-list" onClick={() => { setOccasionsOpen(!occasionsOpen); setShopOpen(false); }}>
                {t('Occasions', 'المناسبات')} <span aria-hidden="true">▾</span>
              </button>
              <div id="nav-occasions-list" className={`nav-occasions__list${occasionsOpen ? ' is-open' : ''}`}>
                {occasions.map((occasion) => <CollectionLink key={occasion.id} hash={`occasion/${occasion.id}`} onClick={closeMenus}>{label(occasion)}</CollectionLink>)}
              </div>
            </div>
            {direct.filter((group) => group.id !== 'roses').map(groupLink)}
          </div>
          <div className="site-nav__secondary">
            <Link href="/services">{t('Events & gifting', 'المناسبات والإهداء')}</Link>
            <Link href="/delivery">{t('Delivery & care', 'التوصيل والعناية')}</Link>
            <Link href="/contact">{t('Contact', 'تواصل معنا')}</Link>
            <Link href="/account">{t('Your account', 'حسابي')}</Link>
          </div>
        </nav>
        <div className="site-header__actions">
          <CollectionLink className="header-action search-link" hash="search" onClick={closeMenus} aria-label={t('Search the collection', 'ابحث في المجموعة')}>
            <SearchIcon />
          </CollectionLink>
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
