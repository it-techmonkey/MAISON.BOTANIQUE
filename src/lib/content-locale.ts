import type { Locale } from './types';

/** Only the new editorial routes have translated URLs; the existing shop keeps its saved preference. */
export function contentLocale(pathname: string): Locale | null {
  const path = pathname.replace(/^\/ar(?=\/)/, '');
  if (!/^\/(?:occasions\/(?:birthday|love)|journal(?:\/[a-z0-9-]+)?)$/.test(path)) return null;
  return pathname.startsWith('/ar/') ? 'ar' : 'en';
}

export function translatedContentPath(pathname: string, locale: Locale): string | null {
  if (!contentLocale(pathname)) return null;
  const path = pathname.replace(/^\/ar(?=\/)/, '');
  return locale === 'ar' ? `/ar${path}` : path;
}

export const contentHref = (path: string, locale: Locale) => translatedContentPath(path, locale) ?? path;
