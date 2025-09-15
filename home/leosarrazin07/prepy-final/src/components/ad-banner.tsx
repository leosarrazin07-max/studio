
"use client";

import { useEffect } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { showBannerAd, hideBannerAd } from '@/lib/admob';

interface AdBannerProps {
  adId: string;
  position: 'top' | 'bottom';
}

export const AdBanner = ({ adId, position }: AdBannerProps) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const isTop = position === 'top';
    showBannerAd(adId, isTop);

    return () => {
      // Hide banner when component unmounts to avoid overlap
      hideBannerAd().catch(e => console.error("Error hiding banner on unmount", e));
    };
  }, [adId, position]);

  // This component doesn't render anything in the DOM itself,
  // it just commands the native AdMob plugin.
  // We can render a placeholder for web view.
  if (!Capacitor.isNativePlatform()) {
    return (
        <div 
            className="w-full h-[50px] bg-gray-200 flex items-center justify-center text-sm text-gray-500"
        >
            Ad Banner Placeholder ({position})
        </div>
    )
  }

  return null;
};
