
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Dose, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS, FINAL_PROTECTION_HOURS } from '@/lib/constants';
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
    permissionStatus: 'loading',
};

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
                      permissionStatus: undefined, // Don't save permission status, check on load
                  };
                  localStorage.setItem('prepState', JSON.stringify(stateToSave));
              } catch (e) {
                  console.error("Could not save state to localStorage", e);
              }
          }
          return updatedState;
      });
  }, []);

  const checkNotificationPermission = useCallback(async (isInitialCheck = false) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setState(prevState => ({...prevState, permissionStatus: 'unsupported' }));
        return;
    }
    
    let hasEverBeenGranted = localStorage.getItem('notificationPermissionEverGranted') === 'true';

    if (hasEverBeenGranted) {
        setState(prevState => ({...prevState, permissionStatus: 'granted' }));
        return;
    }

    const currentPermission = Notification.permission;
    if (currentPermission === 'granted') {
        localStorage.setItem('notificationPermissionEverGranted', 'true');
        setState(prevState => ({...prevState, permissionStatus: 'granted' }));
    } else if (currentPermission === 'denied') {
        setState(prevState => ({...prevState, permissionStatus: 'denied' }));
    } else {
        if (isInitialCheck) {
            setState(prevState => ({...prevState, permissionStatus: 'prompt' }));
        } else {
            // This is a request, not just a check
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                localStorage.setItem('notificationPermissionEverGranted', 'true');
                setState(prevState => ({...prevState, permissionStatus: 'granted' }));
                togglePushNotifications(true, true); // Force enable notifications after grant
            } else {
                setState(prevState => ({...prevState, permissionStatus: 'denied' }));
            }
        }
    }
  }, [saveState]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) {
            setState(prevState => ({...prevState, ...savedState}));
        }

        checkNotificationPermission(true);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
              .catch(error => console.error('Erreur Service Worker:', error));
        }

        const timer = setInterval(() => setNow(new Date()), 1000 * 60);
        return () => clearInterval(timer);
    }
  }, [checkNotificationPermission]);


  const togglePushNotifications = useCallback(async (enabled: boolean, forceSubscription = false) => {
    if (enabled) {
      if (!VAPID_PUBLIC_KEY) {
        console.error("VAPID public key not found.");
        toast({ title: "Erreur de configuration", description: "La clé de notification est manquante.", variant: "destructive" });
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        let sub = await registration.pushManager.getSubscription();
        if (!sub || forceSubscription) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }
        saveState({ pushEnabled: true });
        toast({ title: "Notifications activées !" });
      } catch (error) {
        console.error("Error subscribing:", error);
        toast({ title: "Erreur d'abonnement", variant: "destructive" });
        saveState({ pushEnabled: false }); // Revert on failure
      }
    } else {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
        saveState({ pushEnabled: false });
        toast({ title: "Notifications désactivées." });
      } catch (error) {
        console.error("Error unsubscribing:", error);
        toast({ title: "Erreur de désabonnement", variant: "destructive" });
      }
    }
  }, [saveState, toast]);

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
    saveState({ ...defaultState, pushEnabled: state.pushEnabled, permissionStatus: state.permissionStatus });
    toast({ title: "Données effacées", description: "Votre historique et vos préférences ont été supprimés." });
  }, [saveState, state.pushEnabled, state.permissionStatus, toast]);

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
      statusText = `Sera effective ${formatDistanceToNowStrict(protectionStartTime, { addSuffix: true, locale: fr })}`;
      protectionStartsIn = `à ${format(protectionStartTime, 'HH:mm', { locale: fr })}`;
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
    requestNotificationPermission: () => checkNotificationPermission(false),
  };
}

    