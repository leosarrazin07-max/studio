
export const PROTECTION_START_HOURS = 2;
export const DOSE_INTERVAL_HOURS = 24;
export const MAX_HISTORY_DAYS = 90;
// Protection is effective for 48 hours after the last dose.
// This is used to calculate the residual protection window after a session ends.
export const FINAL_PROTECTION_HOURS = 48;

// The reminder window is now dynamic based on the last dose.
// A dose should be taken between 22 and 26 hours after the last one.
export const DOSE_REMINDER_WINDOW_START_HOURS = 22;
export const DOSE_REMINDER_WINDOW_END_HOURS = 26;
export const DOSE_REMINDER_INTERVAL_MINUTES = 10;

// This is the old value, for calculating status, not for reminders.
export const LAPSES_AFTER_HOURS = DOSE_REMINDER_WINDOW_END_HOURS;
