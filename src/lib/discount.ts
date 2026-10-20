const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Whole-number saving against the struck-through price; 0 when there is none. */
export function discountPercent(price: number, compareAtPrice: number | null | undefined) {
  if (!compareAtPrice || !(compareAtPrice > price) || !(price > 0)) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}

/** A percentage as the shopper reads it: "10%" or "١٠٪". */
export function percentLabel(percent: number, arabic: boolean) {
  return arabic ? `${String(percent).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)])}٪` : `${percent}%`;
}
