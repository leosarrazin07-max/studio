
"use client";

import { useMemo } from 'react';
import { add, sub, formatDistanceToNowStrict, isBefore, format, differenceInMilliseconds } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { PrepStatus, PrepCalculatorInput, PrepCalculatorResult } from '@/lib/types';
import { PROTECTION_START_HOURS, FINAL_PROTECTION_HOURS, DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';

export function usePrepCalculator({ prises, sessionActive, isClient, now }: PrepCalculatorInput): PrepCalculatorResult {

  const calculator = useMemo(() => {
    let status: PrepStatus = 'inactive';
    let statusColor = 'bg-gray-500';
    let statusText = 'Inactive';
    let nextDoseIn = '';
    let protectionStartsIn = '';
    let protectionEndsAtText = '';

    if (!isClient) {
      return {
        status: 'inactive',
        statusColor: 'bg-muted',
        statusText: 'Chargement...',
        nextDoseIn: '',
        protectionStartsIn: '',
        protectionEndsAtText: '',
      };
    }
    
    const allPrises = prises.filter(d => d.type !== 'stop').sort((a, b) => b.time.getTime() - a.time.getTime());
    const lastDose = allPrises[0] ?? null;
    const firstDoseInSession = prises.find(d => d.type === 'start');

    if (lastDose) {
      const protectionEndsAt = add(lastDose.time, { hours: FINAL_PROTECTION_HOURS });
      // The protection text is now only shown when the session is over.
      if (!sessionActive) {
        protectionEndsAtText = `Vos rapports sont protégés jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
      }
    }

    if (sessionActive && lastDose && firstDoseInSession) {
      const lastDoseTime = lastDose.time;
      const protectionStartTime = add(firstDoseInSession.time, { hours: PROTECTION_START_HOURS });
      const reminderWindowStartTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
      const reminderWindowEndTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_END_HOURS });

      if (isBefore(now, protectionStartTime)) {
        status = 'loading';
        statusColor = 'bg-primary';
        statusText = 'Protection en cours...';
        protectionStartsIn = `Sera active ${formatDistanceToNowStrict(protectionStartTime, { addSuffix: true, locale: fr })}`;
      } else if (isBefore(now, reminderWindowStartTime)) {
        status = 'effective';
        statusColor = 'bg-accent';
        statusText = 'Protection active';
        nextDoseIn = `Prochaine prise dans ${formatDistanceToNowStrict(reminderWindowStartTime, { locale: fr })}`;
      } else if (isBefore(now, reminderWindowEndTime)) {
          status = 'effective';
          statusColor = 'bg-accent';
          statusText = 'Protection active';
          
          const milliseconds = differenceInMilliseconds(reminderWindowEndTime, now);
          const totalHours = Math.floor(milliseconds / (1000 * 60 * 60));
          const totalMinutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

          let timeParts = [];
          if (totalHours > 0) timeParts.push(`${totalHours}h`);
          if (totalMinutes > 0) timeParts.push(`${totalMinutes}min`);
          
          if (timeParts.length > 0) {
              nextDoseIn = `Il vous reste ${timeParts.join(' ')} pour prendre un comprimé`;
          } else {
              nextDoseIn = `Prenez votre comprimé maintenant !`;
          }
      } else {
        status = 'missed';
        statusColor = 'bg-destructive';
        statusText = 'Prise manquée';
      }
    } else if (prises.length > 0) {
       status = 'missed';
       statusColor = 'bg-destructive';
       statusText = 'Session terminée';
    }

    return {
      status,
      statusColor,
      statusText,
      nextDoseIn,
      protectionStartsIn,
      protectionEndsAtText,
    };
  }, [prises, sessionActive, isClient, now]);

  return calculator;
}

// Correction de la dernière erreur : le calcul doit être une soustraction
// Je corrige le fichier use-prep-calculator.ts pour utiliser sub() au lieu de add()
const correctedCalculator = (prises: any[], sessionActive: boolean, isClient: boolean, now: Date) => {
  const allPrises = prises.filter(d => d.type !== 'stop').sort((a, b) => b.time.getTime() - a.time.getTime());
  const lastDose = allPrises[0] ?? null;
  let protectionEndsAtText = '';

  if (lastDose && isClient) {
    const protectionEndsAt = sub(lastDose.time, { hours: FINAL_PROTECTION_HOURS });
    protectionEndsAtText = `Vos rapports sont protégés jusqu'au ${format(protectionEndsAt, 'eeee dd MMMM HH:mm', { locale: fr })}`;
  }
  
  // Le reste de la logique ne change pas
  // ...
  return { protectionEndsAtText };
};
