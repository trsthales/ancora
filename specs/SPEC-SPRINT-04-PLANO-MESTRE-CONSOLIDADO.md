# 📘 Dossiê Técnico e Plano Mestre de Execução — Sprint 4: Rotina de Autocuidado, Feed Finito da Tríade e Segurança

- **Documento:** `specs/SPEC-SPRINT-04-PLANO-MESTRE-CONSOLIDADO.md`
- **Projeto:** Jornada Firme — Sistema de Apoio Mútuo e Prevenção de Recaídas ([RFC 002 v3.1](specs/RFC-002.md), [RFC 004.1](specs/RFC-004-ROTINA-E-FEED-TRIADE.md), [RFC 003](specs/RFC-003-EMAIL-OPCIONAL.md))
- **Status:** Consolidado e Pronto para Execução
- **Subdivisão Estratégica:**
  - **Sprint 4A (Modo Pessoal / Single-Player):** Minha Rotina de Autocuidado, "Meus Momentos", Dia Leve e Criptografia Local.
  - **Sprint 4B (Modo Comunitário / Mútua Ajuda):** Feed Finito da Tríade, Ações Cegas, E-mail AES-256-GCM, Notificações em Lote e Métricas Agregadas.
- **Stack Oficial:** Node.js 22 LTS, Fastify 5.2, PostgreSQL 16 Alpine, Drizzle ORM 0.45, React Native 0.86, Expo 57, pg-boss 12.35, Vitest 5.0

---

## 1. Visão Geral e Arquitetura da Sprint 4

A Sprint 4 materializa o núcleo de recuperação do **Jornada Firme**, equilibrando a **Ativação Comportamental individual** com o **suporte mútuo entre pares assíncrono (o NA Virtual)**. 

Para eliminar qualquer risco de dívida técnica ou retrabalho em auditorias futuras, toda a implementação segue o princípio **Single-Player antes do Multiplayer**: a rotina pessoal (4A) é entregue primeiro, com risco zero de moderação, e a dimensão comunitária (4B) entra em seguida com guardrails inquebráveis de segurança e privacidade.

```
+──────────────────────────────────────────────────────────────────────────────────────────────────+
|                                  ARQUITETURA CONSOLIDADA DA SPRINT 4                             |
+──────────────────────────────────────────────────────────────────────────────────────────────────+

 ┌────────────────────────────────────────────────────────┐   ┌───────────────────────────────────────────────┐
 │               SPRINT 4A: MODO PESSOAL                  │   │          SPRINT 4B: MODO COMUNITÁRIO          │
 │              (Ativação Comportamental)                 │   │             (Mútua Ajuda Segura)              │
 ├────────────────────────────────────────────────────────┤   ├───────────────────────────────────────────────┤
 │ • Checklist diário de hábitos saudáveis (max 15).      │   │ • Feed Finito (máx 20 cards + Top Curado).    │
 │ • Zero remédios no catálogo oficial (Anti-SaMD).       │   │ • Moderação por Construção com z.enum na API. │
 │ • "Meus Momentos" (gatilhos locais com alívio 1-toque).│   │ • Trava atômica de 3 posts/dia no relógio SP. │
 │ • Modo "Dia Leve" (1 a 2 itens básicos na crise).      │   │ • Ação Cega com 3 Destinos e CTE Atômica.     │
 │ • Primeiro Uso Guiado (filtro por horário difícil).    │   │ • Loop Fechado no SOS ("O que você guardou"). │
 │ • Revisão Semanal Aditiva ("3 dias", sem julgamento).  │   │ • Apoio "Estamos Juntos" com HMAC por post.   │
 │ • PUT idempotente de status (completed: true/false).   │   │ • Notificações ao autor em Lote (Home, >= 3). │
 │ • Tolerância de fuso de ±1 dia sem coletar GPS.        │   │ • Período de Escuta de 24h para contas novas. │
 │ • Tarefas locais em AsyncStorage Cifrado (AES-GCM)     │   │ • Diversidade: máx 1 post por autor nos 20.   │
 │   com chave no SecureStore e allowBackup="false".      │   │ • Opção de Partilhar sem Pseudônimo (EVITO).  │
 │                                                        │   │ • Métrica do Piloto Agregada (zero espião).   │
 │                                                        │   │ • E-mail de socorro opcional AES-256-GCM.     │
 └──────────────────────────┬─────────────────────────────┘   └───────────────────────┬───────────────────────┘
                            │                                                         │
                            ▼                                                         ▼
                 recovery_core.habits                                      recovery_core.triad_posts
                 recovery_core.habit_logs                                  recovery_core.my_tools
                 (encryptedStorage Local)                                  recovery_core.post_supports
                                                                           recovery_core.daily_post_limits
                                                                           recovery_core.daily_metrics
                                                                           auth_security.user_recovery_emails
```

---

## 2. As Invariantes Técnicas e Blindagens do Pente Fino

1. **Delimitação Não-Farmacológica e Blindagem Regulatória (Anti-SaMD):**
   - O chip de remédios (`morn_meds_01`) foi **definitivamente banido do catálogo oficial**. O app não atua como gerenciador de medicação (*Software as a Medical Device*), prevenindo riscos de dose dupla ou dose omitida de remédios controlados.
   - Tarefas pessoais sobre remédios podem ser anotadas pelo usuário exclusivamente de forma local (`📱 Hábito Local`), sem chancela do servidor.
