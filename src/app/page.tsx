
"use client";

import { useState } from "react";
import { usePrepState } from "@/hooks/use-prep-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { LogDoseDialog } from "@/components/log-dose-dialog";
import { PrepDashboard } from "@/components/prep-dashboard";
import { Pill, Menu, BellOff } from 'lucide-react';
import { SettingsSheet } from "@/components/settings-sheet";

export default function Home() {
  const prepState = usePrepState();
  const [isLogDoseOpen, setIsLogDoseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { sessionActive, startSession, clearHistory, pushEnabled, addDose, status, togglePushNotifications, permissionStatus, requestNotificationPermission } = prepState;

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
        <div className="relative mb-8">
            <Pill className="text-primary" size={80} strokeWidth={1.5}/>
        </div>
      <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline mb-4">
        Bienvenue sur PrEPy
      </h1>
      <p className="max-w-md text-muted-foreground mb-8">
        Votre compagnon intelligent pour la PrEP à la demande. Suivez vos prises, restez protégé et gérez vos sessions en toute confiance.
      </p>
      <Button
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg shadow-lg"
        onClick={() => setIsLogDoseOpen(true)}
      >
        Démarrer une session PrEP
      </Button>
    </div>
  );

  const renderMainContent = () => (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="text-primary" />
            <span className="font-bold text-lg font-headline">PrEPy</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Menu />
          </Button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="container mx-auto w-full max-w-md flex-1 py-8">
          {sessionActive ? <PrepDashboard {...prepState} /> : <WelcomeScreen />}
        </div>
      </main>
       <LogDoseDialog
          isOpen={isLogDoseOpen}
          onOpenChange={setIsLogDoseOpen}
          onLogDose={addDose}
          onStartSession={startSession}
          status={status}
        />
      <SettingsSheet
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onClearHistory={clearHistory}
        pushEnabled={pushEnabled}
        onTogglePush={togglePushNotifications}
      />
    </div>
  );

  const PermissionDialog = () => (
    <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton={true}>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                     <Pill className="text-primary" />
                     Message de PrEPy
                </DialogTitle>
                <DialogDescription>
                    Pour assurer votre protection, PrEPy a besoin de vous envoyer des rappels. Veuillez autoriser les notifications.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground">
                <p>
                    Cette autorisation est nécessaire pour le bon fonctionnement de l'application. Vous pourrez gérer vos préférences de notification à tout moment dans les paramètres.
                </p>
                {permissionStatus === 'denied' && (
                    <p className="text-destructive font-medium mt-2">
                       Les notifications sont bloquées. Vous devez les autoriser manuellement dans les paramètres de votre navigateur pour continuer.
                    </p>
                )}
            </div>
            <DialogFooter>
                <Button onClick={() => requestNotificationPermission()} disabled={permissionStatus === 'denied'}>
                    Activer les notifications
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );

  if (permissionStatus === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Chargement de PrEPy...</div>;
  }
  
  if (permissionStatus !== 'granted') {
    return (
      <>
        {renderMainContent()}
        <PermissionDialog />
      </>
    );
  }

  return renderMainContent();
}
