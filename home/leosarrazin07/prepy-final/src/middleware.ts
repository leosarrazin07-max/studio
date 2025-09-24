
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/constants';

const I18nMiddleware = createI18nMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  // This custom detection function implements the desired logic:
  // 1. We return 'undefined' to let the default detection strategy run.
  // 2. The default strategy in next-international prioritizes the 'next-locale' cookie.
  // 3. If the cookie is not found (first visit), it falls back to the 'Accept-Language' header.
  // This achieves the goal of detecting browser language on first visit and respecting
  // the user's choice on subsequent visits.
  localeDetection: () => undefined,
  urlMappingStrategy: 'rewrite',
});

export function middleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|firebase-messaging-sw.js|icon.svg|apple-icon.svg|manifest.json).*)'],
};
