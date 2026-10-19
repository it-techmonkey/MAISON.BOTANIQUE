import type { Metadata } from 'next';
import { whatsappLink } from '@/lib/whatsapp';
import Reveal from './Reveal';
import './offer.css';

export const metadata: Metadata = {
  title: 'JVC Opening Edition · Maison Botanique',
  description: "Maison Botanique's JVC opening edition: 25% off every product and a scented candle with each of the first 100 qualifying orders. Preview only.",
  robots: { index: false, follow: false },
};

// Footer WhatsApp link, only once the business number is configured.
const whatsapp = whatsappLink('Hello Maison Botanique, I have a question about the JVC opening offer.');

export default function JvcOfferPage() {
  return (
    <>
      <a className="skip" href="#offer">Skip to the opening offer</a>
      <div className="proof">PRIVATE DESIGN PROOF · CATALOG, TERMS &amp; BOOKING TO BE CONFIRMED</div>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Maison Botanique home"><span>MAISON</span><strong>BOTANIQUE</strong></a>
        <nav aria-label="Page navigation"><a href="#offer">The offer</a><a href="#collection">The collection</a><a href="#booking">Booking</a></nav>
        <a className="header-link" href="#booking">Opening edition <span aria-hidden="true">↗</span></a>
      </header>
      <main>
        <section className="hero" id="offer" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-place">MAISON BOTANIQUE / JVC, DUBAI</p>
            <div className="hero-main reveal">
              <h1 id="hero-title">25% off.<br />All products.</h1>
              <p className="hero-lede">For the first 100 confirmed orders. Choose bouquets, gifts or preserved flowers and receive <strong>a scented candle, on us.</strong></p>
              <a className="primary-action" href="#collection">Explore the opening offer <span aria-hidden="true">↗</span></a>
            </div>
            <div className="hero-foot"><span>THE COLLECTION IS YOURS TO EXPLORE</span><span>JVC OPENING EDITION</span></div>
          </div>
          <figure className="hero-image">
            <img src="/assets/bouquet-concept.jpg" width={1024} height={1536} alt="Concept image of a hand-tied blush and cream bouquet in Maison Botanique's floral style" fetchPriority="high" />
            <figcaption>FLORAL DIRECTION · FINAL PRODUCT IMAGERY TO FOLLOW</figcaption>
          </figure>
        </section>
        <section className="gift" aria-labelledby="gift-title">
          <div className="gift-image"><img src="/assets/dark-editorial-concept.jpg" width={1800} height={950} alt="Dark editorial floral arrangement showing the Maison Botanique visual direction" loading="lazy" /></div>
          <div className="gift-copy reveal">
            <p className="section-kicker">A WELCOME FROM US</p>
            <h2 id="gift-title">A gift to<br />keep.</h2>
            <p>Flowers for the moment. A scented candle for the evenings after. One is included with each of the first 100 qualifying orders.</p>
            <p className="gift-qualifier">One candle per confirmed order. The candle&apos;s final scent, vessel and packaging are being selected.</p>
          </div>
        </section>
        <section className="bouquet" id="collection" aria-labelledby="bouquet-title">
          <div className="bouquet-copy reveal">
            <p className="section-kicker">THE COLLECTION, YOUR CHOICE</p>
            <h2 id="bouquet-title">Choose what<br />feels right.</h2>
            <p>Explore bouquets, floral gifts and preserved pieces. The 25% opening offer applies to every product, so the first order can suit the person and the occasion.</p>
            <p className="bouquet-status">Final products, prices and photography are being confirmed. This photograph shows the visual direction.</p>
            <a className="text-action" href="#booking">See how to book <span aria-hidden="true">↗</span></a>
          </div>
          <figure className="bouquet-image">
            <img src="/assets/bouquet-concept.jpg" width={1024} height={1536} alt="Detail crop of a Maison Botanique concept bouquet" loading="lazy" />
            <figcaption>FLORAL DETAIL · CONCEPT IMAGE</figcaption>
          </figure>
        </section>
        <section className="booking" id="booking" aria-labelledby="booking-title">
          <div className="booking-copy reveal">
            <p className="section-kicker">FIRST 100 ORDERS · JVC</p>
            <h2 id="booking-title">The first<br />100.</h2>
            <p>Take 25% off every product in your first qualifying order. We will include a scented candle with each of those first 100 orders.</p>
            <div className="booking-pending" role="status"><strong>Bookings opening soon</strong><span>The collection, final prices and booking link will appear here when confirmed.</span></div>
            <p className="booking-terms">One qualifying order per customer. Discount applies to products; any delivery charge will be shown at checkout. Final dates and full terms will be published before launch.</p>
          </div>
        </section>
      </main>
      <footer>
        <a className="brand footer-brand" href="/" aria-label="Maison Botanique home"><span>MAISON</span><strong>BOTANIQUE</strong></a>
        <p>Flowers for the moments that stay with us.</p>
        <div><span>JVC, DUBAI</span><a href="/">EXPLORE THE COLLECTION ↗</a>{whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">WHATSAPP US ↗</a>}</div>
        <small>Private campaign proof. Imagery and offer details are provisional; do not distribute.</small>
      </footer>
      <Reveal />
    </>
  );
}
