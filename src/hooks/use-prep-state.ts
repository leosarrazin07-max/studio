
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format, set, differenceInMilliseconds } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Prise, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS, FINAL_PROTECTION_HOURS, DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { getRemoteConfig } from "firebase/remote-config";
import { app } from "@/lib/firebase-client";

// --- MOCK DATA GENERATION FOR DEVELOPMENT ---
const createMockData = (): PrepState => {
    const mockPrises: Prise[] = [];
    const now = new Date();
    
    // To simulate being inside the 4-hour reminder window with ~2h15m left,
    // we set the last dose to have occurred 23 hours and 45 minutes ago.
    // 26 hours (window end) - 2h15m = 23h45m.
    const lastDoseTime = sub(now, { hours: 23, minutes: 45 });

    // The start of the session would be 9 days before that last dose
    let firstDoseTime = sub(lastDoseTime, { days: 9 });
    firstDoseTime = set(firstDoseTime, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });

    // Initial dose (2 pills)
    mockPrises.push({
        time: firstDoseTime,
        pills: 2,
        type: 'start',
        id: `mock_0`
    });

    // Subsequent 9 daily doses (1 pill each), always at the same time
    let currentDoseTime = firstDoseTime;
    for (let i = 1; i < 10; i++) {
        // Add exactly 24 hours to maintain the same time of day
        const nextDoseTime = add(currentDoseTime, { hours: 24 });
        
        mockPrises.push({
            time: nextDoseTime,
            pills: 1,
            type: 'dose',
            id: `mock_${i}`
        });
        currentDoseTime = nextDoseTime;
    }

    return {
        prises: mockPrises.sort((a, b) => a.time.getTime() - b.time.getTime()), // Ensure they are sorted
        sessionActive: true, // Ensure the session is marked as active
        pushEnabled: false,
    };
};
// --- END MOCK DATA ---

const getVapidKey = async () => {
    if (typeof window === "undefined") return null;
    try {
        const remoteConfig = getRemoteConfig(app);
        // Note: Remote Config values are not available until fetched and activated.
        // This might not work on initial load without a proper fetching strategy.
        // await fetchAndActivate(remoteConfig);
        const vapidKey = remoteConfig.getString("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        if (vapidKey) {
            return vapidKey;
        }
    } catch (error) {
        console.error("Error fetching VAPID key from Remote Config:", error);
    }
    
    // Fallback to environment variable
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    }
    
    console.error("VAPID public key is not set in environment variables or Remote Config.");
    return null;
};

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

const safelyParseJSON = (jsonString: string | null) => {
  if (!jsonString) return null;
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed.prises)) {
        // Ensure time is a Date object
        parsed.prises = parsed.prises.map((d: any) => ({...d, time: new Date(d.time)}));
    } else {
        parsed.prises = [];
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

const getInitialState = () => {
    // In dev mode, ALWAYS start with mock data for consistent testing.
    if (process.env.NODE_ENV === 'development') {
        return createMockData();
    }
    // In production, get the state from localStorage.
    if (typeof window !== 'undefined') {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) return savedState;
    }
    return defaultState;
}

