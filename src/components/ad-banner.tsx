
"use client";

import { useEffect } from 'react';

interface AdBannerProps {
  adId: string;
  position: 'top' | 'bottom';
}

export const AdBanner = ({ adId, position }: AdBannerProps) => {
  useEffect(() => {
    // AdMob logic removed
  }, [adId, position]);

  // This component doesn't render anything in the DOM itself,
  // it just commanded the native AdMob plugin.
  // We can render a placeholder for web view.
  return (
      <div 
          className="w-full h-[50px] bg-gray-200 flex items-center justify-center text-sm text-gray-500"
      >
          Ad Banner Placeholder ({position}) - Removed
      </div>
  )
};
