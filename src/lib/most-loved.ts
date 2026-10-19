import data from '@/data/most-loved.json';

const IDS = new Set<string>(data.ids);

/** True for the most-ordered pieces, which carry a Most loved tag. */
export const isMostLoved = (productId: string) => IDS.has(productId);
