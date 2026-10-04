# RFC 004: Sistema de Rotina de Autocuidado, Catálogo de Chips da Tríade e Partilha Comunitária Segura

- **Status:** Aprovada para Implementação (Sprint 4)
- **Versão:** 1.1 (Consolidada com Destruição de Grafo Social e Hábitos Locais)
- **Dependência Normativa:** Estende e complementa a [RFC-002 v3.1](specs/RFC-002.md)
- **Escopo Técnico:** `apps/api` (Fastify / PostgreSQL) e `apps/mobile` (React Native / Expo)
- **Domínio:** Ativação Comportamental / Mútua Ajuda / Prevenção de Recaída / NA Virtual
- **Slogan Associado:** _Um passo de cada vez._ / _Firmeza para atravessar a tempestade._

---

## 1. Motivação e Filosofia de Produto

Na recuperação de dependências químicas, o principal gatilho para a recaída nos primeiros meses de abstinência é **"O Vazio"**: o súbito saldo de 6 a 10 horas ociosas no dia que antes eram consumidas pelo ciclo de busca, consumo e ressaca da substância. 

Sem uma estrutura previsível de rotina, o cérebro em sofrimento tende a retornar aos antigos caminhos neurais de busca de alívio rápido.

Inspirado nas partilhas de **Narcóticos Anônimos (NA)** e fundamentado na **Ativação Comportamental da Terapia Cognitivo-Comportamental (TCC)**, esta RFC introduz o núcleo comunitário e de rotina do Jornada Firme:
1. **Minha Rotina de Autocuidado:** Uma agenda diária pessoal onde o usuário estrutura e marca suas pequenas vitórias do dia a dia (saúde, exercícios, mente, arte, tarefas reais);
2. **O Feed da Tríade por "Moderação por Construção":** Em vez de fóruns de texto livre (que demandam moderação 24/7 inviável e correm risco de vazamento de gírias e locais de tráfico), o feed opera através de um **catálogo curado de Chips estruturados** (`chip_id`);
3. **O Ciclo de Inspiração Cega ("Vou Tentar Isso"):** O usuário que conclui uma atividade saudável pode partilhá-la no feed como `🟢 FAÇO`. Outro membro em dificuldade lê a partilha e, com 1 toque, copia o hábito para a sua própria rotina diária, sem gerar arestas relacionais ou rastreamento social de quem copiou de quem.

```
                  O LOOP VIRTUOSO DA SPRINT 4
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  ▼                                                             │
[ MINHA ROTINA ] ──► [ DAR CHECK ] ──► [ PARTILHAR ]           │
  (Caminhada, violão,   (Vitória do       (Post no Feed        │
   pomar, xadrez)        dia a dia)        🟢 FAÇO)             │
                                               │                │
                                               ▼                │
                                       [ COLEGA VÊ NO FEED ]    │
                                       (Identificação de NA)    │
                                               │                │
                                               ▼                │
                                       [ "VOU TENTAR ISSO" ] ───┘
                                       (Copia anônima para sua
                                        própria rotina pessoal)
```

---

## 2. Invariantes de Arquitetura e Regras Inegociáveis

1. **Moderação por Construção no `EVITO`:** É terminantemente proibida a publicação de texto livre na categoria `🔴 EVITO`. O usuário seleciona exclusivamente entre os chips pré-definidos do catálogo. Risco de vazamento de endereços de drogas, nomes de estabelecimentos ou gírias: **zero absoluto**.
2. **A Trava Ética de Medicamentos:** O chip `💊 Tomar meus remédios no horário` é de uso estritamente **privado e pessoal**. Ele existe na rotina do usuário, mas **não possui botão de partilha no feed**, impedindo discussões farmacológicas não supervisionadas ou indução à automedicação entre pares.
3. **Persistência por `chip_id` Estável no Banco:** O banco de dados nunca armazena o texto literal do chip, apenas identificadores imutáveis (ex: `mind_chess_01`, `mov_walk_run_01`). Mudanças de redação, emojis ou traduções ocorrem no código do cliente sem necessidade de migrations SQL.
4. **Hábitos Personalizados são 100% Locais (Zero-PII de Rotina):** Se o usuário criar tarefas pessoais com títulos livres em sua rotina (ex: *"Buscar meu filho Pedro na escola"*), esse dado é salvo **estritamente no armazenamento local do dispositivo (`AsyncStorage` / SQLite local)**. Nenhum texto livre pessoal é enviado para o PostgreSQL, eliminando a possibilidade de desanomização por conteúdo de agenda.
5. **Destruição do Grafo Social (*Blind Action*):** A tabela `my_tools` armazena apenas `(profile_id, chip_id)`. **É proibido armazenar `source_post_id` ou o ID do autor original**. A interação entre quem posta e quem salva é matematicamente cega, impedindo ataques de reconstrução de grafo de amizade ou relacionamento entre perfis.
6. **Métricas Não-Predatórias:** Não existem contadores públicos de curtidas, contadores de seguidores ou rankings de "usuários mais produtivos". As únicas interações comunitárias são as microações funcionais *"Vou Tentar Isso"* (salva o hábito) e *"Estamos Juntos"* (apoio silencioso).
7. **Controle de Frequência de Postagens:** Cada usuário pode publicar no máximo **3 postagens por dia no feed comunitário**, desestimulando comportamentos compulsivos de tela e valorizando a partilha focada.

