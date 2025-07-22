
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Dose, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS, FINAL_PROTECTION_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { getFirestore, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase-client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const firestore = getFirestore(app);


function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

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
    if (parsed.nextNotificationTime && typeof parsed.nextNotificationTime === 'object' && parsed.nextNotificationTime.value) {
        parsed.nextNotificationTime = new Date(parsed.nextNotificationTime.value);
    } else if (typeof parsed.nextNotificationTime === 'string') {
        parsed.nextNotificationTime = new Date(parsed.nextNotificationTime);
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
    protectionNotified: false,
    nextNotificationTime: null,
};

const hashEndpoint = (endpoint: string) => {
    // Simple hash function, not for crypto, just for a unique ID
    let hash = 0;
    for (let i = 0; i < endpoint.length; i++) {
        const char = endpoint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return 'sub_' + Math.abs(hash).toString(16);
}


export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [state, setState] = useState<PrepState>(defaultState);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const calculateNextNotificationTime = useCallback((doses: Dose[], protectionNotified: boolean | undefined): Date | null => {
    if (!doses || doses.length === 0) return null;

    const firstDose = doses.find(d => d.type === 'start');
    const lastDose = doses.filter(d => d.type !== 'stop').sort((a,b) => b.time.getTime() - a.time.getTime())[0] ?? null;
    
    if (!firstDose) return null;

    const protectionStartTime = add(firstDose.time, { hours: PROTECTION_START_HOURS });
    if (!protectionNotified && isAfter(protectionStartTime, new Date())) {
        return protectionStartTime;
    }

    if (lastDose) {
      return add(lastDose.time, { hours: DOSE_INTERVAL_HOURS });
    }
    
    return null;
  }, []);
  
  const updateSubscriptionOnServer = useCallback(async (sub: PushSubscription | null) => {
    if (!sub) return;
    try {
        const id = hashEndpoint(sub.endpoint);
        setSubscriptionId(id);
        const subRef = doc(firestore, "subscriptions", id);
        const subJson = sub.toJSON();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await setDoc(subRef, { ...subJson, timezone }, { merge: true });
    } catch (e) {
        console.error("Failed to save subscription", e);
        toast({
            title: "Erreur serveur",
            description: "Impossible de sauvegarder les préférences de notification.",
            variant: "destructive",
        });
    }
  }, [toast]);
  
  const updateSubscriptionObject = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
            setSubscription(sub);
            setSubscriptionId(hashEndpoint(sub.endpoint));
            setState(prevState => ({...prevState, pushEnabled: true}));
        } else {
            setSubscription(null);
            setSubscriptionId(null);
            setState(prevState => ({...prevState, pushEnabled: false}));
        }
      } catch (error) {
        console.error("Error getting push subscription:", error);
        setSubscription(null);
        setState(prevState => ({...prevState, pushEnabled: false}));
      }
    }
  }, []);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (subscription && subscriptionId) {
      await subscription.unsubscribe();
      try {
          const subRef = doc(firestore, "subscriptions", subscriptionId);
          await deleteDoc(subRef);
          // Also delete state from server
          const stateRef = doc(firestore, "states", subscriptionId);
          await deleteDoc(stateRef);

      } catch(e) {
          console.error("Failed to delete subscription/state from server", e);
      }
      setSubscription(null);
      setSubscriptionId(null);
      setState(prevState => ({...prevState, pushEnabled: false}));
      toast({ title: "Notifications désactivées." });
    }
  }, [subscription, subscriptionId, toast]);


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
            toast({
                title: "Notifications refusées",
                description: "Les rappels ne fonctionneront pas. Vous pouvez les activer dans les paramètres de votre navigateur.",
                variant: "destructive"
            });
            setState(prevState => ({...prevState, pushEnabled: false}));
            return false;
        }

        let currentSubscription = await registration.pushManager.getSubscription();
        if (!currentSubscription) {
            currentSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
        }
        
        setSubscription(currentSubscription);
        await updateSubscriptionOnServer(currentSubscription);
        
        setState(prevState => ({...prevState, pushEnabled: true}));
        toast({ title: "Notifications activées!" });
        return true;
    } catch (error) {
        console.error("Error subscribing to push notifications:", error);
        toast({
            title: "Erreur d'abonnement",
            description: "Impossible de s'abonner aux notifications. Veuillez réessayer.",
            variant: "destructive"
        });
        setState(prevState => ({...prevState, pushEnabled: false}));
        return false;
    }
  }, [toast, updateSubscriptionOnServer]);


  useEffect(() => {
    setIsClient(true);
    
    if ('serviceWorker' in navigator && window.Worker) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('Service Worker enregistré avec succès:', registration);
            updateSubscriptionObject();
        })
        .catch(error => console.error('Erreur lors de l’enregistrement du Service Worker:', error));
    }

    const savedState = safelyParseJSON(localStorage.getItem('prepState'));
    if (savedState) {
      setState(savedState);
    }

    const timer = setInterval(() => setNow(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, [updateSubscriptionObject]);

  // Sync state to Firestore and localStorage
  useEffect(() => {
    if (isClient) {
        const nextNotificationTime = calculateNextNotificationTime(state.doses, state.protectionNotified);
        
        // Prep state for JSON serialization
        const stateToSave = {
          ...state,
          doses: state.doses.map(d => ({...d, time: d.time.toISOString()})),
          nextNotificationTime: nextNotificationTime ? nextNotificationTime.toISOString() : null,
        };

        localStorage.setItem('prepState', JSON.stringify(stateToSave));

        // Save to Firestore if push is enabled and session is active
        if (subscriptionId && state.sessionActive) {
            const stateRef = doc(firestore, "states", subscriptionId);
            setDoc(stateRef, stateToSave, { merge: true }).catch(e => {
                console.error("Failed to save state to server", e);
            });
        }
    }
  }, [state, isClient, subscriptionId, calculateNextNotificationTime]);


  const addDose = useCallback((dose: { time: Date; pills: number }) => {
    setState(prevState => {
      const newDose = { ...dose, type: 'dose' as const, id: new Date().toISOString() };
      const newDoses = [...prevState.doses, newDose]
        .sort((a, b) => a.time.getTime() - b.time.getTime());
      
      const nextNotificationTime = calculateNextNotificationTime(newDoses, prevState.protectionNotified);

      return { ...prevState, sessionActive: true, doses: newDoses, nextNotificationTime: nextNotificationTime };
    });
  }, [calculateNextNotificationTime]);

  const startSession = useCallback(async (time: Date) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
        toast({
            title: "Action impossible",
            description: "L'autorisation de notification est requise pour démarrer une session.",
            variant: "destructive"
        });
        return;
    }
    
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    
    setState(prevState => {
        const updatedDoses = [newDose].sort((a, b) => a.time.getTime() - b.time.getTime());
        const nextNotificationTime = calculateNextNotificationTime(updatedDoses, false);
        const newState: PrepState = {
            ...defaultState,
            pushEnabled: true, // It must be true if we got here
            doses: updatedDoses,
            sessionActive: true,
            protectionNotified: false,
            nextNotificationTime: nextNotificationTime,
        };
        return newState;
    });
    
  }, [requestNotificationPermission, toast, calculateNextNotificationTime]);

  const endSession = useCallback(() => {
    setState(prevState => {
        const stopEvent = { time: new Date(), pills: 0, type: 'stop' as const, id: new Date().toISOString() };
        const updatedDoses = [...prevState.doses, stopEvent].sort((a, b) => a.time.getTime() - b.time.getTime());
        return { ...prevState, sessionActive: false, doses: updatedDoses, nextNotificationTime: null };
    });

    if (subscriptionId) {
        const stateRef = doc(firestore, "states", subscriptionId);
        deleteDoc(stateRef).catch(e => console.error("Could not delete server state.", e));
    }

    toast({
        title: "Session terminée",
        description: "Les rappels de notification sont maintenant arrêtés."
    });
  }, [toast, subscriptionId]);

  const clearHistory = useCallback(async () => {
    await unsubscribeFromNotifications(); // This will also delete server state
    
    localStorage.removeItem('prepState');
    setState({
        ...defaultState,
        pushEnabled: false, // after unsubscribing, it is false
    });
    
    toast({ title: "Données effacées", description: "Votre historique et vos préférences de notification ont été supprimés." });
  }, [unsubscribeFromNotifications, toast]);
  
  const lastDose = state.doses.filter(d => d.type !== 'stop').sort((a,b) => b.time.getTime() - a.time.getTime())[0] ?? null;

  let status: PrepStatus = 'inactive';
  let statusColor = 'bg-gray-500';
  let statusText = 'Inactive';
  let nextDoseIn = '';
  let protectionStartsIn = '';
  let protectionEndsAtText = '';

  const firstDoseInSession = state.doses.find(d => d.type === 'start');

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

  const dosesAsDates = state.doses.map(d => ({ ...d, time: new Date(d.time) }));
  
  const nextNotificationTimeAsDate = state.nextNotificationTime ? new Date(state.nextNotificationTime) : null;

  return {
    ...state,
    nextNotificationTime: nextNotificationTimeAsDate,
    doses: dosesAsDates.filter(dose => isAfter(dose.time, sub(now, { days: MAX_HISTORY_DAYS }))),
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
