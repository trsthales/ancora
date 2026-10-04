# 🌄 Plano de Sprints de Engenharia — Projeto Jornada Firme

- **Metodologia:** Scrum / Kanban Adaptado com Auditoria Adversarial Contínua
- **Cadência:** 7 Sprints Regulares (com Sprint 4 subdividida em 4A e 4B) + 1 Sprint de Hardening (12 semanas / 3 meses)
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
| **Sprint 4A** | **Fase 2 (B):** Modo Pessoal — Minha Rotina, Meus Momentos e Ativação | 🚀 Próxima | Checklist de hábitos (teto 15), PUT idempotente, Meus Momentos, Dia Leve e storage cifrado. |
| **Sprint 4B** | **Fase 3 (A):** Modo Social — Feed Finito da Tríade, Ações Cegas e E-mail | ⏳ Planejada | Feed finito (20 posts), Estratégia da Semana, Ações Cegas sem grafo, Notificações em lote e E-mail AES-256. |
| **Sprint 5** | **Fase 3 (B) & 4 (A):** Reuniões de Texto, Presença Silenciosa e Moderação | ⏳ Planejada | Salas de texto agendadas (estilo NA), body doubling com threshold e moderação básica. |
| **Sprint 6** | **Fase 4 (B) & 5:** Trilha Família, Sustentabilidade e Piloto Alpha | ⏳ Planejada | Conteúdo Ponte para familiares, apoiador solidário e homologação do piloto (40 usuários). |

---

## 🏃 SPRINT 1: Fundação, Schemas Segregados e Migrations — [✅ CONCLUÍDA]

> **Especificação Canônica:** Veja o documento detalhado em [`specs/SPEC-SPRINT-01-FUNDACAO-E-INFRA.md`](specs/SPEC-SPRINT-01-FUNDACAO-E-INFRA.md).

- [x] **TASK-101: Estruturação do Monorepo e Configurações Base**
  - Monorepo pnpm com workspaces `@ancora/api`, `@ancora/mobile` e `@ancora/admin`.
  - Padronização com TypeScript strict, ESLint e Prettier.
- [x] **TASK-102: Setup do PostgreSQL e Drizzle ORM Multi-Schema**
  - Configuração do PostgreSQL 16 Alpine via Docker Compose.
  - Setup do Drizzle Kit com suporte a múltiplos schemas (`auth_security`, `recovery_core`).
- [x] **TASK-103: Implementação da Migration 0000 (Schema Inicial)**
  - Criação das tabelas iniciais e scripts `db:generate` e `db:migrate`.
- [x] **TASK-104: Configuração da Fila de Tarefas no Postgres (`pg-boss`)**
  - Schema isolado `pgboss` com ciclo de vida integrado ao Fastify e graceful shutdown.
- [x] **TASK-105: Logger Estruturado com Anonimização de Dados (Pino)**
  - Mascaramento automático (_redaction_) de campos sensíveis com `[Redacted]`.

---

## 🏃 SPRINT 2: Autenticação 18+, Pseudonimato e Onboarding — [✅ CONCLUÍDA]

> **Especificação Canônica:** Veja o documento detalhado em [`specs/SPEC-SPRINT-02-AUTENTICACAO-E-ONBOARDING.md`](specs/SPEC-SPRINT-02-AUTENTICACAO-E-ONBOARDING.md).

- [x] **TASK-201: Endpoint de Registro com Trava 18+ (`POST /api/v1/auth/register`)**
  - Validação Zod com exigência estrita de maioridade (18+).
  - Hashing de senha com Argon2id com pimenta de aplicação (`APP_PEPPER_V1`).
- [x] **TASK-202: Mecanismo de Autenticação JWT com Refresh Token**
  - Access Token (15m) e Refresh Token criptográfico com rotação em `auth_security.sessions`.
  - Middleware Fastify `app.authenticate` para proteção de rotas privadas.
- [x] **TASK-203: Catálogo de Avatares e Rotação de Pseudônimos**
  - Catálogo de 8 avatares neutros e endpoint `POST /profile/rotate-identity`.