2. **Idempotência Real via PUT e Truncamento de Timestamp:**
   - A alteração de estado não utiliza *toggle flip-flop*. Utiliza semântica declarativa de estado desejado: `PUT /journey/habits/:id/logs/:dateKey` com corpo `{ completed: boolean }`.
   - Se o 4G oscilar ou o usuário der toque duplo, 10 requisições consecutivas com `{ completed: true }` mantêm o hábito concluído.
   - `completed_at` é truncado para a hora cheia (`date_trunc('hour', now())`), aniquilando a correlação temporal por milissegundos em dumps de banco.
3. **Fuso Horário Continental com Tolerância de $\pm 1$ Dia (Zero-PII de Localização):**
   - Para atender os 4 fusos do Brasil (Noronha UTC-2, SP UTC-3, Manaus UTC-4 e Acre UTC-5) sem estragar a rotina noturna (22h-23h), o cliente envia a sua data local `dateKey` (`YYYY-MM-DD`).
   - O servidor valida se `dateKey` está dentro de uma janela deslizante de **$\pm 1$ dia** relativo à data atual do servidor.
   - **Zero GPS / Zero Coleta de Fuso:** A integridade temporal é garantida sem precisar espionar a cidade ou localização do usuário.
4. **Armazenamento Local Cifrado (AES-GCM) e Bloqueio de Backup:**
   - As tarefas livres locais (máximo 5 a 10 itens, títulos max 60 caracteres) são cifradas com **AES-256-GCM** antes de tocar no `AsyncStorage`.
   - A chave simétrica é gerada no primeiro boot e guardada no enclave de hardware (`expo-secure-store`) com o atributo `THIS_DEVICE_ONLY`.
   - `android:allowBackup="false"` no `app.json` impede que bancos SQLite locais vazem para backups automáticos do Google Drive ou extrações via `adb backup`.
5. **Moderação por Construção com Validação Autoritativa no Backend (`z.enum`):**
   - O catálogo canônico de chips reside na API (`apps/api/src/constants/chips.ts`).
   - O backend valida a entrada via `z.enum(CANONICAL_CHIPS)`, rejeitando na hora qualquer tentativa de injetar texto livre, telefones ou endereços via `curl`.
   - Segregação estrita: chips do `FACO` só entram em posts `FACO`, chips do `EVITO` só entram em posts `EVITO`.
6. **Ação "Vou Tentar Isso" com 3 Destinos e CTE Atômica:**
   - `🟢 FAÇO` $\rightarrow$ Entra na **Minha Rotina** (checklist com check). Se já tiver 15 hábitos, salva em `my_tools` e avisa sem erro.
   - `🔴 EVITO` $\rightarrow$ Entra no **Meu Plano de Proteção** (mural sereno de limites conscientes, SEM caixas de marcar para evitar o efeito "Urso Branco" e culpa).
   - `🔵 ME AJUDA` $\rightarrow$ Entra em **Minhas Ferramentas** (primeiros socorros sob demanda).
   - O contador `saved_count` do post só incrementa se a CTE no PostgreSQL gerou uma nova linha em `my_tools`, impedindo inflação por cliques repetidos.
7. **Fechamento do Loop no SOS ("O Que Você Guardou"):**
   - No modal de fissura $\ge 4$ (`AlternativesModal`), o topo exibe com destaque **"O que você guardou"**: 2 a 3 botões grandes com as ferramentas que o usuário escolheu em momentos calmos (`Action Dispatcher`: 1 toque abre a respiração 4-7-8, ancoragem ou discador).
8. **Feed Finito de 20 Posts e Design Sem FOMO:**
   - A timeline exibe no máximo as **20 postagens mais recentes** (`LIMIT 20`).
   - Topo da timeline: Card fixo da **"Estratégia da Semana"** (resolve o início frio / *cold-start* e traz valor clínico imediato).
   - Fim da timeline: Card estático de conclusão: *"Você viu tudo por hoje. Que tal desligar o aplicativo e viver um momento no mundo real?"*.
   - **Zero Badges de Não Lidos:** Proibida a exibição de contadores ou bolinhas vermelhas indicando posts perdidos.
9. **Diversidade Garantida via SQL e Período de Escuta:**
   - Window function no Postgres (`ROW_NUMBER() OVER (PARTITION BY profile_id ORDER BY created_at DESC)`) garantindo `author_post_rank <= 1` (20 autores distintos na tela).
   - Contas com menos de 24 horas navegam em modo de acolhimento e escuta (podem usar rotina e SOS, mas não publicam no feed).
10. **Notificação ao Autor em Lote (Anti-Caça-Níquel):**
    - Zero push em tempo real de "alguém curtiu sua ideia".
    - Alertas entregues em lote uma vez por dia, dentro do app (card na Home), e apenas quando o total acumulado for $\ge 3$ pessoas. Texto qualitativo: *"Suas partilhas inspiraram algumas pessoas."*
