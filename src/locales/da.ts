
export default {
  common: {
    cancel: 'Annuller',
  },
  welcomeScreen: {
    title: 'Velkommen til PrEPy',
    subtitle: 'Din smarte on-demand PrEP-ledsager. Spor dine doser, forbliv beskyttet og administrer dine sessioner med tillid.',
    cta: 'Start en PrEP-session',
  },
welcomeDialog: {
    title: 'Aktiver notifikationer',
    description: {
      part1: 'For din sikkerhed anbefales det kraftigt at aktivere notifikationer. Dette vil give PrEPy mulighed for at sende dig påmindelser om dine piller.',
      part2: 'At gå glip af en påmindelse kan kompromittere din beskyttelse.',
    },
    confirm: 'Forstået, aktiver notifikationer',
  },
  settings: {
    title: 'Indstillinger',
    description: 'Administrer dine data og præferencer.',
    notifications: {
      title: 'Notifikationer',
      description: 'Modtag en påmindelse for hver dosis for at sikre din beskyttelse.',
      enabled: 'Notifikationer aktiveret',
      disabled: 'Notifikationer deaktiveret',
      loading: 'Indlæser...',
      denied: 'Du har blokeret notifikationer. For at genaktivere dem skal du tillade notifikationer for dette websted i dine browserindstillinger og derefter genindlæse siden.',
      disabledWarning: 'Dosispåmindelser er deaktiveret. Du vil ikke modtage nogen notifikationer, hvilket kan føre til glemte doser.',
    },
    language: {
      title: 'Sprog',
      description: 'Vælg visningssproget for appen.',
      select: 'Vælg et sprog',
    },
    clearHistory: {
      button: 'Slet min historik',
      dialog: {
        title: 'Er du helt sikker?',
        description: 'Denne handling kan ikke fortrydes. Alle dine sessionsdata og pillehistorik vil blive slettet permanent.',
        confirm: 'Ja, slet mine data',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Start din session',
      description: 'Du starter med 2 piller. Bekræft, hvornår du tog din startdosis.',
    },
    regular: {
      title: 'Logfør din dosis',
      description: 'Bekræft, hvornår du tog din pille.',
    },
    missed: {
      title: 'Glemt dosis',
      description: 'Det ser ud til, at du har glemt en dosis. Vælg en mulighed for at opdatere din status.',
      earlier: 'Jeg tog 1 pille tidligere',
      restart: 'Genstart med 2 piller',
    },
    picker: {
      description: 'Vælg dato og tidspunkt for indtagelse af {count} pille(r).',
      confirm: 'Bekræft tidspunkt',
    },
    pills: {
      earlier: 'Jeg tog {count} pille(r) tidligere',
      now: 'Jeg har taget {count} pille(r) nu',
    },
  },
  doseHistory: {
    title: 'Logbog',
    description: 'Dine aktiviteter de sidste 90 dage.',
    event: {
      start: 'Session startet',
      dose: 'Pille taget',
      stop: 'Session afsluttet',
      unknown: 'Ukendt begivenhed',
    },
    empty: {
      title: 'Ingen aktivitet registreret.',
      subtitle: 'Start en session for at begynde.',
    },
  },
  status: {
    inactive: 'Inaktiv',
    loading: 'Beskyttelse afventer...',
    effective: 'Beskyttelse aktiv',
    missed: 'Dosis glemt',
    lapsed: 'Beskyttelse bortfaldet',
    ended: 'Session afsluttet',
    loadingClient: 'Indlæser...',
    riskWarning: 'Hvis du har haft ubeskyttet sex uden for beskyttelsesperioden, bedes du blive testet.',
  },
  protection: {
    startsIn: 'Vil være aktiv om {time}',
    text: {
      lapsed: 'Du har glemt en eller flere doser. Din beskyttelse er ikke længere garanteret.',
      lessThan3doses: 'Hvis du fortsætter med at tage doserne indtil {dateTroisiemeJour}, vil dine samlejer mellem {datePriseDemarrage} og {dateLendemain} være beskyttet.',
      moreThan3doses: 'Dine samlejer før {dateAvantDernierePrise} er beskyttet af PrEP.',
    },
  },
  dose: {
    nextIn: 'Næste dosis om {time}',
    timeLeft: 'Du har {time} til at tage en pille',
    now: 'Tag din pille nu!',
  },
dashboard: {
    logDose: 'Jeg har taget min dosis',
    endSession: 'Afslut session',
    startSession: 'Start ny session',
    stopPrepInfo: 'For at stoppe PrEP, fortsæt med at tage 1 pille om dagen i 2 dage efter dit sidste samleje.',
    endSessionDialog: {
      title: 'Afslut PrEP-session?',
      description: 'Dette vil stoppe notifikationspåmindelserne. Din beskyttelse vil blive beregnet baseret på din sidste dosis.',
      confirm: 'Ja, afslut',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Session afsluttet',
        description: 'Notifikationspåmindelser er nu stoppet.',
      },
    },
    clear: {
      toast: {
        dev: 'Testdata genindlæst',
        title: 'Data ryddet',
        description: 'Din historik og præferencer er blevet slettet.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Browser understøttes ikke',
      denied: {
        title: 'Notifikationer afvist',
        description: 'Du kan genaktivere dem i dine browserindstillinger.',
      },
      configError: {
        title: 'Konfigurationsfejl',
        description: 'Notifikationsnøgle mangler.',
      },
      enabled: 'Notifikationer aktiveret!',
      tokenError: 'Kunne ikke hente token',
      subscriptionError: 'Abonnementsfejl',
      disabled: 'Notifikationer deaktiveret.',
      unsubscribeError: 'Fejl under afmelding',
    },
  },
} as const;