- [x] **TASK-204: Telas de Autenticação e Onboarding no Mobile (Expo)**
  - Telas de Boas-Vindas, Cadastro com Trava Dupla, Revelação de Pseudônimo e Login.
  - Armazenamento de sessão seguro com `expo-secure-store` e fallback para web.

---

## 🏃 SPRINT 3: Semáforo SOS e Check-in com Alternativas — [✅ CONCLUÍDA]

> **Especificação Canônica:** Veja o documento detalhado em [`specs/SPEC-SPRINT-03-SEMAFORO-SOS-E-CHECKIN.md`](specs/SPEC-SPRINT-03-SEMAFORO-SOS-E-CHECKIN.md).

- [x] **TASK-301 & 302: Semáforo SOS em 3 Níveis (100% Offline)**
  - Botão flutuante SOS acessível globalmente.
  - 🟢 Nível 1: Respiração guiada 4-7-8 com animação fluida e Ancoragem sensorial 5-4-3-2-1.
  - 🟡 Nível 2: Discagem direta para o CVV 188 e link para chat oficial.
  - 🔴 Nível 3: Discagem direta para SAMU 192 e guia informativo dos CAPS AD.
- [x] **TASK-303: Backend da Jornada e Check-in Diário**
  - Endpoints `/journey/checkin`, `/today` e `/history` com cálculo de datas em fuso brasileiro (`America/Sao_Paulo`).
- [x] **TASK-304: Motor Mobile "Alternativas para este Momento" e Temas**
  - Interceptação automática na interface para fissura $\ge$ 4 com sugestões de alívio de 15 minutos.
  - Suporte nativo a Tema Claro (Off-white linho) e Tema Escuro (Slate/Teal) persistido em storage.

---

## 🏃 SPRINT 3.5: Debt Hardening, Zero-PII e Governança LGPD — [✅ CONCLUÍDA]

> **Especificação Canônica:** Veja o documento detalhado em [`specs/SPEC-SPRINT-03.5-DEBT-HARDENING-E-LGPD.md`](specs/SPEC-SPRINT-03.5-DEBT-HARDENING-E-LGPD.md).

- [x] **TASK-351 (Lote 1): Segurança de Vida & UI Resilience**
  - SOS promovido para a raiz de `App.tsx` (funcional para usuários deslogados).
  - Blindagem do `storage.ts` com `try/catch` defensivo para telas bloqueadas no iOS.
  - Avisos de segurança contra tontura no 4-7-8 e remoção de linguagem determinista.
  - Fim da exibição de e-mail na Home (_shoulder surfing_).
- [x] **TASK-352 (Lote 2A): Desacoplamento Criptográfico no Banco**
  - Remoção física da Foreign Key direta `user_id` em `recovery_core.profiles`.
  - Vínculo efêmero via `account_token` derivado por HMAC-SHA256 com pepper versionado (`APP_PEPPER_V1`).
  - Truncamento do timestamp de perfis contra ataques de correlação temporal.
- [x] **TASK-353 (Lote 2B): Autenticação Zero-PII & Chave Mestra Crockford**
  - Remoção definitiva da coluna de e-mail do banco de credenciais.
  - Chave Mestra Crockford Base32 (`FIRME-XXXXX-...`) emitida no cadastro com tela de retenção obrigatória no mobile.
  - Login seguro via Pseudônimo com Double-Blind HMAC (`login_token`) e rota `/auth/recover`.
- [x] **TASK-354 (Lote 3): Concorrência, Anti-DoS e Resiliência**
  - Rate Limiting de Dois Baldes: 100 req/min por IP (seguro para clínicas/NAT) + trava de 5 falhas no pseudônimo.
  - Startup `DUMMY_HASH` no Argon2id contra DoS de CPU/RAM.
  - RTR com Grace Period idempotente de 10s contra retries 4G e mutex no client mobile (`api.ts`).
  - Expansão do namespace para mais de 7,4 milhões de slots e quarentena de 30 dias na rotação de identidade.
