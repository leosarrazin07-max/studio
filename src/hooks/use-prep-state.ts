"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore } from 'date-fns';
import type { Dose, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { saveSubscription, scheduleDoseReminders } from '@/ai/flows/notification-flow';

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

const requestNotificationPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await saveSubscription(subscription.toJSON());

    return true;
}

export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();

  const [state, setState] = useState<PrepState>({
    doses: [],
    sessionActive: false,
  });

  useEffect(() => {
    setIsClient(true);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.ts')
        .then(registration => console.log('Service Worker enregistré avec succès:', registration))
        .catch(error => console.error('Erreur lors de l’enregistrement du Service Worker:', error));
    }

    const savedState = safelyParseJSON(localStorage.getItem('prepState'));
    if (savedState) {
      setState({
        ...savedState,
        doses: savedState.doses.map((d: Dose) => ({ ...d, time: new Date(d.time) })),
      });
    }

    const timer = setInterval(() => setNow(new Date()), 1000 * 60); // Update every minute
    return () => {
        clearInterval(timer);
    };
  }, []);

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
    setState(prevState => {
      const newDoses = [...prevState.doses, { time: dose.time, pills: dose.pills }]
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      if (newDoses.length > 0) {
        scheduleDoseReminders({
            lastDoseTime: newDoses[newDoses.length - 1].time.toISOString(),
            firstDoseTime: newDoses[0].time.toISOString(),
            isFirstDose: false
        });
      }

      return { ...prevState, doses: newDoses };
    });
  }, []);

  const startSession = useCallback(async (time: Date) => {
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
        toast({
            title: "Notifications refusées",
            description: "Les rappels ne fonctionneront pas. Vous pouvez les activer dans les paramètres de votre navigateur.",
            variant: "destructive"
        })
    }
    const newDose = { time, pills: 2 };
    setState({
      doses: [newDose],
      sessionActive: true,
    });
    scheduleDoseReminders({
        lastDoseTime: newDose.time.toISOString(),
        firstDoseTime: newDose.time.toISOString(),
        isFirstDose: true
    });
  }, [toast]);

  const endSession = useCallback(() => {
    // Here you might want to call a flow to clear server-side notifications
    setState({
      doses: [],
      sessionActive: false,
    });
  }, []);
  
  const lastDose = state.doses.length > 0 ? state.doses[state.doses.length - 1] : null;

  let status: PrepStatus = 'inactive';
  let statusColor = 'bg-gray-500';
  let statusText = 'Inactive';
  let nextDoseIn = '';
  let protectionStartsIn = '';
  let timeSinceMissed = '';

  if (isClient && state.sessionActive && lastDose) {
    const lastDoseTime = new Date(lastDose.time);
    const protectionStartTime = add(new Date(state.doses[0].time), { hours: PROTECTION_START_HOURS });
    const nextDoseDueTime = add(lastDoseTime, { hours: DOSE_INTERVAL_HOURS });
    const protectionLapsesTime = add(lastDoseTime, { hours: LAPSES_AFTER_HOURS });

    if (isBefore(now, protectionStartTime)) {
      status = 'loading';
      statusColor = 'bg-yellow-500';
      statusText = 'Loading...';
      protectionStartsIn = formatDistanceToNowStrict(protectionStartTime, { addSuffix: true });
    } else if (isBefore(now, protectionLapsesTime)) {
      status = 'effective';
      statusColor = 'bg-blue-500';
      statusText = 'Effective';
      nextDoseIn = formatDistanceToNowStrict(nextDoseDueTime, { addSuffix: true });
    } else {
      status = 'missed';
      statusColor = 'bg-destructive';
      statusText = 'Dose Missed';
      timeSinceMissed = formatDistanceToNowStrict(nextDoseDueTime, { addSuffix: true });
    }
  }

  if (!isClient) {
    statusText = "Loading...";
    statusColor = "bg-gray-300";
  }


  return {
    ...state,
    doses: state.doses.filter(dose => isAfter(new Date(dose.time), sub(now, { days: MAX_HISTORY_DAYS }))),
    status,
    statusColor,
    statusText,
    nextDoseIn,
    protectionStartsIn,
    timeSinceMissed,
    addDose,
    startSession,
    endSession,
  };
}
