
export const PROTECTION_START_HOURS = 2;
export const DOSE_INTERVAL_HOURS = 22;
export const MAX_HISTORY_DAYS = 90;

// The reminder window is now dynamic based on the last dose.
// A dose should be taken between 22 and 26 hours after the last one.
export const DOSE_REMINDER_WINDOW_START_HOURS = 22;
export const DOSE_REMINDER_WINDOW_END_HOURS = 26;
export const DOSE_REMINDER_INTERVAL_MINUTES = 10;

// This is the old value, for calculating status, not for reminders.
export const LAPSES_AFTER_HOURS = DOSE_REMINDER_WINDOW_END_HOURS;

// Protection is considered to last up to this many hours after the last dose
export const FINAL_PROTECTION_HOURS = 48;

export const locales = ['fr', 'en', 'de', 'it', 'es', 'ru', 'uk', 'ar', 'tr', 'da', 'sv', 'nl', 'pt', 'sr', 'ro', 'pl'] as const;
export const defaultLocale = 'fr' as const;

