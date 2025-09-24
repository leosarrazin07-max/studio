"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Bell, BellOff, Loader2, AlertTriangle, Languages, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useScopedI18n, useChangeLocale, useCurrentLocale } from '@/locales/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {locales} from '@/lib/constants';
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { Capacitor } from "@capacitor/core";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClearHistory: () => void;
  pushEnabled: boolean;
  isPushLoading: boolean;
  pushPermissionStatus: PermissionState | undefined;
  requestNotificationPermission: () => void;
  unsubscribeFromNotifications: () => void;
}

export function SettingsSheet({
  isOpen,
  onOpenChange,
  onClearHistory,
  pushEnabled,
  isPushLoading,
  pushPermissionStatus,
  requestNotificationPermission,
  unsubscribeFromNotifications
}: SettingsSheetProps) {
  const t = useScopedI18n('settings');
  const changeLocale = useChangeLocale();
  const currentLocale = useCurrentLocale();
  const { theme, setTheme } = useTheme();

  const handleClearHistory = () => {
    onClearHistory();
    onOpenChange(false);
  }

  const handleNotificationsToggle = () => {
    if (pushEnabled) {
      unsubscribeFromNotifications();
    } else {
      requestNotificationPermission();
    }
  };
  
  const handleLocaleChange = (locale: (typeof locales)[number]) => {
    changeLocale(locale);
  };

  const isNative = Capacitor.isNativePlatform();

  const renderNotificationHelpText = () => {
    if (!isNative) return null;

    if (pushPermissionStatus === 'denied') {
      return (
        <p className="text-sm text-destructive/90">
          {t('notifications.denied')}
        </p>
      )
    }
    if (!pushEnabled && pushPermissionStatus === 'granted') {
        return (
            <p className="text-sm text-amber-600">
                <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                {t('notifications.disabledWarning')}
            </p>
        )
    }
    return (
        <p className="text-sm text-muted-foreground">
            {t('notifications.description')}
        </p>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>
            {t('description')}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mr-6 pr-6">
            <div className="grid gap-6 py-8">
              {isNative && (
                <div className="flex flex-col gap-3 p-4 rounded-lg border">
                    <h3 className="font-semibold text-lg">{t('notifications.title')}</h3>
                    <div className="flex items-center space-x-2">
                        <Switch
                        id="notifications-switch"
                        checked={pushEnabled}
                        onCheckedChange={handleNotificationsToggle}
                        disabled={isPushLoading || pushPermissionStatus === 'denied'}
                        aria-readonly
                        />
                        <Label htmlFor="notifications-switch" className="flex items-center">
                        {isPushLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (pushEnabled ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />)}
                        {isPushLoading ? t('notifications.loading') : (pushEnabled ? t('notifications.enabled') : t('notifications.disabled'))}
                        </Label>
                    </div>
                    {renderNotificationHelpText()}
                </div>
              )}
              <div className="flex flex-col gap-3 p-4 rounded-lg border">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Languages />
                      {t('language.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t('language.description')}</p>
                  <Select onValueChange={(value) => handleLocaleChange(value as any)} defaultValue={currentLocale}>
                      <SelectTrigger>
                      <SelectValue placeholder={t('language.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="uk">Українська</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="da">Dansk</SelectItem>
                        <SelectItem value="sv">Svenska</SelectItem>
                        <SelectItem value="nl">Nederlands</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="sr">Srpski</SelectItem>
                        <SelectItem value="ro">Română</SelectItem>
                        <SelectItem value="pl">Polski</SelectItem>
                        <SelectItem value="bg">Български</SelectItem>
                        <SelectItem value="hu">Magyar</SelectItem>
                        <SelectItem value="cs">Čeština</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="flex flex-col gap-3 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  {t('theme.title')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('theme.description')}</p>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="theme-switch"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                  <Moon className="h-5 w-5" />
                </div>
              </div>
            </div>
        </ScrollArea>
        <SheetFooter className="mt-auto">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('clearHistory.button')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('clearHistory.dialog.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('clearHistory.dialog.description')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                      {t('clearHistory.dialog.confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
