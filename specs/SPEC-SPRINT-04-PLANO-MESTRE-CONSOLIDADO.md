# 📘 Dossiê Técnico e Plano Mestre de Execução — Sprint 4: Rotina de Autocuidado, Feed Finito da Tríade e Segurança

- **Documento:** `specs/SPEC-SPRINT-04-PLANO-MESTRE-CONSOLIDADO.md`
- **Projeto:** Jornada Firme — Sistema de Apoio Mútuo e Prevenção de Recaídas ([RFC 002 v3.1](RFC-002.md), [RFC 004.1](RFC-004-ROTINA-E-FEED-TRIADE.md), [RFC 003](RFC-003-EMAIL-OPCIONAL.md))
- **Status:** Consolidado e Pronto para Execução
- **Subdivisão Estratégica:**
  - **Sprint 4A (Modo Pessoal / Single-Player):** ✅ Concluída e Auditada (Minha Rotina, Meus Momentos, Dia Leve e Criptografia Local).
  - **Sprint 4B-1 (Modo Comunitário / Mútua Ajuda):** 🚀 Próxima (Feed Finito da Tríade, Ações Cegas sem Grafo, Plano de Proteção e DELETE LGPD).
  - **Sprint 4B-2 (Confiança Progressiva / Segurança):** ⏳ Planejada (E-mail AES-256-GCM em Repouso e Anti-Email Bombing).
- **Stack Oficial:** Node.js 22 LTS, Fastify 5.2, PostgreSQL 16 Alpine, Drizzle ORM 0.45, React Native 0.86, Expo 57, pg-boss 12.35, Vitest 5.0

---

## 1. Visão Geral e Arquitetura da Sprint 4

A Sprint 4 materializa o núcleo de recuperação do **Jornada Firme**, equilibrando a **Ativação Comportamental individual** com o **suporte mútuo entre pares assíncrono (o NA Virtual)**. 

Para eliminar qualquer risco de dívida técnica ou retrabalho em auditorias futuras, toda a implementação segue o princípio **Single-Player antes do Multiplayer**: a rotina pessoal (4A) já foi entregue, testada e homologada, e a dimensão comunitária foi desacoplada em duas etapas com fronteiras rígidas de dados e segurança:
- **Sprint 4B-1 (Feed da Tríade e Ações Cegas):** Opera **100% dentro do schema `recovery_core`**. O sistema permanece em estado de **Zero-PII absoluto** (zero dados civis entram no banco de dados).
- **Sprint 4B-2 (E-mail Opcional de Recuperação):** Opera **100% dentro do schema `auth_security`**. É aqui, e estritamente aqui, que a criptografia AES-256-GCM, o Blind Index e o envio de OTP são tratados com rate limit dual-bucket contra *Email Bombing*.

