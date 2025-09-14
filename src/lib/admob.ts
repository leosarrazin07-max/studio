
import { AdMob, AdOptions, BannerAdOptions, BannerAdSize, BannerAdPosition, AppOpenAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// Use test ad units for development
const AD_UNITS = {
  // TODO: Replace with your real AdMob ad unit IDs for production
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  APP_OPEN: 'ca-app-pub-3940256099942544/3419835294',
};

export const initializeAdMob = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await AdMob.initialize({
        requestTrackingAuthorization: true,
    });
  } catch (error) {
    console.error("Error initializing AdMob:", error);
  }
};

export const showAppOpenAd = async (): Promise<void> => {
  if (!isNative) return;
  const options: AdOptions = {
    adId: AD_UNITS.APP_OPEN,
    isTesting: process.env.NODE_ENV !== 'production',
  };
  try {
    await AdMob.prepareAppOpenAd(options);
    await AdMob.showAppOpenAd();
  } catch (error) {
    console.error("Error showing App Open ad:", error);
  }
};


export const showBannerAd = async (isTop: boolean): Promise<void> => {
    if (!isNative) return;
    const options: BannerAdOptions = {
        adId: AD_UNITS.BANNER,
        adSize: BannerAdSize.BANNER,
        position: isTop ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
        margin: isTop ? 50 : 0, // Margin from top or bottom
        isTesting: process.env.NODE_ENV !== 'production',
    };
    try {
        await AdMob.showBanner(options);
    } catch (error) {
        console.error("Error showing banner ad:", error);
    }
};

export const hideBannerAd = async (): Promise<void> => {
    if (!isNative) return;
    try {
        await AdMob.hideBanner();
        await AdMob.removeBanner();
    } catch (error) {
        console.error("Error hiding banner ad:", error);
    }
};
