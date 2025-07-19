
export interface Dose {
  time: Date; // Stored as Date object in state, ISO string in storage
  pills: number;
}

export type PrepStatus = 'inactive' | 'loading' | 'effective' | 'missed';

export interface PrepState {
  doses: Dose[];
  sessionActive: boolean;
}

export interface PrepLogic {
  status: PrepStatus;
  statusColor: string;
  statusText: string;
  nextDoseIn: string;
  protectionStartsIn: string;
  timeSinceMissed: string;
  addDose: (dose: { time: Date; pills: number }) => void;
  startSession: (time: Date) => void;
  endSession: () => void;
}

export type UsePrepStateReturn = PrepState & PrepLogic;

    