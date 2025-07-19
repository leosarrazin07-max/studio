

export type DoseType = 'start' | 'dose' | 'stop';

export interface Dose {
  time: Date; // Stored as Date object in state, ISO string in storage
  pills: number;
  type: DoseType;
}

export type PrepStatus = 'inactive' | 'loading' | 'effective' | 'missed';

export interface PrepState {
  doses: Dose[];
  sessionActive: boolean;
  pushEnabled: boolean;
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
  requestNotificationPermission: () => Promise<boolean>;
  unsubscribeFromNotifications: () => void;
}

export type UsePrepStateReturn = PrepState & PrepLogic;