11. **"Estamos Juntos" sem Grafo e Recíproco:**
    - Deduplicado no banco via `reaction_token = HMAC-SHA256(profile_id || post_id, PEPPER)`. 1 apoio por usuário por post, sem permitir reconstrução do grafo social.
    - O autor recebe aviso qualitativo no card diário: *"Algumas pessoas estão com você hoje."*
12. **Taxa de Rajada por Minuto sem Teto Diário por IP:**
    - O endpoint de registro adota limite de rajada (10-15 req/min por IP), **sem teto diário de 24h**, permitindo que 30 ou 40 residentes em uma clínica ou reunião de NA usem o mesmo Wi-Fi para se cadastrar.
13. **Identificação Opcional no Feed:**
    - Por padrão, exibe o pseudônimo poético.
    - Para partilhas sensíveis (especialmente no `🔴 EVITO`), o usuário pode marcar `[ ] Partilhar de forma anônima`, exibindo o card assinado apenas como `🌿 Companheiro Navegador`.
14. **Instrumentação Agregada para o Piloto (Zero Espião):**
    - Tabela de contadores diários `recovery_core.daily_metrics (metric_date, metric_name, metric_value)`. Zero rastreamento individual.
15. **Revisão Semanal Aditiva:**
    - Resumo linguístico positivo (*"Esta semana você caminhou em 3 dias"*), banindo a linguagem de déficit (*"3 de 7"*), porcentagens e barras de progresso.

---

## 3. Detalhamento da SPRINT 4A: Modo Pessoal (Ativação Comportamental)

A **Sprint 4A** entrega a experiência individual e privada do usuário, podendo ser liberada imediatamente para uso e validação clínica sem riscos de moderação.

### 3.1. Tarefas da Sprint 4A

| Identificador | Título da Tarefa | Descrição Técnica e Escopo |
| :--- | :--- | :--- |
| **TASK-401** | **Backend da Rotina de Hábitos Pessoais (`apps/api`)** | • Migration Drizzle 0008 criando `recovery_core.habits` e `recovery_core.habit_logs`.<br>• Catálogo autoritativo de 30 chips canônicos em `apps/api/src/constants/chips.ts` com validação `z.enum`.<br>• Endpoints: `GET /journey/habits?dateKey=YYYY-MM-DD`, `POST /journey/habits` (teto 15 hábitos), `PUT /journey/habits/:id/logs/:dateKey` (idempotente com `{ completed: boolean }`) e `DELETE /journey/habits/:id`.<br>• Janela de tolerância de $\pm 1$ dia para fusos brasileiros sem coleta de GPS. |
| **TASK-402** | **Interface Mobile "Minha Rotina" e Recursos Pessoais (`apps/mobile`)** | • Catálogo estático sincronizado `chips.ts` (30 chips saudáveis sem remédios).<br>• Checklist sereno com check tátil e feedback suave.<br>• Módulo de Tarefas Locais Privadas (máx 5 a 10 tarefas, títulos max 60 chars) com cifra AES-GCM via chave no `SecureStore`.<br>• Configuração de `android:allowBackup="false"` no `app.json`.<br>• **Modo "Dia Leve":** Botão "Hoje está pesado" e gatilho automático em fissura $\ge 4$, colapsando a lista para 1 a 2 itens básicos sob "Hoje basta isso".<br>• **Primeiro Uso Guiado:** Pergunta "Quando costuma ser mais difícil?" e filtra 1 a 3 sugestões iniciais.<br>• **Meus Momentos:** Agendamento 100% local no celular (máx 3 horários na semana com `expo-notifications`), disparo neutro *"Seu momento do dia chegou. Quer olhar sua lista?"*, bottom sheet com 1 a 3 ações e botão "Agora não".<br>• **Revisão Semanal Aditiva:** Card semanal privado com linguagem aditiva ("caminhou em 3 dias", sem "3 de 7" e sem barras). |
| **TASK-401-T** | **Suíte Vitest de Invariantes da 4A (`apps/api`)** | • Teste de idempotência real via `PUT ... logs/:dateKey` (3 chamadas sucessivas mantêm o mesmo estado exato sem duplicar linhas).<br>• Teste de barreira máxima de 15 hábitos ativos.<br>• Teste de rejeição de texto livre ou chips inválidos no backend via `z.enum`.<br>• Teste de asserção estrutural de ausência de streaks (`currentStreak`, `streakBroken` ausentes no JSON da API). |

---

### 3.2. Catálogo Canônico de 30 Chips da Categoria `🟢 FAÇO` (Backend & Mobile)

