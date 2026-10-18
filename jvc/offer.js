const items = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  items.forEach((item) => observer.observe(item));
}

// WhatsApp link in the footer, only once the business number is configured.
const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
const footerLinks = document.querySelector('footer > div');
if (/^971\d{8,9}$/.test(whatsappNumber) && footerLinks) {
  const link = document.createElement('a');
  link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Maison Botanique, I have a question about the JVC opening offer.')}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'WHATSAPP US ↗';
  footerLinks.append(link);
}
