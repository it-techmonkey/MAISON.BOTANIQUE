import type { Metadata } from 'next';
import { whatsappLink } from '@/lib/whatsapp';
import Reveal from './Reveal';
import './offer.css';

export const metadata: Metadata = {
  title: 'Welcome Offer · Maison Botanique',
  description: "Maison Botanique's welcome offer: 25% off with your code, on top of 10% off every product. Preview only.",
  robots: { index: false, follow: false },
};

// Footer WhatsApp link, only once the business number is configured.
const whatsapp = whatsappLink('Hello Maison Botanique, I have a question about the welcome offer.');

export default function JvcOfferPage() {
  return (
    <>
      <a className="skip" href="#offer">Skip to the welcome offer</a>
      <div className="proof">PRIVATE DESIGN PROOF · CATALOG, TERMS &amp; BOOKING TO BE CONFIRMED</div>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Maison Botanique home"><span>MAISON</span><strong>BOTANIQUE</strong></a>
        <nav aria-label="Page navigation"><a href="#offer">The offer</a><a href="#collection">The collection</a><a href="#booking">How to claim</a></nav>
        <a className="header-link" href="#booking">Welcome offer <span aria-hidden="true">↗</span></a>
      </header>
      <main>
        <section className="hero" id="offer" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-place">MAISON BOTANIQUE / DUBAI</p>
            <div className="hero-main reveal">
              <h1 id="hero-title">25% + 10% off.<br />All products.</h1>
              <p className="hero-lede">On your first order. Choose bouquets, gifts or preserved flowers, with <strong>same-day delivery across the UAE.</strong></p>
              <a className="primary-action" href="#collection">Explore the welcome offer <span aria-hidden="true">↗</span></a>
            </div>
            <div className="hero-foot"><span>THE COLLECTION IS YOURS TO EXPLORE</span><span>WELCOME OFFER</span></div>
          </div>
          <figure className="hero-image">
            <img src="/assets/bouquet-concept.jpg" width={1024} height={1536} alt="Concept image of a hand-tied blush and cream bouquet in Maison Botanique's floral style" fetchPriority="high" />
            <figcaption>FLORAL DIRECTION · FINAL PRODUCT IMAGERY TO FOLLOW</figcaption>
          </figure>
        </section>
        <section className="bouquet" id="collection" aria-labelledby="bouquet-title">
          <div className="bouquet-copy reveal">
            <p className="section-kicker">THE COLLECTION, YOUR CHOICE</p>
            <h2 id="bouquet-title">Choose what<br />feels right.</h2>
            <p>Explore bouquets, floral gifts and preserved pieces. The welcome offer, 25% with your code on top of 10% off, applies to every product, so the first order can suit the person and the occasion.</p>
            <p className="bouquet-status">Final products, prices and photography are being confirmed. This photograph shows the visual direction.</p>
            <a className="text-action" href="#booking">See how to claim <span aria-hidden="true">↗</span></a>
          </div>
          <figure className="bouquet-image">
            <img src="/assets/bouquet-concept.jpg" width={1024} height={1536} alt="Detail crop of a Maison Botanique concept bouquet" loading="lazy" />
            <figcaption>FLORAL DETAIL · CONCEPT IMAGE</figcaption>
          </figure>
        </section>
        <section className="booking" id="booking" aria-labelledby="booking-title">
          <div className="booking-copy reveal">
            <p className="section-kicker">YOUR FIRST ORDER</p>
            <h2 id="booking-title">A welcome<br />from us.</h2>
            <p>Take 25% off with your code, on top of 10% off, on every product in your first order.</p>
            <div className="booking-pending" role="status"><strong>Sign up for your code</strong><span>Use the welcome offer banner on the shop, then enter your code at checkout.</span></div>
            <p className="booking-terms">One use per customer. Discount applies to products. Delivery is AED 30 in Dubai and AED 40 elsewhere in the UAE, shown at checkout.</p>
          </div>
        </section>
      </main>
      <footer>
        <a className="brand footer-brand" href="/" aria-label="Maison Botanique home"><span>MAISON</span><strong>BOTANIQUE</strong></a>
        <p>Flowers for the moments that stay with us.</p>
        <div><span>DUBAI</span><a href="/">EXPLORE THE COLLECTION ↗</a>{whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">WHATSAPP US ↗</a>}</div>
        <small>Private campaign proof. Imagery and offer details are provisional; do not distribute.</small>
      </footer>
      <Reveal />
    </>
  );
}
