
import type { getI18n, getScopedI18n } from '@/locales/server';

export type PriseType = 'start' | 'dose' | 'stop';

export interface Prise {
  time: Date; 
  pills: number;
  type: PriseType;
  id: string; 
}

export type PrepStatus = 'inactive' | 'loading' | 'effective' | 'missed' | 'lapsed';

export interface PrepState {
  prises: Prise[];
  sessionActive: boolean;
  pushEnabled: boolean;
  fcmToken: string | null;
}

// The return type of the main state management hook
export interface UsePrepStateReturn extends PrepState {
  isPushLoading: boolean;
  pushPermissionStatus: NotificationPermission | undefined;
  addDose: (dose: { time: Date; pills: number }) => void;
  startSession: (time: Date) => void;
  endSession: () => void;
  clearHistory: () => void;
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

// Firestore types
export interface FirestorePrise {
    time: admin.firestore.Timestamp;
    pills: number;
    type: PriseType;
    id: string;
}

export interface PrepSessionDoc {
    fcmToken: string;
    pushEnabled: boolean;
    sessionActive: boolean;
    prises: FirestorePrise[];
    updatedAt: admin.firestore.Timestamp;
}

export type T = Awaited<ReturnType<typeof getI18n>>;
export type ScopedT = Awaited<ReturnType<typeof getScopedI18n>>;
