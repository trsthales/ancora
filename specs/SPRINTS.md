# 🌄 Plano de Sprints de Engenharia — Projeto Jornada Firme

- **Metodologia:** Scrum / Kanban Adaptado com Auditoria Adversarial Contínua
- **Cadência:** 8 Sprints Regulares (Sprint 4 dividida em 4A, 4B-1 e 4B-2) + 1 Sprint de Hardening (12 semanas / 3 meses)
- **Stack Oficial:** Node.js 22 LTS (TypeScript strict) + Fastify 5.2 + PostgreSQL 16 Alpine + Drizzle ORM 0.45 + React Native 0.86 (Expo 57) + pg-boss 12.35 + Vitest 5.0
- **Diretriz Central:** Simplicidade, dignidade e respeito clínico (Zero Redis no MVP, Zero-PII por padrão, estrita conformidade com a RFC 002 v3.1, RFC 003 e RFC 004.1 — O NA Virtual).

---

## Visão Geral do Cronograma

| Sprint | Foco Temático | Status | Entregável Principal |
| :---: | :--- | :---: | :--- |
| **Sprint 1** | **Fase 0:** Setup de Monorepo, Migrations e Segregação LGPD | ✅ Concluída | Monorepo pnpm, Docker Postgres multi-schema, pg-boss e Pino logger. |
| **Sprint 2** | **Fase 1 (A):** Autenticação 18+, Pseudonimato e Onboarding | ✅ Concluída | Cadastro 18+, JWT com RTR e telas de onboarding mobile. |
| **Sprint 3** | **Fase 1 (B) & 2 (A):** Semáforo SOS e Check-in com Alternativas | ✅ Concluída | SOS offline-first, check-in diário com interceptação e temas Claro/Escuro. |
| **Sprint 3.5** | **Debt Hardening:** Segurança, Zero-PII & Governança LGPD | ✅ Concluída | HMAC real, Chave Crockford `FIRME-`, Rate Limit Dual-Bucket e expurgo Art. 18, VI. |
| **Sprint 4A** | **Fase 2 (B):** Modo Pessoal — Minha Rotina, Meus Momentos e Ativação | ✅ Concluída | Checklist de hábitos (teto 15), PUT idempotente, Meus Momentos, Dia Leve e storage cifrado. |
| **Sprint 4B-1**| **Fase 3 (A1):** Modo Social — Feed Finito da Tríade e Ações Cegas | 🚀 Próxima | Feed finito (20 posts, diversidade SQL, sem contadores), Ações Cegas sem grafo, Plano de Proteção e DELETE LGPD. |
| **Sprint 4B-2**| **Fase 3 (A2):** Confiança Progressiva — E-mail Opcional AES-256 | ⏳ Planejada | E-mail cifrado com AES-GCM (AAD userId), Blind Index, OTP, reautenticação e Dual-Bucket anti-bombing. |
| **Sprint 5** | **Fase 3 (B) & 4 (A):** Reuniões de Texto, Presença Silenciosa e Moderação | ⏳ Planejada | Salas de texto agendadas (estilo NA), body doubling com threshold e moderação básica. |
| **Sprint 6** | **Fase 4 (B) & 5:** Trilha Família, Sustentabilidade e Piloto Alpha | ⏳ Planejada | Conteúdo Ponte para familiares, apoiador solidário e homologação do piloto (40 usuários). |

---

## 🏃 SPRINT 1 a 3.5: Fundação e Hardening — [✅ CONCLUÍDAS]

> **Especificações Canônicas:** 
> - Sprint 1: [`specs/SPEC-SPRINT-01-FUNDACAO-E-INFRA.md`](specs/SPEC-SPRINT-01-FUNDACAO-E-INFRA.md)
> - Sprint 2: [`specs/SPEC-SPRINT-02-AUTENTICACAO-E-ONBOARDING.md`](specs/SPEC-SPRINT-02-AUTENTICACAO-E-ONBOARDING.md)
> - Sprint 3: [`specs/SPEC-SPRINT-03-SEMAFORO-SOS-E-CHECKIN.md`](specs/SPEC-SPRINT-03-SEMAFORO-SOS-E-CHECKIN.md)
> - Sprint 3.5: [`specs/SPEC-SPRINT-03.5-DEBT-HARDENING-E-LGPD.md`](specs/SPEC-SPRINT-03.5-DEBT-HARDENING-E-LGPD.md)

