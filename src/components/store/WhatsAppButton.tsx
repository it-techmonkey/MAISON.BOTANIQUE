'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isWhatsappOpen, whatsappLink, whatsappMessage } from '@/lib/whatsapp';
import { useStore } from './StoreProvider';

const COPY = {
  en: { label: 'Chat with a florist', open: 'Usually replies within minutes', closed: "We'll reply from 9am" },
  ar: { label: 'تحدّث مع منسّق الزهور', open: 'نرد عادةً خلال دقائق', closed: 'نرد ابتداءً من ٩ صباحاً' },
};

export function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.8 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.2-.2-.2-.5-.4Z" /></svg>;
}

/** Floating corner link to a florist. It sits at the inline end, so it moves left in Arabic. Hidden until a number is set. */
export default function WhatsAppButton() {
  const { ar } = useStore();
  const t = COPY[ar ? 'ar' : 'en'];
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [raised, setRaised] = useState(false);

  useEffect(() => {
    setOpen(isWhatsappOpen());
    const timer = window.setInterval(() => setOpen(isWhatsappOpen()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // The home hero has its own arrows in the bottom corner.
  useEffect(() => {
    const hero = document.getElementById('turntable');
    if (!hero || typeof IntersectionObserver === 'undefined') { setRaised(false); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      setRaised(entry.isIntersecting && entry.boundingClientRect.bottom > window.innerHeight - 120);
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  const href = whatsappLink(whatsappMessage.general(ar));
  if (!href) return null;
  return (
    <a className={`wa-float${raised ? ' wa-float--raised' : ''}`} data-track-location="whatsapp_float" href={href} target="_blank" rel="noopener noreferrer"
      aria-label={`${t.label} · ${open ? t.open : t.closed}`}>
      <WhatsAppIcon />
      <span className="wa-float__text"><strong>{t.label}</strong><em>{open ? t.open : t.closed}</em></span>
    </a>
  );
}
