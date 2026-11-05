import { Logo } from './SiteHeader';

/** Maison wordmark beside the partner's logo, for pages made in collaboration with Conscious Curations. */
export default function CoBrand() {
  return (
    <p className="cobrand" aria-label="Maison Botanique × Conscious Curations">
      <Logo />
      <span className="cobrand__x" aria-hidden="true">×</span>
      <img src="/hamper/cc-logo.png" alt="" width="160" height="79" />
    </p>
  );
}
