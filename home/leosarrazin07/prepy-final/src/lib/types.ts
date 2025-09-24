import type { getI18n, getScopedI18n } from '@/locales/server';

export type PriseType = 'start' | 'dose' | 'stop';

export interface Prise {
  time: Date; 
  pills: number;
  type: PriseType;
  id: string; 
}

export type PrepStatus = 'inactive' | 'loading' | 'effective' | 'missed' | 'lapsed' | 'ended';

export interface PrepState {
  prises: Prise[];
  sessionActive: boolean;
  pushEnabled: boolean;
}

// The return type of the main state management hook
export interface UsePrepStateReturn extends PrepState {
  isReady: boolean;
  isPushLoading: boolean;
  pushPermissionStatus: PermissionState | undefined;
  addDose: (dose: { time: Date; pills: number }) => Promise<void>;
  startSession: (time: Date) => Promise<void>;
  endSession: () => Promise<void>;
  clearHistory: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  unsubscribeFromNotifications: () => Promise<void>;
  welcomeScreenVisible: boolean;
  dashboardVisible: boolean;
  status: PrepStatus;
  statusColor: string;
  statusText: string;
  nextDoseIn: string;
  protectionStartsIn: string;
  protectionEndsAtText: string;
}

export type T = Awaited<ReturnType<typeof getI18n>>;
export type ScopedT = Awaited<ReturnType<typeof getScopedI18n>>;