- [x] **TASK-355 (Lote 4): Governança LGPD e Expurgo**
  - Tabela `consents` gravando consentimento do Art. 11 da LGPD no cadastro com termos v2026.1 fixados pelo servidor.
  - Endpoint transacional `DELETE /api/v1/account` com expurgo completo em ambos os schemas (Art. 18, VI da LGPD).
  - Sanitização de `x-request-id` contra Log Poisoning e remoção de rotas de debug.
- [x] **TASK-356 (P0): Saneamento Estrutural e Testes de Invariantes**
  - Padronização definitiva da marca **Jornada Firme** e chave `FIRME-`.
  - Regra `no-explicit-any` como erro no ESLint e remoção de `no-useless-catch`.
  - Suíte formal de testes com **Vitest** (Crockford, HMAC e rate-limiting).
  - Confirmação mandante da chave mestra com persistência em `pendingKeyReveal`.

---

## 🏃 SPRINT 4A: Modo Pessoal — Minha Rotina, Meus Momentos e Ativação — [🚀 PRÓXIMA]

> **Especificação Canônica:** Veja o documento detalhado em [`specs/SPEC-SPRINT-04-PLANO-MESTRE-CONSOLIDADO.md`](specs/SPEC-SPRINT-04-PLANO-MESTRE-CONSOLIDADO.md) (Seção 3).  
> **Diretriz Central:** Modo Single-Player / 100% Privado. Pronto para uso imediato sem risco de moderação comunitária.

### Tarefas da Sprint 4A:

- [ ] **TASK-401: Backend da Rotina de Hábitos Pessoais (`apps/api`)**
  - Migration Drizzle 0008 criando `recovery_core.habits` e `recovery_core.habit_logs`.
  - Catálogo canônico autoritativo de 30 chips saudáveis em `apps/api/src/constants/chips.ts` com validação estrita via `z.enum`.
  - **Eliminação Definitiva de Medicamentos (Anti-SaMD):** Zero chips farmacológicos no catálogo oficial.
  - Endpoints: `GET /journey/habits?dateKey=YYYY-MM-DD`, `POST /journey/habits` (teto rígido de 15 hábitos) e `DELETE /journey/habits/:id`.
  - **Idempotência Real via PUT:** Endpoint `PUT /journey/habits/:id/logs/:dateKey` recebendo `{ completed: boolean }` ($f(f(x)) = f(x)$), eliminando o falso toggle flip-flop.
  - **Truncamento de Timestamp:** `completed_at` truncado para a hora cheia (`date_trunc('hour', now())`), aniquilando correlação temporal em dumps.
  - **Janela de Tolerância Continental:** Validação de `dateKey` em $\pm 1$ dia relativo ao servidor, acolhendo os 4 fusos do Brasil sem coletar GPS ou fuso do usuário (Zero-PII).
- [ ] **TASK-402: Interface Mobile "Minha Rotina" e Recursos Pessoais (`apps/mobile`)**
  - Checklist diário sereno com check tátil suave e cabeçalho *"Um passo de cada vez"*.
  - **Módulo de Tarefas Locais Privadas (Zero-PII):** Tarefas livres de texto pessoal (máx 5 a 10 tarefas, títulos max 60 chars) salvas em `encryptedStorage` com cifra AES-256-GCM via chave de hardware no `SecureStore` (`THIS_DEVICE_ONLY`).
  - **Proteção contra Backup em Nuvem:** Desativação de backup automático no `app.json` (`android:allowBackup="false"`), impedindo que dados de saúde vazem para Google Drive ou iCloud.
  - **Modo "Dia Leve":** Botão manual *"Hoje está pesado"* e ativação automática em check-in com fissura $\ge 4$, colapsando a rotina para 1 a 2 itens básicos sob *"Hoje basta isso"* (sem pendências vermelhas).
  - **Primeiro Uso Guiado:** Onboarding da rotina com a pergunta *"Quando costuma ser mais difícil para você?"*, filtrando 1 a 3 sugestões iniciais contextualizadas.
  - **Funcionalidade "Meus Momentos":** Agendamento 100% local no celular (máx 3 horários na semana via `expo-notifications`), disparo neutro *"Seu momento do dia chegou. Quer olhar sua lista?"*, bottom sheet com 1 a 3 ações e botão *"Agora não"*. Zero dados enviados à API.
  - **Revisão Semanal Aditiva:** Resumo semanal privado com linguagem puramente aditiva (*"Esta semana você caminhou em 3 dias"*), banindo a linguagem de déficit (*"3 de 7"*), porcentagens e barras.
  - **Aviso Clínico de Isenção:** Disclaimer no rodapé esclarecendo que o app não gerencia remédios nem substitui orientação médica.
