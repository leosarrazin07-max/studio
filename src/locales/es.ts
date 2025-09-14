
export default {
  common: {
    cancel: 'Cancelar',
  },
  welcomeScreen: {
    title: 'Bienvenido a PrEPy',
    subtitle: 'Tu compañero inteligente de PrEP a demanda. Sigue tus dosis, mantente protegido y gestiona tus sesiones con confianza.',
    cta: 'Iniciar una sesión de PrEP',
  },
  welcomeDialog: {
    title: 'Activar notificaciones',
    description: {
      part1: 'Por tu seguridad, se recomienda encarecidamente activar las notificaciones. Esto permitirá que PrEPy te envíe recordatorios de tus dosis de pastillas.',
      part2: 'Omitir un recordatorio puede comprometer tu protección.',
    },
    confirm: 'Entendido, activar notificaciones',
  },
  settings: {
    title: 'Configuración',
    description: 'Gestiona tus datos y preferencias.',
    notifications: {
      title: 'Notificaciones',
      description: 'Recibe un recordatorio por cada dosis para garantizar tu protección.',
      enabled: 'Notificaciones activadas',
      disabled: 'Notificaciones desactivadas',
      loading: 'Cargando...',
      denied: 'Has bloqueado las notificaciones. Para reactivarlas, debes permitir las notificaciones para este sitio en la configuración de tu navegador y luego recargar la página.',
      disabledWarning: 'Los recordatorios de dosis están desactivados. No recibirás ninguna notificación, lo que puede llevar a olvidar dosis.',
    },
    language: {
      title: 'Idioma',
      description: 'Elige el idioma de visualización de la aplicación.',
      select: 'Selecciona un idioma',
    },
    clearHistory: {
      button: 'Eliminar mi historial',
      dialog: {
        title: '¿Estás absolutamente seguro?',
        description: 'Esta acción es irreversible. Todos los datos de tu sesión y tu historial de pastillas se eliminarán permanentemente.',
        confirm: 'Sí, eliminar mis datos',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Inicia tu sesión',
      description: 'Comenzarás con 2 pastillas. Confirma cuándo tomaste tu dosis inicial.',
    },
    regular: {
      title: 'Registra tu dosis',
      description: 'Confirma cuándo tomaste tu pastilla.',
    },
    missed: {
      title: 'Dosis olvidada',
      description: 'Parece que olvidaste una dosis. Elige una opción para actualizar tu estado.',
      earlier: 'Tomé 1 pastilla antes',
      restart: 'Reiniciar con 2 pastillas',
    },
    picker: {
      description: 'Selecciona la fecha y hora de la toma de {count} pastilla(s).',
      confirm: 'Confirmar hora',
    },
    pills: {
      earlier: 'Tomé {count} pastilla(s) antes',
      now: 'He tomado {count} pastilla(s) ahora',
    },
  },
  doseHistory: {
    title: 'Diario de a bordo',
    description: 'Tus actividades de los últimos 90 días.',
    event: {
      start: 'Sesión iniciada',
      dose: 'Pastilla tomada',
      stop: 'Sesión terminada',
      unknown: 'Evento desconocido',
    },
    empty: {
      title: 'No se ha registrado ninguna actividad.',
      subtitle: 'Inicia una sesión para empezar.',
    },
  },
  status: {
    inactive: 'Inactivo',
    loading: 'Protección en curso...',
    effective: 'Protección activa',
    missed: 'Dosis olvidada',
    lapsed: 'Protección interrumpida',
    ended: 'Sesión terminada',
    loadingClient: 'Cargando...',
    riskWarning: 'Si has tenido relaciones sexuales sin protección fuera del período de protección, por favor, hazte una prueba.',
  },
  protection: {
    startsIn: 'Estará activa en {time}',
    text: {
      lapsed: 'Has olvidado una o más dosis. Tu protección ya no está garantizada.',
      lessThan3doses: 'Si continúas tomando las dosis hasta el {dateTroisiemeJour}, tus relaciones entre el {datePriseDemarrage} y el {dateLendemain} estarán protegidas.',
      moreThan3doses: 'Tus relaciones antes del {dateAvantDernierePrise} están protegidas por la PrEP.',
    },
Dose: {
    nextIn: 'Próxima dosis en {time}',
    timeLeft: 'Te quedan {time} para tomar una pastilla',
    now: '¡Toma tu pastilla ahora!',
  },
  dashboard: {
    logDose: 'He tomado mi dosis',
    endSession: 'Terminar sesión',
    startSession: 'Iniciar nueva sesión',
    stopPrepInfo: 'Para dejar la PrEP, continúa tomando 1 pastilla al día durante los 2 días siguientes a tu última relación sexual.',
    endSessionDialog: {
      title: '¿Terminar la sesión de PrEP?',
      description: 'Esto detendrá los recordatorios de notificación. Tu protección se calculará en función de tu última dosis.',
      confirm: 'Sí, terminar',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sesión terminada',
        description: 'Los recordatorios de notificación se han detenido.',
      },
    },
    clear: {
      toast: {
        dev: 'Datos de prueba recargados',
        title: 'Datos eliminados',
        description: 'Tu historial y tus preferencias han sido eliminados.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Navegador no compatible',
      denied: {
        title: 'Notificaciones denegadas',
        description: 'Puedes reactivarlas en la configuración de tu navegador.',
      },
      configError: {
        title: 'Error de configuración',
        description: 'Falta la clave de notificación.',
      },
      enabled: '¡Notificaciones activadas!',
      tokenError: 'No se pudo recuperar el token',
      subscriptionError: 'Error de suscripción',
      disabled: 'Notificaciones desactivadas.',
      unsubscribeError: 'Error al cancelar la suscripción',
    },
  },
},
} as const;
