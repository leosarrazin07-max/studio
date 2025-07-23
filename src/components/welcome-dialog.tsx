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
import { BellRing, Pill } from 'lucide-react';

interface WelcomeDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export function WelcomeDialog({ isOpen, onConfirm }: WelcomeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onConfirm()}>
      <DialogContent className="sm:max-w-md border-primary border-2" hideCloseButton={true}>
        <DialogHeader className="items-center text-center">
            <BellRing className="text-primary h-12 w-12 mb-4" />
          <DialogTitle className="text-xl">Activez les notifications</DialogTitle>
          <DialogDescription className="pt-4 text-base text-foreground">
            Pour votre sécurité, il est fortement recommandé d'activer les notifications. Cela permettra à PrEPy de vous envoyer des rappels pour vos prises de comprimés.
            <br/><br/>
            <span className="text-destructive font-medium">Manquer un rappel peut compromettre votre protection.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button onClick={onConfirm} className="w-full">J'ai compris</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
