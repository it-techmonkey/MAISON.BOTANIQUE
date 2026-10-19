export function formatMoney(amount: number, currencyCode: string, arabic: boolean) {
  if (!Number.isFinite(amount)) return '';
  return new Intl.NumberFormat(arabic ? 'ar-AE' : 'en-AE', {
    style: 'currency',
    currency: currencyCode || 'AED',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Today's date in Dubai as YYYY-MM-DD. */
export function todayDubai() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function slugify(value: string) {
  return value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
