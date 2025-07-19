
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
    pushEnabled: false
};


export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const [state, setState] = useState<PrepState>(defaultState);
  
  const updateSubscriptionOnServer = useCallback(async (sub: PushSubscription | null) => {
    if (sub) {
        try {
            const response = await fetch('/api/saveSubscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sub.toJSON()),
            });
            if (!response.ok) {
                throw new Error('Server response was not ok.');
            }
        } catch (e) {
            console.error("Failed to save subscription", e);
            toast({
                title: "Erreur serveur",
                description: "Impossible de sauvegarder les préférences de notification.",
                variant: "destructive",
            });
        }
    }
  }, [toast]);
  
  const updateSubscriptionObject = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        if (sub) {
            setState(prevState => ({...prevState, pushEnabled: true}));
        } else {
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
    return () => {
        clearInterval(timer);
    };
  }, [updateSubscriptionObject]);

  useEffect(() => {
    if (isClient) {
        localStorage.setItem('prepState', JSON.stringify({
            ...state,
            doses: state.doses.map(d => ({...d, time: new Date(d.time).toISOString()}))
        }));

        if (state.sessionActive && subscription) {
            fetch('/api/saveState', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    state: {
                        ...state,
                        doses: state.doses.map(d => ({...d, time: new Date(d.time).toISOString()}))
                    }
                })
            });
        }
    }
  }, [state, isClient, subscription]);

  const addDose = useCallback((dose: { time: Date; pills: number }) => {
    setState(prevState => {
      const newDoses = [...prevState.doses, { ...dose, type: 'dose' as const }]
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      return { ...prevState, sessionActive: true, doses: newDoses };
    });
  }, []);

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
    
    const newDose = { time, pills: 2, type: 'start' as const };
    
    setState(prevState => {
        const updatedDoses = [newDose].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        const newState = {
            ...prevState,
            doses: updatedDoses,
            sessionActive: true,
            pushEnabled: true,
        };
        return newState;
    });
    
  }, [requestNotificationPermission, toast]);

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
    if (subscription) {
      fetch('/api/deleteState', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    }
    localStorage.removeItem('prepState');
    setState(defaultState);
    updateSubscriptionObject();
    toast({ title: "Données effacées", description: "Votre historique local a été supprimé." });
  }, [updateSubscriptionObject, toast, subscription]);
  
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