---

## 3. Catálogo Canônico de Chips da Tríade

Todos os chips são redigidos em primeira pessoa, tom sereno, sem termos estigmatizantes (proibido o uso de palavras como "droga", "vício", "recaída" ou verbos diretos de consumo).

### 3.1. 🟢 Categoria `FAÇO` (Ativação Comportamental e Rotina Viva)

Utilizados tanto no feed comunitário quanto como catálogo base para a agenda pessoal de hábitos.

| Categoria | `chip_id` | Ícone | Rótulo Canônico do Chip | Permite Feed? |
| :--- | :--- | :---: | :--- | :---: |
| **Manhã e Cuidado** | `morn_coffee_01` | ☕ | Café da manhã com calma | Sim |
| | `morn_meds_01` | 💊 | Tomar meus remédios no horário | **NÃO (Privado)** |
| | `morn_shower_01` | 🚿 | Banho e cuidado pessoal | Sim |
| | `morn_bed_01` | 🛏️ | Arrumar a cama e o quarto | Sim |
| | `morn_water_01` | 💧 | Beber água ao longo do dia | Sim |
| | `morn_cook_01` | 🍲 | Cozinhar uma refeição em casa | Sim |
| | `morn_sleep_01` | 😴 | Dormir em um horário regular | Sim |
| **Movimento** | `mov_walk_run_01` | 🏃 | Caminhada ou corrida matinal | Sim |
| | `mov_stretch_01` | 🧘 | Alongamento ou yoga | Sim |
| | `mov_bike_01` | 🚴 | Pedalar | Sim |
| | `mov_swim_01` | 🏊 | Natação ou esporte | Sim |
| | `mov_workout_01` | 🏋️ | Treino na academia ou em casa | Sim |
| | `mov_walk_after_01` | 🚶 | Caminhada leve após o almoço | Sim |
| **Mente e Hobbies** | `mind_chess_01` | ♟️ | Estudo e treino de xadrez | Sim |
| | `mind_guitar_01` | 🎸 | Prática de violão / música | Sim |
| | `mind_reading_01` | 📚 | Leitura de um livro | Sim |
| | `mind_art_01` | 🎨 | Desenho, pintura ou artesanato | Sim |
| | `mind_journal_01` | 📓 | Escrever no diário | Sim |
| | `mind_puzzle_01` | 🧩 | Jogos de raciocínio ou quebra-cabeça | Sim |
| | `mind_study_01` | 🎓 | Estudo ou curso profissional | Sim |
| **Vida e Casa** | `life_garden_01` | 🌱 | Cuidar das plantas e pomar | Sim |
| | `life_clean_01` | 🧹 | Organizar e limpar a casa | Sim |
| | `life_work_01` | 🛠️ | Trabalho ou tarefa produtiva | Sim |
| | `life_pet_01` | 🐕 | Cuidar de um animal de estimação | Sim |
| | `life_market_01` | 🛒 | Fazer as compras da semana | Sim |
| **Conexão** | `conn_call_01` | 📞 | Ligar para alguém que me apoia | Sim |
| | `conn_family_01` | 👨‍👩‍👧 | Tempo de qualidade com a família | Sim |
| | `conn_meeting_01` | 🪑 | Ir a um encontro de apoio mútuo | Sim |
| | `conn_faith_01` | 🙏 | Momento de oração ou espiritualidade | Sim |
| | `conn_friends_01` | 🧃 | Programa saudável com amigos | Sim |