```
+──────────────────────────────────────────────────────────────────────────────────────────────────+
|                                  ARQUITETURA CONSOLIDADA DA SPRINT 4                             |
+──────────────────────────────────────────────────────────────────────────────────────────────────+

 ┌─────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────┐
 │         SPRINT 4A: MODO PESSOAL         │  │       SPRINT 4B-1: MODO COMUNITÁRIO          │  │      SPRINT 4B-2: E-MAIL OPCIONAL        │
 │        (Ativação Comportamental)        │  │             (Mútua Ajuda Segura)             │  │          (Confiança Progressiva)         │
 ├─────────────────────────────────────────┤  ├──────────────────────────────────────────────┤  ├──────────────────────────────────────────┤
 │ • Checklist diário de hábitos (max 15). │  │ • Feed Finito (20 posts, reordenação SQL).   │  │ • user_recovery_emails em auth_security. │
 │ • Zero remédios no catálogo (Anti-SaMD).│  │ • Moderação por Construção com z.enum na API.│  │ • Cifra AES-256-GCM com AAD (userId).   │
 │ • "Meus Momentos" (100% local no phone).│  │ • Trava atômica de 3 posts/dia no relógio SP.│  │ • Blind Index HMAC com EMAIL_PEPPER_V1. │
 │ • Modo "Dia Leve" (1 a 2 itens básicos).│  │ • Ação Cega com 3 Destinos e post_saves.     │  │ • OTP 6 dígitos (15m, máx 5 tentativas).│
 │ • Primeiro Uso Guiado por horário.      │  │ • Loop Fechado no SOS ("O que você guardou").│  │ • Reautenticação obrigatória com senha. │
 │ • Revisão Semanal Aditiva ("3 dias").   │  │ • DELETE de post pelo autor (LGPD Art. 18).  │  │ • Anti-Email Bombing Dual-Bucket (CGNAT)│
 │ • PUT idempotente de status no hábito.  │  │ • DELETE e GET de ferramentas (/tools).      │  │ • Fila pg-boss sem e-mail em texto puro.│
 │ • Tolerância de fuso de ±1 dia sem GPS. │  │ • Apoio "Estamos Juntos" sem grafo social.   │  │ • Desvinculação em 0ms (LGPD Art. 8, § 5)│
 │ • Tarefas locais cifradas (AES-GCM) com │  │ • Notificação em lote na Home (>= 3 pessoas).│  │ • Resposta neutra anti-enumeração ~250ms │
 │   chave SecureStore e allowBackup=false.│  │ • Período de Escuta de 24h Reais.          │  │ • Índice único parcial WHERE is_verified│
 │                                         │  │ • Opção de Post Anônimo (padrão em EVITO).   │  │                                          │
 │                                         │  │ • Cache offline do feed (@ancora_feed_cache).│  │                                          │
 │                                         │  │ • Métrica do Piloto Agregada (daily_metrics).│  │                                          │
 └────────────────────┬────────────────────┘  └──────────────────────┬───────────────────────┘  └────────────────────┬─────────────────────┘
                      │                                              │                                               │
                      ▼                                              ▼                                               ▼
           recovery_core.habits                           recovery_core.triad_posts                       auth_security.user_recovery_emails
           recovery_core.habit_logs                       recovery_core.my_tools
           (encryptedStorage Local)                       recovery_core.post_saves
                                                          recovery_core.post_supports
                                                          recovery_core.daily_post_limits
                                                          recovery_core.daily_metrics
```

---

## 2. As Invariantes Técnicas e Blindagens do Pente Fino

1. **Delimitação Não-Farmacológica e Blindagem Regulatória (Anti-SaMD):**
   - O chip de remédios (`morn_meds_01`) foi banido do catálogo oficial. O app não atua como gerenciador de medicação (*Software as a Medical Device*), prevenindo riscos de dose dupla ou omissão de remédios controlados.
2. **Idempotência Real via PUT e Truncamento de Timestamp:**
   - A alteração de estado utiliza semântica declarativa de estado desejado: `PUT /journey/habits/:id/logs/:dateKey` com corpo `{ completed: boolean }`.
   - `completed_at` é truncado para a hora cheia (`date_trunc('hour', now())`), aniquilando a correlação temporal por milissegundos em dumps de banco.
3. **Fuso Horário Continental com Tolerância de $\pm 1$ Dia (Zero-PII de Localização):**
   - Para atender os 4 fusos do Brasil sem estragar a rotina noturna (22h-23h), o cliente envia a sua data local `dateKey` (`YYYY-MM-DD`).
   - O servidor valida se `dateKey` está dentro de uma janela deslizante de **$\pm 1$ dia** relativo à data atual do servidor, sem coletar GPS ou fuso do usuário.
4. **Armazenamento Local Cifrado (AES-GCM) e Bloqueio de Backup:**
   - As tarefas livres locais (máximo 10 itens, títulos max 60 caracteres) são cifradas com **AES-256-GCM** antes de tocar no `AsyncStorage`.
   - A chave simétrica é gerada no primeiro boot e guardada no enclave de hardware (`expo-secure-store`) com o atributo `THIS_DEVICE_ONLY`.
   - `android:allowBackup="false"` no `app.json` impede vazamento para backups de nuvem do Google Drive ou extrações via `adb backup`.
5. **Moderação por Construção com Validação Autoritativa no Backend (`z.enum`):**
   - O catálogo canônico de chips reside na API (`apps/api/src/constants/chips.ts`).
   - O backend valida a entrada via `z.enum(CANONICAL_CHIPS)`, rejeitando texto livre, telefones ou endereços via `curl`.
   - Segregação estrita: chips do `FACO` só entram em posts `FACO`, chips do `EVITO` só entram em posts `EVITO`, chips do `ME_AJUDA` só entram em posts `ME_AJUDA`.
