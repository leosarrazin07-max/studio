
"use client";

import { useEffect } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Use test ad units for development
const AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

interface AdBannerProps {
  position: 'top' | 'bottom';
  marginTop?: number;
}

export const AdBanner = ({ position, marginTop = 0 }: AdBannerProps) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const showBanner = async () => {
      try {
        await AdMob.showBanner({
          adId: AD_UNIT_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
          margin: marginTop,
          isTesting: process.env.NODE_ENV !== 'production',
        });
      } catch (e) {
        console.error('Error showing banner', e);
      }
    };

    showBanner();

    return () => {
      // Hide banner when component unmounts to avoid overlap
      AdMob.hideBanner().catch(e => console.error("Error hiding banner on unmount", e));
      AdMob.removeBanner().catch(e => console.error("Error removing banner on unmount", e));
    };
  }, [position, marginTop]);

  // This component doesn't render anything in the DOM itself,
  // it just commands the native AdMob plugin.
  // We can render a placeholder for web view.
  if (!Capacitor.isNativePlatform()) {
    return (
        <div 
            className="w-full h-[50px] bg-gray-200 flex items-center justify-center text-sm text-gray-500"
        >
            Ad Banner Placeholder
        </div>
    )
  }

  return null;
};
