export interface FacoChip {
  readonly id: string;
  readonly category: string;
  readonly label: string;
  readonly icon: string;
}

export interface TriadChip {
  readonly id: string;
  readonly category: string;
  readonly label: string;
  readonly icon: string;
}

export type EvitoChip = TriadChip;
export type MeAjudaChip = TriadChip;

export const FACO_CHIPS = [
  // Manhã e Cuidado (6)
  {
    id: 'morn_coffee_01',
    category: 'Manhã e Cuidado',
    label: 'Café da manhã com calma',
    icon: '☕',
  },
  {
    id: 'morn_shower_01',
    category: 'Manhã e Cuidado',
    label: 'Banho e cuidado pessoal',
    icon: '🚿',
  },
  {
    id: 'morn_bed_01',
    category: 'Manhã e Cuidado',
    label: 'Arrumar a cama e o quarto',
    icon: '🛏️',
  },
  {
    id: 'morn_water_01',
    category: 'Manhã e Cuidado',
    label: 'Beber água ao longo do dia',
    icon: '💧',
  },
  {
    id: 'morn_cook_01',
    category: 'Manhã e Cuidado',
    label: 'Cozinhar uma refeição em casa',
    icon: '🍲',
  },
  {
    id: 'morn_sleep_01',
    category: 'Manhã e Cuidado',
    label: 'Dormir em um horário regular',
    icon: '😴',
  },

  // Movimento (6)
  {
    id: 'mov_walk_run_01',
    category: 'Movimento',
    label: 'Caminhada ou corrida matinal',
    icon: '🏃',
  },
  {
    id: 'mov_stretch_01',
    category: 'Movimento',
    label: 'Alongamento ou yoga',
    icon: '🧘',
  },
  {
    id: 'mov_bike_01',
    category: 'Movimento',
    label: 'Pedalar',
    icon: '🚴',
  },
  {
    id: 'mov_swim_01',
    category: 'Movimento',
    label: 'Natação ou esporte',
    icon: '🏊',
  },
  {
    id: 'mov_workout_01',
    category: 'Movimento',
    label: 'Treino na academia ou em casa',
    icon: '🏋️',
  },
  {
    id: 'mov_walk_after_01',
    category: 'Movimento',
    label: 'Caminhada leve após o almoço',
    icon: '🚶',
  },

  // Mente e Hobbies (7)
  {
    id: 'mind_chess_01',
    category: 'Mente e Hobbies',
    label: 'Estudo e treino de xadrez',
    icon: '♟️',
  },
  {
    id: 'mind_guitar_01',
    category: 'Mente e Hobbies',
    label: 'Prática de violão / música',
    icon: '🎸',
  },
  {
    id: 'mind_reading_01',
    category: 'Mente e Hobbies',
    label: 'Leitura de um livro',
    icon: '📚',
  },
  {
    id: 'mind_art_01',
    category: 'Mente e Hobbies',
    label: 'Desenho, pintura ou artesanato',
    icon: '🎨',
  },
  {
    id: 'mind_journal_01',
    category: 'Mente e Hobbies',
    label: 'Escrever no diário',
    icon: '📓',
  },
  {
    id: 'mind_puzzle_01',
    category: 'Mente e Hobbies',
    label: 'Jogos de raciocínio ou quebra-cabeça',
    icon: '🧩',
  },
  {
    id: 'mind_study_01',
    category: 'Mente e Hobbies',
    label: 'Estudo ou curso profissional',
    icon: '🎓',
  },

  // Vida e Casa (6)
  {
    id: 'life_garden_01',
    category: 'Vida e Casa',
    label: 'Cuidar das plantas e pomar',
    icon: '🌱',
  },
  {
    id: 'life_clean_01',
    category: 'Vida e Casa',
    label: 'Organizar e limpar a casa',
    icon: '🧹',
  },
  {
    id: 'life_work_01',
    category: 'Vida e Casa',
    label: 'Trabalho ou tarefa produtiva',
    icon: '🛠️',
  },
  {
    id: 'life_pet_01',
    category: 'Vida e Casa',
    label: 'Cuidar de um animal de estimação',
    icon: '🐕',
  },
  {
    id: 'life_market_01',
    category: 'Vida e Casa',
    label: 'Fazer as compras da semana',
    icon: '🛒',
  },
  {
    id: 'life_health_care_01',
    category: 'Vida e Casa',
    label: 'Cuidar da minha saúde física',
    icon: '🩺',
  },

  // Conexão Humana (5)
  {
    id: 'conn_call_01',
    category: 'Conexão Humana',
    label: 'Ligar para alguém que me apoia',
    icon: '📞',
  },
  {
    id: 'conn_family_01',
    category: 'Conexão Humana',
    label: 'Tempo de qualidade com a família',
    icon: '👨‍👩‍👧',
  },
  {
    id: 'conn_meeting_01',
    category: 'Conexão Humana',
    label: 'Ir a um encontro de apoio mútuo',
    icon: '🪑',
  },
  {
    id: 'conn_faith_01',
    category: 'Conexão Humana',
    label: 'Momento de oração ou espiritualidade',
    icon: '🙏',
  },
  {
    id: 'conn_friends_01',
    category: 'Conexão Humana',
    label: 'Programa saudável com amigos',
    icon: '🧃',
  },
] as const;

