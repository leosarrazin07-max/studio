import { I18nProviderClient } from '@/locales/client';
import { ReactNode } from 'react';
import { locales, defaultLocale } from '@/lib/constants';
import { headers } from 'next/headers';

interface LocaleLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  // Try to get locale from cookie if available
  const headersList = headers();
  const cookie = headersList.get('cookie');
  const savedLocale = cookie
    ?.split(';')
    .find(c => c.trim().startsWith('prepy-locale='))
    ?.split('=')[1];

  const effectiveLocale = locales.includes(savedLocale as any) ? savedLocale : locale;

  return (
    <I18nProviderClient locale={effectiveLocale || defaultLocale}>
      {children}
    </I18nProviderClient>
  );
}
