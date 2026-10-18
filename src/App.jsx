import React, { useCallback, useEffect, useRef, useState } from 'react';
import Turntable from './components/Turntable.jsx';
import CollectionPage from './components/CollectionPage.jsx';
import ShopExperience, { useShopCart } from './components/ShopExperience.jsx';
import { SiteFooter, OfferBar } from './components/SiteChrome.jsx';
import LaunchOffer from './components/LaunchOffer.jsx';
import { allProducts, collectionProducts, heroProducts, liveRooms, liveOccasions } from './data/catalog.js';

const navCopy = {
  en: {
    occasions: 'Occasions', search: 'Search', bag: 'Bag', menu: 'Menu', skip: 'Skip to collection',
    added: 'is in your bag', viewBag: 'View bag', close: 'Close',
  },
  ar: {
    occasions: 'المناسبات', search: 'بحث', bag: 'الحقيبة', menu: 'القائمة', skip: 'انتقل إلى المجموعة',
    added: 'في حقيبتك الآن', viewBag: 'عرض الحقيبة', close: 'إغلاق',
  },
};

// Header categories: the rooms that have products, without "All".
const NAV_ROOMS = liveRooms.filter((room) => room.id !== 'all');

export default function App() {
  const [locale, setLocale] = useState('en');
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [occasionsOpen, setOccasionsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [offerSignal, setOfferSignal] = useState(0);
  const toastTimer = useRef(0);
  const { cart, addItem, updateQuantity, removeItem, cartCount, subtotal } = useShopCart();

  const ar = locale === 'ar';
  const copy = navCopy[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [locale, ar]);

  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      const hero = document.getElementById('turntable');
      setPastHero(hero ? hero.getBoundingClientRect().bottom <= 150 : false); // header + offer bar
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!occasionsOpen) return undefined;
    const close = (event) => { if (!event.target.closest?.('.nav-occasions')) setOccasionsOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setOccasionsOpen(false); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', onKey); };
  }, [occasionsOpen]);

  // Adding keeps the visitor browsing: a short confirmation instead of opening the bag.
  const onAdded = useCallback((product, sizeName) => {
    window.clearTimeout(toastTimer.current);
    setToast({ product, sizeName });
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const onHeroAdd = (product) => {
    addItem(product);
    onAdded(product, ar ? product.sizes[0].nameAr : product.sizes[0].name);
  };

  const closeMenus = () => { setMenuOpen(false); setOccasionsOpen(false); };
  const roomLabel = (room) => (ar ? room.ar : room.en);

  return (
    <div className="site-shell" dir={ar ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#shop">{copy.skip}</a>
      <OfferBar locale={locale} onClaim={() => setOfferSignal((n) => n + 1)} />
      <header className={`site-header site-header--dark ${pastHero ? 'site-header--paper' : ''}`}>
        <a href="#top" className="brand" aria-label={ar ? 'Maison Botanique، الرئيسية' : 'Maison Botanique home'} onClick={closeMenus}><span>MAISON</span><strong>BOTANIQUE</strong></a>
        <nav id="mobile-menu" className={`primary-nav ${menuOpen ? 'primary-nav--open' : ''}`} aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'}>
          {NAV_ROOMS.map((room) => <a key={room.id} href={`#${room.id}`} onClick={closeMenus}>{roomLabel(room)}</a>)}
          <div className="nav-occasions">
            <button type="button" aria-expanded={occasionsOpen} aria-controls="nav-occasions-list" onClick={() => setOccasionsOpen(!occasionsOpen)}>
              {copy.occasions} <span aria-hidden="true">▾</span>
            </button>
            <div id="nav-occasions-list" className={`nav-occasions__list${occasionsOpen ? ' is-open' : ''}`}>
              {liveOccasions.map((o) => <a key={o.id} href={`#occasion/${o.id}`} onClick={closeMenus}>{ar ? o.ar : o.en}</a>)}
            </div>
          </div>
        </nav>
        <div className="header-actions">
          <a className="search-link" href="#search" onClick={closeMenus}>{copy.search}</a>
          <button className="lang-button" type="button" onClick={() => setLocale(ar ? 'en' : 'ar')} aria-label={ar ? 'Switch to English' : 'Switch to Arabic'}>
            {ar ? 'EN' : 'عربي'}
          </button>
          <button className="bag-button" type="button" onClick={() => { closeMenus(); setCartOpen(true); }}>
            {copy.bag} <span aria-live="polite">({cartCount})</span>
          </button>
          <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={copy.menu} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span />
          </button>
        </div>
      </header>
      <main id="top">
        <Turntable
          products={heroProducts}
          locale={locale}
          onProductClick={setSelectedProduct}
          onAddToCart={onHeroAdd}
        />
        <CollectionPage
          products={collectionProducts}
          locale={locale}
          onProductClick={setSelectedProduct}
        />
      </main>
      <SiteFooter locale={locale} rooms={NAV_ROOMS} occasions={liveOccasions} onLocale={() => setLocale(ar ? 'en' : 'ar')} />
      <ShopExperience
        locale={locale}
        products={allProducts}
        related={collectionProducts}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        cart={cart}
        addItem={addItem}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        cartCount={cartCount}
        subtotal={subtotal}
        onAdded={onAdded}
      />
      <LaunchOffer locale={locale} openSignal={offerSignal} />
      <div className={`bag-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast && <>
          <img src={toast.product.imageSmall || toast.product.image} alt="" />
          <p><em>{ar ? toast.product.nameAr : toast.product.name}</em>{toast.sizeName ? `, ${toast.sizeName},` : ''} {copy.added}.</p>
          <button type="button" onClick={() => { setToast(null); setCartOpen(true); }}>{copy.viewBag}</button>
          <button type="button" className="bag-toast__close" aria-label={copy.close} onClick={() => setToast(null)}>×</button>
        </>}
      </div>
    </div>
  );
}
