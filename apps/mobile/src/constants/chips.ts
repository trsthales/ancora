export interface FacoChip {
  readonly id: string;
  readonly category: string;
  readonly label: string;
  readonly icon: string;
}

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

export type FacoChipId = (typeof FACO_CHIPS)[number]['id'];

export const FACO_CHIP_IDS = FACO_CHIPS.map((c) => c.id) as unknown as [
  FacoChipId,
  ...FacoChipId[],
];

export const CHIP_MAP = new Map<string, FacoChip>(
  FACO_CHIPS.map((chip) => [chip.id, chip]),
);

export function getChipById(id: string): FacoChip | undefined {
  return CHIP_MAP.get(id);
}

export const CHIP_CATEGORIES = [
  'Manhã e Cuidado',
  'Movimento',
  'Mente e Hobbies',
  'Vida e Casa',
  'Conexão Humana',
] as const;