- [ ] **TASK-401-T: Suíte Vitest de Invariantes da 4A (`apps/api`)**
  - Teste de idempotência real via `PUT ... logs/:dateKey` (chamadas repetidas mantêm o mesmo estado exato sem duplicar linhas).
  - Teste de barreira máxima de 15 hábitos ativos (16ª tentativa rejeitada com HTTP 400).
  - Teste de rejeição de texto livre ou chips inválidos via `z.enum`.
  - Teste de asserção estrutural de ausência de streaks (`currentStreak`, `streakBroken` ausentes no JSON retornado pela API).

---

## 🏃 SPRINT 4B: Modo Comunitário — Feed da Tríade, Ações Cegas e E-mail — [⏳ PLANEJADA]

> **Especificação Canônica:** Veja o documento detalhado em [`specs/SPEC-SPRINT-04-PLANO-MESTRE-CONSOLIDADO.md`](specs/SPEC-SPRINT-04-PLANO-MESTRE-CONSOLIDADO.md) (Seção 4).  
> **Diretriz Central:** Modo Multiplayer / Mútua Ajuda Assíncrona. Sobe após validação da rotina pessoal.

### Tarefas da Sprint 4B:

- [ ] **TASK-403: Backend do Feed Finito da Tríade (`apps/api`)**
  - Migration Drizzle 0009 criando `triad_posts`, `daily_post_limits`, `my_tools`, `post_supports`, `daily_metrics` e `user_recovery_emails`.
  - Catálogo canônico de chips `EVITO` e `ME AJUDA` na API com validação estrita por categoria.
  - **Feed Finito (LIMIT 20):** Retorno de no máximo 20 posts mais recentes com diversidade de vozes garantida via Window Function (`ROW_NUMBER() OVER (PARTITION BY profile_id ...)` garantindo `author_post_rank <= 1`).
  - **Período de Escuta de 24h:** Contas com menos de 24 horas navegam em modo acolhimento (usam rotina e SOS, mas não publicam no feed).
  - **Controle Atômico de Cota:** Trava de no máximo 3 posts/dia calculada no relógio do servidor via `daily_post_limits` com CTE atômica anti-race condition.
  - Suporte ao campo `isAnonymous: boolean` no post (removendo pseudônimo no retorno para proteger quem expõe gatilhos do `EVITO`).
- [ ] **TASK-404: Ações Cegas, 3 Destinos e Reações Silenciosas (`apps/api`)**
  - **Ação "Vou Tentar Isso" com 3 Destinos:**
    - `🟢 FAÇO` $\rightarrow$ Entra na Minha Rotina (se $< 15$ hábitos; se cheio, salva em `my_tools` com mensagem suave).
    - `🔴 EVITO` $\rightarrow$ Entra no Meu Plano de Proteção (mural sem caixas de marcar).
    - `🔵 ME AJUDA` $\rightarrow$ Entra em Minhas Ferramentas (primeiros socorros rápidos).
  - **CTE Atômica no `saved_count`:** Incrementa o contador do post exclusivamente se uma nova linha foi inserida em `my_tools` (imune a cliques repetidos).
  - **Desacoplamento Permanente:** A ferramenta salva em `my_tools` permanece válida mesmo se o post original for deletado ou moderado.
  - **Reação "Estamos Juntos":** Deduplicada via `reaction_token = HMAC-SHA256(profile_id || post_id, PEPPER)` na tabela `post_supports` (1 apoio por usuário por post, sem reconstrução de grafo social).
  - **Notificações em Lote no `pg-boss`:** Jobs assíncronos que acumulam apoios e inspirações para exibição em lote uma vez por dia na Home quando $\ge 3$ pessoas, sem disparar push notifications em tempo real.
