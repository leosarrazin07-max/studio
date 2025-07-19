
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Dose, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS, FINAL_PROTECTION_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';


const VAPID_PUBLIC_KEY = 'BGEPqO_1POfO9s3j01tpkLdYd-v1jYYtMGTcwaxgQ2I_exGj155R8Xk-sXeyV6ORHIq8n4XhGzAsaKxV9wJzO6w';

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
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
};

const defaultState: PrepState = {
    doses: [],
    sessionActive: false,
    pushEnabled: false
};


export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const [state, setState] = useState<PrepState>(defaultState);
  
  const updateSubscriptionObject = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        if (sub) {
            // If a subscription exists, it means permission was granted.
            // Sync the `pushEnabled` state.
            setState(prevState => ({...prevState, pushEnabled: true}));
        }
      } catch (error) {
        console.error("Error getting push subscription:", error);
        setSubscription(null);
      }
    }
  }, []);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (subscription) {
      
      await subscription.unsubscribe();
      setSubscription(null);
      setState(prevState => ({...prevState, pushEnabled: false}));
      toast({ title: "Notifications désactivées." });
    }
  }, [subscription, toast]);


  const requestNotificationPermission = useCallback(async () => {
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
  }, [toast]);


  useEffect(() => {
    setIsClient(true);
    
    if ('serviceWorker' in navigator && window.Worker) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('Service Worker enregistré avec succès:', registration);
            // This will now sync both the subscription object and pushEnabled state
            updateSubscriptionObject();
        })
        .catch(error => console.error('Erreur lors de l’enregistrement du Service Worker:', error));
    }

    const savedState = safelyParseJSON(localStorage.getItem('prepState'));
    if (savedState) {
        // When loading from storage, ensure we respect the saved `pushEnabled` state.
        // `updateSubscriptionObject` will later align it if needed.
      setState(savedState);
    }

    const timer = setInterval(() => setNow(new Date()), 1000 * 60); // Update every minute
    return () => {
        clearInterval(timer);
    };
  }, [updateSubscriptionObject]);

  useEffect(() => {
    if (isClient) {
       const stateToSave = {
        ...state,
        doses: state.doses.map(d => ({...d, time: new Date(d.time).toISOString()}))
       }
       localStorage.setItem('prepState', JSON.stringify(stateToSave));
    }
  }, [state, isClient]);

  const addDose = useCallback((dose: { time: Date; pills: number }) => {
    if(!state.pushEnabled || !subscription?.endpoint) {
        toast({
            title: "Notifications désactivées",
            description: "Veuillez activer les notifications pour planifier des rappels.",
            variant: "destructive"
        });
    }
    
    setState(prevState => {
      const newDoses = [...prevState.doses, { ...dose, type: 'dose' as const }]
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      return { ...prevState, sessionActive: true, doses: newDoses };
    });
  }, [subscription, toast, state.pushEnabled]);

  const startSession = useCallback(async (time: Date) => {
    const hasPermission = state.pushEnabled || await requestNotificationPermission();
    if (!hasPermission) {
        toast({
            title: "Action impossible",
            description: "L'autorisation de notification est requise pour démarrer une session.",
            variant: "destructive"
        });
        return;
    }
    
    const newDose = { time, pills: 2, type: 'start' as const };
    
    setState(prevState => {
        const updatedDoses = [newDose].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        const newState = {
            ...prevState,
            doses: updatedDoses,
            sessionActive: true,
        };
        return newState;
    });
    
  }, [requestNotificationPermission, state.pushEnabled, toast]);

  const endSession = useCallback(() => {
    setState(prevState => {
        const stopEvent = { time: new Date(), pills: 0, type: 'stop' as const };
        const updatedDoses = [...prevState.doses, stopEvent].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        return { ...prevState, sessionActive: false, doses: updatedDoses };
    });
    toast({
        title: "Session terminée",
        description: "Les rappels de notification sont maintenant arrêtés."
    });
  }, [toast]);

  const clearHistory = useCallback(() => {
    
    localStorage.removeItem('prepState');
    setState(defaultState); // Reset to the very default state
    updateSubscriptionObject();
    toast({ title: "Données effacées", description: "Votre historique local a été supprimé." });
  }, [updateSubscriptionObject, toast]);
  
  const lastDose = state.doses.filter(d => d.type !== 'stop').sort((a,b) => b.time.getTime() - a.time.getTime())[0] ?? null;

  let status: PrepStatus = 'inactive';
  let statusColor = 'bg-gray-500';
  let statusText = 'Inactive';
  let nextDoseIn = '';
  let protectionStartsIn = '';
  let protectionEndsAtText = '';

  const firstDoseInSession = state.doses.find(d => d.type === 'start');

  if (isClient && state.sessionActive && lastDose && firstDoseInSession) {
    const lastDoseTime = new Date(lastDose.time);
    const protectionStartTime = add(new Date(firstDoseInSession.time), { hours: PROTECTION_START_HOURS });
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
  } else if (isClient && !state.sessionActive && lastDose) {
    status = 'missed';
    statusColor = 'bg-destructive';
    statusText = 'Session terminée';
    const protectionEndsAt = add(new Date(lastDose.time), { hours: FINAL_PROTECTION_HOURS });
    protectionEndsAtText = `Protection assurée jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
  }

  if (!isClient) {
    statusText = "Chargement...";
    statusColor = "bg-muted";
  }

  // Ensure doses are Date objects for calculations, but they are stringified in localStorage
  const dosesAsDates = state.doses.map(d => ({ ...d, time: new Date(d.time) }));

  return {
    ...state,
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
