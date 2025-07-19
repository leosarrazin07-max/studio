export const PROTECTION_START_HOURS = 2;
export const DOSE_INTERVAL_HOURS = 22; // Reminder starts 22h after last dose
export const GRACE_PERIOD_HOURS = 4; // Reminder window lasts 4h
export const MAX_HISTORY_DAYS = 90;
export const LAPSES_AFTER_HOURS = DOSE_INTERVAL_HOURS + GRACE_PERIOD_HOURS; // Protection lapses after 26h
