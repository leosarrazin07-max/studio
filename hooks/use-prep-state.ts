
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Dose, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS, FINAL_PROTECTION_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { getFirestore, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase-client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const firestore = getFirestore(app);

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const hashEndpoint = (endpoint: string) => {
    let hash = 0;
    for (let i = 0; i < endpoint.length; i++) {
        const char = endpoint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'sub_' + Math.abs(hash).toString(16);
}

const defaultState: PrepState = {
    doses: [],
    sessionActive: false,
    pushEnabled: false,
};

export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [state, setState] = useState<PrepState>(defaultState);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const syncStateWithServer = useCallback(async (action: 'start' | 'dose' | 'end' | 'clear', payload?: any) => {
      if (!subscriptionId) {
          toast({ title: "Erreur", description: "Impossible d'identifier l'appareil.", variant: "destructive"});
          return;
      }
      try {
          const response = await fetch('/api/dose', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscriptionId, action, payload }),
          });
          if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || "Une erreur serveur est survenue.");
          }
      } catch (e: any) {
          console.error(`Failed to ${action} session:`, e);
          toast({ title: "Erreur de communication", description: e.message, variant: "destructive" });
      }
  }, [subscriptionId, toast]);

  const updateSubscriptionOnServer = useCallback(async (sub: PushSubscription | null) => {
    if (!sub) return;
    const id = hashEndpoint(sub.endpoint);
    setSubscriptionId(id);
    try {
        const subJson = sub.toJSON();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await fetch('/api/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionId: id, subscription: subJson, timezone }),
        });
    } catch (e) {
        console.error("Failed to save subscription", e);
        toast({ title: "Erreur serveur", description: "Impossible de sauvegarder les préférences de notification.", variant: "destructive" });
    }
  }, [toast]);
  
  const requestNotificationPermission = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
        console.error("VAPID public key not found.");
        toast({ title: "Erreur de configuration", description: "La clé de notification est manquante.", variant: "destructive" });
        return false;
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast({ title: "Navigateur non compatible", variant: "destructive" });
        return false;
    }
    try {
        await navigator.serviceWorker.register('/service-worker.js');
        const registration = await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            toast({ title: "Notifications refusées", variant: "destructive" });
            return false;
        }
        let sub = await registration.pushManager.getSubscription();
        if (!sub) {
            sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
        }
        setSubscription(sub);
        await updateSubscriptionOnServer(sub);
        toast({ title: "Notifications activées!" });
        return true;
    } catch (error) {
        console.error("Error subscribing:", error);
        toast({ title: "Erreur d'abonnement", variant: "destructive" });
        return false;
    }
  }, [toast, updateSubscriptionOnServer]);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (subscription && subscriptionId) {
        await subscription.unsubscribe();
        try {
            await fetch('/api/subscription', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId }),
            });
        } catch(e) {
            console.error("Failed to delete subscription/state from server", e);
        }
        setSubscription(null);
        setSubscriptionId(null);
        setState(prevState => ({...prevState, pushEnabled: false}));
        toast({ title: "Notifications désactivées." });
    }
  }, [subscription, subscriptionId, toast]);

  // Effect to get subscription on load
  useEffect(() => {
    setIsClient(true);
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/service-worker.js').then(async registration => {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
            setSubscription(sub);
            setSubscriptionId(hashEndpoint(sub.endpoint));
        }
      }).catch(error => console.error('Erreur Service Worker:', error));
    }
    const timer = setInterval(() => setNow(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  // Effect to listen to state changes from Firestore
  useEffect(() => {
    if (!subscriptionId) {
        setState(defaultState); // Reset to default if no subscription
        return;
    };
    
    const stateRef = doc(firestore, "states", subscriptionId);
    const unsubscribe = onSnapshot(stateRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const parsedDoses = data.doses.map((d: any) => ({
              ...d,
              time: new Date(d.time.seconds * 1000), // Convert Firestore Timestamp
            }));
            setState({ 
                doses: parsedDoses,
                sessionActive: data.sessionActive,
                pushEnabled: true, // If we have state, push is enabled
            });
        } else {
            // Document doesn't exist, maybe it was cleared.
            setState(defaultState);
        }
    });

    const subRef = doc(firestore, "subscriptions", subscriptionId);
    getDoc(subRef).then(doc => {
        setState(prevState => ({...prevState, pushEnabled: doc.exists()}))
    })

    return () => unsubscribe();
  }, [subscriptionId]);


  const startSession = useCallback((time: Date) => {
    syncStateWithServer('start', { time });
  }, [syncStateWithServer]);

  const addDose = useCallback((dose: { time: Date; pills: number }) => {
    syncStateWithServer('dose', dose);
  }, [syncStateWithServer]);

  const endSession = useCallback(() => {
    syncStateWithServer('end');
    toast({ title: "Session terminée", description: "Les rappels de notification sont maintenant arrêtés." });
  }, [syncStateWithServer, toast]);

  const clearHistory = useCallback(() => {
    syncStateWithServer('clear');
    toast({ title: "Données effacées", description: "Votre historique et vos préférences de notification ont été supprimés." });
  }, [syncStateWithServer, toast]);

  const lastDose = state.doses.filter(d => d.type !== 'stop').sort((a, b) => b.time.getTime() - a.time.getTime())[0] ?? null;
  const firstDoseInSession = state.doses.find(d => d.type === 'start');

  let status: PrepStatus = 'inactive';
  let statusColor = 'bg-gray-500';
  let statusText = 'Inactive';
  let nextDoseIn = '';
  let protectionStartsIn = '';
  let protectionEndsAtText = '';

  if (isClient && state.sessionActive && lastDose && firstDoseInSession) {
    const lastDoseTime = lastDose.time;
    const protectionStartTime = add(firstDoseInSession.time, { hours: PROTECTION_START_HOURS });
    
    // Use last dose to calculate next due time, regardless of type
    const lastEffectiveDoseTime = state.doses.filter(d => d.type !== 'stop').sort((a,b) => b.time.getTime() - a.time.getTime())[0]?.time ?? firstDoseInSession.time;
    const nextDoseDueTime = add(lastEffectiveDoseTime, { hours: DOSE_INTERVAL_HOURS });
    const protectionLapsesTime = add(lastEffectiveDoseTime, { hours: LAPSES_AFTER_HOURS });

    if (isBefore(now, protectionStartTime)) {
      status = 'loading';
      statusColor = 'bg-primary';
      statusText = 'Protection en cours...';
      protectionStartsIn = `Sera active ${formatDistanceToNowStrict(protectionStartTime, { addSuffix: true, locale: fr })}`;
    } else if (isBefore(now, protectionLapsesTime)) {
      status = 'effective';
      statusColor = 'bg-accent';
      statusText = 'Protection active';
      nextDoseIn = `Prochaine dose ${formatDistanceToNowStrict(nextDoseDueTime, { addSuffix: true, locale: fr })}`;
      const protectionEndsAt = add(lastEffectiveDoseTime, { hours: FINAL_PROTECTION_HOURS });
      protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
    } else {
      status = 'missed';
      statusColor = 'bg-destructive';
      statusText = 'Dose manquée';
      const protectionEndsAt = add(lastEffectiveDoseTime, { hours: FINAL_PROTECTION_HOURS });
      protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
    }
  } else if (isClient && !state.sessionActive && state.doses.length > 0) {
     const lastEffectiveDose = state.doses.filter(d => d.type !== 'stop').sort((a,b) => b.time.getTime() - a.time.getTime())[0] ?? null;
     if (lastEffectiveDose) {
        status = 'missed';
        statusColor = 'bg-destructive';
        statusText = 'Session terminée';
        const protectionEndsAt = add(lastEffectiveDose.time, { hours: FINAL_PROTECTION_HOURS });
        protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
     }
  }

  if (!isClient) {
    statusText = "Chargement...";
    statusColor = "bg-muted";
  }

  return {
    ...state,
    doses: state.doses.filter(dose => isAfter(dose.time, sub(now, { days: MAX_HISTORY_DAYS }))),
    status,
    statusColor,
    statusText,
    nextDoseIn,
    protectionStartsIn,
    protectionEndsAtText,
    addDose,
    startSession,
    endSession,
    clearHistory,
    requestNotificationPermission,
    unsubscribeFromNotifications
  };
}
