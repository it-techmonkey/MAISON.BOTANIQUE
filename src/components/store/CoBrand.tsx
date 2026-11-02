import { Logo } from './SiteHeader';
import { T } from './StoreProvider';

/** Maison wordmark beside the partner's logo, for pages made in collaboration with Conscious Curations. */
export default function CoBrand() {
  return (
    <p className="cobrand">
      <Logo />
      <span className="cobrand__with"><T en="in collaboration with" ar="بالتعاون مع" /></span>
      <img src="/hamper/cc-logo.png" alt="Conscious Curations" width="160" height="79" />
    </p>
  );
}
