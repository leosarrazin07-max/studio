
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format, set, differenceInMilliseconds } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Prise, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, MAX_HISTORY_DAYS, FINAL_PROTECTION_HOURS, DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { getRemoteConfig, getString, fetchAndActivate } from "firebase/remote-config";
import { app } from "@/lib/firebase-client";

// --- MOCK DATA GENERATION FOR DEVELOPMENT ---
const createMockData = (): PrepState => {
    const mockPrises: Prise[] = [];
    const now = new Date();
    // Start the session 10 days ago at a fixed time (e.g., 09:00) for consistency
    let lastDoseTime = set(sub(now, { days: 10 }), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });

    // Initial dose (2 pills)
    mockPrises.push({
        time: lastDoseTime,
        pills: 2,
        type: 'start',
        id: `mock_0`
    });

    // Subsequent 9 daily doses (1 pill each), always at the same time
    for (let i = 1; i < 10; i++) {
        // Add exactly 24 hours to maintain the same time of day
        const nextDoseTime = add(lastDoseTime, { hours: 24 });
        
        mockPrises.push({
            time: nextDoseTime,
            pills: 1,
            type: 'dose',
            id: `mock_${i}`
        });
        lastDoseTime = nextDoseTime;
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
        await fetchAndActivate(remoteConfig);
        const vapidKey = getString(remoteConfig, "NEXT_PUBLIC_VAPID_PUBLIC_KEY");
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

const getInitialState = (): PrepState => {
    if (typeof window === 'undefined') {
        return defaultState;
    }
    // In development, ALWAYS start with mock data for consistent testing.
    if (process.env.NODE_ENV === 'development') {
        return createMockData();
    }
    // In production, get the state from localStorage.
    const savedState = safelyParseJSON(localStorage.getItem('prepState'));
    return savedState || defaultState;
}

export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [state, setState] = useState<PrepState>(getInitialState);
  const [isPushLoading, setIsPushLoading] = useState(false);


  const saveState = useCallback((updater: (prevState: PrepState) => PrepState) => {
      setState(prevState => {
          const newState = updater(prevState);
          
          if (process.env.NODE_ENV === 'development') {
              return newState;
          }
          
          if (typeof window !== 'undefined') {
            try {
                const stateToSave = {
                    ...newState,
                    prises: newState.prises.map(d => ({...d, time: d.time.toISOString()}))
                };
                localStorage.setItem('prepState', JSON.stringify(stateToSave));
                
                // Use the subscription object from the component's state directly
                if (newState.pushEnabled && subscription) {
                     fetch('/api/tasks/notification', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ subscription: subscription, state: stateToSave })
                    }).catch(err => console.error("Failed to sync state to server:", err));
                }
            } catch (e) {
                console.error("Could not save state", e);
            }
          }
          return newState;
      });
  }, [subscription]);
  
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window) || !navigator.serviceWorker) {
        toast({ title: "Navigateur non compatible", variant: "destructive" });
        return;
    }
    setIsPushLoading(true);

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            toast({ title: "Notifications refusées", variant: "destructive" });
            setIsPushLoading(false);
            return;
        }

        const vapidPublicKey = await getVapidKey();
        if (!vapidPublicKey) {
            toast({ title: "Erreur de configuration", description: "La clé de notification est manquante.", variant: "destructive" });
            setIsPushLoading(false);
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
        saveState(prevState => ({...prevState, pushEnabled: true}));
        toast({ title: "Notifications activées!" });

    } catch (error) {
        console.error("Error subscribing:", error);
        toast({ title: "Erreur d'abonnement", variant: "destructive" });
        // Restore previous state in case of error
        saveState(prevState => ({...prevState, pushEnabled: false}));
    } finally {
        setIsPushLoading(false);
    }
  }, [saveState, toast]);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (subscription) {
      setIsPushLoading(true);
      try {
        await fetch('/api/subscription', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        setSubscription(null);
        saveState(prevState => ({...prevState, pushEnabled: false}));
        toast({ title: "Notifications désactivées." });
      } catch (error) {
         console.error("Error unsubscribing:", error);
         toast({ title: "Erreur lors de la désinscription", variant: "destructive" });
      } finally {
        setIsPushLoading(false);
      }
    }
  }, [subscription, toast, saveState]);

  useEffect(() => {
    setIsClient(true);
    if (process.env.NODE_ENV !== 'development' && typeof window !== 'undefined') {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) setState(savedState);
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready
        .then(registration => registration.pushManager.getSubscription())
        .then(sub => {
            setSubscription(sub);
            // Sync state with subscription status on load
            saveState(prevState => ({ ...prevState, pushEnabled: !!sub }));
        })
        .catch(error => console.error('Erreur Service Worker:', error));
    }
    
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = useCallback((time: Date) => {
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    saveState(prevState => ({ ...defaultState, prises: [newDose], sessionActive: true, pushEnabled: prevState.pushEnabled }));
  }, [saveState]);

  const addDose = useCallback((prise: { time: Date; pills: number }) => {
    const newDose = { ...prise, type: 'dose' as const, id: new Date().toISOString() };
    saveState(prevState => {
        const newPrises = [...prevState.prises, newDose].sort((a, b) => a.time.getTime() - b.time.getTime());
        return { ...prevState, prises: newPrises };
    });
  }, [saveState]);

  const endSession = useCallback(() => {
    const stopEvent = { time: new Date(), pills: 0, type: 'stop' as const, id: new Date().toISOString() };
    saveState(prevState => {
        const updatedDoses = [...prevState.prises, stopEvent];
        return { ...prevState, sessionActive: false, prises: updatedDoses };
    });
    toast({ title: "Session terminée", description: "Les rappels de notification sont maintenant arrêtés." });
  }, [saveState, toast]);

  const clearHistory = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
        setState(createMockData());
        toast({ title: "Données de test rechargées" });
        return;
    }
    
    saveState(prevState => ({ ...defaultState, prises: [], sessionActive: false, pushEnabled: prevState.pushEnabled }));
    toast({ title: "Données effacées", description: "Votre historique de prises a été supprimé." });
  }, [saveState, toast]);

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
      status = 'effective';
      statusColor = 'bg-accent';
      statusText = 'Protection active';
      nextDoseIn = `Prochaine prise dans ${formatDistanceToNowStrict(reminderWindowStartTime, { locale: fr })}`;
    } else if (isBefore(now, reminderWindowEndTime)) {
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
    isPushLoading,
  };
}