---

### 3.2. 🔴 Categoria `EVITO` (Gestão Consciente de Gatilhos)

Chips selecionáveis exclusivamente (1 a 3 por post) para registrar decisões firmes de proteção.

| Subcategoria | `chip_id` | Ícone | Rótulo Canônico do Chip |
| :--- | :--- | :---: | :--- |
| **Ambientes** | `avoid_env_past_01` | 📍 | Evito passar por caminhos do meu passado |
| | `avoid_env_bars_01` | 📍 | Evito bares, adegas e festas |
| | `avoid_env_alone_night_01` | 📍 | Evito ficar em casa sozinho à noite |
| | `avoid_env_crowd_01` | 📍 | Evito lugares com aglomerações intensas |
| | `avoid_env_street_late_01` | 📍 | Evito ficar na rua até tarde sem motivo |
| | `avoid_env_risk_places_01` | 📍 | Evito ambientes e encontros de risco |
| | `avoid_env_idle_01` | 📍 | Evito ficar de bobeira sem ter o que fazer |
| | `avoid_env_triggers_obj_01` | 📍 | Evito guardar objetos e lembranças de risco |
| | `avoid_env_nightlife_01` | 📍 | Evito frequentar locais de saída noturna |
| **Dinheiro e Hábitos** | `avoid_money_cash_01` | 💰 | Evito andar com dinheiro em espécie |
| | `avoid_money_card_01` | 💰 | Evito ficar com o cartão de crédito à mão |
| | `avoid_money_sameday_01` | 💰 | Evito receber e gastar dinheiro no mesmo dia |
| | `avoid_money_transfer_01` | 💰 | Evito fazer transferências por impulso |
| | `avoid_money_bets_01` | 💰 | Evito apostas, bets e jogos de azar |
| | `avoid_money_screens_01` | 💰 | Evito olhar redes sociais por muito tempo |
| | `avoid_money_shopping_01` | 💰 | Evito compras supérfluas por impulso |
| | `avoid_money_weekend_01` | 💰 | Evito ficar com dinheiro sobrando no fim de semana |
| | `avoid_money_banking_01` | 💰 | Evito acessar aplicativos de banco sem planejamento |
| | `avoid_money_unscheduled_01`| 💰 | Evito deixar o dia sem uma programação |
| **Pessoas e Contatos** | `avoid_ppl_toxic_01` | 👥 | Evito contato com quem me incentiva a usar |
| | `avoid_ppl_messages_01` | 👥 | Evito responder mensagens de pessoas do passado |
| | `avoid_ppl_contacts_01` | 👥 | Evito guardar números de telefone que são gatilho |
| | `avoid_ppl_no_exit_01` | 👥 | Evito encontros sem um plano de saída |
| | `avoid_ppl_conflicts_01` | 👥 | Evito discussões e conflitos desnecessários |
| | `avoid_ppl_minimize_01` | 👥 | Evito pessoas que minimizam o meu esforço |
| | `avoid_ppl_isolation_01` | 👥 | Evito me afastar de quem realmente me apoia |
| | `avoid_ppl_groups_01` | 👥 | Evito grupos de conversa que me causam ansiedade |
| | `avoid_ppl_untrusted_01` | 👥 | Evito eventos sociais sem alguém de confiança por perto |
| | `avoid_ppl_overpromise_01` | 👥 | Evito prometer o que não consigo cumprir |
| **HALT (Fome)** | `halt_hungry_01` | 🥪 | Evito ficar muito tempo sem comer |
| | `halt_hungry_02` | 🥪 | Evito pular refeições principais |
| | `halt_hungry_03` | 🥪 | Evito sair de casa de estômago vazio |
| **HALT (Raiva)** | `halt_angry_01` | ⚡ | Evito tomar decisões quando estou irritado |
| | `halt_angry_02` | ⚡ | Evito guardar mágoa sem conversar com alguém |
| | `halt_angry_03` | ⚡ | Evito discutir de cabeça quente |
| **HALT (Solidão)** | `halt_lonely_01` | 🌧️ | Evito passar muitas horas isolado |
| | `halt_lonely_02` | 🌧️ | Evito passar o dia sem falar com ninguém |
| | `halt_lonely_03` | 🌧️ | Evito sumir ou me esconder quando estou mal |
| **HALT (Cansaço)** | `halt_tired_01` | 🌙 | Evito ir para a cama muito tarde |
| | `halt_tired_02` | 🌙 | Evito acumular noites mal dormidas |
| | `halt_tired_03` | 🌙 | Evito me sobrecarregar de tarefas |

