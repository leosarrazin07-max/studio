
"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrepState } from "@/hooks/use-prep-state";
import { Button } from "@/components/ui/button";
import { LogDoseDialog } from "@/components/log-dose-dialog";
import { PrepDashboard } from "@/components/prep-dashboard";
import { Pill, Menu } from 'lucide-react';
import { SettingsSheet } from "@/components/settings-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { useToast } from "@/hooks/use-toast";
import { getRemoteConfig, getString, fetchAndActivate } from "firebase/remote-config";
import { app } from "@/lib/firebase-client";

function urlBase64ToUint8Array(base64String: string) {
  if (typeof window === "undefined") return new Uint8Array(0);
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const getVapidKey = async () => {
    if (typeof window === "undefined") return null;
    try {
        const remoteConfig = getRemoteConfig(app);
        await fetchAndActivate(remoteConfig);
        const vapidKey = getString(remoteConfig, "NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        if (vapidKey) return vapidKey;
    } catch (error) {
        console.error("Error fetching VAPID key from Remote Config:", error);
    }
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    }
    console.error("VAPID public key is not set in env vars or Remote Config.");
    return null;
};


export default function Home() {
  const [isLogDoseOpen, setIsLogDoseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  
  // Prep state logic is now separated from notification logic
  const prepState = usePrepState();
  const { addDose, startSession, clearHistory, welcomeScreenVisible, dashboardVisible } = prepState;

  // Notification logic is now handled directly in the component
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isPushLoading, setIsPushLoading] = useState(true);
  const pushEnabled = !!subscription;

  // Sync state with server whenever it changes, if subscribed.
  useEffect(() => {
    if (subscription) {
        const stateToSave = {
            sessionActive: prepState.sessionActive,
            prises: prepState.prises.map(d => ({...d, time: d.time.toISOString()}))
        };
        fetch('/api/tasks/notification', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ subscription, state: stateToSave })
        }).catch(err => console.error("Failed to sync state to server:", err));
    }
  }, [prepState.prises, prepState.sessionActive, subscription]);

  // Check for existing subscription on mount
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
          setIsPushLoading(false);
        });
      });
    } else {
        setIsPushLoading(false);
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

  const handleWelcomeClose = () => {
    localStorage.setItem('hasSeenWelcomePopup', 'true');
    setIsWelcomeOpen(false);
  };
  
  const subscribeToPush = async () => {
    if (!('Notification' in window) || !navigator.serviceWorker) {
        toast({ title: "Navigateur non compatible", variant: "destructive" });
        return;
    }
    setIsPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
          toast({ title: "Notifications refusées", variant: "destructive" });
          return;
      }

      const vapidPublicKey = await getVapidKey();
      if (!vapidPublicKey) {
          toast({ title: "Erreur de configuration", variant: "destructive" });
          return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch('/api/subscription', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(sub)
      });
      setSubscription(sub);
      toast({ title: "Notifications activées!" });
    } catch(error) {
        console.error("Error subscribing:", error);
        toast({ title: "Erreur d'abonnement", variant: "destructive" });
    } finally {
        setIsPushLoading(false);
    }
  };
  
  const unsubscribeFromPush = async () => {
    if (!subscription) return;
    setIsPushLoading(true);
    try {
        await fetch('/api/subscription', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        setSubscription(null);
        toast({ title: "Notifications désactivées." });
    } catch (error) {
        console.error("Error unsubscribing:", error);
        toast({ title: "Erreur lors de la désinscription", variant: "destructive" });
    } finally {
        setIsPushLoading(false);
    }
  };

  const handleTogglePush = async () => {
    if (pushEnabled) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
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
