
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
}

// The return type of the main state management hook
export interface UsePrepStateReturn extends PrepState {
  pushEnabled: boolean;
  isPushLoading: boolean;
  notificationPermission: 'default' | 'granted' | 'denied';
  addDose: (dose: { time: Date; pills: number }) => void;
  startSession: (time: Date) => void;
  endSession: () => void;
  clearHistory: () => void;
  requestNotificationPermission: () => Promise<void>;
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

export interface PrepCalculatorResult {
  status: PrepStatus;
  statusColor: string;
  statusText: string;
  nextDoseIn: string;
  protectionStartsIn: string;
  protectionEndsAtText: string;
}
    
