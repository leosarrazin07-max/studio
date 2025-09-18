
import { createI18nServer } from 'next-international/server';
 
export const { getI18n, getScopedI18n, getStaticParams, getCurrentLocale } = createI18nServer({
  fr: () => import('./fr'),
  en: () => import('./en'),
  de: () => import('./de'),
  it: () => import('./it'),
  es: () => import('./es'),
  ru: () => import('./ru'),
  uk: () => import('./uk'),
  ar: () => import('./ar'),
  tr: () => import('./tr'),
  da: () => import('./da'),
  sv: () => import('./sv'),
  nl: () => import('./nl'),
  pt: () => import('./pt'),
  sr: () => import('./sr'),
  ro: () => import('./ro'),
  pl: () => import('./pl'),
  bg: () => import('./bg'),
  hu: () => import('./hu'),
  cs: () => import('./cs'),
});

    