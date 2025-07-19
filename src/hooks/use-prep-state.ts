"use client";

import { useState, useEffect, useCallback } from 'react';
import { add, sub, formatDistanceToNowStrict, isAfter, isBefore } from 'date-fns';
import type { Dose, PrepState, PrepStatus, UsePrepStateReturn } from '@/lib/types';
import { PROTECTION_START_HOURS, LAPSES_AFTER_HOURS, MAX_HISTORY_DAYS, DOSE_INTERVAL_HOURS } from '@/lib/constants';

const safelyParseJSON = (jsonString: string | null) => {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
};

export function usePrepState(): UsePrepStateReturn {
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(new Date());

  const [state, setState] = useState<PrepState>({
    doses: [],
    sessionActive: false,
  });

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
    return () => clearInterval(timer);
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
      return { ...prevState, doses: newDoses };
    });
  }, []);

  const startSession = useCallback((time: Date) => {
    setState({
      doses: [{ time, pills: 2 }],
      sessionActive: true,
    });
  }, []);

  const endSession = useCallback(() => {
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
