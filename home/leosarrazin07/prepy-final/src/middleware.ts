
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/constants';

const I18nMiddleware = createI18nMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  // By returning `undefined`, we disable the default locale detection based
  // on the `Accept-Language` header and rely solely on the `next-locale` cookie.
  // This ensures the user's last selected language is always remembered.
  localeDetection: () => undefined,
  urlMappingStrategy: 'rewrite',
});

export function middleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|firebase-messaging-sw.js|icon.svg|apple-icon.svg|manifest.json).*)'],
};
