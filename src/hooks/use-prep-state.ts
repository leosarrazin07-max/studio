
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format, set, differenceInMilliseconds } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Prise, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, MAX_HISTORY_DAYS, FINAL_PROTECTION_HOURS, DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase-client";
import { getRemoteConfig, getString, fetchAndActivate } from "firebase/remote-config";


// --- MOCK DATA GENERATION FOR DEVELOPMENT ---
const createMockData = (): PrepState => {
    const mockPrises: Prise[] = [];
    const now = new Date();

    // To be in the 4-hour window, the last dose must be between 22 and 26 hours ago.
    // Let's set it to be 24 hours ago, so there are ~2 hours left.
    const lastDoseTime = sub(now, { hours: 24 });
    
    // We need to calculate when the first dose (start) was, assuming daily doses.
    // Let's say we have 10 doses total. The first dose was 9 days before the last dose.
    const firstDoseTime = sub(lastDoseTime, { days: 9 });

    // Initial dose (2 pills)
    mockPrises.push({
        time: firstDoseTime,
        pills: 2,
        type: 'start',
        id: `mock_0`
    });

    // Subsequent 9 daily doses (1 pill each)
    for (let i = 1; i <= 9; i++) {
        const doseTime = add(firstDoseTime, { days: i });
        mockPrises.push({
            time: doseTime,
            pills: 1,
            type: 'dose',
            id: `mock_${i}`
        });
    }

    return {
        prises: mockPrises.sort((a, b) => a.time.getTime() - b.time.getTime()), // Ensure they are sorted
        sessionActive: true, // Ensure the session is marked as active
        pushEnabled: false,
    };
};
// --- END MOCK DATA ---

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
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isPushLoading, setIsPushLoading] = useState(false);
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
            
            // This now sends the whole state to the server whenever it changes.
            // The server will decide if a notification needs to be scheduled.
            if (pushToken && newState.sessionActive) {
                 fetch('/api/tasks/notification', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ token: pushToken, state: stateToSave })
                }).catch(err => console.error("Failed to sync state to server:", err));
            }
        } catch (e) {
            console.error("Could not save state", e);
        }
      }
  }, [pushToken]);
  
  const getVapidKey = useCallback(async () => {
    if (typeof window === "undefined") return null;
    try {
        const remoteConfig = getRemoteConfig(app);
        // It's better to ensure config is fetched and activated once, early in the app lifecycle.
        // But for this hook, we'll do it here.
        await fetchAndActivate(remoteConfig);
        const vapidKey = getString(remoteConfig, "NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        if (vapidKey) {
            return vapidKey;
        } else {
             console.error("VAPID key not found in Remote Config.");
        }
    } catch (error) {
        console.error("Error fetching VAPID key from Remote Config:", error);
    }
    
    // Fallback to environment variable
    const localVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (localVapidKey) {
        return localVapidKey;
    }
    
    console.error("VAPID public key is not set in environment variables or Remote Config.");
    return null;
  }, []);
  
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
        toast({ title: "Navigateur non compatible", variant: "destructive" });
        return;
    }
    setIsPushLoading(true);
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            toast({ title: "Notifications refusées", description: "Vous pouvez les réactiver dans les paramètres de votre navigateur.", variant: "destructive" });
            saveState({ ...state, pushEnabled: false });
            setIsPushLoading(false);
            return;
        }

        const messaging = getMessaging(app);
        const vapidKey = await getVapidKey();
        if (!vapidKey) {
            toast({ title: "Erreur de configuration", description: "La clé de notification est manquante.", variant: "destructive" });
            setIsPushLoading(false);
            return;
        }
        
        const token = await getToken(messaging, { vapidKey });

        if (token) {
            await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            setPushToken(token);
            saveState({ ...state, pushEnabled: true });
            toast({ title: "Notifications activées!" });
        } else {
            saveState({ ...state, pushEnabled: false });
            toast({ title: "Erreur d'enregistrement", description: "Impossible d'obtenir le token de notification.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Error subscribing:", error);
        saveState({ ...state, pushEnabled: false });
        toast({ title: "Erreur d'abonnement", variant: "destructive" });
    } finally {
        setIsPushLoading(false);
    }
  }, [toast, state, saveState, getVapidKey]);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (pushToken) {
      setIsPushLoading(true);
      try {
        // Here you would also want to invalidate the token on the server
        await fetch('/api/subscription', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ token: pushToken })
        });
        
        // No need to call deleteToken() from 'firebase/messaging' as it's complex and often not needed.
        // Simply removing it from your server's database is the main goal.
        
        setPushToken(null);
        saveState({...state, pushEnabled: false});
        toast({ title: "Notifications désactivées." });
      } catch (error) {
         console.error("Error unsubscribing:", error);
         toast({ title: "Erreur lors de la désinscription", variant: "destructive" });
      } finally {
        setIsPushLoading(false);
      }
    }
  }, [pushToken, toast, state, saveState]);

  useEffect(() => {
    setIsClient(true);
    // Reload state from localStorage on mount in production.
    if (process.env.NODE_ENV !== 'development' && typeof window !== 'undefined') {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) {
            setState(savedState);
            if (savedState.pushEnabled) {
                // If the state thinks push is enabled, we should try to get the token again
                // This is a bit complex, so for now we just reflect the stored state
            }
        }
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        console.log("Message received. ", payload);
        toast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
      });
    }
    
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [toast]);


  const startSession = useCallback((time: Date) => {
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    const newPrises = [newDose];
    // We get the pushEnabled status from the *current* state, not a default.
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
    // When clearing history, we should also clear the push token state.
    // The user will be prompted again on next session start.
    setPushToken(null);
    setState({ ...defaultState, pushEnabled: false });
    toast({ title: "Données effacées", description: "Votre historique et vos préférences ont été supprimés." });
  }, [toast]);
  
  const formatCountdown = (endDate: Date) => {
    const milliseconds = differenceInMilliseconds(endDate, now);
    if (milliseconds <= 0) return "0s";
    
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    // Only show seconds if less than an hour remaining
    if (hours === 0 && minutes < 60) {
        parts.push(`${seconds}s`);
    }

    return parts.join(' ');
  };

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
    pushEnabled: state.pushEnabled && !!pushToken,
    isPushLoading,
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
