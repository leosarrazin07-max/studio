
export default {
  common: {
    cancel: 'Annuleren',
  },
  welcomeScreen: {
    title: 'Welkom bij PrEPy',
    subtitle: 'Uw slimme on-demand PrEP-metgezel. Volg uw doses, blijf beschermd en beheer uw sessies met vertrouwen.',
    cta: 'Start een PrEP-sessie',
  },
  welcomeDialog: {
    title: 'Meldingen activeren',
    description: {
      part1: 'Voor uw veiligheid wordt het sterk aanbevolen om meldingen te activeren. Dit stelt PrEPy in staat u herinneringen te sturen voor uw pildoses.',
      part2: 'Het missen van een herinnering kan uw bescherming in gevaar brengen.',
    },
    confirm: 'Begrepen, activeer meldingen',
  },
  settings: {
    title: 'Instellingen',
    description: 'Beheer uw gegevens en voorkeuren.',
    notifications: {
      title: 'Meldingen',
      description: 'Ontvang een herinnering voor elke dosis om uw bescherming te garanderen.',
      enabled: 'Meldingen ingeschakeld',
      disabled: 'Meldingen uitgeschakeld',
      loading: 'Laden...',
      denied: 'U heeft meldingen geblokkeerd. Om ze opnieuw in te schakelen, moet u meldingen voor deze site toestaan in uw browserinstellingen en vervolgens de pagina opnieuw laden.',
      disabledWarning: 'Dosisherinneringen zijn uitgeschakeld. U ontvangt geen meldingen, wat kan leiden tot gemiste doses.',
    },
    language: {
      title: 'Taal',
      description: 'Kies de weergavetaal voor de applicatie.',
      select: 'Selecteer een taal',
    },
    clearHistory: {
      button: 'Mijn geschiedenis verwijderen',
      dialog: {
        title: 'Bent u absoluut zeker?',
        description: 'Deze actie is onomkeerbaar. Al uw sessiegegevens en pilgeschiedenis worden permanent verwijderd.',
        confirm: 'Ja, mijn gegevens verwijderen',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Start uw sessie',
      description: 'U begint met 2 pillen. Bevestig wanneer u uw startdosis heeft ingenomen.',
    },
    regular: {
      title: 'Log uw dosis',
      description: 'Bevestig wanneer u uw pil heeft ingenomen.',
    },
    missed: {
      title: 'Gemiste dosis',
      description: 'Het lijkt erop dat u een dosis heeft gemist. Kies een optie om uw status bij te werken.',
      earlier: 'Ik heb 1 pil eerder ingenomen',
      restart: 'Herstart met 2 pillen',
    },
    picker: {
      description: 'Selecteer de datum en tijd van inname van {count} pil(len).',
      confirm: 'Tijd bevestigen',
    },
    pills: {
      earlier: 'Ik heb {count} pil(len) eerder ingenomen',
      now: 'Ik heb {count} pil(len) nu ingenomen',
    },
  },
  doseHistory: {
    title: 'Logboek',
    description: 'Uw activiteiten van de laatste 90 dagen.',
    event: {
      start: 'Sessie gestart',
      dose: 'Pil ingenomen',
      stop: 'Sessie beëindigd',
      unknown: 'Onbekende gebeurtenis',
    },
    empty: {
      title: 'Geen activiteit geregistreerd.',
      subtitle: 'Start een sessie om te beginnen.',
    },
  },
  status: {
    inactive: 'Inactief',
    loading: 'Bescherming in behandeling...',
    effective: 'Bescherming effectief',
    missed: 'Dosis gemist',
    lapsed: 'Bescherming vervallen',
    ended: 'Sessie beëindigd',
    loadingClient: 'Laden...',
    riskWarning: 'Als u onbeschermde seks heeft gehad buiten de beschermingsperiode, laat u dan testen.',
  },
  protection: {
    startsIn: 'Is actief over {time}',
    text: {
      lapsed: 'U heeft een of meer doses gemist. Uw bescherming is niet langer gegarandeerd.',
      lessThan3doses: 'Als u doorgaat met het innemen van de doses tot {dateTroisiemeJour}, zijn uw contacten tussen {datePriseDemarrage} en {dateLendemain} beschermd.',
      moreThan3doses: 'Uw contacten vóór {dateAvantDernierePrise} zijn beschermd door PrEP.',
    },
  },
  dose: {
    nextIn: 'Volgende dosis over {time}',
    timeLeft: 'U heeft nog {time} om een pil in te nemen',
    now: 'Neem nu uw pil!',
  },
  dashboard: {
    logDose: 'Ik heb mijn dosis genomen',
    endSession: 'Sessie beëindigen',
    startSession: 'Nieuwe sessie starten',
    stopPrepInfo: 'Om met PrEP te stoppen, blijf 1 pil per dag innemen gedurende 2 dagen na uw laatste geslachtsgemeenschap.',
    endSessionDialog: {
      title: 'PrEP-sessie beëindigen?',
      description: 'Dit stopt de meldingsherinneringen. Uw bescherming wordt berekend op basis van uw laatste dosis.',
      confirm: 'Ja, beëindigen',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sessie beëindigd',
        description: 'Meldingsherinneringen zijn nu gestopt.',
      },
    },
    clear: {
      toast: {
        dev: 'Testgegevens opnieuw geladen',
        title: 'Gegevens gewist',
        description: 'Uw geschiedenis en voorkeuren zijn verwijderd.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Browser niet compatibel',
      denied: {
        title: 'Meldingen geweigerd',
        description: 'U kunt ze opnieuw inschakelen in uw browserinstellingen.',
      },
      configError: {
        title: 'Configuratiefout',
        description: 'De meldingssleutel ontbreekt.',
      },
      enabled: 'Meldingen ingeschakeld!',
      tokenError: 'Kon token niet ophalen',
      subscriptionError: 'Abonnementsfout',
      disabled: 'Meldingen uitgeschakeld.',
      unsubscribeError: 'Fout bij het afmelden',
    },
  },
} as const;
