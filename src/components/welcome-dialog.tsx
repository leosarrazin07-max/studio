
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pill } from 'lucide-react';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary border-2" hideCloseButton={true}>
        <DialogHeader className="items-center text-center">
            <Pill className="text-primary h-12 w-12 mb-4" />
          <DialogTitle className="text-xl">Message de l'équipe PrEPy</DialogTitle>
          <DialogDescription className="pt-4 text-base text-foreground">
            Nous vous recommandons d'activer les notifications via l'onglet latéral pour que vous puissiez recevoir les rappels relatifs à vos prises de comprimé, <span className="text-destructive font-medium">auquel cas vous pourriez les oublier et manquer vos prises.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button onClick={onClose} className="w-full">J'ai compris</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
