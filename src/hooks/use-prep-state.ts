
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, format, isAfter, isBefore, differenceInMilliseconds } from 'date-fns';
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
            
            // Sync state with Firestore if we have a token.
            if (newState.fcmToken) {
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
            // Save the "disabled" preference but keep the current state otherwise
            setState(prevState => {
                const newState = {...prevState, pushEnabled: false };
                saveState(newState); // Save the fact that user disabled it
                return newState;
            });
            setIsPushLoading(false);
            return false;
        }

        // Wait for the service worker to be ready
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
            setState(prevState => {
                const newState = {...prevState, pushEnabled: true, fcmToken };
                saveState(newState); // Immediately save the new state with the token
                return newState;
            });
            toast({ title: "Notifications activées!" });
        } else {
            toast({ title: "Impossible de récupérer le token", variant: "destructive" });
            setState(prevState => {
                const newState = {...prevState, pushEnabled: false, fcmToken: null };
                saveState(newState);
                return newState;
            });
        }

        setIsPushLoading(false);
        return !!fcmToken;
    } catch (error) {
        console.error("Error getting FCM token:", error);
        toast({ title: "Erreur d'abonnement", variant: "destructive" });
        setState(prevState => {
             const newState = {...prevState, pushEnabled: false, fcmToken: null };
             saveState(newState);
             return newState;
        });
        setIsPushLoading(false);
        return false;
    }
  }, [saveState, toast]);

  const unsubscribeFromNotifications = useCallback(async () => {
    const fcmToken = state.fcmToken;
    if (fcmToken) {
      setIsPushLoading(true);
      try {
        await fetch('/api/subscription', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ token: fcmToken })
        });
        
        setState(prevState => {
            const newState = {...prevState, pushEnabled: false, fcmToken: null};
            saveState(newState);
            return newState;
        });
        toast({ title: "Notifications désactivées." });

      } catch (error) {
         console.error("Error unsubscribing:", error);
         toast({ title: "Erreur lors de la désinscription", variant: "destructive" });
      } finally {
        setIsPushLoading(false);
      }
    } else {
        // If there's no token, just update the state preference
        setState(prevState => {
            const newState = {...prevState, pushEnabled: false};
            saveState(newState);
            return newState;
        });
    }
  }, [state.fcmToken, saveState, toast]);

  // This useEffect only runs once on the client to initialize state and listeners.
  useEffect(() => {
    setIsClient(true);

    // Load state from localStorage on initial client render
    if (process.env.NODE_ENV !== 'development') {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) {
            setState(savedState);
        }
    }
    
    // Set initial permission status from the browser & set up listener
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermissionStatus(Notification.permission);
      try {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log("Message received. ", payload);
          toast({
            title: payload.notification?.title,
            description: payload.notification?.body,
          });
        });
        return () => unsubscribe();
      } catch (err) {
        console.error("Error setting up onMessage listener:", err)
      }
    }

    setIsPushLoading(false);

  }, [toast]);
  
  // This useEffect only runs a timer to update the 'now' state
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startSession = useCallback((time: Date) => {
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    const newPrises = [newDose];
    // Preserve notification settings on new session
    setState(prevState => {
        const newState = { ...defaultState, prises: newPrises, sessionActive: true, pushEnabled: prevState.pushEnabled, fcmToken: prevState.fcmToken };
        saveState(newState);
        return newState;
    });
  }, [saveState]);

  const addDose = useCallback((prise: { time: Date; pills: number }) => {
    const newDose = { ...prise, type: 'dose' as const, id: new Date().toISOString() };
    setState(prevState => {
        const newPrises = [...prevState.prises, newDose].sort((a, b) => a.time.getTime() - b.time.getTime());
        const newState = { ...prevState, prises: newPrises };
        saveState(newState);
        return newState;
    });
  }, [saveState]);

  const endSession = useCallback(() => {
    const stopEvent = { time: new Date(), pills: 0, type: 'stop' as const, id: new Date().toISOString() };
    setState(prevState => {
        const updatedDoses = [...prevState.prises, stopEvent];
        const newState = { ...prevState, sessionActive: false, prises: updatedDoses };
        saveState(newState);
        return newState;
    });
    toast({ title: "Session terminée", description: "Les rappels de notification sont maintenant arrêtés." });
  }, [saveState, toast]);

  const clearHistory = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
        setState(createMockData());
        toast({ title: "Données de test rechargées" });
        return;
    }
    
    if (typeof window !== 'undefined') {
        localStorage.removeItem('prepState');
    }
    // Preserve notification settings on clear
    setState(prevState => {
        const newState = { ...defaultState, pushEnabled: prevState.pushEnabled, fcmToken: prevState.fcmToken };
        saveState(newState);
        return newState;
    });
    toast({ title: "Données effacées", description: "Votre historique et vos préférences ont été supprimés." });
  }, [saveState, toast]);

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

 if (isClient && state.sessionActive && lastDose) {
    if (allPrises.length >= 3 && secondToLastDose) {
      protectionEndsAtText = `Vos rapports sont protégés jusqu'au ${format(add(lastDose.time, { hours: FINAL_PROTECTION_HOURS }), 'eeee dd MMMM HH:mm', { locale: fr })}`;
    } else if (allPrises.length === 2 && firstDoseInSession) {
      protectionEndsAtText = `Si vous continuez les prises vos rapports avant le ${format(firstDoseInSession.time, 'eeee dd MMMM HH:mm', { locale: fr })} seront protégés`;
    } else if (allPrises.length === 1) {
      protectionEndsAtText = "Vos rapports seront protégés par la PrEP si vous continuez les prises pendant 2 jours après ce début de session";
    }
  } else if (isClient && !state.sessionActive && lastDose) {
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

    