
export type PriseType = 'start' | 'dose' | 'stop';

export interface Prise {
  time: Date; // Stored as Date object in state, ISO string in storage
  pills: number;
  type: PriseType;
  id: string; // Unique ID for each dose
}

export type PrepStatus = 'inactive' | 'loading' | 'effective' | 'missed';

export interface PrepState {
  prises: Prise[];
  sessionActive: boolean;
  pushEnabled: boolean; // Re-introduced to track notification state
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
  setPushEnabled: (enabled: boolean) => void; // New function to update push state
  welcomeScreenVisible: boolean;
  dashboardVisible: boolean;
}

export type UsePrepStateReturn = PrepState & PrepLogic;
