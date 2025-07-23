
"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BellRing, Trash2, AlertTriangle, BellOff } from "lucide-react";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClearHistory: () => void;
  pushEnabled: boolean;
  onTogglePush: () => void;
}

const VAPID_KEY_CONFIGURED = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function SettingsSheet({
  isOpen,
  onOpenChange,
  onClearHistory,
  pushEnabled,
  onTogglePush
}: SettingsSheetProps) {

  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    if (isOpen && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);
  
  useEffect(() => {
    // If permission is already granted, but push is not enabled in state,
    // it likely means the user has a subscription but the app state is out of sync.
    // Let's try to enable it. This can happen on first load.
    if (notificationPermission === 'granted' && !pushEnabled) {
       // We don't call onTogglePush directly to avoid an unsubscribe loop
       // in case there's no active subscription. The main hook will sync the state.
    }
  }, [notificationPermission, pushEnabled, onTogglePush]);

  const handleClearHistory = () => {
    onClearHistory();
    onOpenChange(false);
  }

  const isSwitchDisabled = !VAPID_KEY_CONFIGURED || notificationPermission === 'denied';

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Paramètres</SheetTitle>
          <SheetDescription>
            Gérez vos préférences de notification et vos données personnelles.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-8">
          <div className="flex flex-col gap-3 p-4 rounded-lg border">
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notifications-switch" className={`flex flex-col space-y-1 ${isSwitchDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <span className="font-medium flex items-center gap-2">
                    <BellRing className="h-4 w-4" />
                    Notifications Push
                  </span>
                  <span className="text-xs font-normal leading-snug text-muted-foreground">
                    Recevez des rappels pour vos prises.
                  </span>
                </Label>
                <Switch
                  id="notifications-switch"
                  checked={pushEnabled}
                  onCheckedChange={onTogglePush}
                  disabled={isSwitchDisabled}
                />
            </div>
             {!VAPID_KEY_CONFIGURED && (
                <div className="flex items-center gap-2 text-xs text-destructive pt-2 border-t border-destructive/20 mt-2">
                    <AlertTriangle size={14}/>
                    <p>Fonctionnalité non disponible : configuration serveur manquante.</p>
                </div>
            )}
            {notificationPermission === 'denied' && (
                <div className="flex items-center gap-2 text-xs text-destructive pt-2 border-t border-destructive/20 mt-2">
                    <BellOff size={14}/>
                    <p>Les notifications sont bloquées dans les paramètres de votre navigateur.</p>
                </div>
            )}
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