---

### 3.3. 🔵 Categoria `ME AJUDA` (Ferramentas Empíricas de Alívio)

Técnicas de enfrentamento (*coping*) baseadas em TCC, DBT e vivência comunitária.

| Subcategoria | `chip_id` | Ícone | Rótulo Canônico do Chip |
| :--- | :--- | :---: | :--- |
| **Na Hora da Fissura** | `help_tool_breathe_01` | 🌬️ | Praticar a Respiração 4-7-8 |
| | `help_tool_grounding_01`| 🖐️ | Fazer a Ancoragem sensorial 5-4-3-2-1 |
| | `help_tool_wait15_01` | ⏱️ | Esperar 15 minutos antes de tomar qualquer decisão |
| | `help_tool_cold_water_01`| 🚿 | Lavar o rosto ou as mãos com água bem fria |
| | `help_tool_walk_now_01` | 🏃 | Sair para uma caminhada no momento do impulso |
| | `help_tool_ice_01` | 🧊 | Segurar uma pedra de gelo nas mãos |
| **Pedir Apoio** | `help_call_friend_01` | 📞 | Ligar para uma pessoa de confiança |
| | `help_text_before_01` | 💬 | Mandar mensagem para alguém antes de piorar |
| | `help_meeting_01` | 🪑 | Participar de uma reunião de apoio mútuo |
| | `help_cvv_188_01` | 📱 | Ligar para o CVV 188 para desabafar |
| | `help_family_talk_01` | 👨‍👩‍👧 | Contar para alguém próximo como estou me sentindo |
| **Organizar o Dia** | `help_plan_night_01` | 🗓️ | Planejar as tarefas básicas na noite anterior |
| | `help_short_list_01` | ✅ | Ter uma lista curta e realista do que fazer hoje |
| | `help_alarm_reminders_01`| ⏰ | Programar alarmes para remédios e refeições |
| | `help_plan_b_01` | 🧭 | Ter sempre um plano B para momentos de folga |
| | `help_weekend_plan_01` | 📆 | Planejar atividades saudáveis para o fim de semana |
| **Pensar Diferente** | `help_write_feelings_01`| 📓 | Escrever em um papel o que estou sentindo |
| | `help_remember_why_01` | 🎯 | Lembrar do motivo pelo qual decidi parar |
| | `help_craving_passes_01`| 🕰️ | Lembrar que a onda da vontade sobe e desce |
| | `help_past_wins_01` | 🙌 | Lembrar das vitórias e dias limpos que já conquistei |
| | `help_meditation_01` | 🧘 | Fazer uma pausa de respiração guiada |
| | `help_music_01` | 🎧 | Colocar uma música calma que me acalma |
| **Cuidar do Corpo** | `help_body_eat_01` | 🍎 | Comer algo nutritivo quando sinto fome (HALT) |
| | `help_body_rest_01` | 😴 | Deitar e descansar quando o corpo está exausto (HALT) |
| | `help_body_water_01` | 💧 | Tomar um copo cheio de água fresca |
| | `help_body_sun_01` | ☀️ | Tomar 15 minutos de sol pela manhã |

---

## 4. Modelagem de Dados no PostgreSQL (`recovery_core`)

Todas as entidades residem no schema `recovery_core`, vinculadas exclusivamente ao `profile_id`, sem conexões relacionais com `auth_security`.

### 4.1. Tabela de Hábitos da Rotina (`recovery_core.habits`)

Armazena os hábitos do catálogo oficial selecionados pelo usuário. **Zero texto livre.**

```sql
CREATE TABLE recovery_core.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES recovery_core.profiles(id) ON DELETE CASCADE,
    chip_id VARCHAR(32) NOT NULL, -- Apenas identificadores canônicos do catálogo
    created_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('day', now())
);

CREATE UNIQUE INDEX idx_habits_profile_chip ON recovery_core.habits(profile_id, chip_id);
```

### 4.2. Tabela de Conclusão Diária (`recovery_core.habit_logs`)

Registra o check diário de cada hábito.

