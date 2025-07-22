
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Dose, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS } from '@/lib/constants';
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
    if (parsed.doses) {
        parsed.doses = parsed.doses.map((d: any) => ({...d, time: new Date(d.time)}));
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON from localStorage", e);
    return null;
  }
};

const defaultState: PrepState = {
    doses: [],
    sessionActive: false,
    pushEnabled: false,
};

async function syncStateWithServer(state: PrepState) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        const stateToSync = {
            ...state,
            doses: state.doses.map(d => ({ ...d, time: d.time.toISOString() })),
        };
        try {
            await fetch('/api/tasks/notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription, state: stateToSync }),
            });
        } catch (error) {
            console.error("Failed to sync state with server:", error);
        }
    }
}


export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [state, setState] = useState<PrepState>(defaultState);
  
  const saveState = useCallback((newState: Partial<PrepState>) => {
    setState(prevState => {
        const updatedState = { ...prevState, ...newState };
        if (typeof window !== 'undefined') {
            try {
                const stateToSave = {
                    ...updatedState,
                    doses: updatedState.doses.map(d => ({ ...d, time: d.time.toISOString() })),
                };
                localStorage.setItem('prepState', JSON.stringify(stateToSave));
                // Sync with server whenever state changes
                syncStateWithServer(updatedState);
            } catch (e) {
                console.error("Could not save state to localStorage", e);
            }
        }
        return updatedState;
    });
  }, []);

  const syncPushSubscription = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!!subscription !== state.pushEnabled) {
          saveState({ pushEnabled: !!subscription });
        }
      } catch (error) {
        console.error("Error syncing push subscription:", error);
      }
    }
  }, [saveState, state.pushEnabled]);


  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) {
          setState(prevState => ({...prevState, ...savedState}));
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
              .then(() => syncPushSubscription())
              .catch(error => console.error('Erreur Service Worker:', error));
        }

        const timer = setInterval(() => setNow(new Date()), 1000 * 60);
        return () => clearInterval(timer);
    }
  }, [syncPushSubscription]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncPushSubscription();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncPushSubscription]);


  const togglePushNotifications = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
        console.error("VAPID public key not found.");
        toast({ title: "Erreur de configuration", description: "La clé de notification est manquante.", variant: "destructive" });
        return;
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast({ title: "Navigateur non compatible", variant: "destructive" });
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const currentSubscription = await registration.pushManager.getSubscription();
        
        if (currentSubscription) {
            await fetch('/api/subscription', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: currentSubscription.endpoint }),
            });
            await currentSubscription.unsubscribe();
            saveState({ pushEnabled: false });
            toast({ title: "Notifications désactivées." });
        } else {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast({ title: "Permission refusée", description: "Vous devez autoriser les notifications dans les paramètres de votre navigateur.", variant: "destructive" });
                saveState({ pushEnabled: false });
                return;
            }

            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            
            await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSubscription),
            });
            
            saveState({ pushEnabled: true });
            await syncStateWithServer({ ...state, pushEnabled: true });
            toast({ title: "Notifications activées !" });
        }
    } catch (e) {
        console.error("Error toggling push notifications:", e);
        toast({ title: "Une erreur est survenue", variant: "destructive" });
        syncPushSubscription();
    }
  }, [state, saveState, toast, syncPushSubscription]);

  const startSession = useCallback((time: Date) => {
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    const newDoses = [newDose];
    saveState({ ...defaultState, doses: newDoses, sessionActive: true, pushEnabled: state.pushEnabled });
  }, [saveState, state.pushEnabled]);

  const addDose = useCallback((dose: { time: Date; pills: number }) => {
    const newDose = { ...dose, type: 'dose' as const, id: new Date().toISOString() };
    const newDoses = [...state.doses, newDose].sort((a, b) => a.time.getTime() - b.time.getTime());
    saveState({ doses: newDoses, sessionActive: true });
  }, [state.doses, saveState]);

  const endSession = useCallback(() => {
    const stopEvent = { time: new Date(), pills: 0, type: 'stop' as const, id: new Date().toISOString() };
    const updatedDoses = [...state.doses, stopEvent];
    saveState({ sessionActive: false, doses: updatedDoses });
    toast({ title: "Session terminée", description: "Les rappels de notification sont maintenant arrêtés." });
  }, [state.doses, saveState, toast]);

  const clearHistory = useCallback(() => {
    saveState({ ...defaultState, pushEnabled: state.pushEnabled });
    toast({ title: "Données effacées", description: "Votre historique et vos préférences ont été supprimés." });
  }, [saveState, state.pushEnabled, toast]);

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
      // New protection logic: Protection is until 48h BEFORE the last dose.
      const protectionEndDate = sub(lastDoseTime, { hours: 48 });
      protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndDate, 'eeee dd MMMM HH:mm', { locale: fr })}`;
    } else {
      status = 'missed';
      statusColor = 'bg-destructive';
      statusText = 'Dose manquée';
      const protectionEndDate = sub(lastDoseTime, { hours: 48 });
      protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndDate, 'eeee dd MMMM HH:mm', { locale: fr })}`;
    }
  } else if (isClient && !state.sessionActive && state.doses.length > 0) {
      status = 'inactive';
      statusColor = 'bg-gray-500';
      statusText = 'Session terminée';
      if (lastDose) {
          const protectionEndDate = sub(lastDose.time, { hours: 48 });
           if (isAfter(now, protectionEndDate)) {
                protectionEndsAtText = "La protection n'est plus assurée.";
           } else {
                protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndDate, 'eeee dd MMMM HH:mm', { locale: fr })}`;
           }
      }
  }

  if (!isClient) {
    statusText = "Chargement...";
    statusColor = "bg-muted";
  }
  
  const welcomeScreenVisible = !isClient || (!state.sessionActive && state.doses.length === 0);
  const dashboardVisible = isClient && (state.sessionActive || state.doses.length > 0);


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
    togglePushNotifications,
    welcomeScreenVisible,
    dashboardVisible,
  };
}
