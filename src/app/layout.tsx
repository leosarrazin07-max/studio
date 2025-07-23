
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:9002'),
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
  icons: [
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/icon-16x16.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/icon-32x32.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180', url: '/apple-icon.png' },
    // Icons for manifest
    { rel: 'icon', type: 'image/png', sizes: '192x192', url: '/icon-192x192.png' },
    { rel: 'icon', type: 'image/png', sizes: '512x512', url: '/icon-512x512.png' },
  ],
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
