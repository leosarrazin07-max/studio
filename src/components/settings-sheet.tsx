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
import { Trash2, Bell, BellOff, Loader2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClearHistory: () => void;
  pushEnabled: boolean;
  isPushLoading: boolean;
  pushPermissionStatus: NotificationPermission | undefined;
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

  const renderNotificationHelpText = () => {
    if (pushPermissionStatus === 'denied') {
      return (
        <p className="text-sm text-destructive/90">
          Vous avez bloqué les notifications. Pour les réactiver, vous devez autoriser les notifications pour ce site dans les paramètres de votre navigateur, puis recharger la page.
        </p>
      )
    }
    if (!pushEnabled && pushPermissionStatus === 'granted') {
        return (
            <p className="text-sm text-amber-600">
                <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                Les rappels de prise sont désactivés. Vous ne recevrez aucune notification, ce qui peut entraîner des oublis.
            </p>
        )
    }
    return (
        <p className="text-sm text-muted-foreground">
            Recevez un rappel pour chaque prise afin de garantir votre protection.
        </p>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Paramètres</SheetTitle>
          <SheetDescription>
            Gérez vos données et préférences.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-8">
           <div className="flex flex-col gap-3 p-4 rounded-lg border">
              <h3 className="font-semibold text-lg">Notifications</h3>
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
                  {isPushLoading ? 'Chargement...' : (pushEnabled ? 'Notifications activées' : 'Notifications désactivées')}
                </Label>
              </div>
              {renderNotificationHelpText()}
          </div>
        </div>
        <SheetFooter className="absolute bottom-4 right-4 left-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer mon historique
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes vos données de session et
                      votre historique de comprimés seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                      Oui, supprimer mes données
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
