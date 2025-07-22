
export type DoseType = 'start' | 'dose' | 'stop';

export interface Dose {
  time: Date; // Stored as Date object in state, ISO string in storage
  pills: number;
  type: DoseType;
  id: string; // Unique ID for each dose
}

export type PrepStatus = 'inactive' | 'loading' | 'effective' | 'missed';

export type PermissionStatus = 'loading' | 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface PrepState {
  doses: Dose[];
  sessionActive: boolean;
  pushEnabled: boolean;
  permissionStatus: PermissionStatus;
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
  togglePushNotifications: (enabled: boolean) => void;
  requestNotificationPermission: () => void;
}

export type UsePrepStateReturn = PrepState & PrepLogic;

    