```sql
CREATE TABLE recovery_core.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES recovery_core.habits(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES recovery_core.profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_key DATE NOT NULL -- Data no fuso 'America/Sao_Paulo'
);

CREATE UNIQUE INDEX idx_habit_logs_unique_day ON recovery_core.habit_logs(habit_id, date_key);
CREATE INDEX idx_habit_logs_profile_date ON recovery_core.habit_logs(profile_id, date_key);
```

### 4.3. Tabela do Feed Comunitário (`recovery_core.triad_posts`)

Armazena as publicações da Tríade estruturadas em arrays de chips.

```sql
CREATE TABLE recovery_core.triad_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES recovery_core.profiles(id) ON DELETE CASCADE,
    category VARCHAR(10) NOT NULL CHECK (category IN ('FACO', 'EVITO', 'ME_AJUDA')),
    chip_ids VARCHAR(32)[] NOT NULL,   -- Array de 1 a 3 chip_ids do catálogo
    saved_count INTEGER NOT NULL DEFAULT 0,    -- Contador anônimo de "Vou Tentar Isso"
    support_count INTEGER NOT NULL DEFAULT 0,  -- Contador de "Estamos Juntos"
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_triad_posts_created ON recovery_core.triad_posts(created_at DESC);
CREATE INDEX idx_triad_posts_category ON recovery_core.triad_posts(category, created_at DESC);
```

### 4.4. Tabela da Caixa de Ferramentas Desacoplada (`recovery_core.my_tools`)

**Destruição do Grafo Social:** Esta tabela **NÃO possui `source_post_id`** e não possui referência ao autor original. Ela armazena exclusivamente quais chips o usuário adicionou à sua caixa de ferramentas pessoal.

```sql
CREATE TABLE recovery_core.my_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES recovery_core.profiles(id) ON DELETE CASCADE,
    chip_id VARCHAR(32) NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('day', now())
);

CREATE UNIQUE INDEX idx_my_tools_profile_chip ON recovery_core.my_tools(profile_id, chip_id);
```

---

## 5. Especificação dos Endpoints de Backend (`apps/api`)

### 5.1. Módulo de Hábitos Pessoais (`/api/v1/journey/habits`)

* `GET /api/v1/journey/habits`:  
  Retorna a lista de hábitos ativos do usuário e quais foram concluídos na data de hoje (fuso `America/Sao_Paulo`).
* `POST /api/v1/journey/habits`:  
  Adiciona um chip do catálogo à rotina pessoal.  
  Validação Zod: `z.object({ chipId: z.string().max(32) })`.  
  *(A API rejeita qualquer tentativa de enviar títulos livres ou strings customizadas para o servidor).*
* `POST /api/v1/journey/habits/:id/toggle`:  
  Marca ou desmarca a conclusão daquele hábito na data de hoje. Retorna `{ completed: boolean }`.
* `DELETE /api/v1/journey/habits/:id`:  
  Remove o hábito da rotina.

### 5.2. Módulo do Feed da Tríade (`/api/v1/community/posts`)

* `POST /api/v1/community/posts`:  
  Publica um card comunitário sob a Tríade.  
  - Rate limit estrito: **máximo de 3 postagens por dia por usuário**.
  - Validação Zod com Trava de Medicamentos:
    ```ts
    z.object({
      category: z.enum(['FACO', 'EVITO', 'ME_AJUDA']),
      chipIds: z.array(z.string().max(32)).min(1).max(3),
    }).refine(data => {
      // REGRA DE OURO: Bloqueia publicação do chip de medicação no feed
      return !data.chipIds.includes('morn_meds_01');
    }, { message: "O hábito de medicação é estritamente pessoal e não pode ser compartilhado no feed comunitário." })
    ```
* `GET /api/v1/community/feed`:  
  Retorna a timeline recente de posts da comunidade com paginação por cursor.
* `POST /api/v1/community/posts/:id/try` (Ação Cega / Sem Grafo Social):  
  1. Incrementa atomicamente `saved_count = saved_count + 1` no post original;
  2. Insere o chip primário na tabela `recovery_core.my_tools` do usuário autenticado:
     `INSERT INTO my_tools (profile_id, chip_id) VALUES ($me, $chip) ON CONFLICT DO NOTHING;`
  3. Insere automaticamente o chip na rotina de hábitos do usuário (`recovery_core.habits`) caso ele ainda não o tenha;
  4. Enfileira um job cego no `pg-boss` para notificar o autor:  
     `{ job: "notify_post_author", post_id: post.id }`.  
     *(O job NÃO contém o ID do usuário que salvou, eliminando rastreabilidade de ponta a ponta).*
