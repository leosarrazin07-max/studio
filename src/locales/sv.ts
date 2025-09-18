
export default {
  common: {
    cancel: 'Avbryt',
  },
  welcomeScreen: {
    title: 'Välkommen till PrEPy',
    subtitle: 'Din smarta on-demand PrEP-kompanjon. Spåra dina doser, håll dig skyddad och hantera dina sessioner med självförtroende.',
    cta: 'Starta en PrEP-session',
  },
  welcomeDialog: {
    title: 'Aktivera aviseringar',
    description: {
      part1: 'För din säkerhet rekommenderas det starkt att aktivera aviseringar. Detta gör att PrEPy kan skicka påminnelser om dina pillerdoser.',
      part2: 'Att missa en påminnelse kan äventyra ditt skydd.',
    },
    confirm: 'Förstått, aktivera aviseringar',
  },
  settings: {
    title: 'Inställningar',
    description: 'Hantera dina data och preferenser.',
    notifications: {
      title: 'Aviseringar',
      description: 'Få en påminnelse för varje dos för att säkerställa ditt skydd.',
      enabled: 'Aviseringar aktiverade',
      disabled: 'Aviseringar inaktiverade',
      loading: 'Laddar...',
      denied: 'Du har blockerat aviseringar. För att återaktivera dem måste du tillåta aviseringar för den här webbplatsen i dina webbläsarinställningar och sedan ladda om sidan.',
      disabledWarning: 'Dospåminnelser är inaktiverade. Du kommer inte att få några aviseringar, vilket kan leda till missade doser.',
    },
    language: {
      title: 'Språk',
      description: 'Välj visningsspråk för applikationen.',
      select: 'Välj ett språk',
    },
    clearHistory: {
      button: 'Radera min historik',
      dialog: {
        title: 'Är du helt säker?',
        description: 'Denna åtgärd kan inte ångras. All din sessionsdata och pillerhistorik kommer att raderas permanent.',
        confirm: 'Ja, radera mina data',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Starta din session',
      description: 'Du kommer att börja med 2 piller. Bekräfta när du tog din startdos.',
    },
    regular: {
      title: 'Logga din dos',
      description: 'Bekräfta när du tog ditt piller.',
    },
    missed: {
      title: 'Missad dos',
      description: 'Det verkar som att du har missat en dos. Välj ett alternativ för att uppdatera din status.',
      earlier: 'Jag tog 1 piller tidigare',
      restart: 'Starta om med 2 piller',
    },
    picker: {
      description: 'Välj datum och tid för intag av {count} piller.',
      confirm: 'Bekräfta tid',
    },
    pills: {
      earlier: 'Jag tog {count} piller tidigare',
      now: 'Jag har tagit {count} piller nu',
    },
  },
  doseHistory: {
    title: 'Loggbok',
    description: 'Dina aktiviteter de senaste 90 dagarna.',
    event: {
      start: 'Session startad',
      dose: 'Piller taget',
      stop: 'Session avslutad',
      unknown: 'Okänd händelse',
    },
    empty: {
      title: 'Ingen aktivitet registrerad.',
      subtitle: 'Starta en session för att börja.',
    },
  },
  status: {
    inactive: 'Inaktiv',
    loading: 'Skydd väntar...',
    effective: 'Skydd effektivt',
    missed: 'Dos missad',
    lapsed: 'Skyddet har upphört',
    ended: 'Session avslutad',
    loadingClient: 'Laddar...',
    riskWarning: 'Om du har haft oskyddat sex utanför skyddsperioden, vänligen testa dig.',
  },
  protection: {
    startsIn: 'Kommer att vara aktiv om {time}',
    text: {
      lapsed: 'Du har missat en eller flera doser. Ditt skydd är inte längre garanterat.',
      lessThan3doses: 'Om du fortsätter att ta doserna till {dateTroisiemeJour} kommer dina relationer mellan {datePriseDemarrage} och {dateLendemain} att skyddas.',
      moreThan3doses: 'Dina relationer före {dateAvantDernierePrise} skyddas av PrEP.',
    },
  },
  dose: {
    nextIn: 'Nästa dos om {time}',
    timeLeft: 'Du har {time} på dig att ta ett piller',
    now: 'Ta ditt piller nu!',
  },
  dashboard: {
    logDose: 'Jag har tagit min dos',
    endSession: 'Avsluta session',
    startSession: 'Starta ny session',
    stopPrepInfo: 'För att sluta med PrEP, fortsätt att ta 1 piller om dagen i 2 dagar efter ditt senaste samlag.',
    endSessionDialog: {
      title: 'Avsluta PrEP-session?',
      description: 'Detta kommer att stoppa aviseringspåminnelserna. Ditt skydd kommer att beräknas baserat på din senaste dos.',
      confirm: 'Ja, avsluta',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Session avslutad',
        description: 'Aviseringspåminnelser är nu stoppade.',
      },
    },
    clear: {
      toast: {
        dev: 'Testdata omladdad',
        title: 'Data raderad',
        description: 'Din historik och dina preferenser har raderats.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Webbläsaren stöds inte',
      denied: {
        title: 'Aviseringar nekade',
        description: 'Du kan återaktivera dem i dina webbläsarinställningar.',
      },
      configError: {
        title: 'Konfigurationsfel',
        description: 'Aviseringsnyckeln saknas.',
      },
      enabled: 'Aviseringar aktiverade!',
      tokenError: 'Kunde inte hämta token',
      subscriptionError: 'Prenumerationsfel',
      disabled: 'Aviseringar inaktiverade.',
      unsubscribeError: 'Fel vid avanmälan',
    },
  },
} as const;
