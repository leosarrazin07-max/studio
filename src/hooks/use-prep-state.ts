
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format, set, differenceInMilliseconds } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Prise, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, MAX_HISTORY_DAYS, FINAL_PROTECTION_HOURS, DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { app } from "@/lib/firebase-client";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// --- MOCK DATA GENERATION FOR DEVELOPMENT ---
const createMockData = (): PrepState => {
    const mockPrises: Prise[] = [];
    const now = new Date();
    // To see the "time to take" countdown, set the last dose to be ~24h ago
    let lastDoseTime = sub(now, { hours: 24, minutes: 30 });

    mockPrises.push({
        time: sub(lastDoseTime, {days: 9}),
        pills: 2,
        type: 'start',
        id: `mock_0`
    });

    for (let i = 1; i < 10; i++) {
        mockPrises.push({
            time: add(mockPrises[0].time, {days: i}),
            pills: 1,
            type: 'dose',
            id: `mock_${i}`
        });
    }
    
    // Replace the last mock dose with our specific time
    mockPrises[mockPrises.length - 1].time = lastDoseTime;

    return {
        prises: mockPrises.sort((a, b) => a.time.getTime() - b.time.getTime()),
        sessionActive: true,
        pushEnabled: false,
        fcmToken: null,
    };
};
// --- END MOCK DATA ---


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
    fcmToken: null,
};

const getInitialState = () => {
    if (typeof window === 'undefined') {
        return defaultState;
    }
    if (process.env.NODE_ENV === 'development') {
        return createMockData();
    }
    const savedState = safelyParseJSON(localStorage.getItem('prepState'));
    return savedState || defaultState;
}