---

## 🏃 SPRINT 4A: Modo Pessoal — Minha Rotina, Meus Momentos e Ativação — [✅ CONCLUÍDA E AUDITADA]

> **Status:** 100% Concluída, Auditada e Homologada (36 testes no Vitest, 0 erros no typecheck).  
> **Patches de Remediação:** Patches 1, 2 e 3 integrados (lockout de recuperação eliminado, índice único de chave, REDACTED_PATHS expandido, anti-DoS Argon2id, SQL temporal canônico `(now() AT TIME ZONE 'America/Sao_Paulo')::date` e Dia Leve persistido).

- [x] **TASK-401: Backend da Rotina de Hábitos Pessoais (`apps/api`)**
  - Migration Drizzle 0008 criando `recovery_core.habits` e `recovery_core.habit_logs`.
  - Catálogo autoritativo de 30 chips saudáveis em `apps/api/src/constants/chips.ts` com validação estrita `z.enum(FACO_CHIP_IDS)`.
  - Eliminação de medicamentos do catálogo oficial (Anti-SaMD).
  - Endpoints: `GET /journey/habits?dateKey=YYYY-MM-DD`, `POST /journey/habits` (teto 15 hábitos), `PUT /journey/habits/:id/logs/:dateKey` (idempotente) e `DELETE /journey/habits/:id`.
  - Truncamento de `completed_at` para a hora e tolerância de $\pm 1$ dia no `dateKey` sem coleta de GPS.
- [x] **TASK-402: Interface Mobile "Minha Rotina" e Recursos Pessoais (`apps/mobile`)**
  - Checklist diário sereno com check tátil suave e cabeçalho *"Um passo de cada vez"*.
  - Tarefas Locais Privadas (máx 10 itens, títulos max 60 chars) salvas em `encryptedStorage` com AES-256-GCM (`THIS_DEVICE_ONLY`).
  - Proteção anti-backup no `app.json` (`android:allowBackup="false"`).
  - Modo "Dia Leve": botão manual *"Hoje está pesado"* e gatilho em fissura $\ge 4$, persistido no storage local por `dateKey`.
  - Primeiro Uso Guiado com botão `(X)` e filtro por horário mais difícil.
  - "Meus Momentos": agendamento 100% local no celular via `expo-notifications` (máx 3 horários na semana).
  - Revisão Semanal Aditiva em palavras (*"caminhou em 3 dias"*, sem métricas de déficit).
  - Disclaimer de isenção médica no rodapé da rotina.
- [x] **TASK-401-T: Suíte Vitest de Invariantes da 4A (`apps/api`)**
  - Idempotência real via PUT comprovada sem duplicatas de linhas.
  - Barreira máxima de 15 hábitos ativos testada com HTTP 400.
  - Rejeição estrita de remédios e texto livre via `z.enum`.
  - Asserção estrutural de ausência de streaks (`currentStreak`, `streakBroken` ausentes no JSON da API).

---

## 🏃 SPRINT 4B-1: Modo Comunitário — Feed da Tríade e Ações Cegas — [🚀 PRÓXIMA]

> **Especificação Canônica:** Veja o documento detalhado em [`specs/SPEC-SPRINT-04-PLANO-MESTRE-CONSOLIDADO.md`](specs/SPEC-SPRINT-04-PLANO-MESTRE-CONSOLIDADO.md) (Seção 4).  
> **Diretriz Central:** Modo Multiplayer / Mútua Ajuda Assíncrona. 100% no schema `recovery_core` (Zero-PII absoluto).

### Tarefas da Sprint 4B-1:

