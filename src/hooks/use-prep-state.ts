
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format, intervalToDuration } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Prise, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS, FINAL_PROTECTION_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { getRemoteConfig } from "firebase/remote-config";
import { app } from "@/lib/firebase-client";

// --- MOCK DATA GENERATION FOR DEVELOPMENT ---
const createMockData = (): PrepState => {
    const mockPrises: Prise[] = [];
    const now = new Date();
    // Start the session 10 days ago
    let lastDoseTime = sub(now, { days: 10 });

    // Initial dose (2 pills)
    mockPrises.push({
        time: lastDoseTime,
        pills: 2,
        type: 'start',
        id: `mock_0`
    });

    // Subsequent 9 daily doses (1 pill each)
    for (let i = 1; i < 10; i++) {
        // Add roughly 24 hours, with some variation
        const hoursToAdd = 23 + Math.random() * 2;
        const minutesToAdd = Math.random() * 60;
        const nextDoseTime = add(lastDoseTime, { hours: Math.floor(hoursToAdd), minutes: Math.floor(minutesToAdd) });
        
        mockPrises.push({
            time: nextDoseTime,
            pills: 1,
            type: 'dose',
            id: `mock_${i}`
        });
        lastDoseTime = nextDoseTime;
    }

    return {
        prises: mockPrises,
        sessionActive: true, // Ensure the session is marked as active
        pushEnabled: false,
    };
};
// --- END MOCK DATA ---

const getVapidKey = async () => {
    if (typeof window === "undefined") return null;
    try {
        const remoteConfig = getRemoteConfig(app);
        const vapidKey = remoteConfig.getString("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        if (vapidKey) {
            return vapidKey;
        }
    } catch (error) {
        console.error("Error fetching VAPID key from Remote Config:", error);
    }
    
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
    if (process.env.NODE_ENV === 'development') {
        const savedState = safelyParseJSON(typeof window !== 'undefined' ? localStorage.getItem('prepState') : null);
        if (!savedState || savedState.prises.length === 0) {
            return createMockData();
        }
        return savedState;
    }
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
  const [state, setState] = useState<PrepState>(getInitialState);

  const saveState = useCallback((newState: PrepState) => {
      setState(newState);
      if (process.env.NODE_ENV === 'development') {
        // Don't persist over mock data in dev unless we explicitly add a dose
      }

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
    if (!isClient) return false;

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
  }, [isClient, toast, state, saveState]);

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
    
    // Initial state is now handled by getInitialState
    // We just need to register the service worker and update timers/push status
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => registration.pushManager.getSubscription())
        .then(sub => {
            if (sub) {
                setSubscription(sub);
                setState(currentState => ({...currentState, pushEnabled: !!sub}));
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
        const mockState = createMockData();
        setState(mockState); // Just reload the mock data, don't save to localStorage
        toast({ title: "Données de test rechargées" });
        return;
    }
    
    if (typeof window !== 'undefined') {
        localStorage.removeItem('prepState');
    }
    setState({ ...defaultState, pushEnabled: state.pushEnabled });
    toast({ title: "Données effacées", description: "Votre historique et vos préférences ont été supprimés." });
  }, [state.pushEnabled, toast]);

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
      
      const milliseconds = nextDoseDueTime.getTime() - now.getTime();
      const totalHours = Math.floor(milliseconds / (1000 * 60 * 60));
      const totalMinutes = Math.floor((milliseconds / (1000 * 60)) % 60);

      let timeParts = [];
      if (totalHours > 0) timeParts.push(`${totalHours}h`);
      if (totalMinutes > 0) timeParts.push(`${totalMinutes}min`);
      
      if (timeParts.length > 0) {
        nextDoseIn = `Prochaine prise dans ${timeParts.join(' ')}`;
      } else {
        nextDoseIn = `Prochaine prise imminente`;
      }
      
      const protectionEndsAt = add(lastDoseTime, { hours: FINAL_PROTECTION_HOURS });
      protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
    } else {
      status = 'missed';
      statusColor = 'bg-destructive';
      statusText = 'Prise manquée';
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

    