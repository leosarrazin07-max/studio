
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
import { BellRing } from 'lucide-react';
import { useScopedI18n } from '@/locales/client';

interface WelcomeDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export function WelcomeDialog({ isOpen, onConfirm }: WelcomeDialogProps) {
  const t = useScopedI18n('welcomeDialog');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onConfirm()}>
      <DialogContent className="sm:max-w-md border-primary border-2" hideCloseButton={true}>
        <DialogHeader className="items-center text-center">
            <BellRing className="text-primary h-12 w-12 mb-4" />
          <DialogTitle className="text-xl">{t('title')}</DialogTitle>
          <DialogDescription className="pt-4 text-base text-foreground">
            {t('description.part1')}
            <br/><br/>
            <span className="text-destructive font-medium">{t('description.part2')}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button onClick={onConfirm} className="w-full">{t('confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
