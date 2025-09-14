
export default {
  common: {
    cancel: 'Abbrechen',
  },
  welcomeScreen: {
    title: 'Willkommen bei PrEPy',
    subtitle: 'Ihr intelligenter Begleiter für die On-Demand-PrEP. Verfolgen Sie Ihre Einnahmen, bleiben Sie geschützt und verwalten Sie Ihre Sitzungen mit Zuversicht.',
    cta: 'Eine PrEP-Sitzung starten',
  },
  welcomeDialog: {
    title: 'Benachrichtigungen aktivieren',
    description: {
      part1: 'Zu Ihrer Sicherheit wird dringend empfohlen, Benachrichtigungen zu aktivieren. Dadurch kann PrEPy Ihnen Erinnerungen für Ihre Pilleneinnahme senden.',
      part2: 'Das Verpassen einer Erinnerung kann Ihren Schutz gefährden.',
    },
    confirm: 'Verstanden, Benachrichtigungen aktivieren',
  },
  settings: {
    title: 'Einstellungen',
    description: 'Verwalten Sie Ihre Daten und Präferenzen.',
    notifications: {
      title: 'Benachrichtigungen',
      description: 'Erhalten Sie für jede Einnahme eine Erinnerung, um Ihren Schutz zu gewährleisten.',
      enabled: 'Benachrichtigungen aktiviert',
      disabled: 'Benachrichtigungen deaktiviert',
      loading: 'Wird geladen...',
      denied: 'Sie haben Benachrichtigungen blockiert. Um sie wieder zu aktivieren, müssen Sie Benachrichtigungen für diese Website in Ihren Browsereinstellungen zulassen und die Seite dann neu laden.',
      disabledWarning: 'Die Einnahmeerinnerungen sind deaktiviert. Sie erhalten keine Benachrichtigungen, was zu vergessenen Einnahmen führen kann.',
    },
    language: {
      title: 'Sprache',
      description: 'Wählen Sie die Anzeigesprache der Anwendung.',
      select: 'Sprache wählen',
    },
    clearHistory: {
      button: 'Meine Historie löschen',
      dialog: {
        title: 'Sind Sie absolut sicher?',
        description: 'Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Sitzungsdaten und Ihre Pillenhistorie werden endgültig gelöscht.',
        confirm: 'Ja, meine Daten löschen',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Starten Sie Ihre Sitzung',
      description: 'Sie beginnen mit 2 Tabletten. Bestätigen Sie, wann Sie Ihre Anfangsdosis eingenommen haben.',
    },
    regular: {
      title: 'Protokollieren Sie Ihre Einnahme',
      description: 'Bestätigen Sie, wann Sie Ihre Tablette eingenommen haben.',
    },
    missed: {
      title: 'Einnahme verpasst',
      description: 'Es scheint, als hätten Sie eine Einnahme verpasst. Wählen Sie eine Option, um Ihren Status zu aktualisieren.',
      earlier: 'Ich habe 1 Tablette früher eingenommen',
      restart: 'Neustart mit 2 Tabletten',
    },
    picker: {
      description: 'Wählen Sie das Datum und die Uhrzeit der Einnahme von {count} Tablette(n).',
      confirm: 'Uhrzeit bestätigen',
    },
    pills: {
      earlier: 'Ich habe {count} Tablette(n) früher eingenommen',
      now: 'Ich habe {count} Tablette(n) jetzt eingenommen',
    },
  },
  doseHistory: {
    title: 'Logbuch',
    description: 'Ihre Aktivitäten der letzten 90 Tage.',
    event: {
      start: 'Sitzung gestartet',
      dose: 'Tablette eingenommen',
      stop: 'Sitzung beendet',
      unknown: 'Unbekanntes Ereignis',
    },
    empty: {
      title: 'Keine Aktivität protokolliert.',
      subtitle: 'Starten Sie eine Sitzung, um zu beginnen.',
    },
  },
  status: {
    inactive: 'Inaktiv',
    loading: 'Schutz wird aufgebaut...',
    effective: 'Schutz aktiv',
    missed: 'Einnahme verpasst',
    lapsed: 'Schutz erloschen',
    ended: 'Sitzung beendet',
    loadingClient: 'Wird geladen...',
    riskWarning: 'Wenn Sie ungeschützten Geschlechtsverkehr außerhalb des Schutzzeitraums hatten, lassen Sie sich bitte testen.',
  },
  protection: {
    startsIn: 'Wird in {time} aktiv sein',
    text: {
      lapsed: 'Sie haben eine oder mehrere Einnahmen verpasst. Ihr Schutz ist nicht mehr gewährleistet.',
      lessThan3doses: 'Wenn Sie die Einnahmen bis zum {dateTroisiemeJour} fortsetzen, sind Ihre Beziehungen zwischen dem {datePriseDemarrage} und dem {dateLendemain} geschützt.',
      moreThan3doses: 'Ihre Beziehungen vor dem {dateAvantDernierePrise} sind durch PrEP geschützt.',
    },
  },
  dose: {
    nextIn: 'Nächste Einnahme in {time}',
    timeLeft: 'Sie haben noch {time} Zeit, eine Tablette einzunehmen',
    now: 'Nehmen Sie jetzt Ihre Tablette!',
  },
  dashboard: {
    logDose: 'Ich habe meine Dosis genommen',
    endSession: 'Sitzung beenden',
    startSession: 'Neue Sitzung starten',
    stopPrepInfo: 'Um die PrEP zu beenden, nehmen Sie nach Ihrem letzten Geschlechtsverkehr noch 2 Tage lang täglich 1 Tablette ein.',
    endSessionDialog: {
      title: 'PrEP-Sitzung beenden?',
      description: 'Dadurch werden die Benachrichtigungserinnerungen gestoppt. Ihr Schutz wird basierend auf Ihrer letzten Einnahme berechnet.',
      confirm: 'Ja, beenden',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sitzung beendet',
        description: 'Die Benachrichtigungserinnerungen sind jetzt gestoppt.',
      },
    },
    clear: {
      toast: {
        dev: 'Testdaten neu geladen',
        title: 'Daten gelöscht',
        description: 'Ihre Historie und Präferenzen wurden gelöscht.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Browser nicht unterstützt',
      denied: {
        title: 'Benachrichtigungen abgelehnt',
        description: 'Sie können sie in Ihren Browsereinstellungen wieder aktivieren.',
      },
      configError: {
        title: 'Konfigurationsfehler',
        description: 'Benachrichtigungsschlüssel fehlt.',
      },
      enabled: 'Benachrichtigungen aktiviert!',
      tokenError: 'Token konnte nicht abgerufen werden',
      subscriptionError: 'Abonnementfehler',
      disabled: 'Benachrichtigungen deaktiviert.',
      unsubscribeError: 'Fehler beim Abbestellen',
    },
  },
} as const;