export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [isPushLoading, setIsPushLoading] = useState(true);
  const [state, setState] = useState<PrepState>(getInitialState);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission>();

  const saveState = useCallback((newState: PrepState) => {
      // Don't persist mock data in dev unless we have a token (for testing notifications)
      if (process.env.NODE_ENV === 'development' && newState.fcmToken === null) {
          setState(newState);
          return;
      }
      
      setState(newState);
      if (typeof window !== 'undefined') {
        try {
            // Ensure we are saving a valid fcmToken state
            const stateToSave = {
                ...newState,
                prises: newState.prises.map(d => ({...d, time: d.time.toISOString()}))
            };
            localStorage.setItem('prepState', JSON.stringify(stateToSave));
            
            // Sync state with Firestore if push is enabled, and we have a token
            if (newState.pushEnabled && newState.fcmToken) {
                 fetch('/api/subscription', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ token: newState.fcmToken, state: stateToSave })
                }).catch(err => console.error("Failed to sync state to server:", err));
            }
        } catch (e) {
            console.error("Could not save state", e);
        }
      }
  }, []);
  
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || !navigator.serviceWorker) {
        toast({ title: "Navigateur non compatible", variant: "destructive" });
        return false;
    }
    setIsPushLoading(true);

    try {
        const permission = await Notification.requestPermission();
        setPushPermissionStatus(permission);

        if (permission !== 'granted') {
            toast({ title: "Notifications refusées", description: "Vous pouvez les réactiver dans les paramètres de votre navigateur.", variant: "destructive" });
            saveState({...state, pushEnabled: false, fcmToken: null});
            setIsPushLoading(false);
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const messaging = getMessaging(app);
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!vapidKey) {
            console.error("VAPID public key not found in environment variables.");
            toast({ title: "Erreur de configuration", description: "La clé de notification est manquante.", variant: "destructive" });
            setIsPushLoading(false);
            return false;
        }

        const fcmToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

        if (fcmToken) {
            saveState({...state, pushEnabled: true, fcmToken });
            toast({ title: "Notifications activées!" });
        } else {
            toast({ title: "Impossible de récupérer le token", variant: "destructive" });
            saveState({...state, pushEnabled: false, fcmToken: null });
        }

        setIsPushLoading(false);
        return !!fcmToken;
    } catch (error) {
        console.error("Error getting FCM token:", error);
        toast({ title: "Erreur d'abonnement", variant: "destructive" });
        saveState({...state, pushEnabled: false, fcmToken: null });
        setIsPushLoading(false);
        return false;
    }
  }, [state, saveState, toast]);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (state.fcmToken) {
      setIsPushLoading(true);
      try {
        await fetch('/api/subscription', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ token: state.fcmToken })
        });
        saveState({...state, pushEnabled: false, fcmToken: null});
        toast({ title: "Notifications désactivées." });
      } catch (error) {
         console.error("Error unsubscribing:", error);
         toast({ title: "Erreur lors de la désinscription", variant: "destructive" });
      } finally {
        setIsPushLoading(false);
      }
    } else {
        saveState({...state, pushEnabled: false, fcmToken: null});
    }
  }, [state, saveState, toast]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      setPushPermissionStatus(currentPermission);
      
      const initializeMessaging = async () => {
         if (currentPermission === 'granted') {
            setIsPushLoading(true);
            try {
              const registration = await navigator.serviceWorker.ready;
              const messaging = getMessaging(app);
              if (!state.fcmToken) {
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (vapidKey) {
                  const fcmToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
                  if (fcmToken) {
                    saveState({ ...state, fcmToken, pushEnabled: true });
                  } else {
                    saveState({ ...state, pushEnabled: false, fcmToken: null });
                  }
                }
              } else if (!state.pushEnabled) {
                 saveState({ ...state, pushEnabled: true });
              }
            } catch (err) {
              console.error("Error initializing messaging on mount", err);
              saveState({ ...state, pushEnabled: false, fcmToken: null });
            } finally {
               setIsPushLoading(false);
            }
        } else {
            setIsPushLoading(false);
        }
      };

      initializeMessaging();
    } else {
        setIsPushLoading(false);
    }
    
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      try {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          console.log("Message received. ", payload);
          toast({
            title: payload.notification?.title,
            description: payload.notification?.body,
          });
        });
      } catch (err) {
        console.error("Error getting messaging instance:", err)
      }
    }

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    // This effect runs only once on the client to load the state from localStorage
    if(isClient && process.env.NODE_ENV !== 'development') {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) {
            setState(savedState);
        }
    }
  }, [isClient]);

  const startSession = useCallback((time: Date) => {
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    const newPrises = [newDose];
    saveState({ ...defaultState, prises: newPrises, sessionActive: true, pushEnabled: state.pushEnabled, fcmToken: state.fcmToken });
  }, [saveState, state.pushEnabled, state.fcmToken]);

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
    setState({ ...defaultState, pushEnabled: state.pushEnabled, fcmToken: state.fcmToken });
    toast({ title: "Données effacées", description: "Votre historique et vos préférences ont été supprimés." });
  }, [state.pushEnabled, state.fcmToken, toast]);

    const formatCountdown = (endDate: Date) => {
    const milliseconds = differenceInMilliseconds(endDate, now);
    if (milliseconds <= 0) return "0s";
    
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (hours === 0) { 
        parts.push(`${seconds}s`);
    }

    return parts.join(' ');
  };
  
  const allPrises = state.prises.filter(d => d.type !== 'stop').sort((a, b) => b.time.getTime() - a.time.getTime());
  const lastDose = allPrises[0] ?? null;
  const secondToLastDose = allPrises[1] ?? null;
  
  const firstDoseInSession = state.prises.find(d => d.type === 'start');

  let status: PrepStatus = 'inactive';
  let statusColor = 'bg-gray-500';
  let statusText = 'Inactive';
  let nextDoseIn = '';
  let protectionStartsIn = '';
  let protectionEndsAtText = '';

 if (isClient && state.sessionActive) {
    if (allPrises.length >= 3 && secondToLastDose) {
      protectionEndsAtText = `Vos rapports sont protégés jusqu'au ${format(secondToLastDose.time, 'eeee dd MMMM HH:mm', { locale: fr })}`;
    } else if (allPrises.length === 2 && secondToLastDose) {
      protectionEndsAtText = `Si vous continuez les prises vos rapports avant le ${format(secondToLastDose.time, 'eeee dd MMMM HH:mm', { locale: fr })} seront protégés`;
    } else if (allPrises.length === 1) {
      protectionEndsAtText = "Vos rapports seront protégés par la PrEP si vous continuez les prises pendant 2 jours après ce début de session";
    }
  } else if (isClient && !state.sessionActive && lastDose && secondToLastDose) {
      protectionEndsAtText = `Protection résiduelle jusqu'au ${format(add(lastDose.time, { hours: FINAL_PROTECTION_HOURS }), 'eeee dd MMMM HH:mm', { locale: fr })}`;
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
      protectionStartsIn = `Sera active dans ${formatCountdown(protectionStartTime)}`;
    } else if (isBefore(now, reminderWindowStartTime)) {
      status = 'effective';
      statusColor = 'bg-accent';
      statusText = 'Protection active';
      nextDoseIn = `Prochaine prise dans ${formatCountdown(reminderWindowStartTime)}`;
    } else if (isBefore(now, reminderWindowEndTime)) {
        status = 'effective';
        statusColor = 'bg-accent';
        statusText = 'Protection active';
        const timeLeft = formatCountdown(reminderWindowEndTime);
        if (timeLeft !== "0s") {
            nextDoseIn = `Il vous reste ${timeLeft} pour prendre un comprimé`;
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
    pushEnabled: state.pushEnabled,
    isPushLoading,
    pushPermissionStatus,
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

    