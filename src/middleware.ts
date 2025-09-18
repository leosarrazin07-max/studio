
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/constants';

const I18nMiddleware = createI18nMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  // Laisser next-international gérer la détection de la langue (via cookie, header, etc.)
  // en ne fournissant pas de fonction de détection personnalisée.
  // Cela activera automatiquement la persistance via le cookie `next-locale`.
  localeDetection: undefined, 
  urlMappingStrategy: 'rewrite',
});

export function middleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|firebase-messaging-sw.js|icon.svg|apple-icon.svg|manifest.json).*)'],
};
