
export default {
  common: {
    cancel: 'Zrušit',
  },
  welcomeScreen: {
    title: 'Vítejte v PrEPy',
    subtitle: 'Váš chytrý společník pro PrEP na vyžádání. Sledujte své dávky, zůstaňte chráněni a spravujte své sezení s důvěrou.',
    cta: 'Zahájit sezení PrEP',
  },
  welcomeDialog: {
    title: 'Aktivovat oznámení',
    description: {
      part1: 'Pro vaši bezpečnost se důrazně doporučuje aktivovat oznámení. To umožní PrEPy posílat vám připomenutí na vaše dávky pilulek.',
      part2: 'Zmeškání připomenutí může ohrozit vaši ochranu.',
    },
    confirm: 'Rozumím, aktivovat oznámení',
  },
  settings: {
    title: 'Nastavení',
    description: 'Spravujte svá data a preference.',
    notifications: {
      title: 'Oznámení',
      description: 'Dostávejte připomenutí pro každou dávku, abyste si zajistili ochranu.',
      enabled: 'Oznámení povolena',
      disabled: 'Oznámení zakázána',
      loading: 'Načítání...',
      denied: 'Zablokovali jste oznámení. Chcete-li je znovu povolit, musíte povolit oznámení pro tuto stránku v nastavení svého prohlížeče a poté stránku znovu načíst.',
      disabledWarning: 'Připomenutí dávek jsou zakázána. Nebudete dostávat žádná oznámení, což může vést k vynechání dávek.',
    },
    language: {
      title: 'Jazyk',
      description: 'Zvolte jazyk zobrazení aplikace.',
      select: 'Vyberte jazyk',
    },
    theme: {
      title: 'Režim zobrazení',
      description: 'Vyberte si mezi světlým a tmavým motivem.',
    },
    clearHistory: {
      button: 'Smazat moji historii',
      dialog: {
        title: 'Jste si naprosto jisti?',
        description: 'Tato akce je nevratná. Všechna vaše data o sezení a historie pilulek budou trvale smazána.',
        confirm: 'Ano, smazat má data',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Zahajte své sezení',
      description: 'Začnete s 2 pilulkami. Potvrďte, kdy jste si vzali svou počáteční dávku.',
    },
    regular: {
      title: 'Zaznamenejte svou dávku',
      description: 'Potvrďte, kdy jste si vzali svou pilulku.',
    },
    missed: {
      title: 'Vynechaná dávka',
      description: 'Zdá se, že jste vynechali dávku. Zvolte možnost pro aktualizaci svého stavu.',
      earlier: 'Vzal jsem 1 pilulku dříve',
      restart: 'Restartovat s 2 pilulkami',
    },
    picker: {
      description: 'Vyberte datum a čas užití {count} pilulky(ek).',
      confirm: 'Potvrdit čas',
    },
    pills: {
      earlier: 'Vzal jsem {count} pilulku(y) dříve',
      now: 'Vzal jsem {count} pilulku(y) nyní',
    },
  },
  doseHistory: {
    title: 'Záznam',
    description: 'Vaše aktivity za posledních 90 dní.',
    event: {
      start: 'Sezení zahájeno',
      dose: 'Pilulka užita',
      stop: 'Sezení ukončeno',
      unknown: 'Neznámá událost',
    },
    empty: {
      title: 'Žádná aktivita zaznamenána.',
      subtitle: 'Zahajte sezení, abyste začali.',
    },
  },
  status: {
    inactive: 'Neaktivní',
    loading: 'Ochrana čeká...',
    effective: 'Ochrana účinná',
    missed: 'Dávka vynechána',
    lapsed: 'Ochrana propadla',
    ended: 'Sezení ukončeno',
    loadingClient: 'Načítání...',
    riskWarning: 'Pokud jste měli nechráněný sex mimo období ochrany, nechte se prosím otestovat.',
  },
  protection: {
    startsIn: 'Bude aktivní za {time}',
    text: {
      lapsed: 'Vynechali jste jednu nebo více dávek. Vaše ochrana již není zaručena.',
      lessThan3doses: 'Pokud budete pokračovat v užívání dávek do {dateTroisiemeJour}, vaše styky mezi {datePriseDemarrage} a {dateLendemain} budou chráněny.',
      moreThan3doses: 'Vaše styky před {dateAvantDernierePrise} jsou chráněny PrEP.',
    },
  },
  dose: {
    nextIn: 'Další dávka za {time}',
    timeLeft: 'Máte {time} na užití pilulky',
    now: 'Vezměte si svou pilulku nyní!',
  },
  dashboard: {
    logDose: 'Vzal jsem si svou dávku',
    endSession: 'Ukončit sezení',
    startSession: 'Zahájit nové sezení',
    stopPrepInfo: 'Chcete-li přestat s PrEP, pokračujte v užívání 1 pilulky denně po dobu 2 dnů po posledním pohlavním styku.',
    endSessionDialog: {
      title: 'Ukončit sezení PrEP?',
      description: 'Tím se zastaví připomenutí oznámení. Vaše ochrana bude vypočtena na základě vaší poslední dávky.',
      confirm: 'Ano, ukončit',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sezení ukončeno',
        description: 'Připomenutí oznámení jsou nyní zastavena.',
      },
    },
    clear: {
      toast: {
        dev: 'Testovací data znovu načtena',
        title: 'Data vymazána',
        description: 'Vaše historie a preference byly smazány.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Prohlížeč není kompatibilní',
      denied: {
        title: 'Oznámení zamítnuta',
        description: 'Můžete je znovu aktivovat v nastavení svého prohlížeče.',
      },
      configError: {
        title: 'Chyba konfigurace',
        description: 'Chybí klíč oznámení.',
      },
      enabled: 'Oznámení povolena!',
      tokenError: 'Nepodařilo se získat token',
      subscriptionError: 'Chyba předplatného',
      disabled: 'Oznámení zakázána.',
      unsubscribeError: 'Chyba při odhlašování',
    },
  },
} as const;

    