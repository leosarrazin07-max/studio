
export default {
  common: {
    cancel: 'Anuluj',
  },
  welcomeScreen: {
    title: 'Witaj w PrEPy',
    subtitle: 'Twój inteligentny towarzysz PrEP na żądanie. Śledź swoje dawki, bądź chroniony i zarządzaj swoimi sesjami z pewnością siebie.',
    cta: 'Rozpocznij sesję PrEP',
  },
  welcomeDialog: {
    title: 'Aktywuj powiadomienia',
    description: {
      part1: 'Dla Twojego bezpieczeństwa zaleca się aktywowanie powiadomień. Pozwoli to PrEPy na wysyłanie Ci przypomnień o dawkach tabletek.',
      part2: 'Pominięcie przypomnienia może zagrozić Twojej ochronie.',
    },
    confirm: 'Rozumiem, aktywuj powiadomienia',
  },
  settings: {
    title: 'Ustawienia',
    description: 'Zarządzaj swoimi danymi i preferencjami.',
    notifications: {
      title: 'Powiadomienia',
      description: 'Otrzymuj przypomnienie o każdej dawce, aby zapewnić sobie ochronę.',
      enabled: 'Powiadomienia włączone',
      disabled: 'Powiadomienia wyłączone',
      loading: 'Ładowanie...',
      denied: 'Zablokowałeś powiadomienia. Aby je ponownie włączyć, musisz zezwolić na powiadomienia dla tej witryny w ustawieniach przeglądarki, a następnie ponownie załadować stronę.',
      disabledWarning: 'Przypomnienia o dawkach są wyłączone. Nie będziesz otrzymywać żadnych powiadomień, co może prowadzić do pominięcia dawek.',
    },
    language: {
      title: 'Język',
      description: 'Wybierz język wyświetlania aplikacji.',
      select: 'Wybierz język',
    },
    theme: {
      title: "Tryb wyświetlania",
      description: "Wybierz między jasnym a ciemnym motywem."
    },
    clearHistory: {
      button: 'Usuń moją historię',
      dialog: {
        title: 'Czy jesteś absolutnie pewien?',
        description: 'Ta operacja jest nieodwracalna. Wszystkie Twoje dane sesji i historia tabletek zostaną trwale usunięte.',
        confirm: 'Tak, usuń moje dane',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Rozpocznij sesję',
      description: 'Zaczniesz od 2 tabletek. Potwierdź, kiedy przyjąłeś dawkę początkową.',
    },
    regular: {
      title: 'Zarejestruj swoją dawkę',
      description: 'Potwierdź, kiedy przyjąłeś tabletkę.',
    },
    missed: {
      title: 'Pominięta dawka',
      description: 'Wygląda na to, że pominąłeś dawkę. Wybierz opcję, aby zaktualizować swój status.',
      earlier: 'Wziąłem 1 tabletkę wcześniej',
      restart: 'Uruchom ponownie z 2 tabletkami',
    },
    picker: {
      description: 'Wybierz datę i godzinę zażycia {count} tabletki(ek).',
      confirm: 'Potwierdź godzinę',
    },
    pills: {
      earlier: 'Wziąłem {count} tabletkę(i) wcześniej',
      now: 'Wziąłem {count} tabletkę(i) teraz',
    },
  },
  doseHistory: {
    title: 'Dziennik',
    description: 'Twoje działania z ostatnich 90 dni.',
    event: {
      start: 'Sesja rozpoczęta',
      dose: 'Tabletka zażyta',
      stop: 'Sesja zakończona',
      unknown: 'Nieznane zdarzenie',
    },
    empty: {
      title: 'Brak zarejestrowanej aktywności.',
      subtitle: 'Rozpocznij sesję, aby zacząć.',
    },
  },
  status: {
    inactive: 'Nieaktywny',
    loading: 'Ochrona w toku...',
    effective: 'Ochrona skuteczna',
    missed: 'Pominięto dawkę',
    lapsed: 'Ochrona wygasła',
    ended: 'Sesja zakończona',
    loadingClient: 'Ładowanie...',
    riskWarning: 'Jeśli uprawiałeś seks bez zabezpieczenia poza okresem ochrony, proszę wykonaj test.',
  },
  protection: {
    startsIn: 'Będzie aktywna za {time}',
    text: {
      lapsed: 'Pominąłeś jedną lub więcej dawek. Twoja ochrona nie jest już gwarantowana.',
      lessThan3doses: 'Jeśli będziesz kontynuować przyjmowanie dawek do {dateTroisiemeJour}, Twoje stosunki między {datePriseDemarrage} a {dateLendemain} będą chronione.',
      moreThan3doses: 'Twoje stosunki przed {dateAvantDernierePrise} są chronione przez PrEP.',
    },
  },
  dose: {
    nextIn: 'Następna dawka za {time}',
    timeLeft: 'Masz {time}, aby wziąć tabletkę',
    now: 'Weź tabletkę teraz!',
  },
  dashboard: {
    logDose: 'Wziąłem dawkę',
    endSession: 'Zakończ sesję',
    startSession: 'Rozpocznij nową sesję',
    stopPrepInfo: 'Aby przerwać PrEP, kontynuuj przyjmowanie 1 tabletki dziennie przez 2 dni po ostatnim stosunku.',
    endSessionDialog: {
      title: 'Zakończyć sesję PrEP?',
      description: 'To zatrzyma przypomnienia o powiadomieniach. Twoja ochrona zostanie obliczona na podstawie ostatniej dawki.',
      confirm: 'Tak, zakończ',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sesja zakończona',
        description: 'Przypomnienia o powiadomieniach są teraz zatrzymane.',
      },
    },
    clear: {
      toast: {
        dev: 'Dane testowe przeładowane',
        title: 'Dane wyczyszczone',
        description: 'Twoja historia i preferencje zostały usunięte.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Przeglądarka nie jest kompatybilna',
      denied: {
        title: 'Powiadomienia odrzucone',
        description: 'Możesz je ponownie aktywować w ustawieniach przeglądarki.',
      },
      configError: {
        title: 'Błąd konfiguracji',
        description: 'Brak klucza powiadomień.',
      },
      enabled: 'Powiadomienia włączone!',
      tokenError: 'Nie można pobrać tokena',
      subscriptionError: 'Błąd subskrypcji',
      disabled: 'Powiadomienia wyłączone.',
      unsubscribeError: 'Błąd podczas anulowania subskrypcji',
    },
  },
} as const;
