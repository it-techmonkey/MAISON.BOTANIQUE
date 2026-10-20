import { formatMoney } from '@/lib/format';
import Dirham from './Dirham';

/**
 * A price with the Dirham sign instead of the letters "AED". Other currencies keep the text format.
 * Symbol first in English; number first in Arabic, so it reads naturally right to left.
 */
export default function Money({ amount, currency = 'AED', ar, whole = false }: { amount: number; currency?: string; ar: boolean; whole?: boolean }) {
  if (!Number.isFinite(amount)) return null;
  if (currency && currency !== 'AED') return <>{formatMoney(amount, currency, ar)}</>;
  const digits = whole ? 0 : Number.isInteger(amount) ? 0 : 2;
  const number = new Intl.NumberFormat(ar ? 'ar-AE' : 'en-AE', { minimumFractionDigits: digits, maximumFractionDigits: whole ? 0 : 2 }).format(amount);
  return ar
    ? <span className="money money--after"><span className="money__n">{number}</span><Dirham ar /></span>
    : <span className="money"><Dirham /><span className="money__n">{number}</span></span>;
}