```typescript
// apps/api/src/constants/chips.ts & apps/mobile/src/constants/chips.ts
export const FACO_CHIPS = [
  // Manhã e Cuidado (6)
  { id: 'morn_coffee_01', icon: '☕', label: 'Café da manhã com calma', category: 'care' },
  { id: 'morn_shower_01', icon: '🚿', label: 'Banho e cuidado pessoal', category: 'care' },
  { id: 'morn_bed_01', icon: '🛏️', label: 'Arrumar a cama e o quarto', category: 'care' },
  { id: 'morn_water_01', icon: '💧', label: 'Beber água ao longo do dia', category: 'care' },
  { id: 'morn_cook_01', icon: '🍲', label: 'Cozinhar uma refeição em casa', category: 'care' },
  { id: 'morn_sleep_01', icon: '😴', label: 'Dormir em um horário regular', category: 'care' },

  // Movimento (6)
  { id: 'mov_walk_run_01', icon: '🏃', label: 'Caminhada ou corrida matinal', category: 'movement' },
  { id: 'mov_stretch_01', icon: '🧘', label: 'Alongamento ou yoga', category: 'movement' },
  { id: 'mov_bike_01', icon: '🚴', label: 'Pedalar', category: 'movement' },
  { id: 'mov_swim_01', icon: '🏊', label: 'Natação ou esporte', category: 'movement' },
  { id: 'mov_workout_01', icon: '🏋️', label: 'Treino na academia ou em casa', category: 'movement' },
  { id: 'mov_walk_after_01', icon: '🚶', label: 'Caminhada leve após o almoço', category: 'movement' },

  // Mente e Hobbies (7)
  { id: 'mind_chess_01', icon: '♟️', label: 'Estudo e treino de xadrez', category: 'mind' },
  { id: 'mind_guitar_01', icon: '🎸', label: 'Prática de violão / música', category: 'mind' },
  { id: 'mind_reading_01', icon: '📚', label: 'Leitura de um livro', category: 'mind' },
  { id: 'mind_art_01', icon: '🎨', label: 'Desenho, pintura ou artesanato', category: 'mind' },
  { id: 'mind_journal_01', icon: '📓', label: 'Escrever no diário', category: 'mind' },
  { id: 'mind_puzzle_01', icon: '🧩', label: 'Jogos de raciocínio ou quebra-cabeça', category: 'mind' },
  { id: 'mind_study_01', icon: '🎓', label: 'Estudo ou curso profissional', category: 'mind' },

  // Vida e Casa (6)
  { id: 'life_garden_01', icon: '🌱', label: 'Cuidar das plantas e pomar', category: 'life' },
  { id: 'life_clean_01', icon: '🧹', label: 'Organizar e limpar a casa', category: 'life' },
  { id: 'life_work_01', icon: '🛠️', label: 'Trabalho ou tarefa produtiva', category: 'life' },
  { id: 'life_pet_01', icon: '🐕', label: 'Cuidar de um animal de estimação', category: 'life' },
  { id: 'life_market_01', icon: '🛒', label: 'Fazer as compras da semana', category: 'life' },
  { id: 'life_health_care_01', icon: '🩺', label: 'Cuidar da minha saúde física', category: 'life' },

  // Conexão Humana (5)
  { id: 'conn_call_01', icon: '📞', label: 'Ligar para alguém que me apoia', category: 'connection' },
  { id: 'conn_family_01', icon: '👨‍👩‍👧', label: 'Tempo de qualidade com a família', category: 'connection' },
  { id: 'conn_meeting_01', icon: '🪑', label: 'Ir a um encontro de apoio mútuo', category: 'connection' },
  { id: 'conn_faith_01', icon: '🙏', label: 'Momento de oração ou espiritualidade', category: 'connection' },
  { id: 'conn_friends_01', icon: '🧃', label: 'Programa saudável com amigos', category: 'connection' },
] as const;

export const FACO_CHIP_IDS = FACO_CHIPS.map(c => c.id) as [string, ...string[]];
```

---

### 3.3. Modelagem de Dados Drizzle da Sprint 4A

