export default {
  common: {
    cancel: 'Mégse',
  },
  welcomeScreen: {
    title: 'Üdvözöljük a PrEPy-ben',
    subtitle: 'Az Ön intelligens, igény szerinti PrEP-társa. Kövesse nyomon adagjait, maradjon védett, és kezelje munkameneteit magabiztosan.',
    cta: 'PrEP-munkamenet indítása',
  },
welcomeDialog: {
    title: 'Értesítések aktiválása',
    description: {
      part1: 'Az Ön biztonsága érdekében erősen ajánlott az értesítések aktiválása. Ez lehetővé teszi a PrEPy számára, hogy emlékeztetőket küldjön a tabletta adagjairól.',
      part2: 'Egy emlékeztető kihagyása veszélyeztetheti a védelmét.',
    },
    confirm: 'Értettem, értesítések aktiválása',
  },
  settings: {
    title: 'Beállítások',
    description: 'Kezelje adatait és preferenciáit.',
    notifications: {
      title: 'Értesítések',
      description: 'Kapjon emlékeztetőt minden adagról, hogy biztosítsa védelmét.',
      enabled: 'Értesítések engedélyezve',
      disabled: 'Értesítések letiltva',
      loading: 'Betöltés...',
      denied: 'Letiltotta az értesítéseket. Az újbóli engedélyezéshez engedélyeznie kell az értesítéseket ehhez az oldalhoz a böngésző beállításaiban, majd újra kell töltenie az oldalt.',
      disabledWarning: 'Az adag emlékeztetők le vannak tiltva. Nem fog értesítéseket kapni, ami kihagyott adagokhoz vezethet.',
    },
    language: {
      title: 'Nyelv',
      description: 'Válassza ki az alkalmazás megjelenítési nyelvét.',
      select: 'Válasszon nyelvet',
    },
    theme: {
      title: 'Megjelenítési mód',
      description: 'Válasszon a világos és a sötét téma között.',
    },
    clearHistory: {
      button: 'Előzményeim törlése',
      dialog: {
        title: 'Teljesen biztos benne?',
        description: 'Ez a művelet visszavonhatatlan. Az összes munkamenet-adat és tabletta-előzmény véglegesen törlődik.',
        confirm: 'Igen, törölje az adataimat',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Indítsa el a munkamenetet',
      description: '2 tablettával fog kezdeni. Erősítse meg, mikor vette be a kezdeti adagot.',
    },
    regular: {
      title: 'Naplózza az adagját',
      description: 'Erősítse meg, mikor vette be a tablettáját.',
    },
    missed: {
      title: 'Kihagyott adag',
      description: 'Úgy tűnik, kihagyott egy adagot. Válasszon egy lehetőséget az állapot frissítéséhez.',
      earlier: 'Korábban vettem be 1 tablettát',
      restart: 'Újraindítás 2 tablettával',
    },
    picker: {
      description: 'Válassza ki a(z) {count} tabletta bevételének dátumát és idejét.',
      confirm: 'Időpont megerősítése',
    },
    pills: {
      earlier: 'Korábban vettem be {count} tablettát',
      now: 'Most vettem be {count} tablettát',
    },
  },
  doseHistory: {
    title: 'Napló',
    description: 'Az elmúlt 90 nap tevékenységei.',
    event: {
      start: 'Munkamenet elindítva',
      dose: 'Tabletta bevéve',
      stop: 'Munkamenet befejezve',
      unknown: 'Ismeretlen esemény',
    },
    empty: {
      title: 'Nincs rögzített tevékenység.',
      subtitle: 'Indítson el egy munkamenetet a kezdéshez.',
    },
  },
  status: {
    inactive: 'Inaktív',
    loading: 'Védelem függőben...',
    effective: 'Védelem hatékony',
    missed: 'Adag kihagyva',
    lapsed: 'Védelem lejárt',
    ended: 'Munkamenet befejezve',
    loadingClient: 'Betöltés...',
    riskWarning: 'Ha a védelmi időszakon kívül védekezés nélkül szexelt, kérjük, teszteltesse magát.',
  },
  protection: {
    startsIn: '{time} múlva lesz aktív',
    text: {
      lapsed: 'Kihagyott egy vagy több adagot. A védelme már nem garantált.',
      lessThan3doses: 'Ha folytatja az adagok szedését {dateTroisiemeJour}-ig, a {datePriseDemarrage} és {dateLendemain} közötti kapcsolatai védettek lesznek.',
      moreThan3doses: 'A {dateAvantDernierePrise} előtti kapcsolatai védettek a PrEP által.',
    },
  },
  dose: {
    nextIn: 'Következő adag {time} múlva',
    timeLeft: 'Még {time} van egy tabletta bevételére',
    now: 'Vegye be most a tablettáját!',
  },
  dashboard: {
    logDose: 'Bevettem az adagomat',
    endSession: 'Munkamenet befejezése',
    startSession: 'Új munkamenet indítása',
    stopPrepInfo: 'A PrEP abbahagyásához folytassa a napi 1 tabletta szedését az utolsó közösülés utáni 2 napig.',
    endSessionDialog: {
      title: 'Befejezi a PrEP-munkamenetet?',
      description: 'Ez leállítja az értesítési emlékeztetőket. A védelme az utolsó adag alapján lesz kiszámítva.',
      confirm: 'Igen, befejezés',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Munkamenet befejezve',
        description: 'Az értesítési emlékeztetők leállítva.',
      },
    },
    clear: {
      toast: {
        dev: 'Tesztadatok újratöltve',
        title: 'Adatok törölve',
        description: 'Az előzményei és preferenciái törölve lettek.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'A böngésző nem kompatibilis',
      denied: {
        title: 'Értesítések elutasítva',
        description: 'Újra engedélyezheti őket a böngésző beállításaiban.',
      },
      configError: {
        title: 'Konfigurációs hiba',
        description: 'Hiányzik az értesítési kulcs.',
      },
      enabled: 'Értesítések engedélyezve!',
      tokenError: 'Nem sikerült lekérni a tokent',
      subscriptionError: 'Előfizetési hiba',
      disabled: 'Értesítések letiltva.',
      unsubscribeError: 'Hiba a leiratkozás során',
    },
  },
} as const;