- [ ] **TASK-405: Interface Mobile do Feed Finito e Loop no SOS (`apps/mobile`)**
  - Linha do tempo finita de 20 posts com pílulas de filtro (Todas, FAÇO, EVITO, ME AJUDA).
  - **Card Fixo no Topo:** *"Estratégia da Semana"* (conteúdo curado garantindo valor no cold-start).
  - **Card de Encerramento Sereno:** *"Você viu tudo por hoje. Que tal desligar o aplicativo e viver um momento no mundo real?"* (Apoio > Retenção).
  - **Zero Badges de Não Lidos:** Proibida qualquer bolinha vermelha ou contador de posts não vistos.
  - Botão *"Partilhar no Feed 🟢"* ativado na Minha Rotina.
  - Seletor no modal de publicação: `[ ] Partilhar de forma anônima (sem pseudônimo)`.
  - **Fechamento do Loop no SOS:** Em fissura $\ge 4$, o `AlternativesModal` exibe no topo *"O que você guardou"*, com 2 a 3 botões grandes de disparo direto (4-7-8, ancoragem ou discador em 1 toque).
  - Card diário de acolhimento na Home exibindo apoio coletivo em lote: *"Suas partilhas inspiraram algumas pessoas"* e *"Algumas pessoas estão com você hoje"*.
- [ ] **TASK-406: Vinculação Opcional de E-mail de Recuperação (RFC-003)**
  - Criptografia em repouso AES-256-GCM com AAD (`userId`) e Blind Index HMAC `email_lookup_hash` em `auth_security.user_recovery_emails`.
  - Endpoints `/auth/email/bind`, `/verify` (código OTP de 6 dígitos) e `DELETE /email` (desvinculação instantânea com 1 toque).
  - Endpoint público `/auth/recover-by-email` com tempo de resposta equiparado (~250ms) anti-enumeração de contas.
  - Tela de configurações no mobile com dicas de privacidade (Apple Hide My Email / Proton) e cumprimento estrito do Teste da Notificação nos e-mails disparados.
- [ ] **TASK-403-T: Suíte Vitest de Invariantes do Feed (`apps/api`)**
  - Teste de concorrência atômica no teto de 3 posts/dia sob disparos paralelos via CTE.
  - Teste de isolamento de `my_tools` comprovando ausência de `author_id` ou `source_post_id`.
  - Teste de deduplicação cega de apoios em `post_supports`.
  - Teste do "Teste da Notificação" via varredura regex em todos os templates de e-mail e mensagens do sistema contra termos estigmatizantes (`/droga|v[ií]cio|reca[ií]da|fissura|overdose/i`).

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
3. **Idempotência Real e Semântica de Estado:** Operações de check/uncheck de hábitos utilizam semântica declarativa `PUT` com `{ completed: boolean }`.
4. **Proteção de Dados em Repouso Local:** Tarefas privadas locais criptografadas com AES-256-GCM no aparelho e `allowBackup="false"` ativo no Android/iOS.
5. **Teste da Notificação:** Nenhuma notificação push, e-mail ou mensagem transacional pode conter palavras estigmatizantes ("droga", "vício", "recaída", "fissura", "overdose").
6. **Anti-Dopamina e Design Ético:** Ausência de *streaks*, zero contadores de posts não lidos, feed rigorosamente finito em 20 posts e notificações de inspiração entregues em lote dentro do app.
7. **Resiliência e Tolerância de Rede:** Falhas transitórias de conexão não devem provocar logout do usuário, e requisições de hábitos aceitam janela de tolerância de $\pm 1$ dia para cobrir os fusos do Brasil.
8. **Auditoria de Fechamento de Sprint:** Toda sprint deve encerrar com suíte completa de testes do Vitest passando com 100% de sucesso antes do merge definitivo na `main`.