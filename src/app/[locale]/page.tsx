
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
import { initializeAdMob, showAppOpenAd } from "@/lib/admob";
import { Capacitor } from '@capacitor/core';
import { useI18n, useScopedI18n } from '@/locales/client';

export default function Home() {
  const [isLogDoseOpen, setIsLogDoseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  
  const t = useI18n();
  const scopedT = useScopedI18n('welcomeScreen');

  const {
    prises,
    addDose,
    startSession,
    endSession,
    clearHistory,
    requestNotificationPermission,
    unsubscribeFromNotifications,
    pushEnabled,
    isPushLoading,
    pushPermissionStatus,
    welcomeScreenVisible,
    dashboardVisible,
    status,
    statusColor,
    statusText,
    nextDoseIn,
    protectionStartsIn,
    protectionEndsAtText,
    sessionActive
  } = usePrepState();

  useEffect(() => {
    // Initialize AdMob and show app open ad on first load
    if (Capacitor.isNativePlatform()) {
      initializeAdMob().then(() => {
        const hasSeenAppOpenAd = sessionStorage.getItem('hasSeenAppOpenAd');
        if (!hasSeenAppOpenAd) {
          showAppOpenAd();
          sessionStorage.setItem('hasSeenAppOpenAd', 'true');
        }
      });
    }
  }, []);

  useEffect(() => {
    if (welcomeScreenVisible) {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcomePopup');
        if (!hasSeenWelcome) {
            setIsWelcomeOpen(true);
        }
    }
  }, [welcomeScreenVisible]);

  const handleWelcomeConfirm = () => {
    localStorage.setItem('hasSeenWelcomePopup', 'true');
    setIsWelcomeOpen(false);
    requestNotificationPermission();
  };

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
        <div className="relative mb-8">
            <Pill className="text-primary" size={80} strokeWidth={1.5}/>
        </div>
      <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline mb-4">
        {scopedT('title')}
      </h1>
      <p className="max-w-md text-muted-foreground mb-8">
        {scopedT('subtitle')}
      </p>
      <Button
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg shadow-lg"
        onClick={() => setIsLogDoseOpen(true)}
      >
        {scopedT('cta')}
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
          {dashboardVisible && <PrepDashboard 
                                prises={prises}
                                addDose={addDose}
                                endSession={endSession}
                                sessionActive={sessionActive}
                                startSession={startSession}
                                status={status}
                                statusColor={statusColor}
                                statusText={statusText}
                                nextDoseIn={nextDoseIn}
                                protectionStartsIn={protectionStartsIn}
                                protectionEndsAtText={protectionEndsAtText}
                              />}
        </div>
      </main>
      <WelcomeDialog isOpen={isWelcomeOpen} onConfirm={handleWelcomeConfirm} />
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
        isPushLoading={isPushLoading}
        pushPermissionStatus={pushPermissionStatus}
        requestNotificationPermission={requestNotificationPermission}
        unsubscribeFromNotifications={unsubscribeFromNotifications}
      />
    </div>
  );
}
