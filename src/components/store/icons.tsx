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

// Thin line icons for the trust rows and the residences page.
const line = { viewBox: '0 0 32 32', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export function TruckIcon() {
  return <svg className="mb-line-icon" {...line}><path d="M3 9h16v13H3zM19 13h5l4 4v5h-9" /><circle cx="9" cy="23.5" r="2.4" /><circle cx="23" cy="23.5" r="2.4" /></svg>;
}

export function GiftIcon() {
  return <svg className="mb-line-icon" {...line}><rect x="4" y="12" width="24" height="16" rx="1" /><path d="M3 8h26v4H3zM16 8v20M16 8c-3-5-9-4-8 0M16 8c3-5 9-4 8 0" /></svg>;
}

export function FlowerIcon() {
  return <svg className="mb-line-icon" {...line}><circle cx="16" cy="12" r="2.6" /><path d="M16 9.4c-2-5 3-7 3-3.4M18.6 12c5-2 7 3 3.4 3M16 14.6c2 5-3 7-3 3.4M13.4 12c-5 2-7-3-3.4-3M16 20v9M16 25c-3-1-5-3-5-5 3 0 5 2 5 5ZM16 27c3-1 5-3 5-5-3 0-5 2-5 5Z" /></svg>;
}

export function HeartIcon() {
  return <svg className="mb-line-icon" {...line}><path d="M16 27C6 20 4 14 4 10.5 4 7 6.6 5 9.5 5 12.3 5 14.7 6.6 16 9c1.3-2.4 3.7-4 6.5-4 2.9 0 5.5 2 5.5 5.5C28 14 26 20 16 27Z" /></svg>;
}

export function ClockIcon() {
  return <svg className="mb-line-icon" {...line}><circle cx="16" cy="16" r="12" /><path d="M16 8v8l5 3" /></svg>;
}

export function HomeIcon() {
  return <svg className="mb-line-icon" {...line}><path d="M4 15 16 5l12 10M7 13v14h18V13M13 27v-8h6v8" /></svg>;
}

export function BuildingIcon() {
  return <svg className="mb-line-icon" {...line}><path d="M7 28V5h14v23M21 12h4v16M4 28h24M11 10h2M15 10h2M11 15h2M15 15h2M11 20h2M15 20h2" /></svg>;
}

export function InstagramIcon() {
  return <svg className="mb-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" stroke="none" /></svg>;
}
