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
import { Trash2, BellOff } from "lucide-react";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClearHistory: () => void;
}

export function SettingsSheet({
  isOpen,
  onOpenChange,
  onClearHistory,
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
            Gérez vos données personnelles.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-8">
          <div className="flex flex-col gap-3 p-4 rounded-lg border">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <BellOff className="h-5 w-5 mt-0.5 shrink-0"/>
                  <p>Si vous avez refusé les notifications et souhaitez les réactiver, vous devez vider le cache et les données de ce site dans les paramètres de votre navigateur, puis recharger l'application.</p>
              </div>
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
