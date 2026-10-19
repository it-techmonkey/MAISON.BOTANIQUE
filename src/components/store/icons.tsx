// Line icons and the brand leaf mark (from maison_botanique_brand_kit/logos).

export function LeafMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="8 0 92 96" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 92 C42 70 56 47 76 15" />
      <path d="M39 73 C22 72 14 62 12 49 C28 49 39 57 39 73Z" fill="currentColor" fillOpacity=".24" />
      <path d="M51 57 C68 57 80 48 84 34 C67 34 56 42 51 57Z" fill="currentColor" fillOpacity=".24" />
      <path d="M61 40 C45 39 37 29 36 17 C51 18 60 27 61 40Z" fill="currentColor" fillOpacity=".24" />
      <path d="M71 24 C83 23 92 15 95 5 C83 6 75 13 71 24Z" fill="currentColor" fillOpacity=".24" />
    </svg>
  );
}

export function ArrowIcon() {
  return <svg className="mb-icon mb-icon--arrow" viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M3 12h18m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function CloseIcon() {
  return <svg className="mb-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export function SearchIcon() {
  return <svg className="mb-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none"><circle cx="10.8" cy="10.8" r="6.6" stroke="currentColor" strokeWidth="1.5" /><path d="m15.8 15.8 4.4 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

export function PlusIcon() {
  return <svg className="mb-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
