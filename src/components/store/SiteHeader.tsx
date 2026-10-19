'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ABOUT_LINKS, HELP_LINKS, NAV_LINKS } from '@/lib/site';
import { useStore } from './StoreProvider';

/** The storefront wordmark: small MAISON over a large BOTANIQUE. */
export function Logo() {
  return <span className="logo"><span>MAISON</span><strong>BOTANIQUE</strong></span>;
}

export default function SiteHeader() {
  const { ar, t, setLocale, cart, setCartOpen } = useStore();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pick = (label: { en: string; ar: string }) => (ar ? label.ar : label.en);

  // Over the home hero the header stays transparent for the whole pinned
  // scene, and takes its paper background once the hero has moved past it.
  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      const hero = document.getElementById('turntable');
      setScrolled(hero ? hero.getBoundingClientRect().bottom <= 110 : window.scrollY > 24);
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

  // Close the mobile menu after navigating.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header data-track-location="header" className={`site-header${scrolled || menuOpen ? ' site-header--solid' : ''}`}>
      <Link href="/" className="site-header__brand" aria-label={t('Maison Botanique home', 'ميزون بوتانيك، الرئيسية')}>
        <Logo />
      </Link>
      <nav id="site-menu" className={`site-nav${menuOpen ? ' site-nav--open' : ''}`} aria-label={t('Main navigation', 'التنقل الرئيسي')}>
        <div className="site-nav__primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{pick(link.label)}</Link>
          ))}
        </div>
        <div className="site-nav__secondary">
          {[...ABOUT_LINKS, ...HELP_LINKS.slice(0, 2)].map((link) => (
            <Link key={link.href} href={link.href}>{pick(link.label)}</Link>
          ))}
          <Link href="/account">{t('Your account', 'حسابي')}</Link>
        </div>
      </nav>
      <div className="site-header__actions">
        <button className="header-action" type="button" onClick={() => setLocale(ar ? 'en' : 'ar')}
          aria-label={ar ? 'Switch to English' : 'التبديل إلى العربية'}>
          {ar ? 'AR / EN' : 'EN / AR'}
        </button>
        <Link className="header-action header-action--account" href="/account" aria-current={pathname === '/account' ? 'page' : undefined}>
          {t('Account', 'حسابي')}
        </Link>
        <button className="header-action" type="button" onClick={() => { setMenuOpen(false); setCartOpen(true); }}>
          {t('Bag', 'السلة')} <span aria-live="polite">({cart.cartCount})</span>
        </button>
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="site-menu"
          aria-label={t('Menu', 'القائمة')} onClick={() => setMenuOpen((open) => !open)}>
          <span /><span />
        </button>
      </div>
    </header>
  );
}
