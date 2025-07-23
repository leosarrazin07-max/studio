
"use client";

import { useState, useEffect } from "react";
import { usePrepState } from "@/hooks/use-prep-state";
import { Button } from "@/components/ui/button";
import { LogDoseDialog } from "@/components/log-dose-dialog";
import { PrepDashboard } from "@/components/prep-dashboard";
import { Pill, Menu } from 'lucide-react';
import { SettingsSheet } from "@/components/settings-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeDialog } from "@/components/welcome-dialog";

export default function Home() {
  const [isLogDoseOpen, setIsLogDoseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const prepState = usePrepState();

  const { 
    addDose, 
    startSession, 
    clearHistory, 
    requestNotificationPermission, 
    unsubscribeFromNotifications, 
    setPushState,
    pushEnabled, 
    welcomeScreenVisible, 
    dashboardVisible, 
    isPushLoading 
  } = prepState;

  useEffect(() => {
    if (welcomeScreenVisible) {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcomePopup');
        if (!hasSeenWelcome) {
            setIsWelcomeOpen(true);
        }
    }
  }, [welcomeScreenVisible]);

  const handleWelcomeClose = () => {
    localStorage.setItem('hasSeenWelcomePopup', 'true');
    setIsWelcomeOpen(false);
  };
  
  const handleTogglePush = async () => {
    if (pushEnabled) {
      const success = await unsubscribeFromNotifications();
      if (success) {
        setPushState(false);
      }
    } else {
      const success = await requestNotificationPermission();
      if (success) {
        setPushState(true);
      }
    }
  };

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
  
  const LoadingScreen = () => (
      <div className="p-4 max-w-md w-full mx-auto space-y-8">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full rounded-lg" />
      </div>
  )

  return (
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
          {welcomeScreenVisible && <WelcomeScreen />}
          {!dashboardVisible && !welcomeScreenVisible && <LoadingScreen />}
          {dashboardVisible && <PrepDashboard {...prepState} />}
        </div>
      </main>
      <WelcomeDialog isOpen={isWelcomeOpen} onClose={handleWelcomeClose} />
       <LogDoseDialog
          isOpen={isLogDoseOpen}
          onOpenChange={setIsLogDoseOpen}
          onLogDose={addDose}
          onStartSession={startSession}
          status={prepState.status}
        />
      <SettingsSheet
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onClearHistory={clearHistory}
        pushEnabled={pushEnabled}
        onTogglePush={handleTogglePush}
        isPushLoading={isPushLoading}
      />
    </div>
  );
}
