
export const PROTECTION_START_HOURS = 2;
export const DOSE_INTERVAL_HOURS = 24; // A dose should be taken every 24 hours
export const GRACE_PERIOD_HOURS = 4; // Reminder window lasts 4h after the 24h mark
export const MAX_HISTORY_DAYS = 90;
// Protection lapses 28h after last dose (24h interval + 4h grace period)
export const LAPSES_AFTER_HOURS = DOSE_INTERVAL_HOURS + GRACE_PERIOD_HOURS;
// Final protection after session ends is 48h after last dose
export const FINAL_PROTECTION_HOURS = 48;
