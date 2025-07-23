
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Prise, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS, FINAL_PROTECTION_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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

const safelyParseJSON = (jsonString: string | null) => {
  if (!jsonString) return null;
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.prises) {
        parsed.prises = parsed.prises.map((d: any) => ({...d, time: new Date(d.time)}));
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON from localStorage", e);
    return null;
  }
};

const defaultState: PrepState = {
    prises: [],
    sessionActive: false,
    pushEnabled: false,
};

export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [state, setState] = useState<PrepState>(defaultState);

  const saveState = useCallback((newState: PrepState) => {
      setState(newState);
      try {
        const stateToSave = {
            ...newState,
            prises: newState.prises.map(d => ({...d, time: d.time.toISOString()}))
        };
        localStorage.setItem('prepState', JSON.stringify(stateToSave));
      } catch (e) {
          console.error("Could not save state to localStorage", e);
      }
  }, []);

  const updateSubscriptionObject = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        setState(prevState => ({...prevState, pushEnabled: !!sub}));
      } catch (error) {
        console.error("Error getting push subscription:", error);
      }
    }
  }, []);

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
        saveState({...state, pushEnabled: true});
        toast({ title: "Notifications activées!" });
        return true;
    } catch (error) {
        console.error("Error subscribing:", error);
        toast({ title: "Erreur d'abonnement", variant: "destructive" });
        return false;
    }
  }, [toast, state, saveState]);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        saveState({...state, pushEnabled: false});
        toast({ title: "Notifications désactivées." });
    }
  }, [subscription, toast, state, saveState]);

  useEffect(() => {
    setIsClient(true);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => updateSubscriptionObject())
        .catch(error => console.error('Erreur Service Worker:', error));
    }
    
    const savedState = safelyParseJSON(localStorage.getItem('prepState'));
    if (savedState) {
        setState(savedState);
    }
    
    const timer = setInterval(() => setNow(new Date()), 1000 * 60); // Update "now" every minute
    return () => clearInterval(timer);
  }, [updateSubscriptionObject]);

  const startSession = useCallback((time: Date) => {
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    const newPrises = [newDose];
    saveState({ ...defaultState, prises: newPrises, sessionActive: true, pushEnabled: state.pushEnabled });
  }, [saveState, state.pushEnabled]);

  const addDose = useCallback((prise: { time: Date; pills: number }) => {
    const newDose = { ...prise, type: 'dose' as const, id: new Date().toISOString() };
    const newPrises = [...state.prises, newDose].sort((a, b) => a.time.getTime() - b.time.getTime());
    saveState({ ...state, prises: newPrises });
  }, [state, saveState]);

  const endSession = useCallback(() => {
    const stopEvent = { time: new Date(), pills: 0, type: 'stop' as const, id: new Date().toISOString() };
    const updatedDoses = [...state.prises, stopEvent];
    saveState({ ...state, sessionActive: false, prises: updatedDoses });
    toast({ title: "Session terminée", description: "Les rappels de notification sont maintenant arrêtés." });
  }, [state, saveState, toast]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem('prepState');
    saveState({ ...defaultState, pushEnabled: state.pushEnabled });
    toast({ title: "Données effacées", description: "Votre historique et vos préférences ont été supprimés." });
  }, [saveState, state.pushEnabled, toast]);

  const lastDose = state.prises.filter(d => d.type !== 'stop').sort((a, b) => b.time.getTime() - a.time.getTime())[0] ?? null;
  const firstDoseInSession = state.prises.find(d => d.type === 'start');

  let status: PrepStatus = 'inactive';
  let statusColor = 'bg-gray-500';
  let statusText = 'Inactive';
  let nextDoseIn = '';
  let protectionStartsIn = '';
  let protectionEndsAtText = '';

  if (isClient && state.sessionActive && lastDose && firstDoseInSession) {
    const lastDoseTime = lastDose.time;
    const protectionStartTime = add(firstDoseInSession.time, { hours: PROTECTION_START_HOURS });
    const nextDoseDueTime = add(lastDoseTime, { hours: DOSE_INTERVAL_HOURS });
    const protectionLapsesTime = add(lastDoseTime, { hours: LAPSES_AFTER_HOURS });

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
      const protectionEndsAt = add(lastDoseTime, { hours: FINAL_PROTECTION_HOURS });
      protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
    } else {
      status = 'missed';
      statusColor = 'bg-destructive';
      statusText = 'Dose manquée';
      const protectionEndsAt = add(lastDoseTime, { hours: FINAL_PROTECTION_HOURS });
      protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
    }
  } else if (isClient && !state.sessionActive && state.prises.length > 0) {
     const lastEffectiveDose = state.prises.filter(d => d.type !== 'stop').sort((a,b) => b.time.getTime() - a.time.getTime())[0] ?? null;
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

  const welcomeScreenVisible = isClient && state.prises.length === 0;
  const dashboardVisible = isClient && state.prises.length > 0;

  return {
    ...state,
    prises: state.prises.filter(dose => isAfter(dose.time, sub(now, { days: MAX_HISTORY_DAYS }))),
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
    unsubscribeFromNotifications,
    welcomeScreenVisible,
    dashboardVisible,
  };
}