- [ ] **TASK-403: Backend do Feed Finito da Tríade (`apps/api`)**
  - Migration Drizzle 0010 criando no schema `recovery_core`: `triad_posts`, `daily_post_limits`, `my_tools`, `post_saves`, `post_supports`, `profile_notification_counters` e `daily_metrics`.
  - Adição de `reaction_salt` na tabela `profiles` para garantia de desassociação criptográfica irrevogável (sem tabela de grafo `profile_reactions`).
  - Adição de `is_hidden: boolean DEFAULT false` em `triad_posts` como kill-switch administrativo.
  - Catálogo canônico de chips `EVITO` e `ME AJUDA` na API com validação estrita por categoria.
  - **Feed Finito (LIMIT 20) com Reordenação Cronológica:** Query via Window Function com candidatos diversos ordenados internamente por `author_rank ASC, created_at DESC LIMIT 20` e reordenados externamente por `created_at DESC`.
  - **Supressão de Métricas Públicas:** Remoção de `saved_count` e `support_count` do payload do feed (Horizontalidade Radical sem vaidade).
  - **Truncamento de Timestamp no Feed:** `created_at` retornado truncado para a hora cheia contra correlação com posts anônimos.
  - **Direito ao Esquecimento de Postagens (LGPD Art. 18):** Endpoint autenticado `DELETE /api/v1/community/posts/:id` com verificação estrita de autoria.
  - **Período de Escuta de 24h Reais:** Bloqueio de postagem se `profiles.created_at >= (now() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '1 day'`.
  - **Controle Atômico de Cota:** Trava de 3 posts/dia calculada no relógio SP com CTE atômica em `daily_post_limits`.
  - **Suporte a Postagens Anônimas:** Campo `isAnonymous: boolean` no post (padrão `true` para `EVITO`); a API suprime o pseudônimo na resposta JSON.
  - **Idempotência de Publicação:** Suporte a `Idempotency-Key: <uuid>` em memória com TTL de 2 minutos.
- [ ] **TASK-404: Ações Cegas, 3 Destinos e Caixa de Ferramentas (`apps/api`)**
  - **Ação "Vou Tentar Isso" com 3 Destinos Funcionais:**
    - `🟢 FAÇO` $\rightarrow$ Rotina Pessoal (se $< 15$ hábitos; se cheio, salva em `my_tools` com mensagem suave);
    - `🔴 EVITO` $\rightarrow$ Meu Plano de Proteção (mural de limites conscientes sem caixas de marcar);
    - `🔵 ME AJUDA` $\rightarrow$ Minhas Ferramentas (recursos sob demanda para momentos difíceis).
  - **Separação Criptográfica de Domínio:**
    - `save_token = HMAC("save:" || post_id, profile.reaction_salt)`
    - `reaction_token = HMAC("support:" || post_id, profile.reaction_salt)`
    - Segredo independente `COMMUNITY_PEPPER_V1` no `env.ts`.
  - **Deduplicação de Adoção:** Tabela `post_saves` com `(post_id, save_token)`. Se o usuário readotar um chip já salvo, atualiza `my_tools` sem re-incrementar `saved_count` no post.
  - **Desacoplamento Permanente:** A ferramenta em `my_tools` sobrevive mesmo se o post original for deletado pelo autor.
  - **Remoção de Ferramentas:** Endpoint `DELETE /api/v1/journey/tools/:chipId`.
  - **Endpoint de Leitura de Ferramentas:** `GET /api/v1/journey/tools` retornando ferramentas ativas agrupadas por categoria.
  - **Reação Silenciosa "Estamos Juntos":** Deduplicada via `reaction_token` em `post_supports`. Proibição de auto-apoio (`post.profileId !== me`).
  - **Notificações em Lote no `pg-boss`:** Acúmulo contínuo em `profile_notification_counters` até atingir threshold $\ge 3$. Ao exibir na Home, o contador é **zerado atomicamente**, eliminando vazamento do 4º evento.
