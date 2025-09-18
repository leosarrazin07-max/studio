
export default {
  common: {
    cancel: 'Anulează',
  },
  welcomeScreen: {
    title: 'Bun venit la PrEPy',
    subtitle: 'Partenerul tău inteligent pentru PrEP la cerere. Urmărește-ți dozele, fii protejat și gestionează-ți sesiunile cu încredere.',
    cta: 'Începe o sesiune PrEP',
  },
  welcomeDialog: {
    title: 'Activează notificările',
    description: {
      part1: 'Pentru siguranța ta, este recomandat să activezi notificările. Acest lucru va permite PrEPy să îți trimită memento-uri pentru dozele de pastile.',
      part2: 'Omiterea unui memento poate compromite protecția ta.',
    },
    confirm: 'Am înțeles, activează notificările',
  },
  settings: {
    title: 'Setări',
    description: 'Gestionează-ți datele și preferințele.',
    notifications: {
      title: 'Notificări',
      description: 'Primește un memento pentru fiecare doză pentru a-ți asigura protecția.',
      enabled: 'Notificări activate',
      disabled: 'Notificări dezactivate',
      loading: 'Se încarcă...',
      denied: 'Ai blocat notificările. Pentru a le reactiva, trebuie să permiți notificările pentru acest site în setările browserului tău, apoi să reîncarci pagina.',
      disabledWarning: 'Memento-urile pentru doze sunt dezactivate. Nu vei primi nicio notificare, ceea ce poate duce la omiterea dozelor.',
    },
    language: {
      title: 'Limbă',
      description: 'Alege limba de afișare a aplicației.',
      select: 'Selectează o limbă',
    },
    theme: {
      title: "Mod de afișare",
      description: "Alege între tema deschisă și cea întunecată."
    },
    clearHistory: {
      button: 'Șterge istoricul meu',
      dialog: {
        title: 'Ești absolut sigur?',
        description: 'Această acțiune este ireversibilă. Toate datele sesiunii tale și istoricul pastilelor vor fi șterse definitiv.',
        confirm: 'Da, șterge datele mele',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Începe sesiunea',
      description: 'Vei începe cu 2 pastile. Confirmă când ai luat doza inițială.',
    },
    regular: {
      title: 'Înregistrează-ți doza',
      description: 'Confirmă când ai luat pastila.',
    },
    missed: {
      title: 'Doză omisă',
      description: 'Se pare că ai omis o doză. Alege o opțiune pentru a-ți actualiza starea.',
      earlier: 'Am luat 1 pastilă mai devreme',
      restart: 'Repornește cu 2 pastile',
    },
    picker: {
      description: 'Selectează data și ora administrării a {count} pastilă(e).',
      confirm: 'Confirmă ora',
    },
    pills: {
      earlier: 'Am luat {count} pastilă(e) mai devreme',
      now: 'Am luat {count} pastilă(e) acum',
    },
  },
  doseHistory: {
    title: 'Jurnal de bord',
    description: 'Activitățile tale din ultimele 90 de zile.',
    event: {
      start: 'Sesiune începută',
      dose: 'Pastilă luată',
      stop: 'Sesiune încheiată',
      unknown: 'Eveniment necunoscut',
    },
    empty: {
      title: 'Nicio activitate înregistrată.',
      subtitle: 'Începe o sesiune pentru a începe.',
    },
  },
  status: {
    inactive: 'Inactiv',
    loading: 'Protecție în așteptare...',
    effective: 'Protecție eficientă',
    missed: 'Doză omisă',
    lapsed: 'Protecție întreruptă',
    ended: 'Sesiune încheiată',
    loadingClient: 'Se încarcă...',
    riskWarning: 'Dacă ai avut contact sexual neprotejat în afara perioadei de protecție, te rugăm să te testezi.',
  },
  protection: {
    startsIn: 'Va fi activă în {time}',
    text: {
      lapsed: 'Ai omis una sau mai multe doze. Protecția ta nu mai este garantată.',
      lessThan3doses: 'Dacă continui să iei dozele până la {dateTroisiemeJour}, relațiile tale între {datePriseDemarrage} și {dateLendemain} vor fi protejate.',
      moreThan3doses: 'Relațiile tale de dinainte de {dateAvantDernierePrise} sunt protejate de PrEP.',
    },
  },
  dose: {
    nextIn: 'Următoarea doză în {time}',
    timeLeft: 'Mai ai {time} pentru a lua o pastilă',
    now: 'Ia-ți pastila acum!',
  },
  dashboard: {
    logDose: 'Am luat doza',
    endSession: 'Încheie sesiunea',
    startSession: 'Începe o nouă sesiune',
    stopPrepInfo: 'Pentru a opri PrEP, continuă să iei 1 pastilă pe zi timp de 2 zile după ultimul contact sexual.',
    endSessionDialog: {
      title: 'Închei sesiunea PrEP?',
      description: 'Acest lucru va opri memento-urile de notificare. Protecția ta va fi calculată pe baza ultimei doze.',
      confirm: 'Da, încheie',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sesiune încheiată',
        description: 'Memento-urile de notificare sunt acum oprite.',
      },
    },
    clear: {
      toast: {
        dev: 'Date de test reîncărcate',
        title: 'Date șterse',
        description: 'Istoricul și preferințele tale au fost șterse.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Browser incompatibil',
      denied: {
        title: 'Notificări refuzate',
        description: 'Le poți reactiva din setările browserului tău.',
      },
      configError: {
        title: 'Eroare de configurare',
        description: 'Cheia de notificare lipsește.',
      },
      enabled: 'Notificări activate!',
      tokenError: 'Nu s-a putut prelua token-ul',
      subscriptionError: 'Eroare de abonare',
      disabled: 'Notificări dezactivate.',
      unsubscribeError: 'Eroare la dezabonare',
    },
  },
} as const;
