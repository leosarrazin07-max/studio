
export default {
  common: {
    cancel: 'Cancelar',
  },
  welcomeScreen: {
    title: 'Bem-vindo ao PrEPy',
    subtitle: 'Seu companheiro inteligente de PrEP sob demanda. Acompanhe suas doses, mantenha-se protegido e gerencie suas sessões com confiança.',
    cta: 'Iniciar uma sessão de PrEP',
  },
  welcomeDialog: {
    title: 'Ativar Notificações',
    description: {
      part1: 'Para sua segurança, é altamente recomendável ativar as notificações. Isso permitirá que o PrEPy envie lembretes para suas doses de pílulas.',
      part2: 'Perder um lembrete pode comprometer sua proteção.',
    },
    confirm: 'Entendi, ativar notificações',
  },
  settings: {
    title: 'Configurações',
    description: 'Gerencie seus dados e preferências.',
    notifications: {
      title: 'Notificações',
      description: 'Receba um lembrete para cada dose para garantir sua proteção.',
      enabled: 'Notificações ativadas',
      disabled: 'Notificações desativadas',
      loading: 'Carregando...',
      denied: 'Você bloqueou as notificações. Para reativá-las, você deve permitir notificações para este site nas configurações do seu navegador e, em seguida, recarregar a página.',
      disabledWarning: 'Os lembretes de dose estão desativados. Você não receberá nenhuma notificação, o que pode levar a doses perdidas.',
    },
    language: {
      title: 'Idioma',
      description: 'Escolha o idioma de exibição do aplicativo.',
      select: 'Selecione um idioma',
    },
    theme: {
      title: "Modo de exibição",
      description: "Escolha entre o tema claro e escuro."
    },
    clearHistory: {
      button: 'Excluir meu histórico',
      dialog: {
        title: 'Você tem certeza absoluta?',
        description: 'Esta ação é irreversível. Todos os seus dados de sessão e histórico de pílulas serão excluídos permanentemente.',
        confirm: 'Sim, excluir meus dados',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Inicie sua sessão',
      description: 'Você começará com 2 pílulas. Confirme quando tomou sua dose inicial.',
    },
    regular: {
      title: 'Registre sua dose',
      description: 'Confirme quando tomou sua pílula.',
    },
    missed: {
      title: 'Dose perdida',
      description: 'Parece que você perdeu uma dose. Escolha uma opção para atualizar seu status.',
      earlier: 'Tomei 1 pílula mais cedo',
      restart: 'Reiniciar com 2 pílulas',
    },
    picker: {
      description: 'Selecione a data e a hora da ingestão de {count} pílula(s).',
      confirm: 'Confirmar hora',
    },
    pills: {
      earlier: 'Tomei {count} pílula(s) mais cedo',
      now: 'Tomei {count} pílula(s) agora',
    },
  },
  doseHistory: {
    title: 'Diário de Bordo',
    description: 'Suas atividades dos últimos 90 dias.',
    event: {
      start: 'Sessão iniciada',
      dose: 'Pílula tomada',
      stop: 'Sessão encerrada',
      unknown: 'Evento desconhecido',
    },
    empty: {
      title: 'Nenhuma atividade registrada.',
      subtitle: 'Inicie uma sessão para começar.',
    },
  },
  status: {
    inactive: 'Inativo',
    loading: 'Proteção pendente...',
    effective: 'Proteção eficaz',
    missed: 'Dose perdida',
    lapsed: 'Proteção interrompida',
    ended: 'Sessão encerrada',
    loadingClient: 'Carregando...',
    riskWarning: 'Se você teve relações sexuais desprotegidas fora do período de proteção, por favor, faça o teste.',
  },
  protection: {
    startsIn: 'Estará ativo em {time}',
    text: {
      lapsed: 'Você perdeu uma ou mais doses. Sua proteção não está mais garantida.',
      lessThan3doses: 'Se você continuar tomando as doses até {dateTroisiemeJour}, suas relações entre {datePriseDemarrage} e {dateLendemain} estarão protegidas.',
      moreThan3doses: 'Suas relações antes de {dateAvantDernierePrise} estão protegidas pela PrEP.',
    },
  },
  dose: {
    nextIn: 'Próxima dose em {time}',
    timeLeft: 'Você tem {time} para tomar uma pílula',
    now: 'Tome sua pílula agora!',
  },
  dashboard: {
    logDose: 'Tomei minha dose',
    endSession: 'Encerrar sessão',
    startSession: 'Iniciar nova sessão',
    stopPrepInfo: 'Para parar a PrEP, continue a tomar 1 pílula por dia durante os 2 dias seguintes à sua última relação sexual.',
    endSessionDialog: {
      title: 'Encerrar sessão de PrEP?',
      description: 'Isso interromperá os lembretes de notificação. Sua proteção será calculada com base na sua última dose.',
      confirm: 'Sim, encerrar',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Sessão encerrada',
        description: 'Os lembretes de notificação foram interrompidos.',
      },
    },
    clear: {
      toast: {
        dev: 'Dados de teste recarregados',
        title: 'Dados apagados',
        description: 'Seu histórico e preferências foram excluídos.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Navegador não compatível',
      denied: {
        title: 'Notificações recusadas',
        description: 'Você pode reativá-las nas configurações do seu navegador.',
      },
      configError: {
        title: 'Erro de configuração',
        description: 'A chave de notificação está ausente.',
      },
      enabled: 'Notificações ativadas!',
      tokenError: 'Não foi possível recuperar o token',
      subscriptionError: 'Erro de assinatura',
      disabled: 'Notificações desativadas.',
      unsubscribeError: 'Erro ao cancelar a inscrição',
    },
  },
} as const;
