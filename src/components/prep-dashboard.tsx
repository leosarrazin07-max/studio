
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
import { Pill, AlertTriangle, ShieldCheck, Clock, CheckCircle2, ShieldOff, Info } from 'lucide-react';
import type { UsePrepStateReturn } from '@/lib/types';
import { LogDoseDialog } from './log-dose-dialog';

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
      default:
        return <Pill className="h-16 w-16 text-white" />;
    }
  };

  const StatusDetails = () => {
    switch (status) {
      case 'loading':
        return <p className="text-white/80">{protectionStartsIn}</p>;
      case 'effective':
        return (
          <div className="text-center">
            <p className="text-white/90">{nextDoseIn}</p>
            {protectionEndsAtText && <p className="text-xs text-white/70 mt-1">{protectionEndsAtText}</p>}
          </div>
        );
      case 'missed':
        return (
          <div className="text-center">
            <p className="text-white/90 font-medium">Prenez une dose dès que possible.</p>
             {protectionEndsAtText && <p className="text-xs text-white/70 mt-1">{protectionEndsAtText}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className={`flex flex-col items-center justify-center p-8 transition-colors duration-500 ${statusColor}`}>
            <div className="mb-4">
              <StatusIcon />
            </div>
            <h2 className="text-3xl font-bold text-white font-headline">{statusText}</h2>
            <StatusDetails />
          </div>
          { sessionActive && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-card">
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
                      Cela arrêtera les rappels de notification. Votre protection finale sera calculée en fonction de votre dernière prise.
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
          )}
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Pour une protection continue, n'oubliez pas de prendre un comprimé chaque jour pendant les deux jours suivant votre dernier rapport sexuel.
            </p>
          </div>
        </div>
      </div>

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
