/** Existing catalogue photographs shown on guide and journal pages: one hero, then products worth considering. */
export interface GuideVisual { hero: string; products: string[] }

export const GUIDE_VISUALS: Record<string, GuideVisual> = {
  '/guides/flower-care-air-conditioning': { hero: 'eloise-pink-and-white-rose-bouquet', products: ['eloise-pink-and-white-rose-bouquet', 'aveline-red-pink-and-white-rose-bouquet', 'nacre-pearl-white-rose-bouquet'] },
  '/guides/flowers-for-a-dinner-host': { hero: 'rosamund-blush-pink-rose-bouquet', products: ['cadeau-flowers-and-chocolate-box', 'rosamund-blush-pink-rose-bouquet', 'nacre-pearl-white-rose-bouquet'] },
  '/guides/congratulations-flowers-dubai': { hero: 'amber-sunflower-and-golden-rose-bouquet', products: ['amber-sunflower-and-golden-rose-bouquet', 'aveline-red-pink-and-white-rose-bouquet', 'beau-red-roses-in-glass-with-plush-bear'] },
  '/journal/birthday-card-messages': { hero: 'eloise-pink-and-white-rose-bouquet', products: ['eloise-pink-and-white-rose-bouquet', 'rosamund-blush-pink-rose-bouquet', 'paloma-mixed-rose-and-gypsophila-bouquet'] },
  '/journal/what-flowers-say-sorry': { hero: 'nacre-pearl-white-rose-bouquet', products: ['nacre-pearl-white-rose-bouquet', 'eloise-pink-and-white-rose-bouquet', 'aveline-red-pink-and-white-rose-bouquet'] },
  '/journal/how-to-choose-a-flower-delivery-in-dubai': { hero: 'eloise-pink-and-white-rose-bouquet', products: ['eloise-pink-and-white-rose-bouquet', 'rosamund-blush-pink-rose-bouquet', 'amber-sunflower-and-golden-rose-bouquet'] },
  '/journal/send-flowers-to-dubai-from-abroad': { hero: 'aimee-red-rose-bouquet', products: ['aimee-red-rose-bouquet', 'eloise-pink-and-white-rose-bouquet', 'aveline-red-pink-and-white-rose-bouquet'] },
};

/** Catalogue photo path for a handle (the 960px webp used by product pages). */
export const guideHeroImage = (path: string) => {
  const visual = GUIDE_VISUALS[path];
  return visual ? `/collection/${visual.hero}-960.webp` : undefined;
};