6. **Destruição do Grafo Social via `reaction_salt` no Perfil (Eliminação de `profile_reactions`):**
   - A tabela `profile_reactions` foi banida por recriar o grafo relacional entre usuário e post.
   - Em vez disso, a tabela `recovery_core.profiles` possui `reaction_salt VARCHAR(64) NOT NULL DEFAULT gen_random_uuid()`.
   - Separação de domínio em HMAC com segredo dedicado `COMMUNITY_PEPPER_V1`:
     $$\text{reaction\_token} = \text{HMAC-SHA256}(\text{"support:"} \parallel \text{post\_id}, \text{profile.reaction\_salt})$$
     $$\text{save\_token} = \text{HMAC-SHA256}(\text{"save:"} \parallel \text{post\_id}, \text{profile.reaction\_salt})$$
   - Ao deletar a conta (`DELETE /account`), o perfil é excluído e o seu `reaction_salt` é destruído para sempre. Ninguém consegue recalcular ou associar os tokens antigos a uma pessoa (Forward Secrecy).
7. **Ação "Vou Tentar Isso" com 3 Destinos e Deduplicação via `post_saves`:**
   - `🟢 FAÇO` $\rightarrow$ Entra na **Minha Rotina** (checklist com check). Se já tiver 15 hábitos, salva em `my_tools` e avisa sem erro.
   - `🔴 EVITO` $\rightarrow$ Entra no **Meu Plano de Proteção** (mural de limites conscientes, SEM caixas de marcar para evitar o efeito "Urso Branco" e culpa).
   - `🔵 ME AJUDA` $\rightarrow$ Entra em **Minhas Ferramentas** (recursos de enfrentamento para momentos difíceis).
   - A tabela `post_saves` armazena `(post_id, save_token)`. Se o usuário readotar um chip já salvo, atualiza `my_tools` sem re-incrementar `saved_count` no post.
   - A ferramenta em `my_tools` sobrevive mesmo se o post original for deletado pelo autor.
8. **Direito ao Esquecimento e Autonomia (LGPD Art. 18):**
   - Endpoint `DELETE /api/v1/community/posts/:id` permitindo ao autor apagar seu post a qualquer momento, com exclusão em cascata de apoios e salvamentos.
   - Endpoint `DELETE /api/v1/journey/tools/:chipId` permitindo ao usuário remover um item salvo da sua caixa de ferramentas/plano de proteção.
   - Endpoint `GET /api/v1/journey/tools` retornando as ferramentas salvas agrupadas por categoria.
9. **Fechamento do Loop no SOS ("O Que Você Guardou"):**
   - No modal de fissura $\ge 4$ (`AlternativesModal`), o topo exibe com destaque **"O que você guardou"**: 2 a 3 botões grandes com as ferramentas que o usuário escolheu em momentos calmos (`Action Dispatcher`: 1 toque abre a respiração 4-7-8, ancoragem ou discador), lendo diretamente do cache local em `encryptedStorage`.
10. **Feed Finito de 20 Posts com Reordenação Externa e Sem Métricas de Vaidade:**
    - A timeline exibe no máximo as **20 postagens mais recentes** (`LIMIT 20`).
    - Query com Window Function: busca candidatos com `author_rank <= 1` (e fallback dinâmico ordenado por `author_rank ASC, created_at DESC LIMIT 20`), e **reordena externamente por `created_at DESC`**, garantindo ordem cronológica impecável na tela.
    - **Remoção de Métricas Públicas:** `saved_count` e `support_count` são expurgados do payload da API. O leitor vê apenas as partilhas e os botões de ação (Horizontalidade Radical).
    - Topo da timeline: Card fixo da **"Estratégia da Semana"** (curada pela equipe).
    - Fim da timeline: Card estático de conclusão: *"Você viu tudo por hoje. Que tal desligar o aplicativo e viver um momento no mundo real?"*.
    - **Zero Badges de Não Lidos:** Proibida a exibição de contadores ou bolinhas vermelhas indicando posts perdidos.
11. **Resiliência Offline no Feed:**
    - O mobile faz cache local em `encryptedStorage` dos últimos 20 posts recebidos (`@ancora_feed_cache`). Limpeza de cache no logout. Ao reconectar, substituição total do cache (não mescla posts deletados por LGPD).
    - Ação de publicar exige conexão ativa (sem fila local para evitar inconsistências de cota).
