
export default {
  common: {
    cancel: 'Otkaži',
  },
  welcomeScreen: {
    title: 'Dobrodošli u PrEPy',
    subtitle: 'Vaš pametni saputnik za PrEP na zahtev. Pratite svoje doze, ostanite zaštićeni i upravljajte svojim sesijama sa poverenjem.',
    cta: 'Započnite PrEP sesiju',
  },
  welcomeDialog: {
    title: 'Aktivirajte obaveštenja',
    description: {
      part1: 'Radi vaše bezbednosti, preporučuje se da aktivirate obaveštenja. Ovo će omogućiti PrEPy-ju da vam šalje podsetnike za doze pilula.',
      part2: 'Propuštanje podsetnika može ugroziti vašu zaštitu.',
    },
    confirm: 'Razumem, aktiviraj obaveštenja',
  },
  settings: {
    title: 'Podešavanja',
    description: 'Upravljajte svojim podacima i preferencijama.',
    notifications: {
      title: 'Obaveštenja',
      description: 'Primajte podsetnik za svaku dozu kako biste osigurali svoju zaštitu.',
      enabled: 'Obaveštenja omogućena',
      disabled: 'Obaveštenja onemogućena',
      loading: 'Učitavanje...',
      denied: 'Blokirali ste obaveštenja. Da biste ih ponovo omogućili, morate dozvoliti obaveštenja za ovaj sajt u podešavanjima vašeg pregledača, a zatim ponovo učitati stranicu.',
      disabledWarning: 'Podsetnici za doze su onemogućeni. Nećete primati nikakva obaveštenja, što može dovesti do propuštenih doza.',
    },
    language: {
      title: 'Jezik',
      description: 'Izaberite jezik prikaza aplikacije.',
      select: 'Izaberite jezik',
    },
    theme: {
      title: "Režim prikaza",
      description: "Izaberite između svetle i tamne teme."
    },
clearHistory: {
      button: 'Obriši moju istoriju',
      dialog: {
        title: 'Da li ste apsolutno sigurni?',
        description: 'Ova akcija je nepovratna. Svi vaši podaci o sesiji i istorija pilula biće trajno obrisani.',
        confirm: 'Da, obriši moje podatke',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Započnite svoju sesiju',
      description: 'Počećete sa 2 pilule. Potvrdite kada ste uzeli svoju početnu dozu.',
    },
    regular: {
      title: 'Zabeležite svoju dozu',
      description: 'Potvrdite kada ste uzeli pilulu.',
    },
    missed: {
      title: 'Propuštena doza',
      description: 'Čini se da ste propustili dozu. Izaberite opciju da ažurirate svoj status.',
      earlier: 'Uzeo sam 1 pilulu ranije',
      restart: 'Ponovo pokrenite sa 2 pilule',
    },
    picker: {
      description: 'Izaberite datum i vreme uzimanja {count} pilule(a).',
      confirm: 'Potvrdi vreme',
    },
    pills: {
      earlier: 'Uzeo sam {count} pilule(a) ranije',
      now: 'Uzeo sam {count} pilule(a) sada',
    },
  },
  doseHistory: {
    title: 'Dnevnik',
    description: 'Vaše aktivnosti u poslednjih 90 dana.',
    event: {
      start: 'Sesija započeta',
      dose: 'Pilula uzeta',
      stop: 'Sesija završena',
      unknown: 'Nepoznat događaj',
    },
    empty: {
      title: 'Nema zabeleženih aktivnosti.',
      subtitle: 'Započnite sesiju da biste počeli.',
    },
  },
  status: {
    inactive: 'Neaktivno',
    loading: 'Zaštita u toku...',
    effective: 'Zaštita efektivna',
    missed: 'Doza propuštena',
    lapsed: 'Zaštita istekla',
    ended: 'Sesija završena',
    loadingClient: 'Učitavanje...',
    riskWarning: 'Ako ste imali nezaštićen seks van perioda zaštite, molimo vas da se testirate.',
  },
  protection: {
    startsIn: 'Biće aktivno za {time}',
    text: {
      lapsed: 'Propustili ste jednu ili više doza. Vaša zaštita više nije zagarantovana.',
      lessThan3doses: 'Ako nastavite da uzimate doze do {dateTroisiemeJour}, vaši odnosi između {datePriseDemarrage} i {dateLendemain} biće zaštićeni.',
      moreThan3doses: 'Vaši odnosi pre {dateAvantDernierePrise} su zaštićeni PrEP-om.',
    },
  },
  dose: {
    nextIn: 'Sledeća doza za {time}',
    timeLeft: 'Imate {time} da uzmete pilulu',
    now: 'Uzmite svoju pilulu sada!',
  },
dashboard: {
    logDose: 'Uzeo sam svoju dozu',
    endSession: 'Završi sesiju',
    startSession: 'Započni novu sesiju',
    stopPrepInfo: 'Da biste prekinuli sa PrEP-om, nastavite da uzimate 1 pilulu dnevno tokom 2 dana nakon poslednjeg seksualnog odnosa.',
    endSessionDialog: {
      title: 'Završiti PrEP sesiju?',
      description: 'Ovo će zaustaviti podsetnike za obaveštenja. Vaša zaštita će biti izračunata na osnovu vaše poslednje doze.',
      confirm: 'Da, završi',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sesija završena',
        description: 'Podsetnici za obaveštenja su sada zaustavljeni.',
      },
    },
    clear: {
      toast: {
        dev: 'Test podaci ponovo učitani',
        title: 'Podaci obrisani',
        description: 'Vaša istorija i preference su obrisane.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Pregledač nije podržan',
      denied: {
        title: 'Obaveštenja odbijena',
        description: 'Možete ih ponovo aktivirati u podešavanjima vašeg pregledača.',
      },
      configError: {
        title: 'Greška u konfiguraciji',
        description: 'Ključ za obaveštenja nedostaje.',
      },
      enabled: 'Obaveštenja omogućena!',
      tokenError: 'Nije moguće preuzeti token',
      subscriptionError: 'Greška u pretplati',
      disabled: 'Obaveštenja onemogućena.',
      unsubscribeError: 'Greška prilikom otkazivanja pretplate',
    },
  },
} as const;
