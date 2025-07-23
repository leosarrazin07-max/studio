
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    "name": "PrEPy",
    "short_name": "PrEPy",
    "description": "Your PrEP medication companion",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#F5F5F5",
    "theme_color": "#039BE5",
    "icons": [
      {
        "src": "/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ],
    "badge": {
        "url": "/badge.svg",
        "type": "image/svg+xml"
    }
  });
}
