
export default {
  common: {
    cancel: 'Annuler',
  },
  welcomeScreen: {
    title: 'Bienvenue sur PrEPy',
    subtitle: 'Votre compagnon intelligent pour la PrEP à la demande. Suivez vos prises, restez protégé et gérez vos sessions en toute confiance.',
    cta: 'Démarrer une session PrEP',
  },
  welcomeDialog: {
    title: 'Activez les notifications',
    description: {
      part1: 'Pour votre sécurité, il est fortement recommandé d\'activer les notifications. Cela permettra à PrEPy de vous envoyer des rappels pour vos prises de comprimés.',
      part2: 'Manquer un rappel peut compromettre votre protection.',
    },
    confirm: 'J\'ai compris, activer les notifications',
  },
  settings: {
    title: 'Paramètres',
    description: 'Gérez vos données et préférences.',
    notifications: {
      title: 'Notifications',
      description: 'Recevez un rappel pour chaque prise afin de garantir votre protection.',
      enabled: 'Notifications activées',
      disabled: 'Notifications désactivées',
      loading: 'Chargement...',
      denied: 'Vous avez bloqué les notifications. Pour les réactiver, vous devez autoriser les notifications pour ce site dans les paramètres de votre navigateur, puis recharger la page.',
      disabledWarning: 'Les rappels de prise sont désactivés. Vous ne recevrez aucune notification, ce qui peut entraîner des oublis.',
    },
    language: {
      title: 'Langue',
      description: 'Choisissez la langue d\'affichage de l\'application.',
      select: 'Choisissez une langue',
    },
    clearHistory: {
      button: 'Supprimer mon historique',
      dialog: {
        title: 'Êtes-vous absolutely sûr ?',
        description: 'Cette action est irréversible. Toutes vos données de session et votre historique de comprimés seront définitivement supprimés.',
        confirm: 'Oui, supprimer mes données',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Démarrer votre session',
      description: 'Vous commencerez avec 2 comprimés. Confirmez quand vous avez fait votre prise initiale.',
    },
    regular: {
      title: 'Enregistrer votre prise',
      description: 'Confirmez quand vous avez pris votre comprimé.',
    },
missed: {
      title: 'Prise manquée',
      description: 'Il semble que vous ayez manqué une prise. Choisissez une option pour mettre à jour votre statut.',
      earlier: 'J\'ai pris 1 comprimé plus tôt',
      restart: 'Recommencer avec 2 comprimés',
    },
    picker: {
      description: 'Sélectionnez la date et l\'heure de la prise de {count} comprimé(s).',
      confirm: 'Confirmer l\'heure',
    },
    pills: {
      earlier: 'J\'ai pris {count} comprimé(s) plus tôt',
      now: 'J\'ai pris {count} comprimé(s) maintenant',
    },
  },
  doseHistory: {
    title: 'Journal de bord',
    description: 'Vos activités des 90 derniers jours.',
    event: {
      start: 'Démarrage de la session',
      dose: 'Prise de comprimé',
      stop: 'Fin de session',
      unknown: 'Événement inconnu',
    },
    empty: {
      title: 'Aucune activité enregistrée.',
      subtitle: 'Démarrez une session pour commencer.',
    },
  },
  status: {
    inactive: 'Inactive',
    loading: 'Protection en cours...',
    effective: 'Protection active',
    missed: 'Prise manquée',
    lapsed: 'Protection rompue',
    ended: 'Session terminée',
    loadingClient: 'Chargement...',
    riskWarning: 'Si vous avez eu des rapports à risque hors de la période de protection, veuillez vous faire tester.',
  },
  protection: {
    startsIn: 'Sera active dans {time}',
    text: {
      lapsed: 'Vous avez manqué une ou plusieurs prises. Votre protection n\'est plus garantie.',
      lessThan3doses: 'Si vous continuez les prises jusqu\'au {dateTroisiemeJour}, vos rapports entre le {datePriseDemarrage} et le {dateLendemain} seront protégés.',
      moreThan3doses: 'Vos rapports avant le {dateAvantDernierePrise} sont protégés par la PrEP.',
    },
  },
  dose: {
    nextIn: 'Prochaine prise dans {time}',
    timeLeft: 'Il vous reste {time} pour prendre un comprimé',
    now: 'Prenez votre comprimé maintenant !',
  },
  dashboard: {
    logDose: 'J\'ai pris ma prise',
    endSession: 'Terminer la session',
    startSession: 'Démarrer une nouvelle session',
    stopPrepInfo: 'Pour arrêter la PrEP, continuez de prendre 1 comprimé par jour pendant les 2 jours qui suivent votre dernier rapport.',
    endSessionDialog: {
      title: 'Terminer votre session PrEP ?',
      description: 'Cela arrêtera les rappels de notification. Votre protection sera calculée en fonction de votre dernière prise.',
      confirm: 'Oui, Terminer',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Session terminée',
        description: 'Les rappels de notification sont maintenant arrêtés.',
      },
    },
    clear: {
      toast: {
        dev: 'Données de test rechargées',
        title: 'Données effacées',
        description: 'Votre historique et vos préférences ont été supprimés.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Navigateur non compatible',
      denied: {
        title: 'Notifications refusées',
        description: 'Vous pouvez les réactiver dans les paramètres de votre navigateur.',
      },
      configError: {
        title: 'Erreur de configuration',
        description: 'La clé de notification est manquante.',
      },
      enabled: 'Notifications activées !',
      tokenError: 'Impossible de récupérer le token',
      subscriptionError: 'Erreur d\'abonnement',
      disabled: 'Notifications désactivées.',
      unsubscribeError: 'Erreur lors de la désinscription',
    },
  },
} as const;