* `POST /api/v1/community/posts/:id/together`:  
  Incrementa atomicamente `support_count = support_count + 1` no post (reação anônima silenciosa).

---

## 6. Especificação da Interface Mobile (`apps/mobile`)

### 6.1. Aba "Minha Rotina" (O Checklist Diário de Vida Limpa)
- Exibe o checklist do dia com a saudação serena: *"Um passo de cada vez"*;
- Unifica na interface:
  - **Hábitos Oficiais:** Carregados da API (`recovery_core.habits`);
  - **Hábitos Personalizados:** Salvos e gerenciados **exclusivamente no storage local do celular**, com selo visual sutil `📱 Hábito Local (Privado)`;
- Check tátil suave com vibração leve ao marcar cada tarefa;
- O item de remédio (`morn_meds_01`) possui o selo: `🔒 Hábito Pessoal` e **não exibe** o botão de partilha;
- Os demais hábitos do catálogo possuem o botão: `Partilhar no Feed 🟢`.

### 6.2. O Painel Vivo (Feed Comunitário)
- Filtros rápidos em pílulas: `Todas`, `🟢 Faço`, `🔴 Evito`, `🔵 Me Ajuda`;
- Cards estruturados exibindo o pseudônimo do autor (ex: `@FarolLivre_836`), o badge da categoria e os 1 a 3 chips com seus respectivos ícones e rótulos;
- Botão funcional **`💡 Vou tentar isso`** (adiciona à rotina do leitor);
- Botão funcional **`🤝 Estamos juntos`** (apoio moral silencioso);
- Fim da timeline com encerramento sereno:  
  *"Você viu as partilhas de hoje. Que tal desligar o aplicativo e viver um momento no mundo real?"*

---

## 7. Matriz de Ameaças e Mitigações

| Vetor de Risco | Cenário de Ameaça | Mitigação Arquitetural Implementada |
| :--- | :--- | :--- |
| **Reconstrução de Grafo Social** | Perito ou invasor analisa o banco para descobrir quem segue ou copia quem. | **Destruição do Elo:** A tabela `my_tools` não guarda `source_post_id`. A notificação no `pg-boss` não carrega o ID de quem clicou. É matematicamente impossível reconstruir o grafo. |
| **Vazamento por Texto Livre em Hábitos** | Usuário digita nome de médico ou parente em tarefa pessoal e o banco vaza. | **Isolamento Local:** Hábitos personalizados nunca sobem para a API; residem exclusivamente no SQLite/AsyncStorage do aparelho. |
| **Vazamento de Pontos de Tráfico** | Usuário tenta divulgar endereço de venda no `EVITO`. | **Moderação por Construção:** Zero texto livre no `EVITO`. O usuário escolhe apenas chips pré-definidos do catálogo. |
| **Automedicação entre Pares** | Usuários comparam dosagens de remédios controlados no feed. | **Trava de Sistema:** O chip `morn_meds_01` tem flag `can_share: false` e a API rejeita com HTTP 400 tentativas de publicação. |
| **Competição e Ansiedade de Streaks** | Usuário se sente cobrado ou envergonhado por não cumprir todas as tarefas. | **Princípio Anti-Cobrança:** Sem contadores de sequências consecutivas, sem perda de pontos e sem rankings. |
| **Spam no Feed** | Usuário publica compulsivamente no feed. | **Rate Limit:** Máximo de 3 publicações comunitárias por usuário a cada 24 horas. |

---

## 8. Definição de Pronto da Sprint 4 (DoD Específico)

1. **Catálogo Estático Unificado:** Arquivo `apps/mobile/src/constants/chips.ts` implementado com 100% dos IDs, ícones e textos canônicos da Seção 3.
2. **Migrations Canônicas do Drizzle:** Tabelas `habits`, `habit_logs`, `triad_posts` e `my_tools` criadas e migradas sem Foreign Keys relacionais com `auth_security`.
3. **Trava de Medicamentos Auditada:** Teste automatizado com Vitest garantindo que o backend rejeite com HTTP 400 tentativas de publicação contendo `morn_meds_01`.
4. **Desacoplamento de Grafo Comprovado:** Teste garantindo que `my_tools` não armazene identificadores do autor original.
5. **Typecheck e Lint:** `pnpm typecheck` com 0 erros e `pnpm lint` com 0 avisos em todos os workspaces.