12. **Período de Escuta de 24h Reais e Kill-Switch:**
    - Contas devem ter sido criadas antes de ontem (`profiles.created_at < (now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '1 day'`) para poder postar.
    - Coluna `is_hidden: boolean NOT NULL DEFAULT false` em `triad_posts` como kill-switch administrativo.
    - Trava atômica de 3 posts/dia no relógio do servidor via `daily_post_limits`.
    - Suporte a `Idempotency-Key: <uuid>` em memória com TTL de 2 minutos no `POST /community/posts`.
13. **Identificação Opcional no Feed (`isAnonymous: boolean`):**
    - Padrão: com pseudônimo poético para `FAÇO` e `ME_AJUDA`. Padrão: **anônimo para `EVITO`** (proteção máxima contra exposição de gatilhos).
    - A API suprime o pseudônimo na resposta JSON e devolve apenas `🌿 Companheiro Navegador`.
    - `created_at` truncado para a hora cheia no payload para impedir correlação temporal com posts identificados.
14. **Notificações em Lote e OpSec no Aparelho:**
    - Notificações internas por padrão: apoios e inspirações são somados continuamente em `profile_notification_counters` até atingir $\ge 3$ pessoas, acendendo um card sereno na Home, **zerando o contador após exibição**.
    - Zero push no sistema operacional na 4B-1.
    - "Meu Plano de Proteção" recolhido dentro da Minha Rotina (não exposto na Home).
    - Teste regex de palavras estigmatizantes varre estritamente notificações externas (push, e-mail e cards da Home), excluindo a UI clínica interna.
15. **Proteção contra Email Bombing e Fila Zero-PII (4B-2):**
    - A fila do `pg-boss` carrega **apenas o UUID do registro** (`{ email_record_id: uuid }`). Zero e-mails em texto claro na tabela `pgboss.job`.
    - Índice único parcial: `UNIQUE INDEX idx_user_recovery_emails_verified ... WHERE is_verified = true` (linhas não verificadas não bloqueiam a vítima).
    - Reautenticação obrigatória com senha no `/bind` (proteção contra sessões roubadas).
    - Rate limit por `userId` no `/bind` (máx 3 envios por hora por conta, seguro para CGNAT de operadoras móveis).
    - Rate limit por hash de e-mail no `/recover-by-email` (máx 3 envios por e-mail em 24h).
    - Cifra AES-256-GCM com chave versionada `ENCRYPTION_KEY_V1` e Blind Index com `EMAIL_PEPPER_V1`.

---

## 3. SPRINT 4A: Modo Pessoal — [✅ CONCLUÍDA E HOMOLOGADA]

- [x] **TASK-401:** Backend de Hábitos Pessoais (`habits`, `habit_logs`, PUT idempotente, fuso $\pm 1$ dia, teto 15 hábitos e timestamp truncado).
- [x] **TASK-402:** Mobile Minha Rotina (Checklist, Dia Leve com persistência, Meus Momentos, Primeiro Uso Guiado com botão X, Revisão Semanal Aditiva e storage cifrado).
- [x] **TASK-401-T:** Suíte Vitest de Invariantes da 4A (48 testes verdes no monorepo).
- [x] **Patches 1, 2 e 3:** Auditoria adversarial superada e homologada.

---

## 4. Detalhamento da SPRINT 4B-1: Modo Comunitário (Mútua Ajuda e Partilha Cega)

A **Sprint 4B-1** ativa a dimensão social semântica operando 100% dentro do schema `recovery_core`.

### 4.1. Tarefas da Sprint 4B-1

