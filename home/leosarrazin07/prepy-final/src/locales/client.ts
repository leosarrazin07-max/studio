
'use client';

import { createI18nClient } from 'next-international/client';
import { locales, defaultLocale } from '@/lib/constants';

export const { useI18n, useScopedI18n, I18nProviderClient, useChangeLocale, useCurrentLocale } = createI18nClient({
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

    