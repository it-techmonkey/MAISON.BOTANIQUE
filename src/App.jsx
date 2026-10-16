import React, { useEffect, useState } from 'react';
import Turntable from './components/Turntable.jsx';
import EditorialSections from './components/EditorialSections.jsx';
import ShopExperience, { useShopCart } from './components/ShopExperience.jsx';
import { products } from './data/products.js';

const navCopy = {
  en: {
    bouquets: 'Bouquets', gifts: 'Gifts', preserved: 'Preserved', occasions: 'Occasions', story: 'Gifting',
    bag: 'Bag', menu: 'Menu', skip: 'Skip to collection',
    footer: 'Flowers for the moments that stay with us.',
    concept: 'Concept storefront for review. Imagery, products and prices are illustrative. Payments are not live.',
    terms: 'Delivery terms and product availability will be confirmed before launch.',
  },
  ar: {
    bouquets: 'باقات', gifts: 'هدايا', preserved: 'ورود محفوظة', occasions: 'المناسبات', story: 'الإهداء',
    bag: 'السلة', menu: 'القائمة', skip: 'انتقل إلى المجموعة',
    footer: 'زهور للحظات تبقى معنا.',
    concept: 'معاينة للمتجر. الصور والمنتجات والأسعار توضيحية. الدفع غير مفعل.',
    terms: 'سيتم تأكيد شروط التوصيل وتوفر المنتجات قبل الإطلاق.',
  },
};

export default function App() {
  const [locale, setLocale] = useState('en');
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [requestedCategory, setRequestedCategory] = useState('all');
  const [categoryRequestSeq, setCategoryRequestSeq] = useState(0);
  const { cart, addItem, updateQuantity, removeItem, cartCount, subtotal } = useShopCart();

  const copy = navCopy[locale];
  const featured = products.slice(0, 3);
  const collectionProducts = [...products].sort((a, b) => (a.catalogOrder ?? Infinity) - (b.catalogOrder ?? Infinity));

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      const hero = document.getElementById('turntable');
      setPastHero(hero ? hero.getBoundingClientRect().bottom <= 110 : false);
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

  const onAddToCart = (product) => {
    addItem(product);
    setCartOpen(true);
  };

  const tone = 'dark';
  const closeMenu = () => setMenuOpen(false);
  const selectNavCategory = (category) => {
    setRequestedCategory(category);
    setCategoryRequestSeq((sequence) => sequence + 1);
    closeMenu();
  };

  return (
    <div className="site-shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#shop">{copy.skip}</a>
      <header className={`site-header site-header--${tone} ${pastHero ? 'site-header--paper' : ''}`}>
        <a href="#top" className="brand" aria-label={locale === 'ar' ? 'Maison Botanique، الرئيسية' : 'Maison Botanique home'} onClick={closeMenu}><span>MAISON</span><strong>BOTANIQUE</strong></a>
        <nav id="mobile-menu" className={`primary-nav ${menuOpen ? 'primary-nav--open' : ''}`} aria-label={locale === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
          <a href="#shop" onClick={() => selectNavCategory('occasion')}>{copy.occasions}</a>
          <a href="#shop" onClick={() => selectNavCategory('bouquets')}>{copy.bouquets}</a>
          <a href="#shop" onClick={() => selectNavCategory('gifts')}>{copy.gifts}</a>
          <a href="#shop" onClick={() => selectNavCategory('preserved')}>{copy.preserved}</a>
          <a href="#our-world" onClick={closeMenu}>{copy.story}</a>
        </nav>
        <div className="header-actions">
          <button className="lang-button" type="button" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')} aria-label={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}>
            {locale === 'en' ? 'EN / AR' : 'AR / EN'}
          </button>
          <button className="bag-button" type="button" onClick={() => { closeMenu(); setCartOpen(true); }}>
            {copy.bag} <span aria-live="polite">({cartCount})</span>
          </button>
          <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={copy.menu} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span />
          </button>
        </div>
      </header>
      <main id="top">
        <Turntable
          products={featured}
          locale={locale}
          onProductClick={setSelectedProduct}
          onAddToCart={onAddToCart}
        />
        <EditorialSections
          products={collectionProducts}
          locale={locale}
          requestedCategory={requestedCategory}
          categoryRequestSeq={categoryRequestSeq}
          onProductClick={setSelectedProduct}
        />
      </main>
      <footer className="site-footer" id="site-footer">
        <div className="footer-brand"><span>MAISON</span><strong>BOTANIQUE</strong></div>
        <p>{copy.footer}</p>
        <div className="footer-end"><span>Dubai, UAE</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{locale === 'ar' ? 'العودة للأعلى ↑' : 'Back to top ↑'}</button></div>
        <div className="footer-terms"><p>{copy.concept}</p><p>{copy.terms}</p></div>
      </footer>
      <ShopExperience
        locale={locale}
        products={products}
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
      />
    </div>
  );
}
