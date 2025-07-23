
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BellRing, Trash2, BellOff, Loader2 } from "lucide-react";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClearHistory: () => void;
  pushEnabled: boolean;
  onTogglePush: () => void;
  isPushLoading: boolean;
  notificationPermission: 'default' | 'granted' | 'denied';
}

export function SettingsSheet({
  isOpen,
  onOpenChange,
  onClearHistory,
  pushEnabled,
  onTogglePush,
  isPushLoading,
  notificationPermission
}: SettingsSheetProps) {

  const handleClearHistory = () => {
    onClearHistory();
    onOpenChange(false);
  }

  // The switch is disabled if permission is denied by the user in browser settings, or during an async operation.
  const isSwitchDisabled = notificationPermission === 'denied' || isPushLoading;

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
                    {isPushLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
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
                  aria-label="Toggle Push Notifications"
                />
            </div>
            {notificationPermission === 'denied' && (
                <div className="flex items-center gap-2 text-xs text-destructive pt-2 border-t border-destructive/20 mt-2">
                    <BellOff size={14}/>
                    <p>Notifications bloquées. Videz le cache et rechargez l'application pour autoriser de nouveau.</p>
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
