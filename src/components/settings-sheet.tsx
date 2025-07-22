
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
import { BellRing, Trash2 } from "lucide-react";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClearHistory: () => void;
  pushEnabled: boolean;
  onTogglePush: (enabled: boolean) => void;
}

export function SettingsSheet({
  isOpen,
  onOpenChange,
  onClearHistory,
  pushEnabled,
  onTogglePush
}: SettingsSheetProps) {

  const handleClearHistory = () => {
    onClearHistory();
    onOpenChange(false);
  }

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
          <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
            <Label htmlFor="notifications-switch" className="flex flex-col space-y-1 cursor-pointer">
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
            />
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
                      votre historique de doses seront définitivement supprimés.
                    </d'AlertDialogDescription>
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

    