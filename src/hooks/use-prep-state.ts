
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore, differenceInMinutes } from 'date-fns';
import type { Dose, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS, GRACE_PERIOD_HOURS } from '@/lib/constants';
import { useToast } from './use-toast';

const safelyParseJSON = (jsonString: string | null) => {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
};

const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

const scheduleNotification = (title: string, options: NotificationOptions, time: Date) => {
    const delay = time.getTime() - new Date().getTime();
    if (delay > 0) {
        return setTimeout(() => {
            new Notification(title, options);
        }, delay);
    }
    return null;
};

export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();
  const notificationTimeouts = useRef<NodeJS.Timeout[]>([]);


  const [state, setState] = useState<PrepState>({
    doses: [],
    sessionActive: false,
  });

   const clearNotifications = () => {
    notificationTimeouts.current.forEach(clearTimeout);
    notificationTimeouts.current = [];
  };

  useEffect(() => {
    setIsClient(true);
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
        clearNotifications();
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
    // Schedule notifications when state changes
    if (isClient && state.sessionActive && state.doses.length > 0) {
        scheduleReminders();
    } else {
        clearNotifications();
    }
  }, [state, isClient]);

  const scheduleReminders = () => {
    clearNotifications();
    const timeouts: NodeJS.Timeout[] = [];
    const lastDose = state.doses[state.doses.length - 1];
    if (!lastDose) return;

    // Protection start notification
    if (state.doses.length === 1) {
        const protectionStartTime = add(new Date(state.doses[0].time), { hours: PROTECTION_START_HOURS });
         if (isAfter(protectionStartTime, new Date())) {
            const timeoutId = scheduleNotification(
                'PrEPy: Protection active!',
                { body: 'Vous êtes protégé par la PrEP.', icon: '/shield-check.png' },
                protectionStartTime
            );
            if(timeoutId) timeouts.push(timeoutId);
        }
    }
    
    // Next dose reminders
    const nextDoseTime = add(new Date(lastDose.time), { hours: DOSE_INTERVAL_HOURS });
    const reminderEndTime = add(nextDoseTime, { hours: GRACE_PERIOD_HOURS });

    for (let i = 0; i < (GRACE_PERIOD_HOURS * 60) / 15; i++) {
        const reminderTime = add(nextDoseTime, { minutes: i * 15 });
        if (isBefore(reminderTime, new Date()) || isAfter(reminderTime, reminderEndTime)) {
            continue;
        }

        const minutesRemaining = differenceInMinutes(reminderEndTime, reminderTime);
        const hours = Math.floor(minutesRemaining / 60);
        const mins = minutesRemaining % 60;
        const timeLeft = `Il vous reste ${hours}h et ${mins}min.`;

        const timeoutId = scheduleNotification(
            "C'est l'heure de prendre la PrEP",
            { body: timeLeft, icon: '/pill.png', renotify: true, tag: 'prep-reminder' },
            reminderTime
        );
        if(timeoutId) timeouts.push(timeoutId);
    }
    notificationTimeouts.current = timeouts;
  }

  const addDose = useCallback((dose: { time: Date; pills: number }) => {
    setState(prevState => {
      const newDoses = [...prevState.doses, { time: dose.time, pills: dose.pills }]
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      return { ...prevState, doses: newDoses };
    });
    // Reschedule notifications after adding a dose
    if(isClient) {
        clearNotifications();
    }
  }, [isClient]);

  const startSession = useCallback(async (time: Date) => {
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
        toast({
            title: "Notifications refusées",
            description: "Vous pouvez activer les notifications dans les paramètres de votre navigateur pour recevoir des rappels.",
            variant: "destructive"
        })
    }
    setState({
      doses: [{ time, pills: 2 }],
      sessionActive: true,
    });
  }, [toast]);

  const endSession = useCallback(() => {
    clearNotifications();
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

    