- [ ] **TASK-405: Interface Mobile do Feed Finito e UI de Proteção (`apps/mobile`)**
  - Linha do tempo finita de 20 posts com pílulas de filtro (`Todas`, `FAÇO`, `EVITO`, `ME AJUDA`).
  - **Estratégia da Semana:** Card fixo curado pela equipe no topo da timeline.
  - **Encerramento Sereno:** Card final estático *"Você viu tudo por hoje"*, sem scroll infinito e sem contadores de não lidos.
  - **Resiliência Offline:** Cache local dos últimos 20 posts em `encryptedStorage` (`@ancora_feed_cache`). Limpeza de cache no logout. Ao reconectar, substituição total do cache (não mescla posts deletados por LGPD).
  - **Seletor de Anonimato:** Opção `[ ] Partilhar de forma anônima` no modal (marcada por padrão no `EVITO`).
  - **OpSec na Home:** "Meu Plano de Proteção" recolhido dentro da Minha Rotina (não exposto na Home).
  - **Fechamento do Loop no SOS:** Em fissura $\ge 4$, o `AlternativesModal` exibe prioritariamente no topo *"O que você guardou"*, lendo da cópia local em `encryptedStorage`.
  - **Card de Notificação em Lote na Home:** Card qualitativo com frases silenciosas (*"Suas partilhas inspiraram algumas pessoas"* e *"Algumas pessoas estão com você hoje"*).
- [ ] **TASK-403-T: Suíte Vitest de Invariantes do Feed (`apps/api`)**
  - Teste comprovando que `isAnonymous: true` suprime o pseudônimo e avatar na resposta JSON da API.
  - Teste do Período de Escuta de 24h Reais (bloqueio no mesmo dia civil; liberação após 1 dia civil completo).
  - Teste do Fallback de Diversidade com reordenação cronológica externa.
  - Teste de ausência de contadores de popularidade e contadores de não lidos no JSON do feed.
  - Teste de concorrência atômica no teto de 3 posts/dia e `Idempotency-Key`.
  - Teste de isolamento de grafo em `my_tools` e `post_saves`.
  - Teste de autorização: usuário não consegue executar `DELETE` no post de outro autor.
  - Teste do "Teste da Notificação" com regex restrito a templates externos.

---

## 🏃 SPRINT 4B-2: Confiança Progressiva — E-mail Opcional AES-256 — [⏳ PLANEJADA]

> **Especificação Canônica:** Veja o documento detalhado em [`specs/RFC-003-EMAIL-OPCIONAL.md`](specs/RFC-003-EMAIL-OPCIONAL.md).  
> **Diretriz Central:** Criptografia em Repouso, Blind Index e Anti-Email Bombing. 100% no schema `auth_security`.

### Tarefas da Sprint 4B-2:

- [ ] **TASK-406: E-mail de Recuperação com Criptografia em Repouso (`apps/api` e `apps/mobile`)**
  - Migration Drizzle 0011 criando `auth_security.user_recovery_emails`.
  - Cifra AES-256-GCM com chave versionada `ENCRYPTION_KEY_V1` e AAD (`userId`).
  - Blind Index HMAC `email_lookup_hash` derivado com `EMAIL_PEPPER_V1` (separado do pepper de auth).
  - **Índice Único Parcial:** `UNIQUE INDEX idx_user_recovery_emails_verified ... WHERE is_verified = true` (linhas não verificadas não bloqueiam a vítima).
  - **Reautenticação Obrigatória:** Endpoint `/auth/email/bind` exige `{ email: string, currentPassword: string }` para impedir sequestro de sessão desbloqueada.
  - **Dual-Bucket Anti-Bombing (Respeitando CGNAT):**
    - Balde por Usuário no `/bind`: máximo de 3 tentativas por hora por `userId` (não penaliza IPs em CGNAT);
    - Balde por Destinatário no `/recover-by-email`: máximo de 3 envios por `email_lookup_hash` a cada 24 horas.
  - **Fila Zero-PII no `pg-boss`:** O payload do job carrega **apenas o UUID do registro** (`{ email_record_id: uuid }`). Zero e-mails em texto claro na tabela `pgboss.job`.
  - Endpoint `/recover-by-email`: resposta imediata com trabalho constante anti-enumeração.
  - Desvinculação com exclusão física no `DELETE /api/v1/auth/email`.
  - Revogação de sessões e emissão de nova Chave Mestra após recuperação bem-sucedida por e-mail.
