
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/constants';

const I18nMiddleware = createI18nMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  // This custom detection function implements the desired logic:
  // 1. If a 'next-locale' cookie is present, let the middleware use it.
  // 2. If no cookie is found (first visit), it falls back to the default
  //    'Accept-Language' header detection.
  // We return 'undefined' to let next-international handle the logic.
  // Providing a function, even if it returns undefined, prevents
  // the issue of the header always overriding the cookie.
  localeDetection: (request) => {
    // The presence of the cookie indicates it's not the first visit.
    // Let the default strategy (which prefers cookies) handle it.
    if (request.cookies.has('next-locale')) {
      return undefined;
    }
    // For the first visit, let it detect from the browser's Accept-Language header.
    return undefined;
  },
  urlMappingStrategy: 'rewrite',
});

export function middleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|firebase-messaging-sw.js|icon.svg|apple-icon.svg|manifest.json).*)'],
};
