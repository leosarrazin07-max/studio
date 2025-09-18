
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/constants';

const I18nMiddleware = createI18nMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  // By not providing a `localeDetection` function, next-international
  // will automatically use its default strategy which includes cookie persistence.
  // This ensures the last selected language is remembered.
  urlMappingStrategy: 'rewrite',
});

export function middleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|firebase-messaging-sw.js|icon.svg|apple-icon.svg|manifest.json).*)'],
};