| Identificador | Título da Tarefa | Descrição Técnica e Escopo |
| :--- | :--- | :--- |
| **TASK-403** | **Backend do Feed Finito da Tríade (`apps/api`)** | • Migration Drizzle 0010 criando no schema `recovery_core`: `triad_posts` (com `is_hidden`), `daily_post_limits`, `daily_metrics`, `my_tools` (com `category`), `post_saves`, `post_supports` e `profile_notification_counters`.<br>• Adição de `reaction_salt` em `recovery_core.profiles`.<br>• Catálogo canônico `EVITO` e `ME AJUDA` na API com validação estrita por categoria via `z.enum`.<br>• Query do Feed com seleção por diversidade e reordenação cronológica externa (`created_at DESC`), suprimindo contadores de vaidade e truncando hora.<br>• Endpoints: `POST /community/posts` (com `Idempotency-Key`, trava atômica de 3 posts/dia, período de escuta de 24h reais e padrão anônimo para EVITO), `GET /community/feed` e `DELETE /community/posts/:id` (LGPD Art. 18 com verificação de autoria). |
| **TASK-404** | **Ações Cegas, 3 Destinos e Caixa de Ferramentas (`apps/api`)** | • Endpoint `POST /posts/:id/try`: separação de domínio `save_token = HMAC("save:" || post_id, reaction_salt)`; deduplicação em `post_saves`; distribuição para os 3 destinos funcionais (`FAÇO` rotina, `EVITO` proteção, `ME AJUDA` ferramentas); persistência pós-exclusão do post; job assíncrono no `pg-boss` para acúmulo contínuo até $\ge 3$ com reset do contador.<br>• Endpoint `POST /posts/:id/together`: apoio deduplicado em `post_supports` via `reaction_token = HMAC("support:" || post_id, reaction_salt)`; proibição de auto-apoio.<br>• Endpoints de ferramentas: `GET /journey/tools` e `DELETE /journey/tools/:chipId`. |
| **TASK-405** | **Interface Mobile do Feed Finito e UI de Proteção (`apps/mobile`)** | • Linha do tempo finita de 20 posts com pílulas de filtro (`Todas`, `FAÇO`, `EVITO`, `ME AJUDA`).<br>• Card fixo curado "Estratégia da Semana" e card estático de conclusão "Você viu tudo por hoje" (zero badges de não lidos).<br>• Cache offline do feed em `encryptedStorage` (`@ancora_feed_cache`) com limpeza no logout e substituição total na reconexão.<br>• Botão "Partilhar no Feed 🟢" ativado na Minha Rotina e seletor `[ ] Partilhar de forma anônima` no modal (marcado por padrão no EVITO).<br>• Seção "Meu Plano de Proteção" na UI (recolhido na rotina, sem caixas de marcar) e "Minhas Ferramentas".<br>• Fechamento do loop no SOS: "O que você guardou" no topo do `AlternativesModal` lendo da cópia local em `encryptedStorage`.<br>• Card diário de acolhimento na Home exibindo apoio coletivo em lote quando $\ge 3$ pessoas, zerando após visualização. |
| **TASK-403-T** | **Suíte Vitest de Invariantes do Feed (`apps/api`)** | • Teste comprovando que `isAnonymous: true` suprime pseudônimo e avatar na resposta JSON da API e não vaza profileId.<br>• Teste do Período de Escuta de 24h Reais (bloqueio no mesmo dia civil; liberação após 1 dia civil completo).<br>• Teste do Fallback de Diversidade com reordenação cronológica externa.<br>• Teste de ausência de contadores de popularidade e contadores de não lidos no JSON do feed.<br>• Teste de concorrência atômica no teto de 3 posts/dia e `Idempotency-Key`.<br>• Teste de isolamento de grafo em `my_tools` e `post_saves` com forward secrecy via `reaction_salt`.<br>• Teste de autorização: usuário não consegue executar `DELETE` no post de outro autor.<br>• Teste do "Teste da Notificação" com regex restrito a templates externos. |

---

### 4.2. Modelagem Drizzle da Sprint 4B-1 (`recovery_core`)