```typescript
// apps/api/src/db/schema/recovery.ts (Adições da Sprint 4A)

export const habits = recoverySchema.table(
  'habits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    chipId: varchar('chip_id', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [uniqueIndex('idx_habits_profile_chip').on(table.profileId, table.chipId)],
);

export const habitLogs = recoverySchema.table(
  'habit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    dateKey: date('date_key').notNull(), // 'YYYY-MM-DD' validado na janela de ±1 dia
    completedAt: timestamp('completed_at', { withTimezone: true })
      .default(sql`date_trunc('hour', now())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('idx_habit_logs_unique_day').on(table.habitId, table.dateKey),
    index('idx_habit_logs_profile_date').on(table.profileId, table.dateKey),
  ],
);
```

---

### 3.4. Contratos de Endpoints da API Fastify (Sprint 4A)

#### A. `GET /api/v1/journey/habits?dateKey=YYYY-MM-DD`
- **Query Params:** `dateKey` (opcional, validado com regex e tolerância de $\pm 1$ dia).
- **Resposta (200 OK):**
```json
{
  "status": "success",
  "data": {
    "dateKey": "2026-10-04",
    "totalActive": 3,
    "habits": [
      {
        "id": "a1b2c3d4-0000-0000-0000-000000000001",
        "chipId": "mov_walk_run_01",
        "completed": true,
        "completedAt": "2026-10-04T07:00:00.000Z"
      },
      {
        "id": "a1b2c3d4-0000-0000-0000-000000000002",
        "chipId": "mind_chess_01",
        "completed": false,
        "completedAt": null
      }
    ]
  }
}
```

#### B. `POST /api/v1/journey/habits`
- **Payload Zod:** `z.object({ chipId: z.enum(FACO_CHIP_IDS) })`
- **Regra de Teto:** Se `SELECT count(*) FROM habits WHERE profile_id = $me` já for $\ge 15$, retorna **HTTP 400 Bad Request** com mensagem: *"Você já atingiu o teto de 15 hábitos ativos na sua rotina. Que tal focar nos atuais?"*.

#### C. `PUT /api/v1/journey/habits/:id/logs/:dateKey` (Idempotente)
- **Path Params:** `id: UUID`, `dateKey: YYYY-MM-DD` (tolerância de $\pm 1$ dia).
- **Payload Zod:** `z.object({ completed: z.boolean() })`
- **Lógica ACID:**
  - Se `completed: true`:
    ```sql
    INSERT INTO recovery_core.habit_logs (habit_id, profile_id, date_key, completed_at)
    VALUES ($id, $profileId, $dateKey, date_trunc('hour', now()))
    ON CONFLICT (habit_id, date_key) DO NOTHING
    RETURNING id;
    ```
  - Se `completed: false`:
    ```sql
    DELETE FROM recovery_core.habit_logs
    WHERE habit_id = $id AND date_key = $dateKey AND profile_id = $profileId;
    ```
- **Resposta (200 OK):** `{ "status": "success", "data": { "habitId": "...", "completed": true, "dateKey": "2026-10-04" } }`.

#### D. `DELETE /api/v1/journey/habits/:id`
- Remove o hábito e apaga em cascata seus logs históricos.

---

## 4. Detalhamento da SPRINT 4B: Modo Comunitário (Mútua Ajuda e Partilha Cega)

A **Sprint 4B** ativa a dimensão social semântica e a segurança progressiva de acesso.

### 4.1. Tarefas da Sprint 4B

| Identificador | Título da Tarefa | Descrição Técnica e Escopo |
| :--- | :--- | :--- |
| **TASK-403** | **Backend do Feed da Tríade (`apps/api`)** | • Migration Drizzle 0009 criando `triad_posts`, `daily_post_limits` e `daily_metrics`.<br>• Catálogo canônico de chips `EVITO` e `ME AJUDA` na API com validação estrita.<br>• Endpoint `POST /community/posts`: 1 a 3 chips canônicos, zero texto livre no EVITO, suporte a `isAnonymous: boolean` e trava atômica de 3 posts/dia no relógio do servidor.<br>• Endpoint `GET /community/feed`: exatamente os últimos 20 posts com diversidade garantida via `author_post_rank <= 1`.<br>• Bloqueio amigável de postagem para contas com menos de 24 horas (Período de Escuta). |
| **TASK-404** | **Ações Cegas e Reações Silenciosas (`apps/api`)** | • Tabela `recovery_core.my_tools` (apenas `profile_id` e `chip_id`).<br>• Tabela `recovery_core.post_supports` com token HMAC único por post (`post_id`, `reaction_token`).<br>• Endpoint `POST /posts/:id/try`: CTE atômica que incrementa `saved_count` apenas na primeira adoção; despacha os 3 destinos funcionais (Rotina / Plano de Proteção / Minhas Ferramentas); job assíncrono no `pg-boss` defensivo contra posts deletados.<br>• Endpoint `POST /posts/:id/together`: apoio anônimo único por post. |
| **TASK-405** | **Interface Mobile do Feed Finito e Loop no SOS (`apps/mobile`)** | • Linha do tempo finita (máximo 20 posts) com pílulas de filtro (Todas, FAÇO, EVITO, ME AJUDA).<br>• Card fixo no topo: **"Estratégia da Semana"**.<br>• Card estático no final: **"Você viu tudo por hoje"**.<br>• Botão "Partilhar no Feed 🟢" ativado na Minha Rotina.<br>• Seletor no modal de postagem: `[ ] Partilhar de forma anônima`.<br>• **Fechamento do Loop no SOS:** Em fissura $\ge 4$, o `AlternativesModal` exibe "O que você guardou" no topo com botões grandes táteis de 1 toque.<br>• **Notificação em Lote na Home:** Card diário sereno quando inspirações $\ge 3$ ("Suas partilhas inspiraram algumas pessoas") e apoio recíproco ("Algumas pessoas estão com você hoje"). Zero push em tempo real, zero contadores numéricos. |
| **TASK-406** | **Vinculação Opcional de E-mail — RFC-003 (`apps/api` e `apps/mobile`)** | • Tabela `auth_security.user_recovery_emails`.<br>• Criptografia AES-256-GCM com AAD (`userId`) e Blind Index HMAC `email_lookup_hash`.<br>• Endpoints `/auth/email/bind`, `/verify` (OTP 6 dígitos) e `DELETE /email` (desvinculação instantânea).<br>• Tela de configurações com dica de OpSec (Apple Hide My Email / Proton) e Teste da Notificação nos disparos. |
| **TASK-403-T** | **Suíte Vitest de Invariantes do Feed (`apps/api`)** | • Teste de concorrência atômica no teto de 3 posts/dia via CTE.<br>• Teste do Teste da Notificação (varredura regex garantindo ausência de termos estigmatizantes nos templates).<br>• Teste de integridade de `my_tools` comprovando ausência de IDs de autor.<br>• Teste de isolamento de reações únicas no `post_supports`. |

---

### 4.2. Catálogo Canônico dos Chips de Proteção (`🔴 EVITO` e `🔵 ME AJUDA`)

```typescript
// apps/api/src/constants/chips.ts & apps/mobile/src/constants/chips.ts