- [ ] **TASK-406-T: Suíte Vitest de Invariantes do E-mail Cifrado (`apps/api`)**
  - Teste de anti-enumeração em `/recover-by-email`.
  - Teste de índice parcial (e-mail não verificado abandonado não impede nova vinculação legítima).
  - Teste de exigência de senha correta no `/bind`.
  - Teste de expiração de OTP (15 min) e bloqueio na 6ª tentativa errada.
  - Teste do Dual-Bucket contra Email Bombing.
  - Teste de garantia de payload sem PII na fila do `pg-boss`.
  - Teste de desvinculação com deleção física em `user_recovery_emails`.

---

## 🏃 SPRINT 5: Reuniões de Texto, Presença Silenciosa e Moderação — [⏳ PLANEJADA]

- [ ] **TASK-501: Presença Silenciosa (Body Doubling) via Postgres**
  - Indicador no topo do app mostrando usuários ativos cuidando de sua rotina (`last_seen_at`), com regra de threshold ($\ge 15$).
- [ ] **TASK-502: Interceptação Ativa de Conteúdo Nocivo**
  - Bloqueio pré-publicação de termos de autolesão com redirecionamento automático para apoio do CVV 188.
- [ ] **TASK-503: Painel Web de Moderação (React + Vite + Tailwind)**
  - Interface simples para aprovação de relatos em quarentena e gestão de denúncias em 1 toque.
- [ ] **TASK-504: Salas de Apoio Agendadas em Texto (Reuniões de NA Virtuais)**
  - Gateway WebSocket no Fastify com salas temporárias com hora marcada (ex: *Roda da Noite — 20h às 21h*).
  - Dinâmica com limite de 20 conexões simultâneas e mensagens efêmeras descartadas ao término da reunião.

---

## 🏃 SPRINT 6: Trilha Família, Sustentabilidade e Piloto Alpha — [⏳ PLANEJADA]

- [ ] **TASK-601: Trilha Ponto de Apoio e Conteúdo Ponte**
  - Área dedicada para familiares com cartões informativos sobre limites saudáveis, comunicação não-violenta e autocuidado.
- [ ] **TASK-602: Sustentabilidade Ética (Apoiador Solidário e Assinatura Familiar)**
  - Integração de checkout para contribuição voluntária e planos de familiares, subsidiando o acesso universal e gratuito para o Navegador.
- [ ] **TASK-603: Homologação e Auditoria Pré-Piloto**
  - Checklist final de usabilidade, métricas agregadas (`daily_metrics`) e privacidade.
- [ ] **TASK-604: Execução do Piloto Alpha Controlado (40 Voluntários)**
  - Monitoramento de 30 dias com coorte fechada de 25 pessoas em recuperação e 15 familiares utilizando instrumentação agregada sem rastreamento de PII.

---

## 🛡️ Definição de Pronto Consolidada (Definition of Done - DoD)

1. **Tipagem Estrita e Zero Any:** Código 100% tipado em TypeScript, com flag `no-explicit-any` como erro e zero uso de `any`.
2. **Segregação Criptográfica LGPD:** Nenhuma query relacional direta (`JOIN` ou `FK`) entre `auth_security` e `recovery_core`.
3. **Idempotência Real e Semântica de Estado:** Operações de conclusão de hábitos utilizam semântica declarativa `PUT` com `{ completed: boolean }`.
4. **Proteção de Dados em Repouso Local:** Tarefas privadas locais criptografadas com AES-256-GCM no aparelho e `allowBackup="false"` ativo no Android/iOS.
5. **Teste da Notificação:** Nenhuma notificação externa (push, e-mail ou cards da Home) pode conter palavras estigmatizantes ("droga", "vício", "recaída", "fissura", "overdose").
6. **Anti-Dopamina e Design Ético:** Ausência de *streaks*, zero contadores públicos de curtidas no feed, feed rigorosamente finito em 20 posts e notificações em lote internas por padrão acumuladas até $\ge 3$.
7. **Resiliência e Tolerância de Rede:** Falhas transitórias de conexão não provocam logout, cache offline do feed ativo e requisições de hábitos aceitam janela de tolerância de $\pm 1$ dia para cobrir os fusos do Brasil.
8. **Auditoria de Fechamento de Sprint:** Toda sprint encerra com suíte completa de testes do Vitest passando com 100% de sucesso antes do merge definitivo na `main`.