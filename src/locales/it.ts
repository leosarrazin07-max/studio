
export default {
  common: {
    cancel: 'Annulla',
  },
  welcomeScreen: {
    title: 'Benvenuto in PrEPy',
    subtitle: 'Il tuo compagno intelligente per la PrEP on-demand. Tieni traccia delle tue dosi, resta protetto e gestisci le tue sessioni con fiducia.',
    cta: 'Inizia una sessione PrEP',
  },
  welcomeDialog: {
    title: 'Attiva le notifiche',
    description: {
      part1: 'Per la tua sicurezza, si consiglia vivamente di attivare le notifiche. Ciò consentirà a PrEPy di inviarti promemoria per le dosi delle pillole.',
      part2: 'Saltare un promemoria può compromettere la tua protezione.',
    },
    confirm: 'Capito, attiva le notifiche',
  },
  settings: {
    title: 'Impostazioni',
    description: 'Gestisci i tuoi dati e le tue preferenze.',
    notifications: {
      title: 'Notifiche',
      description: 'Ricevi un promemoria per ogni dose per garantire la tua protezione.',
      enabled: 'Notifiche attivate',
      disabled: 'Notifiche disattivate',
      loading: 'Caricamento...',
      denied: 'Hai bloccato le notifiche. Per riattivarle, devi consentire le notifiche per questo sito nelle impostazioni del tuo browser, quindi ricaricare la pagina.',
      disabledWarning: 'I promemoria delle dosi sono disattivati. Non riceverai alcuna notifica, il che può portare a dosi mancate.',
    },
    language: {
      title: 'Lingua',
      description: 'Scegli la lingua di visualizzazione dell\'applicazione.',
      select: 'Seleziona una lingua',
    },
    theme: {
      title: "Modalità di visualizzazione",
      description: "Scegli tra tema chiaro e scuro."
    },
    clearHistory: {
      button: 'Cancella la mia cronologia',
      dialog: {
        title: 'Sei assolutamente sicuro?',
        description: 'Questa azione è irreversibile. Tutti i dati della tua sessione e la cronologia delle pillole verranno eliminati definitivamente.',
        confirm: 'Sì, cancella i miei dati',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Inizia la tua sessione',
      description: 'Inizierai con 2 pillole. Conferma quando hai assunto la tua dose iniziale.',
    },
    regular: {
      title: 'Registra la tua dose',
      description: 'Conferma quando hai assunto la tua pillola.',
    },
    missed: {
      title: 'Dose mancata',
      description: 'Sembra che tu abbia saltato una dose. Scegli un\'opzione per aggiornare il tuo stato.',
      earlier: 'Ho preso 1 pillola prima',
      restart: 'Ricomincia con 2 pillole',
    },
    picker: {
      description: 'Seleziona la data e l\'ora dell\'assunzione di {count} pillola(e).',
      confirm: 'Conferma ora',
    },
    pills: {
      earlier: 'Ho preso {count} pillola(e) prima',
      now: 'Ho preso {count} pillola(e) ora',
    },
  },
  doseHistory: {
    title: 'Diario di bordo',
    description: 'Le tue attività degli ultimi 90 giorni.',
    event: {
      start: 'Sessione iniziata',
      dose: 'Pillola assunta',
      stop: 'Sessione terminata',
      unknown: 'Evento sconosciuto',
    },
    empty: {
      title: 'Nessuna attività registrata.',
      subtitle: 'Inizia una sessione per iniziare.',
    },
  },
  status: {
    inactive: 'Inattivo',
    loading: 'Protezione in corso...',
    effective: 'Protezione attiva',
    missed: 'Dose mancata',
    lapsed: 'Protezione interrotta',
    ended: 'Sessione terminata',
    loadingClient: 'Caricamento...',
    riskWarning: 'Se hai avuto rapporti sessuali non protetti al di fuori del periodo di protezione, ti preghiamo di fare il test.',
  },
  protection: {
    startsIn: 'Sarà attiva tra {time}',
    text: {
      lapsed: 'Hai saltato una o più dosi. La tua protezione non è più garantita.',
      lessThan3doses: 'Se continui ad assumere le dosi fino al {dateTroisiemeJour}, i tuoi rapporti tra il {datePriseDemarrage} e il {dateLendemain} saranno protetti.',
      moreThan3doses: 'I tuoi rapporti prima del {dateAvantDernierePrise} sono protetti dalla PrEP.',
    },
  },
  dose: {
    nextIn: 'Prossima dose tra {time}',
    timeLeft: 'Hai {time} per prendere una pillola',
    now: 'Prendi la tua pillola ora!',
  },
  dashboard: {
    logDose: 'Ho preso la mia dose',
    endSession: 'Termina sessione',
    startSession: 'Inizia nuova sessione',
    stopPrepInfo: 'Per interrompere la PrEP, continua ad assumere 1 pillola al giorno per i 2 giorni successivi al tuo ultimo rapporto sessuale.',
    endSessionDialog: {
      title: 'Terminare la sessione PrEP?',
      description: 'Questo fermerà i promemoria delle notifiche. La tua protezione verrà calcolata in base alla tua ultima dose.',
      confirm: 'Sì, termina',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sessione terminata',
        description: 'I promemoria delle notifiche sono ora interrotti.',
      },
    },
    clear: {
      toast: {
        dev: 'Dati di test ricaricati',
        title: 'Dati cancellati',
        description: 'La tua cronologia e le tue preferenze sono state eliminate.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Browser non compatibile',
      denied: {
        title: 'Notifiche rifiutate',
        description: 'Puoi riattivarle nelle impostazioni del tuo browser.',
      },
      configError: {
        title: 'Errore di configurazione',
        description: 'La chiave di notifica è mancante.',
      },
      enabled: 'Notifiche attivate!',
      tokenError: 'Impossibile recuperare il token',
      subscriptionError: 'Errore di sottoscrizione',
      disabled: 'Notifiche disattivate.',
      unsubscribeError: 'Errore durante l\'annullamento dell\'iscrizione',
    },
  },
} as const;