export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  // Force mock data in dev, otherwise load from storage.
  const [state, setState] = useState<PrepState>(getInitialState);


  const saveState = useCallback((newState: PrepState) => {
      // In development, just update the state without saving to localStorage to keep mock data consistent.
      if (process.env.NODE_ENV === 'development') {
          setState(newState);
          return;
      }
      
      // Production logic
      setState(newState);
      if (typeof window !== 'undefined') {
        try {
            const stateToSave = {
                ...newState,
                prises: newState.prises.map(d => ({...d, time: d.time.toISOString()}))
            };
            localStorage.setItem('prepState', JSON.stringify(stateToSave));
            
            const currentSub = subscription;
            if (newState.pushEnabled && currentSub) {
                 fetch('/api/tasks/notification', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ subscription: currentSub, state: stateToSave })
                }).catch(err => console.error("Failed to sync state to server:", err));
            }
        } catch (e) {
            console.error("Could not save state", e);
        }
      }
  }, [subscription]);
  
  const requestNotificationPermission = useCallback(async () => {
    const vapidPublicKey = await getVapidKey();
    if (!vapidPublicKey) {
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
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
        }
        await fetch('/api/subscription', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(sub)
        });
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
      try {
        await fetch('/api/subscription', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        setSubscription(null);
        saveState({...state, pushEnabled: false});
        toast({ title: "Notifications désactivées." });
      } catch (error) {
         console.error("Error unsubscribing:", error);
         toast({ title: "Erreur lors de la désinscription", variant: "destructive" });
      }
    }
  }, [subscription, toast, state, saveState]);

  useEffect(() => {
    setIsClient(true);

    // In dev mode, always ensure we are using the mock data on mount, overriding localStorage.
    if (process.env.NODE_ENV === 'development') {
      setState(createMockData());
    } else {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) {
            setState(savedState);
        }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => registration.pushManager.getSubscription())
        .then(sub => {
            if (sub) {
                setSubscription(sub);
                // No need to set state here, it's derived from the presence of `subscription` now.
            }
        })
        .catch(error => console.error('Erreur Service Worker:', error));
    }
    
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

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
    if (process.env.NODE_ENV === 'development') {
        setState(createMockData());
        toast({ title: "Données de test rechargées" });
        return;
    }
    
    if (typeof window !== 'undefined') {
        localStorage.removeItem('prepState');
    }
    // Set state back to default, keeping push preference
    setState({ ...defaultState, pushEnabled: !!subscription });
    toast({ title: "Données effacées", description: "Votre historique et vos préférences ont été supprimés." });
  }, [subscription, toast]);

  const allPrises = state.prises.filter(d => d.type !== 'stop').sort((a, b) => b.time.getTime() - a.time.getTime());
  const lastDose = allPrises[0] ?? null;
  
  const firstDoseInSession = state.prises.find(d => d.type === 'start');

  let status: PrepStatus = 'inactive';
  let statusColor = 'bg-gray-500';
  let statusText = 'Inactive';
  let nextDoseIn = '';
  let protectionStartsIn = '';
  let protectionEndsAtText = '';

  if (isClient && lastDose) {
    const protectionEndsAt = sub(lastDose.time, { hours: FINAL_PROTECTION_HOURS });
    protectionEndsAtText = `Vos rapports sont protégés jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
  }

  if (isClient && state.sessionActive && lastDose && firstDoseInSession) {
    const lastDoseTime = lastDose.time;
    const protectionStartTime = add(firstDoseInSession.time, { hours: PROTECTION_START_HOURS });
    const reminderWindowStartTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
    const reminderWindowEndTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_END_HOURS });

    if (isBefore(now, protectionStartTime)) {
      status = 'loading';
      statusColor = 'bg-primary';
      statusText = 'Protection en cours...';
      protectionStartsIn = `Sera active ${formatDistanceToNowStrict(protectionStartTime, { addSuffix: true, locale: fr })}`;
    } else if (isBefore(now, reminderWindowStartTime)) {
      // Before the reminder window (0 to 22h)
      status = 'effective';
      statusColor = 'bg-accent';
      statusText = 'Protection active';

      const milliseconds = differenceInMilliseconds(reminderWindowStartTime, now);
      const totalHours = Math.floor(milliseconds / (1000 * 60 * 60));
      const totalMinutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

      let timeParts = [];
      if (totalHours > 0) timeParts.push(`${totalHours}h`);
      if (totalMinutes > 0) timeParts.push(`${totalMinutes}min`);
        
      if (timeParts.length > 0) {
        nextDoseIn = `Prochaine prise dans ${timeParts.join(' ')}`;
      } else {
        nextDoseIn = `Prochaine prise imminente`;
      }

    } else if (isBefore(now, reminderWindowEndTime)) {
        // Within the reminder window (22h to 26h)
        status = 'effective';
        statusColor = 'bg-accent';
        statusText = 'Protection active';
        
        const milliseconds = differenceInMilliseconds(reminderWindowEndTime, now);
        const totalHours = Math.floor(milliseconds / (1000 * 60 * 60));
        const totalMinutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

        let timeParts = [];
        if (totalHours > 0) timeParts.push(`${totalHours}h`);
        if (totalMinutes > 0) timeParts.push(`${totalMinutes}min`);
        
        if (timeParts.length > 0) {
            nextDoseIn = `Il vous reste ${timeParts.join(' ')} pour prendre un comprimé`;
        } else {
            nextDoseIn = `Prenez votre comprimé maintenant !`;
        }
    } else {
      status = 'missed';
      statusColor = 'bg-destructive';
      statusText = 'Prise manquée';
    }
  } else if (isClient && !state.sessionActive && state.prises.length > 0) {
     status = 'missed';
     statusColor = 'bg-destructive';
     statusText = 'Session terminée';
  }

  if (!isClient) {
    statusText = "Chargement...";
    statusColor = "bg-muted";
  }

  const welcomeScreenVisible = isClient && state.prises.length === 0;
  const dashboardVisible = isClient && state.prises.length > 0;

  return {
    ...state,
    pushEnabled: !!subscription,
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

    