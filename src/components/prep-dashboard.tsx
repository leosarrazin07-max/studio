
"use client";

import { useState } from 'react';
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
import { Card, CardContent } from "@/components/ui/card";
import { Pill, ShieldCheck, Clock, CheckCircle2, ShieldOff, Info, PowerOff } from 'lucide-react';
import type { UsePrepStateReturn } from '@/lib/types';
import { LogDoseDialog } from './log-dose-dialog';
import { DoseHistory } from './dose-history';

export function PrepDashboard({
  doses,
  status,
  statusColor,
  statusText,
  nextDoseIn,
  protectionStartsIn,
  protectionEndsAtText,
  addDose,
  endSession,
  sessionActive,
  startSession
}: UsePrepStateReturn) {
  const [isLogDoseOpen, setIsLogDoseOpen] = useState(false);

  const StatusIcon = () => {
    switch (status) {
      case 'effective':
        return <ShieldCheck className="h-16 w-16 text-white" />;
      case 'missed':
        return <ShieldOff className="h-16 w-16 text-white" />;
      case 'loading':
        return <Clock className="h-16 w-16 text-white" />;
      case 'inactive':
        return <PowerOff className="h-16 w-16 text-white" />;
      default:
        return <Pill className="h-16 w-16 text-white" />;
    }
  };

  const StatusDetails = () => {
    switch (status) {
      case 'loading':
        return <p className="text-white/80">{protectionStartsIn}</p>;
      case 'effective':
        return <p className="text-sm text-white/90 font-medium">{nextDoseIn}</p>;
      case 'missed':
        return <p className="text-white/90 font-medium">Prenez une dose dès que possible.</p>;
      case 'inactive':
         return <p className="text-sm text-white/90 font-medium">{protectionEndsAtText}</p>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className={`flex flex-col items-center justify-center p-8 transition-colors duration-500 text-center ${statusColor}`}>
            <div className="mb-4">
              <StatusIcon />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white font-headline">{statusText}</h2>
            <StatusDetails />
          </div>
          
            <div className="p-6 bg-card">
               { sessionActive ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                        size="lg"
                        className="bg-accent hover:bg-accent/90 text-accent-foreground w-full shadow-md"
                        onClick={() => setIsLogDoseOpen(true)}
                    >
                        <CheckCircle2 className="mr-2 h-5 w-5" /> J'ai pris ma dose
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button size="lg" variant="destructive" className="w-full shadow-md">
                            Terminer la session
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Terminer votre session PrEP?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Cela arrêtera les rappels de notification. Votre protection sera calculée en fonction de votre dernière prise.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={endSession} className="bg-destructive hover:bg-destructive/90">
                            Oui, Terminer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
               ) : (
                <div className="flex justify-center">
                    <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                        onClick={() => setIsLogDoseOpen(true)}
                    >
                        <Pill className="mr-2 h-5 w-5" />
                        <span>Démarrer une nouvelle session</span>
                    </Button>
                </div>
               )}
            </div>
        </CardContent>
      </Card>
      
      {sessionActive && (
        <div className="bg-blue-50 border-l-4 border-primary p-4 rounded-md">
            <div className="flex">
                <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-primary/90">
                        Rappel : Pour être protégé, continuez de prendre 1 comprimé par jour pendant les 2 jours qui suivent votre dernier rapport sexuel.
                    </p>
                </div>
            </div>
        </div>
      )}


      <DoseHistory doses={doses} />

      <LogDoseDialog
        isOpen={isLogDoseOpen}
        onOpenChange={setIsLogDoseOpen}
        onLogDose={addDose}
        onStartSession={startSession}
        status={status}
      />
    </div>
  );
}