```typescript
// apps/api/src/db/schema/recovery.ts (Adições da Sprint 4B-1)

// Alteração na tabela profiles existente:
// reactionSalt: varchar('reaction_salt', { length: 64 }).notNull().default(sql`gen_random_uuid()`),

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
    isHidden: boolean('is_hidden').notNull().default(false), // Kill-switch administrativo
    savedCount: integer('saved_count').notNull().default(0),
    supportCount: integer('support_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_triad_posts_created').on(table.createdAt),
    index('idx_triad_posts_category').on(table.category, table.createdAt),
  ],
);

export const dailyPostLimits = recoverySchema.table(
  'daily_post_limits',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    postDate: date('post_date').notNull(),
    postCount: integer('post_count').notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.postDate] })],
);

export const myTools = recoverySchema.table(
  'my_tools',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    chipId: varchar('chip_id', { length: 32 }).notNull(),
    category: varchar('category', { length: 20 }).notNull(),
    savedAt: timestamp('saved_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [uniqueIndex('idx_my_tools_profile_chip').on(table.profileId, table.chipId)],
);

export const postSaves = recoverySchema.table(
  'post_saves',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => triadPosts.id, { onDelete: 'cascade' }),
    saveToken: varchar('save_token', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.saveToken] })],
);

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

export const profileNotificationCounters = recoverySchema.table(
  'profile_notification_counters',
  {
    profileId: uuid('profile_id')
      .notNull()
      .primaryKey()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    unreadSupports: integer('unread_supports').notNull().default(0),
    unreadInspirations: integer('unread_inspirations').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
);

export const dailyMetrics = recoverySchema.table(
  'daily_metrics',
  {
    metricDate: date('metric_date').notNull(),
    metricName: varchar('metric_name', { length: 50 }).notNull(),
    metricValue: integer('metric_value').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.metricDate, table.metricName] })],
);
```

---

### 4.3. Query do Feed Finito com Reordenação Externa Canônica

```sql
WITH ranked_posts AS (
  SELECT 
    p.id,
    p.category,
    p.chip_ids,
    p.is_anonymous,
    p.created_at,
    prof.pseudonym,
    prof.avatar_id,
    ROW_NUMBER() OVER (
      PARTITION BY p.profile_id 
      ORDER BY p.created_at DESC
    ) as author_rank
  FROM recovery_core.triad_posts p
  JOIN recovery_core.profiles prof ON p.profile_id = prof.id
  WHERE p.is_hidden = false
),
selected_candidates AS (
  SELECT * FROM ranked_posts
  ORDER BY author_rank ASC, created_at DESC
  LIMIT 20
)
SELECT 
  id,
  category,
  chip_ids,
  is_anonymous,
  -- Trunca timestamp na hora contra correlação temporal
  date_trunc('hour', created_at) as created_at,
  CASE WHEN is_anonymous THEN NULL ELSE pseudonym END as pseudonym,
  CASE WHEN is_anonymous THEN 'avatar_default' ELSE avatar_id END as avatar_id
FROM selected_candidates
ORDER BY created_at DESC;
```
*(Nota de Horizontalidade: `saved_count` e `support_count` foram sumariamente expurgados do SELECT. Zero métricas de popularidade no payload).*

---

## 5. Detalhamento da SPRINT 4B-2: Confiança Progressiva (E-mail Opcional AES-256)

A **Sprint 4B-2** isola a segurança de e-mail 100% dentro do schema `auth_security`.

### 5.1. Tarefas da Sprint 4B-2

| Identificador | Título da Tarefa | Descrição Técnica e Escopo |
| :--- | :--- | :--- |
| **TASK-406** | **E-mail de Recuperação Cifrado em Repouso (`apps/api` e `apps/mobile`)** | • Migration Drizzle 0011 criando `auth_security.user_recovery_emails`.<br>• Cifra AES-256-GCM com chave versionada `ENCRYPTION_KEY_V1` e AAD (`userId`).<br>• Blind Index HMAC `email_lookup_hash` derivado com `EMAIL_PEPPER_V1` (separado do pepper de auth).<br>• Índice único parcial: `UNIQUE INDEX idx_user_recovery_emails_verified ... WHERE is_verified = true`.<br>• Reautenticação obrigatória com senha no `/bind` (`{ email, currentPassword }`).<br>• Dual-Bucket Anti-Bombing seguro para CGNAT: máx 3 envios/hora por `userId` no `/bind`; máx 3 envios/24h por `email_lookup_hash` no `/recover-by-email`.<br>• Fila Zero-PII no `pg-boss`: payload carrega **apenas o UUID do registro** (`{ email_record_id: uuid }`). Zero e-mails em texto claro na tabela `pgboss.job`.<br>• Endpoint `/recover-by-email` com resposta imediata e trabalho constante.<br>• Desvinculação em 0ms (`DELETE /auth/email`).<br>• Revogação de sessões e emissão de nova Chave Mestra após recuperação bem-sucedida por e-mail. |
| **TASK-406-T** | **Suíte Vitest de Invariantes do E-mail Cifrado (`apps/api`)** | • Teste de anti-enumeração por timing em `/recover-by-email`.<br>• Teste de índice parcial (e-mail não verificado abandonado não impede nova vinculação legítima).<br>• Teste de exigência de senha correta no `/bind`.<br>• Teste de expiração de OTP (15 min) e bloqueio na 6ª tentativa errada.<br>• Teste do Dual-Bucket contra Email Bombing.<br>• Teste comprovando ausência de e-mail no payload do job no `pg-boss`.<br>• Teste de desvinculação em 0ms comprovando deleção física do registro em `user_recovery_emails`. |

