
import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/constants';

const I18nMiddleware = createI18nMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  urlMappingStrategy: 'rewrite',
  resolveLocaleFromRequest: (request) => {
    // Check for locale in cookie first
    if (request.cookies.has('prepy-locale')) {
      const cookieLocale = request.cookies.get('prepy-locale')?.value;
      if (locales.includes(cookieLocale as any)) {
        return cookieLocale;
      }
    }
    // Fallback to default behavior (accept-language header)
    return undefined;
  }
});

export function middleware(request: NextRequest) {
  const response = I18nMiddleware(request);

  // Persist chosen locale in cookie
  const currentLocale = response.headers.get('x-next-intl-locale') || defaultLocale;
  response.cookies.set('prepy-locale', currentLocale);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|firebase-messaging-sw.js|icon.svg|apple-icon.svg).*)'],
};
