
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'PrEPy',
  description: 'Votre compagnon intelligent pour la PrEP à la demande.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PrEPy',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-v2-192x192.png',
    shortcut: '/icon-v2-192x192.png',
    apple: '/icon-v2-512x512.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#039BE5',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