### 5.2. Modelagem Drizzle da Sprint 4B-2 (`auth_security`)

```typescript
// apps/api/src/db/schema/auth.ts (Adições da Sprint 4B-2)

export const userRecoveryEmails = authSchema.table(
  'user_recovery_emails',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    encryptedEmail: text('encrypted_email').notNull(), // "iv:authTag:ciphertext"
    emailLookupHash: varchar('email_lookup_hash', { length: 64 }).notNull(),
    isVerified: boolean('is_verified').notNull().default(false),
    verificationCodeHash: varchar('verification_code_hash', { length: 64 }),
    verificationExpiresAt: timestamp('verification_expires_at', { withTimezone: true }),
    verificationAttempts: integer('verification_attempts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (table) => [
    // Índice único parcial: linhas pendentes não verificadas NÃO bloqueiam a vítima!
    uniqueIndex('idx_user_recovery_emails_verified')
      .on(table.emailLookupHash)
      .where(sql`is_verified = true`),
  ],
);
```

---

## 6. Definição de Pronto Consolidada (DoD da Sprint 4)

- [x] **DOD-401:** Backend de hábitos (4A) com PUT idempotente, truncamento temporal e teto de 15 hábitos.
- [x] **DOD-402:** Mobile de rotina (4A) com tarefas locais cifradas (AES-GCM), Dia Leve e Meus Momentos.
- [x] **DOD-403:** Suíte Vitest da 4A com 48 testes verdes e auditoria adversarial superada.
- [ ] **DOD-404:** Feed da Tríade (4B-1) finito em 20 posts com reordenação externa cronológica (`ORDER BY created_at DESC`) e sem contadores de popularidade no payload.
- [ ] **DOD-405:** Deleção de postagem pelo autor implementada em `DELETE /community/posts/:id` (LGPD Art. 18).
- [ ] **DOD-406:** Remoção e leitura de ferramentas implementadas em `DELETE /journey/tools/:chipId` e `GET /journey/tools`.
- [ ] **DOD-407:** Ação "Vou Tentar Isso" com deduplicação cega via `post_saves` (`save_token` com prefixo e pepper próprio) e persistência pós-exclusão do post.
- [ ] **DOD-408:** Reação "Estamos Juntos" deduplicada por `reaction_token` com desassociação irrevogável por `reaction_salt` no perfil (sem tabela de grafo).
- [ ] **DOD-409:** Cache offline do feed implementado no mobile (`@ancora_feed_cache`) com limpeza no logout e substituição na reconexão.
- [ ] **DOD-410:** Notificações em lote na Home acumuladas até $\ge 3$ pessoas com reset automático após visualização.
- [ ] **DOD-411:** Suíte Vitest da 4B-1 cobrindo supressão de pseudônimo no `isAnonymous`, período de escuta de 24h reais, fallback de diversidade e regex de notificações restrito.
- [ ] **DOD-412:** E-mail opcional (4B-2) operando com AES-256-GCM com AAD (`userId`), Blind Index parcial, reautenticação com senha no `/bind` e Dual-Bucket contra Email Bombing seguro para CGNAT.
- [ ] **DOD-413:** Fila do `pg-boss` transportando exclusivamente `{ email_record_id }`, garantindo zero e-mails em texto claro na tabela `pgboss.job`.
- [ ] **DOD-414:** Suíte Vitest da 4B-2 cobrindo anti-enumeração, expiração de OTP e desvinculação em 0ms.
- [ ] **DOD-415:** `pnpm typecheck` com 0 erros e `pnpm lint` com 0 avisos em todos os workspaces.

---

Este plano mestre constitui a referência canônica absoluta para a execução das Sprints 4B-1 e 4B-2 do ecossistema Jornada Firme.
