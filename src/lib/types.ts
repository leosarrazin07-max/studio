

export type DoseType = 'start' | 'dose' | 'stop';

export interface Dose {
  time: Date; // Stored as Date object in state, ISO string in storage
  pills: number;
  type: DoseType;
  id: string; // Unique ID for each dose
}

export type PrepStatus = 'inactive' | 'loading' | 'effective' | 'missed';

export interface PrepState {
  doses: Dose[];
  sessionActive: boolean;
  pushEnabled: boolean;
  protectionNotified?: boolean; // Used by service worker
}

export interface PrepLogic {
  status: PrepStatus;
  statusColor: string;
  statusText: string;
  nextDoseIn: string;
  protectionStartsIn: string;
  protectionEndsAtText: string;
  addDose: (dose: { time: Date; pills: number }) => void;
  startSession: (time: Date) => void;
  endSession: () => void;
  clearHistory: () => void;
  // New simplified method for toggling push notifications
  togglePushNotifications: (enabled: boolean) => void;
  // Deprecated methods
  requestNotificationPermission: () => Promise<boolean>;
  unsubscribeFromNotifications: () => void;
}

export type UsePrepStateReturn = PrepState & PrepLogic;

    