export const EVITO_CHIP_IDS = [
  // Ambientes (9)
  'avoid_env_past_01', 'avoid_env_bars_01', 'avoid_env_alone_night_01',
  'avoid_env_crowd_01', 'avoid_env_street_late_01', 'avoid_env_risk_places_01',
  'avoid_env_idle_01', 'avoid_env_triggers_obj_01', 'avoid_env_nightlife_01',

  // Dinheiro e Hábitos (10)
  'avoid_money_cash_01', 'avoid_money_card_01', 'avoid_money_sameday_01',
  'avoid_money_transfer_01', 'avoid_money_bets_01', 'avoid_money_screens_01',
  'avoid_money_shopping_01', 'avoid_money_weekend_01', 'avoid_money_banking_01',
  'avoid_money_unscheduled_01',

  // Pessoas e Contatos (10)
  'avoid_ppl_toxic_01', 'avoid_ppl_messages_01', 'avoid_ppl_contacts_01',
  'avoid_ppl_no_exit_01', 'avoid_ppl_conflicts_01', 'avoid_ppl_minimize_01',
  'avoid_ppl_isolation_01', 'avoid_ppl_groups_01', 'avoid_ppl_untrusted_01',
  'avoid_ppl_overpromise_01',

  // HALT - Fome, Raiva, Solidão, Cansaço (12)
  'halt_hungry_01', 'halt_hungry_02', 'halt_hungry_03',
  'halt_angry_01', 'halt_angry_02', 'halt_angry_03',
  'halt_lonely_01', 'halt_lonely_02', 'halt_lonely_03',
  'halt_tired_01', 'halt_tired_02', 'halt_tired_03',
] as const;

export const ME_AJUDA_CHIP_IDS = [
  // Na Hora da Fissura (6)
  'help_tool_breathe_01', 'help_tool_grounding_01', 'help_tool_wait15_01',
  'help_tool_cold_water_01', 'help_tool_walk_now_01', 'help_tool_ice_01',

  // Pedir Apoio (5)
  'help_call_friend_01', 'help_text_before_01', 'help_meeting_01',
  'help_cvv_188_01', 'help_family_talk_01',

  // Organizar o Dia (5)
  'help_plan_night_01', 'help_short_list_01', 'help_alarm_reminders_01',
  'help_plan_b_01', 'help_weekend_plan_01',

  // Pensar Diferente (6)
  'help_write_feelings_01', 'help_remember_why_01', 'help_craving_passes_01',
  'help_past_wins_01', 'help_meditation_01', 'help_music_01',

  // Cuidar do Corpo (4)
  'help_body_eat_01', 'help_body_rest_01', 'help_body_water_01', 'help_body_sun_01',
] as const;

export const ALL_CANONICAL_CHIP_IDS = [
  ...FACO_CHIP_IDS,
  ...EVITO_CHIP_IDS,
  ...ME_AJUDA_CHIP_IDS,
] as const;
```

---

### 4.3. Modelagem de Dados Drizzle da Sprint 4B

```typescript
// apps/api/src/db/schema/recovery.ts (Adições da Sprint 4B)

// Tabela de Posts da Tríade
export const triadPosts = recoverySchema.table(
  'triad_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 10 }).notNull(), // 'FACO' | 'EVITO' | 'ME_AJUDA'
    chipIds: varchar('chip_ids', { length: 32 }).array().notNull(),
    isAnonymous: boolean('is_anonymous').notNull().default(false),
    savedCount: integer('saved_count').notNull().default(0),
    supportCount: integer('support_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_triad_posts_created').on(table.createdAt),
    index('idx_triad_posts_category').on(table.category, table.createdAt),
  ],
);

// Controle Atômico de Cota Diária de Posts no Relógio do Servidor
export const dailyPostLimits = recoverySchema.table(
  'daily_post_limits',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    postDate: date('post_date').notNull(), // Data do servidor SP
    postCount: integer('post_count').notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.postDate] })],
);

// Caixa de Ferramentas Cega (Destruição do Grafo Social)
export const myTools = recoverySchema.table(
  'my_tools',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    chipId: varchar('chip_id', { length: 32 }).notNull(),
    category: varchar('category', { length: 10 }).notNull(),
    savedAt: timestamp('saved_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [uniqueIndex('idx_my_tools_profile_chip').on(table.profileId, table.chipId)],
);

// Reação Silenciosa "Estamos Juntos" sem Grafo
export const postSupports = recoverySchema.table(
  'post_supports',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => triadPosts.id, { onDelete: 'cascade' }),
    reactionToken: varchar('reaction_token', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.reactionToken] })],
);

// Instrumentação Agregada do Piloto (Zero Telemetria Vigilante)
export const dailyMetrics = recoverySchema.table(
  'daily_metrics',
  {
    metricDate: date('metric_date').notNull(),
    metricName: varchar('metric_name', { length: 50 }).notNull(),
    metricValue: integer('metric_value').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.metricDate, table.metricName] })],
);

