
"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, format, isAfter, isBefore, differenceInMilliseconds, differenceInHours } from 'date-fns';
import { fr, enUS, de, it, es, ru, uk, ar, tr, da, sv, nl, pt, sr, ro, pl, bg, hu, cs } from 'date-fns/locale';
import type { Prise, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, MAX_HISTORY_DAYS, DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { app } from "@/lib/firebase-client";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useI18n, useScopedI18n, useCurrentLocale } from '@/locales/client';

const dateLocales: { [key: string]: Locale } = {
  fr, en: enUS, de, it, es, ru, uk, ar, tr, da, sv, nl, pt, sr, ro, pl, bg, hu, cs
};

const createMockData = (): PrepState => {
    const mockPrises: Prise[] = [];
    const now = new Date();
    const firstDoseTime = sub(now, { days: 1 }); 
    const secondDoseTime = sub(now, { hours: 22, minutes: 5 }); 

    mockPrises.push({
        time: firstDoseTime,
        pills: 2,
        type: 'start',
        id: `mock_0`
    });

    mockPrises.push({
        time: secondDoseTime,
        pills: 1,
        type: 'dose',
        id: `mock_1`
    });

    return {
        prises: mockPrises.sort((a, b) => a.time.getTime() - b.time.getTime()),
        sessionActive: true,
        pushEnabled: false,
        fcmToken: null,
    };
};

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

  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const locale = dateLocales[currentLocale] || fr;
  const statusT = useScopedI18n('status');

  const saveState = useCallback((newState: PrepState) => {
      if (process.env.NODE_ENV === 'development' && newState.fcmToken === null) {
          setState(newState);
          return;
      }
      
      setState(newState);
      if (typeof window !== 'undefined') {
        try {
            const stateToSave = {
                ...newState,
                prises: newState.prises.map(d => ({...d, time: d.time.toISOString()}))
            };
            localStorage.setItem('prepState', JSON.stringify(stateToSave));
            
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
        toast({ title: t('notifications.toast.unsupported'), variant: "destructive" });
        setIsPushLoading(false);
        return false;
    }
    setIsPushLoading(true);

    try {
        const permission = await Notification.requestPermission();
        setPushPermissionStatus(permission);

        if (permission !== 'granted') {
            toast({ title: t('notifications.toast.denied.title'), description: t('notifications.toast.denied.description'), variant: "destructive" });
            const newState = {...state, pushEnabled: false, fcmToken: null};
            saveState(newState);
            setIsPushLoading(false);
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const messaging = getMessaging(app);
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!vapidKey) {
            console.error("VAPID public key not found in environment variables.");
            toast({ title: t('notifications.toast.configError.title'), description: t('notifications.toast.configError.description'), variant: "destructive" });
            setIsPushLoading(false);
            return false;
        }

        const fcmToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        
        if (fcmToken) {
             const newState = {...state, pushEnabled: true, fcmToken };
             saveState(newState);
             toast({ title: t('notifications.toast.enabled') });
        } else {
             const newState = {...state, pushEnabled: false, fcmToken: null };
             saveState(newState);
             toast({ title: t('notifications.toast.tokenError'), variant: "destructive" });
        }

        setIsPushLoading(false);
        return !!fcmToken;
    } catch (error) {
        console.error("Error getting FCM token:", error);
        toast({ title: t('notifications.toast.subscriptionError'), variant: "destructive" });
        const newState = {...state, pushEnabled: false, fcmToken: null };
        saveState(newState);
        setIsPushLoading(false);
        return false;
    }
  }, [state, saveState, toast, t]);

  const unsubscribeFromNotifications = useCallback(async () => {
    setIsPushLoading(true);
    const fcmToken = state.fcmToken;
    const newState = {...state, pushEnabled: false};
    saveState(newState);
    toast({ title: t('notifications.toast.disabled') });

    if (fcmToken) {
      try {
        await fetch('/api/subscription', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ token: fcmToken })
        });
      } catch (error) {
         console.error("Error unsubscribing:", error);
         toast({ title: t('notifications.toast.unsubscribeError'), variant: "destructive" });
      }
    }
    
    setIsPushLoading(false);
  }, [state, saveState, toast, t]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
        const savedState = safelyParseJSON(localStorage.getItem('prepState'));
        if (savedState) {
            setState(savedState);
        }
    }
    
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
          const savedState = safelyParseJSON(localStorage.getItem('prepState'));
          if (savedState) {
              setState(savedState);
          }
        });
        return () => unsubscribe();
      } catch (err) {
        console.error("Error setting up onMessage listener:", err)
      }
    }
  }, [toast]);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const permission = Notification.permission;
    if (permission === 'denied') {
        if(state.pushEnabled) {
            const newState = {...state, pushEnabled: false, fcmToken: null};
            saveState(newState);
        }
    }
    setIsPushLoading(false);
  }, [isClient, state.pushEnabled, saveState]);

  const startSession = useCallback((time: Date) => {
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    const newPrises = [newDose];
    const newState = { ...defaultState, prises: newPrises, sessionActive: true, pushEnabled: state.pushEnabled, fcmToken: state.fcmToken };
    saveState(newState);
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
    toast({ title: t('session.end.toast.title'), description: t('session.end.toast.description') });
  }, [state, saveState, toast, t]);

  const clearHistory = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
        setState(createMockData());
        toast({ title: t('session.clear.toast.dev') });
        return;
    }
    
    if (typeof window !== 'undefined') {
        localStorage.removeItem('prepState');
    }
    const newState = { ...defaultState, pushEnabled: state.pushEnabled, fcmToken: state.fcmToken };
    saveState(newState);
    toast({ title: t('session.clear.toast.title'), description: t('session.clear.toast.description') });
  }, [state.pushEnabled, state.fcmToken, toast, saveState, t]);

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
  
  const firstDoseInSession = state.prises.find(d => d.type === 'start');

  let status: PrepStatus = 'inactive';
  let statusColor = 'bg-gray-500';
  let statusText = statusT('inactive');
  let nextDoseIn = '';
  let protectionStartsIn = '';
  let protectionEndsAtText = '';

  if (isClient && state.prises.length > 0) {
    const sortedPrises = state.prises
      .filter(d => d.type !== 'stop')
      .sort((a, b) => a.time.getTime() - b.time.getTime());
    
    const priseCount = sortedPrises.length;
    const firstDose = sortedPrises[0];

    if (priseCount > 0 && firstDose) {
      if (priseCount < 3) {
        const datePriseDemarrage = format(firstDose.time, "dd/MM 'à' HH:mm", { locale });
        const dateTroisiemeJour = format(add(firstDose.time, { days: 2 }), "dd/MM 'à' HH:mm", { locale });
        const dateLendemain = format(add(firstDose.time, { hours: 24 }), "dd/MM 'à' HH:mm", { locale });
        protectionEndsAtText = t('protection.text.lessThan3doses', { datePriseDemarrage, dateTroisiemeJour, dateLendemain });
      } else {
        const avantDernierePrise = sortedPrises[priseCount - 2];
        if (avantDernierePrise) {
          const dateAvantDernierePrise = format(avantDernierePrise.time, "eeee dd MMMM 'à' HH:mm", { locale });
          protectionEndsAtText = t('protection.text.moreThan3doses', { dateAvantDernierePrise });
        }
      }
    }
  }

  if (isClient && state.sessionActive && lastDose && firstDoseInSession) {
    const lastDoseTime = lastDose.time;
    const protectionStartTime = add(firstDoseInSession.time, { hours: PROTECTION_START_HOURS });
    const reminderWindowStartTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
    const reminderWindowEndTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_END_HOURS });

    const sortedDoses = state.prises
      .filter(d => d.type !== 'stop')
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    let isLapsed = false;
    if (sortedDoses.length > 1) {
        for (let i = 1; i < sortedDoses.length; i++) {
            const currentDose = sortedDoses[i];
            const previousDose = sortedDoses[i-1];
            const hoursBetweenDoses = differenceInHours(currentDose.time, previousDose.time);
            if (hoursBetweenDoses > DOSE_REMINDER_WINDOW_END_HOURS) {
                isLapsed = true;
                break;
            }
        }
    }
    
    const hoursSinceLastDose = differenceInHours(now, lastDoseTime);

    if (isLapsed || (hoursSinceLastDose > DOSE_REMINDER_WINDOW_END_HOURS && status !== 'lapsed')) {
        status = 'lapsed';
        statusColor = 'bg-destructive';
        statusText = statusT('lapsed');
        protectionEndsAtText = t('protection.text.lapsed');
    } else if (isBefore(now, protectionStartTime)) {
      status = 'loading';
      statusColor = 'bg-primary';
      statusText = statusT('loading');
      protectionStartsIn = t('protection.startsIn', { time: formatCountdown(protectionStartTime) });
    } else if (isBefore(now, reminderWindowStartTime)) {
      status = 'effective';
      statusColor = 'bg-accent';
      statusText = statusT('effective');
      nextDoseIn = t('dose.nextIn', { time: formatCountdown(reminderWindowStartTime) });
    } else if (isBefore(now, reminderWindowEndTime)) {
        status = 'effective';
        statusColor = 'bg-accent';
        statusText = statusT('effective');
        const timeLeft = formatCountdown(reminderWindowEndTime);
        if (timeLeft !== "0s") {
            nextDoseIn = t('dose.timeLeft', { time: timeLeft });
        } else {
            nextDoseIn = t('dose.now');
        }
    } else {
      status = 'missed';
      statusColor = 'bg-destructive';
      statusText = statusT('missed');
    }
  } else if (isClient && !state.sessionActive && state.prises.length > 0) {
     status = 'missed';
     statusColor = 'bg-destructive';
     statusText = statusT('ended');
  }

  if (!isClient) {
    statusText = statusT('loadingClient');
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

    