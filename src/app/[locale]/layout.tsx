// This file is no longer needed as the root layout has been moved to src/app/layout.tsx
// The new root layout at src/app/layout.tsx now handles all pages.

import { ReactNode } from 'react';

// This component is now just a pass-through.
export default function LocaleLayout({ children }: { children: ReactNode }) {
  return children;
}
