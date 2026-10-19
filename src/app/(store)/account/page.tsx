import type { Metadata } from 'next';
import AccountView from '@/components/store/AccountView';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Your account',
  description: 'Your Maison Botanique orders, details and addresses.',
  robots: { index: false, follow: false },
};

// The page shell is static; the signed-in content is loaded in the browser
// from /api/account/summary, which reads the encrypted session cookie.
export default function AccountPage() {
  return (
    <div className="section section--top">
      <AccountView />
    </div>
  );
}
