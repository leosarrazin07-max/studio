
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
import { Pill, ShieldCheck, Clock, CheckCircle2, ShieldOff, Info, PowerOff, ShieldX } from 'lucide-react';
import type { UsePrepStateReturn, PrepCalculatorResult } from '@/lib/types';
import { LogDoseDialog } from './log-dose-dialog';
import { DoseHistory } from './dose-history';

type PrepDashboardProps = Pick<UsePrepStateReturn, 'prises' | 'addDose' | 'endSession' | 'sessionActive' | 'startSession'> & PrepCalculatorResult;

export function PrepDashboard({
  prises,
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
}: PrepDashboardProps) {
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
      case 'lapsed':
        return <ShieldX className="h-16 w-16 text-white" />;
      default:
        return <Pill className="h-16 w-16 text-white" />;
    }
  };

  const StatusDetails = () => {
    return (
      <div className="text-center h-12 mt-2 flex flex-col justify-center">
        {status === 'loading' && <p className="text-white/80">{protectionStartsIn}</p>}
        {status === 'effective' && <p className="text-sm text-white/90 font-medium">{nextDoseIn}</p>}
        {(status === 'missed' || status === 'lapsed') && <p className="text-white/90 font-medium">Si vous avez eu des rapports à risque hors de la période de protection, veuillez vous faire tester.</p>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className={`flex flex-col items-center justify-center p-6 transition-colors duration-500 text-center ${statusColor}`}>
            <div className="mb-4">
              <StatusIcon />
            </div>
            <div className="min-h-[6rem] flex flex-col justify-center">
              <h2 className="text-xl md:text-2xl font-bold text-white font-headline">{statusText}</h2>
              <StatusDetails />
            </div>
          </div>
          
           {protectionEndsAtText && (
             <div className="bg-card border-t p-4 text-center">
                <p className="text-sm text-muted-foreground font-medium">{protectionEndsAtText}</p>
             </div>
           )}

            <div className="p-6 bg-card border-t">
               { sessionActive ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                        size="lg"
                        className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
                        onClick={() => setIsLogDoseOpen(true)}
                        disabled={status === 'lapsed'}
                    >
                        <CheckCircle2 className="mr-2 h-5 w-5" /> J'ai pris ma prise
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button size="lg" variant="destructive" className="shadow-md">
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
                       Pour arrêter la PrEP, continuez de prendre 1 comprimé par jour pendant les 2 jours qui suivent votre dernier rapport.
                    </p>
                </div>
            </div>
        </div>
      )}


      <DoseHistory prises={prises} />

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
