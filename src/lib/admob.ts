
import { AdMob, AdOptions, BannerAdOptions, BannerAdSize, BannerAdPosition, AppOpenAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// Use production ad units.
const AD_UNITS = {
  BANNER_TOP: 'ca-app-pub-9344137111723261/4902584995',
  BANNER_BOTTOM: 'ca-app-pub-9344137111723261/2276421652',
  APP_OPEN: 'ca-app-pub-9344137111723261/9915184623',
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
    isTesting: false,
  };
  try {
    await AdMob.prepareAppOpenAd(options);
    await AdMob.showAppOpenAd();
  } catch (error) {
    console.error("Error showing App Open ad:", error);
  }
};

export const showBannerAd = async (adId: string, isTop: boolean): Promise<void> => {
    if (!isNative) return;
    const options: BannerAdOptions = {
        adId: adId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: isTop ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
        margin: isTop ? 64 : 0, // Margin from top or bottom
        isTesting: false,
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

export { AD_UNITS };
