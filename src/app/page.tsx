
import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/constants';

// This is a temporary workaround for the root page not redirecting to the default locale.
// This page will redirect the user to the default locale's home page.
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
