import React, { useCallback, useEffect, useRef, useState } from 'react';
import Turntable from './components/Turntable.jsx';
import CollectionPage from './components/CollectionPage.jsx';
import ShopExperience, { useShopCart } from './components/ShopExperience.jsx';
import { SiteFooter, OfferBar } from './components/SiteChrome.jsx';
import LaunchOffer from './components/LaunchOffer.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import { allProducts, collectionProducts, heroProducts, liveGroups, liveOccasions, findGroup, TAB_IDS } from './data/catalog.js';

const navCopy = {
  en: {
    shop: 'Shop', occasions: 'Occasions', byOccasion: 'By occasion', byFlower: 'By flower', byFormat: 'By format', byBudget: 'By budget', shopAll: 'Shop everything', search: 'Search', bag: 'Bag', menu: 'Menu', skip: 'Skip to collection',
    added: 'is in your bag', viewBag: 'View bag', close: 'Close',
  },
  ar: {
    shop: 'تسوّق', occasions: 'المناسبات', byOccasion: 'حسب المناسبة', byFlower: 'حسب الزهرة', byFormat: 'حسب الشكل', byBudget: 'حسب الميزانية', shopAll: 'تسوّق الكل', search: 'بحث', bag: 'الحقيبة', menu: 'القائمة', skip: 'انتقل إلى المجموعة',
    added: 'في حقيبتك الآن', viewBag: 'عرض الحقيبة', close: 'إغلاق',
  },
};

// Header: a Shop menu (occasion / flower / format & budget) plus four direct links.
const kind = (k) => liveGroups.filter((g) => g.kind === k);
const MENU = { flower: kind('flower'), format: [...kind('format'), ...kind('curated')], budget: kind('budget') };
const DIRECT = ['roses', 'grand-gestures', 'under-300'].map(findGroup).filter(Boolean);
const FOOTER_GROUPS = TAB_IDS.filter((id) => id !== 'all').map(findGroup).filter(Boolean);

export default function App() {
  const [locale, setLocale] = useState('en');
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [occasionsOpen, setOccasionsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [offerSignal, setOfferSignal] = useState(0);
  const toastTimer = useRef(0);
  const { cart, addItem, updateQuantity, removeItem, cartCount, subtotal, delivery, setDelivery } = useShopCart();

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
      // The hero stays pinned behind the page, so watch where the collection starts instead.
      const shop = document.getElementById('shop');
      setPastHero(shop ? shop.getBoundingClientRect().top <= 150 : false); // header + offer bar
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
    if (!occasionsOpen && !shopOpen) return undefined;
    const close = (event) => {
      if (!event.target.closest?.('.nav-occasions')) setOccasionsOpen(false);
      if (!event.target.closest?.('.nav-shop')) setShopOpen(false);
    };
    const onKey = (event) => { if (event.key === 'Escape') { setOccasionsOpen(false); setShopOpen(false); } };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', onKey); };
  }, [occasionsOpen, shopOpen]);

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

  const closeMenus = () => { setMenuOpen(false); setOccasionsOpen(false); setShopOpen(false); };
  const label = (item) => (ar ? item.ar : item.en);
  const groupLink = (g) => <a key={g.id} href={`#${g.id}`} onClick={closeMenus}>{label(g)}</a>;

  return (
    <div className="site-shell" dir={ar ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#shop">{copy.skip}</a>
      <OfferBar locale={locale} onClaim={() => setOfferSignal((n) => n + 1)} />
      <header className={`site-header site-header--dark ${pastHero ? 'site-header--paper' : ''}`}>
        <a href="#top" className="brand" aria-label={ar ? 'Maison Botanique، الرئيسية' : 'Maison Botanique home'} onClick={closeMenus}><span>MAISON</span><strong>BOTANIQUE</strong></a>
        <nav id="mobile-menu" className={`primary-nav ${menuOpen ? 'primary-nav--open' : ''}`} aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'}>
          <div className="nav-shop">
            <button type="button" aria-expanded={shopOpen} aria-controls="nav-shop-panel" onClick={() => { setShopOpen(!shopOpen); setOccasionsOpen(false); }}>
              {copy.shop} <span aria-hidden="true">▾</span>
            </button>
            <div id="nav-shop-panel" className={`nav-shop__panel${shopOpen ? ' is-open' : ''}`}>
              <div className="nav-shop__col">
                <h2>{copy.byOccasion}</h2>
                {liveOccasions.map((o) => <a key={o.id} href={`#occasion/${o.id}`} onClick={closeMenus}>{label(o)}</a>)}
              </div>
              <div className="nav-shop__col">
                <h2>{copy.byFlower}</h2>
                {MENU.flower.map(groupLink)}
              </div>
              <div className="nav-shop__col">
                <h2>{copy.byFormat}</h2>
                {MENU.format.map(groupLink)}
                <h2>{copy.byBudget}</h2>
                {MENU.budget.map(groupLink)}
              </div>
              <a className="nav-shop__all" href="#shop" onClick={closeMenus}>{copy.shopAll} →</a>
            </div>
          </div>
          {DIRECT.slice(0, 1).map((g) => <a key={g.id} href={`#${g.id}`} onClick={closeMenus}>{label(g)}</a>)}
          <div className="nav-occasions">
            <button type="button" aria-expanded={occasionsOpen} aria-controls="nav-occasions-list" onClick={() => { setOccasionsOpen(!occasionsOpen); setShopOpen(false); }}>
              {copy.occasions} <span aria-hidden="true">▾</span>
            </button>
            <div id="nav-occasions-list" className={`nav-occasions__list${occasionsOpen ? ' is-open' : ''}`}>
              {liveOccasions.map((o) => <a key={o.id} href={`#occasion/${o.id}`} onClick={closeMenus}>{label(o)}</a>)}
            </div>
          </div>
          {DIRECT.slice(1).map((g) => <a key={g.id} href={`#${g.id}`} onClick={closeMenus}>{label(g)}</a>)}
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
      <SiteFooter locale={locale} rooms={FOOTER_GROUPS} occasions={liveOccasions} onLocale={() => setLocale(ar ? 'en' : 'ar')} />
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
        delivery={delivery}
        setDelivery={setDelivery}
        onAdded={onAdded}
      />
      <LaunchOffer locale={locale} openSignal={offerSignal} />
      <WhatsAppButton locale={locale} />
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
