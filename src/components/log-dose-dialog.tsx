
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from '@/components/date-time-picker';
import { Clock, Calendar, Pill, RefreshCw } from 'lucide-react';
import type { PrepStatus } from '@/lib/types';

interface LogDoseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogDose: (prise: { time: Date; pills: number }) => void;
  onStartSession: (time: Date) => void;
  status: PrepStatus;
}

export function LogDoseDialog({
  isOpen,
  onOpenChange,
  onLogDose,
  onStartSession,
  status,
}: LogDoseDialogProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pickerPillCount, setPickerPillCount] = useState(1);

  const isInitialDose = status === 'inactive';
  const isMissedDose = status === 'missed';

  let title = 'Enregistrer votre prise';
  let description = "Confirmez quand vous avez pris votre comprimé.";
  if (isInitialDose) {
    title = 'Démarrer votre session';
    description = 'Vous commencerez avec 2 comprimés. Confirmez quand vous avez fait votre prise initiale.';
  } else if (isMissedDose) {
    title = 'Comprimé manqué';
    description = "Il semble que vous ayez manqué une prise. Choisissez une option pour mettre à jour votre statut.";
  }

  const handleLog = (time: Date, pills: number) => {
    if (pills === 2) {
        onStartSession(time);
    } else {
        onLogDose({ time, pills });
    }
    onOpenChange(false);
    setShowTimePicker(false);
  };

  const handleNow = (pills: number) => {
    handleLog(new Date(), pills);
  };

  const handleEarlier = (pills: number) => {
    setPickerPillCount(pills);
    setShowTimePicker(true);
  };

  const handleRestartNow = () => {
    onStartSession(new Date());
    onOpenChange(false);
    setShowTimePicker(false);
  }
  
  const handlePickerConfirm = () => {
    handleLog(selectedDate, pickerPillCount);
  }

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
        setShowTimePicker(false);
        setSelectedDate(new Date());
    }, 300);
  }

  const renderContent = () => {
    if (showTimePicker) {
      return (
        <div className="py-4 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Sélectionnez la date et l'heure de la prise de {pickerPillCount} comprimé(s).</p>
          <DateTimePicker date={selectedDate} setDate={setSelectedDate} />
          <DialogFooter>
             <Button onClick={handlePickerConfirm}>Confirmer l'heure</Button>
          </DialogFooter>
        </div>
      );
    }

    if (isMissedDose) {
        return (
            <div className="flex flex-col gap-3 pt-4">
                <Button variant="outline" onClick={() => handleEarlier(1)}>
                    <Calendar className="mr-2 h-4 w-4" /> J'ai pris 1 comprimé plus tôt
                </Button>
                <Button variant="destructive" onClick={handleRestartNow}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Recommencer avec 2 comprimés
                </Button>
            </div>
        );
    }

    const pills = isInitialDose ? 2 : 1;
    return (
      <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={() => handleEarlier(pills)}>
              <Calendar className="mr-2 h-4 w-4" /> J'ai pris {pills} comprimé(s) plus tôt
          </Button>
          <Button onClick={() => handleNow(pills)}>
              <Clock className="mr-2 h-4 w-4" /> J'ai pris {pills} comprimé(s) maintenant
          </Button>
      </DialogFooter>
    );
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
