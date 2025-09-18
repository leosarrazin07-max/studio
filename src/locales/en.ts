
export default {
  common: {
    cancel: 'Cancel',
  },
  welcomeScreen: {
    title: 'Welcome to PrEPy',
    subtitle: 'Your smart on-demand PrEP companion. Track your doses, stay protected, and manage your sessions with confidence.',
    cta: 'Start a PrEP session',
  },
  welcomeDialog: {
    title: 'Activate Notifications',
    description: {
      part1: 'For your safety, it is strongly recommended to activate notifications. This will allow PrEPy to send you reminders for your pill doses.',
      part2: 'Missing a reminder can compromise your protection.',
    },
    confirm: 'Got it, activate notifications',
  },
  settings: {
    title: 'Settings',
    description: 'Manage your data and preferences.',
    notifications: {
      title: 'Notifications',
      description: 'Receive a reminder for each dose to ensure your protection.',
      enabled: 'Notifications enabled',
      disabled: 'Notifications disabled',
      loading: 'Loading...',
      denied: 'You have blocked notifications. to re-enable them, you must allow notifications for this site in your browser settings, then reload the page.',
      disabledWarning: 'Dose reminders are disabled. You will not receive any notifications, which can lead to missed doses.',
    },
    language: {
      title: 'Language',
      description: 'Choose the display language for the application.',
      select: 'Select a language',
    },
    theme: {
      title: "Display Mode",
      description: "Choose between light and dark theme."
    },
    clearHistory: {
      button: 'Delete my history',
      dialog: {
        title: 'Are you absolutely sure?',
        description: 'This action is irreversible. All your session data and pill history will be permanently deleted.',
        confirm: 'Yes, delete my data',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Start your session',
      description: 'You will start with 2 pills. Confirm when you took your initial dose.',
    },
    regular: {
      title: 'Log your dose',
      description: 'Confirm when you took your pill.',
    },
    missed: {
      title: 'Missed dose',
      description: 'It seems you missed a dose. Choose an option to update your status.',
      earlier: 'I took 1 pill earlier',
      restart: 'Restart with 2 pills',
    },
    picker: {
      description: 'Select the date and time of the intake of {count} pill(s).',
      confirm: 'Confirm time',
    },
    pills: {
      earlier: 'I took {count} pill(s) earlier',
      now: 'I have taken {count} pill(s) now',
    },
  },
  doseHistory: {
    title: 'Logbook',
    description: 'Your activities of the last 90 days.',
    event: {
      start: 'Session started',
      dose: 'Pill taken',
      stop: 'Session ended',
      unknown: 'Unknown event',
    },
    empty: {
      title: 'No activity recorded.',
      subtitle: 'Start a session to begin.',
    },
  },
  status: {
    inactive: 'Inactive',
    loading: 'Protection pending...',
    effective: 'Protection effective',
    missed: 'Dose missed',
lapsed: 'Protection lapsed',
    ended: 'Session ended',
    loadingClient: 'Loading...',
    riskWarning: 'If you have had unprotected sex outside of the protection period, please get tested.',
  },
  protection: {
    startsIn: 'Will be active in {time}',
    text: {
      lapsed: 'You have missed one or more doses. Your protection is no longer guaranteed.',
      lessThan3doses: 'If you continue taking the doses until {dateTroisiemeJour}, your relations between {datePriseDemarrage} and {dateLendemain} will be protected.',
      moreThan3doses: 'Your relations before {dateAvantDernierePrise} are protected by PrEP.',
    },
  },
  dose: {
    nextIn: 'Next dose in {time}',
    timeLeft: 'You have {time} to take a pill',
    now: 'Take your pill now!',
  },
  dashboard: {
    logDose: 'I took my dose',
    endSession: 'End session',
    startSession: 'Start new session',
    stopPrepInfo: 'To stop PrEP, continue to take 1 pill a day for the 2 days following your last intercourse.',
    endSessionDialog: {
      title: 'End PrEP session?',
      description: 'This will stop the notification reminders. Your protection will be calculated based on your last dose.',
      confirm: 'Yes, End',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Session ended',
        description: 'Notification reminders are now stopped.',
      },
    },
    clear: {
      toast: {
        dev: 'Test data reloaded',
        title: 'Data cleared',
        description: 'Your history and preferences have been deleted.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Browser not compatible',
      denied: {
        title: 'Notifications refused',
        description: 'You can reactivate them in your browser settings.',
      },
      configError: {
        title: 'Configuration error',
        description: 'The notification key is missing.',
      },
      enabled: 'Notifications enabled!',
      tokenError: 'Could not retrieve token',
      subscriptionError: 'Subscription error',
      disabled: 'Notifications disabled.',
      unsubscribeError: 'Error during unsubscription',
    },
  },
} as const;
