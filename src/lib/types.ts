
export type PriseType = 'start' | 'dose' | 'stop';

export interface Prise {
  time: Date; 
  pills: number;
  type: PriseType;
  id: string; 
}

export type PrepStatus = 'inactive' | 'loading' | 'effective' | 'missed';

export interface PrepState {
  prises: Prise[];
  sessionActive: boolean;
  pushEnabled: boolean;
}

// The return type of the main state management hook
export interface UsePrepStateReturn extends PrepState {
  now: Date;
  isClient: boolean;
  addDose: (dose: { time: Date; pills: number }) => void;
  startSession: (time: Date) => void;
  endSession: () => void;
  clearHistory: () => void;
  setPushEnabled: (enabled: boolean) => void;
  welcomeScreenVisible: boolean;
  dashboardVisible: boolean;
}

// Input for the calculator hook
export interface PrepCalculatorInput {
    prises: Prise[];
    sessionActive: boolean;
    isClient: boolean;
    now: Date;
}

// The return type of the calculator hook, contains only derived values
export interface PrepCalculatorResult {
  status: PrepStatus;
  statusColor: string;
  statusText: string;
  nextDoseIn: string;
  protectionStartsIn: string;
  protectionEndsAtText: string;
}