export const EVITO_CHIPS = [
  // Ambientes (9)
  {
    id: 'avoid_env_past_01',
    category: 'Ambientes',
    label: 'Evito passar por caminhos do meu passado',
    icon: '📍',
  },
  {
    id: 'avoid_env_bars_01',
    category: 'Ambientes',
    label: 'Evito bares, adegas e festas',
    icon: '📍',
  },
  {
    id: 'avoid_env_alone_night_01',
    category: 'Ambientes',
    label: 'Evito ficar em casa sozinho à noite',
    icon: '📍',
  },
  {
    id: 'avoid_env_crowd_01',
    category: 'Ambientes',
    label: 'Evito lugares com aglomerações intensas',
    icon: '📍',
  },
  {
    id: 'avoid_env_street_late_01',
    category: 'Ambientes',
    label: 'Evito ficar na rua até tarde sem motivo',
    icon: '📍',
  },
  {
    id: 'avoid_env_risk_places_01',
    category: 'Ambientes',
    label: 'Evito ambientes e encontros de risco',
    icon: '📍',
  },
  {
    id: 'avoid_env_idle_01',
    category: 'Ambientes',
    label: 'Evito ficar de bobeira sem ter o que fazer',
    icon: '📍',
  },
  {
    id: 'avoid_env_triggers_obj_01',
    category: 'Ambientes',
    label: 'Evito guardar objetos e lembranças de risco',
    icon: '📍',
  },
  {
    id: 'avoid_env_nightlife_01',
    category: 'Ambientes',
    label: 'Evito frequentar locais de saída noturna',
    icon: '📍',
  },

  // Dinheiro e Hábitos (10)
  {
    id: 'avoid_money_cash_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito andar com dinheiro em espécie',
    icon: '💰',
  },
  {
    id: 'avoid_money_card_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito ficar com o cartão de crédito à mão',
    icon: '💰',
  },
  {
    id: 'avoid_money_sameday_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito receber e gastar dinheiro no mesmo dia',
    icon: '💰',
  },
  {
    id: 'avoid_money_transfer_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito fazer transferências por impulso',
    icon: '💰',
  },
  {
    id: 'avoid_money_bets_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito apostas, bets e jogos de azar',
    icon: '💰',
  },
  {
    id: 'avoid_money_screens_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito olhar redes sociais por muito tempo',
    icon: '💰',
  },
  {
    id: 'avoid_money_shopping_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito compras supérfluas por impulso',
    icon: '💰',
  },
  {
    id: 'avoid_money_weekend_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito ficar com dinheiro sobrando no fim de semana',
    icon: '💰',
  },
  {
    id: 'avoid_money_banking_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito acessar aplicativos de banco sem planejamento',
    icon: '💰',
  },
  {
    id: 'avoid_money_unscheduled_01',
    category: 'Dinheiro e Hábitos',
    label: 'Evito deixar o dia sem uma programação',
    icon: '💰',
  },

  // Pessoas e Contatos (10)
  {
    id: 'avoid_ppl_toxic_01',
    category: 'Pessoas e Contatos',
    label: 'Evito contato com quem me incentiva a usar',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_messages_01',
    category: 'Pessoas e Contatos',
    label: 'Evito responder mensagens de pessoas do passado',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_contacts_01',
    category: 'Pessoas e Contatos',
    label: 'Evito guardar números de telefone que são gatilho',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_no_exit_01',
    category: 'Pessoas e Contatos',
    label: 'Evito encontros sem um plano de saída',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_conflicts_01',
    category: 'Pessoas e Contatos',
    label: 'Evito discussões e conflitos desnecessários',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_minimize_01',
    category: 'Pessoas e Contatos',
    label: 'Evito pessoas que minimizam o meu esforço',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_isolation_01',
    category: 'Pessoas e Contatos',
    label: 'Evito me afastar de quem realmente me apoia',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_groups_01',
    category: 'Pessoas e Contatos',
    label: 'Evito grupos de conversa que me causam ansiedade',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_untrusted_01',
    category: 'Pessoas e Contatos',
    label: 'Evito eventos sociais sem alguém de confiança por perto',
    icon: '👥',
  },
  {
    id: 'avoid_ppl_overpromise_01',
    category: 'Pessoas e Contatos',
    label: 'Evito prometer o que não consigo cumprir',
    icon: '👥',
  },

  // HALT (12)
  {
    id: 'halt_hungry_01',
    category: 'HALT',
    label: 'Evito ficar muito tempo sem comer',
    icon: '🥪',
  },
  {
    id: 'halt_hungry_02',
    category: 'HALT',
    label: 'Evito pular refeições principais',
    icon: '🥪',
  },
  {
    id: 'halt_hungry_03',
    category: 'HALT',
    label: 'Evito sair de casa de estômago vazio',
    icon: '🥪',
  },
  {
    id: 'halt_angry_01',
    category: 'HALT',
    label: 'Evito tomar decisões quando estou irritado',
    icon: '⚡',
  },
  {
    id: 'halt_angry_02',
    category: 'HALT',
    label: 'Evito guardar mágoa sem conversar com alguém',
    icon: '⚡',
  },
  {
    id: 'halt_angry_03',
    category: 'HALT',
    label: 'Evito discutir de cabeça quente',
    icon: '⚡',
  },
  {
    id: 'halt_lonely_01',
    category: 'HALT',
    label: 'Evito passar muitas horas isolado',
    icon: '🌧️',
  },
  {
    id: 'halt_lonely_02',
    category: 'HALT',
    label: 'Evito passar o dia sem falar com ninguém',
    icon: '🌧️',
  },
  {
    id: 'halt_lonely_03',
    category: 'HALT',
    label: 'Evito sumir ou me esconder quando estou mal',
    icon: '🌧️',
  },
  {
    id: 'halt_tired_01',
    category: 'HALT',
    label: 'Evito ir para a cama muito tarde',
    icon: '🌙',
  },
  {
    id: 'halt_tired_02',
    category: 'HALT',
    label: 'Evito acumular noites mal dormidas',
    icon: '🌙',
  },
  {
    id: 'halt_tired_03',
    category: 'HALT',
    label: 'Evito me sobrecarregar de tarefas',
    icon: '🌙',
  },
] as const;

