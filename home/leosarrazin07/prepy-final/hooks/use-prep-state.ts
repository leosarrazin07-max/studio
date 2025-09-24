"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, format, isAfter, isBefore, differenceInMilliseconds, differenceInHours } from 'date-fns';
import { fr, enUS, de, it, es, ru, uk, ar, tr, da, sv, nl, pt, sr, ro, pl, bg, hu, cs } from 'date-fns/locale';
import type { Prise, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, MAX_HISTORY_DAYS, DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n, useScopedI18n, useCurrentLocale } from '@/locales/client';
import * as db from '@/lib/database';
import * as notifications from '@/lib/notifications';
import { Capacitor } from '@capacitor/core';

const dateLocales: { [key: string]: Locale } = {
  fr, en: enUS, de, it, es, ru, uk, ar, tr, da, sv, nl, pt, sr, ro, pl, bg, hu, cs
};

const defaultState: PrepState = {
    prises: [],
    sessionActive: false,
    pushEnabled: false,
};

export function usePrepState(): UsePrepStateReturn {
  const [isReady, setIsReady] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [state, setState] = useState<PrepState>(defaultState);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<PermissionState>();

  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const locale = dateLocales[currentLocale] || fr;
  const statusT = useScopedI18n('status');

  const loadInitialState = useCallback(async () => {
    try {
      await db.initialize();
      const prises = await db.getPrises();
      const sessionActive = await db.isSessionActive();
      
      const pushEnabled = Capacitor.isNativePlatform() ? (await notifications.areNotificationsEnabled()) : false;
      
      setState({ prises, sessionActive, pushEnabled });

      if (Capacitor.isNativePlatform()) {
        const status = await notifications.checkPermissions();
        setPushPermissionStatus(status.display);
      }
    } catch (e) {
      console.error("Failed to load initial state", e);
      toast({ title: "Error", description: "Could not load data from local database.", variant: "destructive" });
    } finally {
      setIsReady(true);
    }
  }, [toast]);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({ title: t('notifications.toast.unsupported'), variant: "destructive" });
      return false;
    }
    setIsPushLoading(true);
    try {
      const result = await notifications.requestPermissions();
      setPushPermissionStatus(result.display);
      const newPushState = result.display === 'granted';
      setState(s => ({...s, pushEnabled: newPushState }));

      if (newPushState) {
        toast({ title: t('notifications.toast.enabled') });
        const lastDose = state.prises.filter(p => p.type !== 'stop').sort((a,b) => b.time.getTime() - a.time.getTime())[0];
        if (lastDose) {
          await notifications.scheduleDoseReminders(lastDose.time, t);
        }
      } else {
        toast({ title: t('notifications.toast.denied.title'), description: t('notifications.toast.denied.description'), variant: "destructive" });
      }
      return newPushState;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({ title: "Error", description: "Could not request notification permissions.", variant: "destructive" });
      return false;
    } finally {
      setIsPushLoading(false);
    }
  }, [state.prises, t, toast]);

  const unsubscribeFromNotifications = useCallback(async () => {
      if (!Capacitor.isNativePlatform()) return;
      setIsPushLoading(true);
      await notifications.cancelAllNotifications();
      setState(s => ({...s, pushEnabled: false}));
      toast({ title: t('notifications.toast.disabled') });
      setIsPushLoading(false);
  }, [t, toast]);


  const startSession = useCallback(async (time: Date) => {
    setIsReady(false);
    const newDose = { time, pills: 2, type: 'start' as const, id: new Date().toISOString() };
    await db.clearHistory();
    await db.addPrise(newDose);
    await db.setSessionActive(true);
    
    if (state.pushEnabled) {
      await notifications.scheduleDoseReminders(newDose.time, t);
    }
    
    await loadInitialState();
  }, [loadInitialState, state.pushEnabled, t]);

  const addDose = useCallback(async (prise: { time: Date; pills: number }) => {
    setIsReady(false);
    const newDose = { ...prise, type: 'dose' as const, id: new Date().toISOString() };
    await db.addPrise(newDose);

    if (state.pushEnabled) {
      await notifications.scheduleDoseReminders(newDose.time, t);
    }
    
    await loadInitialState();
  }, [loadInitialState, state.pushEnabled, t]);

  const endSession = useCallback(async () => {
    setIsReady(false);
    const stopEvent = { time: new Date(), pills: 0, type: 'stop' as const, id: new Date().toISOString() };
    await db.addPrise(stopEvent);
    await db.setSessionActive(false);
    
    await notifications.cancelAllNotifications();

    await loadInitialState();
    toast({ title: t('session.end.toast.title'), description: t('session.end.toast.description') });
  }, [loadInitialState, t, toast]);

  const clearHistory = useCallback(async () => {
    setIsReady(false);
    await db.clearHistory();
    await db.setSessionActive(false);
    await notifications.cancelAllNotifications();
    await loadInitialState();
    toast({ title: t('session.clear.toast.title'), description: t('session.clear.toast.description') });
  }, [loadInitialState, t, toast]);

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

  if (isReady && state.prises.length > 0) {
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

  if (isReady && state.sessionActive && lastDose && firstDoseInSession) {
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
  } else if (isReady && !state.sessionActive && state.prises.length > 0) {
     status = 'missed';
     statusColor = 'bg-destructive';
     statusText = statusT('ended');
  }

  if (!isReady) {
    statusText = statusT('loadingClient');
    statusColor = "bg-muted";
  }

  const welcomeScreenVisible = isReady && state.prises.length === 0;
  const dashboardVisible = isReady && state.prises.length > 0;

  return {
    ...state,
    isReady,
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