// apps/api/src/db/schema/auth.ts (RFC-003)
export const userRecoveryEmails = authSchema.table(
  'user_recovery_emails',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    encryptedEmail: text('encrypted_email').notNull(), // Formato "iv:authTag:ciphertext"
    emailLookupHash: varchar('email_lookup_hash', { length: 64 }).notNull().unique(),
    isVerified: boolean('is_verified').notNull().default(false),
    verificationCodeHash: varchar('verification_code_hash', { length: 64 }),
    verificationExpiresAt: timestamp('verification_expires_at', { withTimezone: true }),
    verificationAttempts: integer('verification_attempts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('idx_user_recovery_emails_lookup').on(table.emailLookupHash)],
);
```

---

### 4.4. Contratos de Endpoints e Queries Críticas (Sprint 4B)

#### A. Query com Window Function do Feed Finito (Diversidade Garantida)
```sql
WITH ranked_posts AS (
  SELECT 
    p.id,
    p.profile_id,
    p.category,
    p.chip_ids,
    p.is_anonymous,
    p.saved_count,
    p.support_count,
    p.created_at,
    prof.pseudonym,
    prof.avatar_id,
    ROW_NUMBER() OVER (
      PARTITION BY p.profile_id 
      ORDER BY p.created_at DESC
    ) as author_post_rank
  FROM recovery_core.triad_posts p
  JOIN recovery_core.profiles prof ON p.profile_id = prof.id
  WHERE p.created_at >= NOW() - INTERVAL '72 hours'
)
SELECT 
  id,
  category,
  chip_ids,
  is_anonymous,
  saved_count,
  support_count,
  created_at,
  CASE WHEN is_anonymous THEN NULL ELSE pseudonym END as pseudonym,
  CASE WHEN is_anonymous THEN 'avatar_default' ELSE avatar_id END as avatar_id
FROM ranked_posts
WHERE author_post_rank <= 1
ORDER BY created_at DESC
LIMIT 20;
```

#### B. Publicação no Feed (`POST /api/v1/community/posts`)
- **Validação de Entrada:**
  ```typescript
  export const createPostSchema = z.object({
    category: z.enum(['FACO', 'EVITO', 'ME_AJUDA']),
    chipIds: z.array(z.string()).min(1).max(3),
    isAnonymous: z.boolean().default(false),
  }).superRefine((data, ctx) => {
    const allowed = 
      data.category === 'FACO' ? FACO_CHIP_IDS :
      data.category === 'EVITO' ? EVITO_CHIP_IDS :
      ME_AJUDA_CHIP_IDS;

    for (let i = 0; i < data.chipIds.length; i++) {
      if (!allowed.includes(data.chipIds[i] as any)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `O chip "${data.chipIds[i]}" não pertence à categoria ${data.category}.`,
          path: ['chipIds', i],
        });
      }
    }
  });
  ```
- **Checagem de Período de Escuta (24h):** Se `profile.createdAt > now() - interval '24 hours'`, retorna HTTP 403 amigável.
- **Controle Atômico de Cota:**
  ```sql
  INSERT INTO recovery_core.daily_post_limits (profile_id, post_date, post_count)
  VALUES ($profileId, CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo', 1)
  ON CONFLICT (profile_id, post_date)
  DO UPDATE SET post_count = daily_post_limits.post_count + 1
  WHERE daily_post_limits.post_count < 3
  RETURNING post_count;
  ```
  Se retornar 0 linhas, a API responde HTTP 429: *"Você já fez suas 3 partilhas de hoje. Que tal descansar a mente agora?"*.

#### C. Ação "Vou Tentar Isso" (`POST /api/v1/community/posts/:id/try`)
1. Busca a categoria e o chip primário do post.
2. Executa a inserção atômica via CTE com incremento condicional:
   ```sql
   WITH inserted_tool AS (
     INSERT INTO recovery_core.my_tools (profile_id, chip_id, category)
     VALUES ($profileId, $primaryChipId, $category)
     ON CONFLICT (profile_id, chip_id) DO NOTHING
     RETURNING id
   )
   UPDATE recovery_core.triad_posts
   SET saved_count = saved_count + 1
   WHERE id = $postId
     AND EXISTS (SELECT 1 FROM inserted_tool);
   ```
3. **Distribuição para o Destino Funcional:**
   - Se `category === 'FACO'`:
     - Se `habits.count < 15`: insere em `recovery_core.habits`;
     - Se `habits.count >= 15`: mantém em `my_tools` e retorna `{ saved: true, addedToRoutine: false }`.
   - Se `category === 'EVITO'`: salva em `my_tools` (exibido no *Meu Plano de Proteção*).
   - Se `category === 'ME_AJUDA'`: salva em `my_tools` (exibido em *Minhas Ferramentas* e prioritário no SOS).
4. **Job Cego no `pg-boss`:**
   Enfileira `{ job: 'record_inspiration_batch', author_id: post.profileId }`.  
   O job agrega as contagens internamente para alimentar o card diário sem disparar push.

#### D. Reação "Estamos Juntos" (`POST /api/v1/community/posts/:id/together`)
1. Deriva o token cego:
   $$\text{reaction\_token} = \text{HMAC-SHA256}(\text{profile\_id} \parallel \text{postId}, \text{APP\_PEPPER\_V1})$$
2. Executa inserção com incremento atômico:
   ```sql
   WITH inserted_support AS (
     INSERT INTO recovery_core.post_supports (post_id, reaction_token)
     VALUES ($postId, $reactionToken)
     ON CONFLICT (post_id, reaction_token) DO NOTHING
     RETURNING post_id
   )
   UPDATE recovery_core.triad_posts
   SET support_count = support_count + 1
   WHERE id = $postId
     AND EXISTS (SELECT 1 FROM inserted_support);
   ```

---

## 5. Suíte de Testes de Invariantes com Vitest

Todos os testes de segurança, clínica e concorrência serão executados via `pnpm --filter @ancora/api test`.

### 5.1. Testes da Sprint 4A (`apps/api/src/routes/habits.test.ts`)
1. **Idempotência Real via PUT:** Três chamadas idênticas com `{ completed: true }` deixam exatamente 1 registro no banco. Duas chamadas com `{ completed: false }` mantêm 0 registros.
2. **Barreira Máxima de 15 Hábitos:** A 16ª tentativa de adicionar chip retorna HTTP 400.
3. **Ausência Estrutural de Streaks:** Asserção no payload JSON de `GET /journey/habits` garantindo ausência de chaves `currentStreak`, `streakCount`, `streakBroken` ou `daysLost`.
4. **Rejeição de Medicamentos e Texto Livre:** Tentativa de enviar `"morn_meds_01"` ou `"minha tarefa customizada"` na API retorna HTTP 400.

### 5.2. Testes da Sprint 4B (`apps/api/src/routes/community.test.ts`)
1. **Concorrência Atômica do Teto de Posts:** Disparo simultâneo de 5 requisições de post no mesmo milissegundo (`Promise.all`). Apenas 3 conseguem gravar; as outras 2 tomam HTTP 429.
2. **Deduplicação Cega de Apoio:** 5 chamadas em `/together` do mesmo usuário no mesmo post resultam em `support_count = 1`.
3. **Isolamento de Grafo Social:** Verificação direta na tabela `my_tools` comprovando que nenhum campo armazena `author_id` ou `source_post_id`.
4. **"O Teste da Notificação" (Blacklist Regex):** Varredura automatizada em todos os templates de e-mail e strings de notificação do sistema, garantindo zero ocorrências de termos como:
   `/droga|v[ií]cio|reca[ií]da|fissura|overdose|cl[ií]nica|dependente|entorpecente/i`.

---

## 6. Definição de Pronto Consolidada (DoD da Sprint 4)

- [ ] **DOD-401:** Tabelas `habits`, `habit_logs`, `triad_posts`, `daily_post_limits`, `my_tools`, `post_supports`, `daily_metrics` e `user_recovery_emails` migradas sem Foreign Keys relacionais com dados sensíveis.
- [ ] **DOD-402:** Teto de 15 hábitos ativos respeitado com erro amigável em HTTP 400.
- [ ] **DOD-403:** Atualização de conclusão de hábitos implementada via `PUT .../logs/:dateKey` idempotente, com `completed_at` truncado para a hora.
- [ ] **DOD-404:** Tolerância de $\pm 1$ dia no `dateKey` validada no backend sem coleta de GPS.
- [ ] **DOD-405:** Armazenamento local de tarefas privadas cifrado com AES-256-GCM via chave no `SecureStore`, limitado a 5-10 itens, e `android:allowBackup="false"` no `app.json`.
- [ ] **DOD-406:** Modos "Dia Leve", "Primeiro Uso Guiado", "Meus Momentos" e "Revisão Semanal Aditiva" implementados no mobile.
- [ ] **DOD-407:** Feed da Tríade estritamente finito em 20 posts, com "Estratégia da Semana" fixada no topo, encerramento sereno no rodapé e diversidade garantida por autor (`author_post_rank <= 1`).
- [ ] **DOD-408:** Teto de 3 posts/dia controlado atomicamente no relógio do servidor, e período de escuta de 24h ativo para contas novas.
- [ ] **DOD-409:** Ação "Vou Tentar Isso" distribuindo para os 3 destinos funcionais (Rotina, Plano de Proteção e Minhas Ferramentas) com CTE atômica anti-inflação.
- [ ] **DOD-410:** Fechamento do loop no SOS com ferramentas salvas exibidas prioritariamente no `AlternativesModal`.
- [ ] **DOD-411:** Opção de partilha anônima no feed (`isAnonymous: true`), especialmente destacada para `🔴 EVITO`.
- [ ] **DOD-412:** Notificações em lote entregues exclusivamente no app (card na Home) com threshold $\ge 3$.
- [ ] **DOD-413:** Vinculação opcional de e-mail (RFC-003) operando com AES-256-GCM em repouso e busca cega $O(1)$.
- [ ] **DOD-414:** Suíte de 4 testes de invariantes aprovada com 100% de sucesso no Vitest.
- [ ] **DOD-415:** `pnpm typecheck` com 0 erros e `pnpm lint` com 0 avisos em todos os workspaces do monorepo.

---

Este plano mestre constitui a referência canônica absoluta para a implementação da Sprint 4 do ecossistema Jornada Firme.