export const ME_AJUDA_CHIPS = [
  // Na Hora da Fissura (6)
  {
    id: 'help_tool_breathe_01',
    category: 'Na Hora da Fissura',
    label: 'Praticar a Respiração 4-7-8',
    icon: '🌬️',
  },
  {
    id: 'help_tool_grounding_01',
    category: 'Na Hora da Fissura',
    label: 'Fazer a Ancoragem sensorial 5-4-3-2-1',
    icon: '🖐️',
  },
  {
    id: 'help_tool_wait15_01',
    category: 'Na Hora da Fissura',
    label: 'Esperar 15 minutos antes de tomar qualquer decisão',
    icon: '⏱️',
  },
  {
    id: 'help_tool_cold_water_01',
    category: 'Na Hora da Fissura',
    label: 'Lavar o rosto ou as mãos com água bem fria',
    icon: '🚿',
  },
  {
    id: 'help_tool_walk_now_01',
    category: 'Na Hora da Fissura',
    label: 'Sair para uma caminhada no momento do impulso',
    icon: '🏃',
  },
  {
    id: 'help_tool_ice_01',
    category: 'Na Hora da Fissura',
    label: 'Segurar uma pedra de gelo nas mãos',
    icon: '🧊',
  },

  // Pedir Apoio (5)
  {
    id: 'help_call_friend_01',
    category: 'Pedir Apoio',
    label: 'Ligar para uma pessoa de confiança',
    icon: '📞',
  },
  {
    id: 'help_text_before_01',
    category: 'Pedir Apoio',
    label: 'Mandar mensagem para alguém antes de piorar',
    icon: '💬',
  },
  {
    id: 'help_meeting_01',
    category: 'Pedir Apoio',
    label: 'Participar de uma reunião de apoio mútuo',
    icon: '🪑',
  },
  {
    id: 'help_cvv_188_01',
    category: 'Pedir Apoio',
    label: 'Ligar para o CVV 188 para desabafar',
    icon: '📱',
  },
  {
    id: 'help_family_talk_01',
    category: 'Pedir Apoio',
    label: 'Contar para alguém próximo como estou me sentindo',
    icon: '👨‍👩‍👧',
  },

  // Organizar o Dia (5)
  {
    id: 'help_plan_night_01',
    category: 'Organizar o Dia',
    label: 'Planejar as tarefas básicas na noite anterior',
    icon: '🗓️',
  },
  {
    id: 'help_short_list_01',
    category: 'Organizar o Dia',
    label: 'Ter uma lista curta e realista do que fazer hoje',
    icon: '✅',
  },
  {
    id: 'help_alarm_reminders_01',
    category: 'Organizar o Dia',
    label: 'Programar alarmes para refeições e compromissos',
    icon: '⏰',
  },
  {
    id: 'help_plan_b_01',
    category: 'Organizar o Dia',
    label: 'Ter sempre um plano B para momentos de folga',
    icon: '🧭',
  },
  {
    id: 'help_weekend_plan_01',
    category: 'Organizar o Dia',
    label: 'Planejar atividades saudáveis para o fim de semana',
    icon: '📆',
  },

  // Pensar Diferente (6)
  {
    id: 'help_write_feelings_01',
    category: 'Pensar Diferente',
    label: 'Escrever em um papel o que estou sentindo',
    icon: '📓',
  },
  {
    id: 'help_remember_why_01',
    category: 'Pensar Diferente',
    label: 'Lembrar do motivo pelo qual decidi parar',
    icon: '🎯',
  },
  {
    id: 'help_craving_passes_01',
    category: 'Pensar Diferente',
    label: 'Lembrar que a onda da vontade sobe e desce',
    icon: '🕰️',
  },
  {
    id: 'help_past_wins_01',
    category: 'Pensar Diferente',
    label: 'Lembrar das vitórias e dias limpos que já conquistei',
    icon: '🙌',
  },
  {
    id: 'help_meditation_01',
    category: 'Pensar Diferente',
    label: 'Fazer uma pausa de respiração guiada',
    icon: '🧘',
  },
  {
    id: 'help_music_01',
    category: 'Pensar Diferente',
    label: 'Colocar uma música calma que me acalma',
    icon: '🎧',
  },

  // Cuidar do Corpo (4)
  {
    id: 'help_body_eat_01',
    category: 'Cuidar do Corpo',
    label: 'Comer algo nutritivo quando sinto fome',
    icon: '🍎',
  },
  {
    id: 'help_body_rest_01',
    category: 'Cuidar do Corpo',
    label: 'Deitar e descansar quando o corpo está exausto',
    icon: '😴',
  },
  {
    id: 'help_body_water_01',
    category: 'Cuidar do Corpo',
    label: 'Tomar um copo cheio de água fresca',
    icon: '💧',
  },
  {
    id: 'help_body_sun_01',
    category: 'Cuidar do Corpo',
    label: 'Tomar 15 minutos de sol pela manhã',
    icon: '☀️',
  },
] as const;

export type FacoChipId = (typeof FACO_CHIPS)[number]['id'];
export type EvitoChipId = (typeof EVITO_CHIPS)[number]['id'];
export type MeAjudaChipId = (typeof ME_AJUDA_CHIPS)[number]['id'];
export type CanonicalChipId = FacoChipId | EvitoChipId | MeAjudaChipId;

export const FACO_CHIP_IDS = FACO_CHIPS.map((c) => c.id) as unknown as [
  FacoChipId,
  ...FacoChipId[],
];

export const EVITO_CHIP_IDS = EVITO_CHIPS.map((c) => c.id) as unknown as [
  string,
  ...string[],
];

export const ME_AJUDA_CHIP_IDS = ME_AJUDA_CHIPS.map((c) => c.id) as unknown as [
  string,
  ...string[],
];

export const ALL_CANONICAL_CHIP_IDS = [
  ...FACO_CHIP_IDS,
  ...EVITO_CHIP_IDS,
  ...ME_AJUDA_CHIP_IDS,
] as unknown as [string, ...string[]];
