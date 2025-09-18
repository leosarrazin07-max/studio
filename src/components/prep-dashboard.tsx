
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
import type { UsePrepStateReturn } from '@/lib/types';
import { LogDoseDialog } from './log-dose-dialog';
import { DoseHistory } from './dose-history';
import { AdBanner } from './ad-banner';
import { Capacitor } from '@capacitor/core';
import { AD_UNITS } from '@/lib/admob';
import { useScopedI18n, useI18n } from '@/locales/client';

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
}: UsePrepStateReturn) {
  const [isLogDoseOpen, setIsLogDoseOpen] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const t = useI18n();

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
      <div className="text-center flex flex-col justify-center">
        {status === 'loading' && <p className="text-white/80">{protectionStartsIn}</p>}
        {status === 'effective' && <p className="text-sm text-white/90 font-medium">{nextDoseIn}</p>}
        {(status === 'missed' || status === 'lapsed') && <p className="text-sm text-white/90 font-medium">{t('status.riskWarning')}</p>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {isNative && <AdBanner adId={AD_UNITS.BANNER_TOP} position="top" />}
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className={`flex flex-col items-center justify-center p-6 transition-colors duration-500 text-center ${statusColor}`}>
            <div className="mb-4">
              <StatusIcon />
            </div>
            <div className="min-h-[8rem] flex flex-col justify-center items-center px-4">
              <h2 className="text-xl md:text-2xl font-bold text-white font-headline mb-2">{statusText}</h2>
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
                        className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md whitespace-nowrap overflow-hidden text-ellipsis"
                        onClick={() => setIsLogDoseOpen(true)}
                        disabled={status === 'lapsed'}
                    >
                        <CheckCircle2 className="mr-2 h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{t('dashboard.logDose')}</span>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button size="lg" variant="destructive" className="shadow-md">
                            {t('dashboard.endSession')}
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('dashboard.endSessionDialog.title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('dashboard.endSessionDialog.description')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={endSession} className="bg-destructive hover:bg-destructive/90">
                            {t('dashboard.endSessionDialog.confirm')}
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
                        <span>{t('dashboard.startSession')}</span>
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
                       {t('dashboard.stopPrepInfo')}
                    </p>
                </div>
            </div>
        </div>
      )}

      {isNative && <AdBanner adId={AD_UNITS.BANNER_BOTTOM} position="bottom" />}
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
