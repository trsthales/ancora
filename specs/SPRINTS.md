# ⚓ Plano de Sprints de Engenharia — Projeto Âncora

- **Metodologia:** Scrum / Kanban Adaptado com Auditoria Adversarial Contínua
- **Cadência:** 6 Sprints Regulares + 1 Sprint de Hardening (12 semanas / 3 meses)
- **Stack Oficial:** Node.js (TypeScript) + Fastify + PostgreSQL 16+ + Drizzle ORM + React Native (Expo)
- **Diretriz Central:** Simplicidade de infraestrutura (Zero Redis no MVP, Zero-PII por padrão, estrita conformidade com a RFC 002 v3.0).

---

## Visão Geral do Cronograma

|     Sprint     | Foco Temático                                                    |    Status    | Entregável Principal                                                                |
| :------------: | :--------------------------------------------------------------- | :----------: | :---------------------------------------------------------------------------------- |
|  **Sprint 1**  | **Fase 0:** Setup de Monorepo, Migrations e Segregação LGPD      | ✅ Concluída | Monorepo pnpm, Docker Postgres multi-schema, pg-boss e Pino logger.                 |
|  **Sprint 2**  | **Fase 1 (A):** Autenticação 18+, Pseudonimato e Onboarding      | ✅ Concluída | Cadastro com trava 18+, JWT com RTR e telas de onboarding mobile.                   |
|  **Sprint 3**  | **Fase 1 (B) & 2 (A):** Semáforo SOS e Check-in com Alternativas | ✅ Concluída | SOS offline-first, check-in diário com interceptação e temas Claro/Escuro.          |
| **Sprint 3.5** | **Debt Hardening:** Segurança, Zero-PII & Governança LGPD        | ✅ Concluída | HMAC real, Chave Crockford, Rate Limit Dual-Bucket e expurgo Art. 18, VI.           |
|  **Sprint 4**  | **Fase 2 (B) & 3 (A):** Hábitos, Plano Pré-Crise e Feed Tríade   |  🚀 Próxima  | Cripto AES-256 do plano pré-crise, micro-hábitos e Feed da Tríade.                  |
|  **Sprint 5**  | **Fase 3 (B) & 4 (A):** Moderação, Presença Silenciosa e Rodas   | ⏳ Planejada | Painel admin web, body doubling com threshold e salas de texto temporárias.         |
|  **Sprint 6**  | **Fase 4 (B) & 5:** Trilha Família, Pagamentos e Piloto Alpha    | ⏳ Planejada | Assinatura de familiares, apoiador solidário e homologação do piloto (40 usuários). |

---

## 🏃 SPRINT 1: Fundação, Schemas Segregados e Migrations — [✅ CONCLUÍDA]

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

- [x] **TASK-201: Endpoint de Registro com Trava 18+ (`POST /api/v1/auth/register`)**
  - Validação Zod com exigência estrita de maioridade (18+).
  - Hashing de senha com Argon2id.
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
  - Chave Mestra Crockford Base32 (`ANCORA-XXXXX-...`) emitida no cadastro com tela de retenção obrigatória no mobile.
  - Login seguro via Pseudônimo com Double-Blind HMAC (`login_token`) e rota `/auth/recover`.
- [x] **TASK-354 (Lote 3): Concorrência, Anti-DoS e Resiliência**
  - Rate Limiting de Dois Baldes: 100 req/min por IP (seguro para clínicas/NAT) + trava de 5 falhas no pseudônimo.
  - Startup `DUMMY_HASH` no Argon2id contra DoS de CPU/RAM.
  - RTR com Grace Period idempotente de 10s contra retries 4G e mutex no client mobile (`api.ts`).
  - Expansão do namespace para mais de 7,4 milhões de slots e quarentena de 30 dias na rotação de identidade.
- [x] **TASK-355 (Lote 4): Governança LGPD e Expurgo**
  - Tabela `consents` gravando consentimento do Art. 11 da LGPD no cadastro.
  - Endpoint transacional `DELETE /api/v1/account` com expurgo completo em ambos os schemas (Art. 18, VI da LGPD).
  - Sanitização de `x-request-id` contra Log Poisoning e remoção de rotas de debug.

---

## 🏃 SPRINT 4: Hábitos, Plano Pré-Crise e o Feed da Tríade — [🚀 PRÓXIMA]

**Objetivo da Sprint:** Construir a camada de rotina pessoal, ferramentas de autorreflexão e o feed comunitário operacional sem métricas de vaidade.

### Tarefas da Sprint 4:

- [ ] **TASK-401: Criptografia AES-256-GCM do Plano Pessoal Pré-Crise**
  - Tabela `recovery_core.emergency_plans` com coluna `encrypted_data TEXT`.
  - Helper simétrico com IV aleatório de 12 bytes e Auth Tag de 16 bytes.
  - Endpoints para salvar e recuperar o plano de emergência do usuário autenticado.
- [ ] **TASK-402: Gestão de 1 a 3 Micro-Hábitos Diários**
  - Tabelas `recovery_core.habits` e `recovery_core.habit_logs`.
  - Interface mobile para cadastro de até 3 tarefas simples diárias sem streaks punitivos.
- [ ] **TASK-403: Backend do Feed sob a Tríade Semântica**
  - Tabela `recovery_core.triad_posts` categorizada em `FAÇO`, `EVITO` e `ME AJUDA`.
  - Sanitização geográfica automatizada bloqueando menções a nomes de ruas/locais no `EVITO`.
  - Limite estrito de no máximo 3 postagens diárias por usuário.
- [ ] **TASK-404: Microação Funcional "Vou Tentar Isso"**
  - Tabela `recovery_core.my_tools` permitindo salvar estratégias diretamente na caixa pessoal de ferramentas.
  - Enfileiramento de notificação silenciosa para o autor via `pg-boss`.
- [ ] **TASK-405: Interface do Feed Mobile**
  - Feed no app mobile estruturado nas cores da Tríade sem contadores de curtidas ou rankings.
  - Modal para publicação com seleção obrigatória de categoria.

---

## 🏃 SPRINT 5: Moderação, Presença Silenciosa e Rodas de Texto — [⏳ PLANEJADA]

- [ ] **TASK-501: Presença Silenciosa (Body Doubling) via Postgres**
  - Contagem agregada de usuários ativos calculada por timestamp (`last_seen_at`) com regra de threshold ($\ge 15$).
- [ ] **TASK-502: Interceptação Ativa de Ideação Autolítica**
  - Filtro semântico bloqueando relatos de autolesão antes da publicação e acionando modal de apoio do CVV 188.
- [ ] **TASK-503: Painel Web de Moderação (React + Vite + Tailwind)**
  - Interface de produtividade para triagem de denúncias, quarentena de novos usuários e seleção manual da "Estratégia da Semana".
- [ ] **TASK-504: Salas de Apoio Agendadas em Texto (WebSockets)**
  - Gateway WebSocket no Fastify com salas efêmeras, horário marcado e limite rígido de 20 conexões simultâneas.

---

## 🏃 SPRINT 6: Trilha Família, Pagamentos e Piloto Alpha — [⏳ PLANEJADA]

- [ ] **TASK-601: Alternância de Perfil (Dupla Persona) e Conteúdo Ponte**
  - Seletor de visão Navegador vs Ponto de Apoio com área compartilhada de artigos sobre codependência.
- [ ] **TASK-602: Integração de Pagamento Ético (Stripe / Asaas)**
  - Checkout para assinatura de familiares e contribuição voluntária do Apoiador Solidário.
- [ ] **TASK-603: Auditoria Final e Submissão para Lojas**
  - Auditoria completa de UGC e diretrizes de apps de saúde mental para Google Play e App Store.
- [ ] **TASK-604: Execução do Piloto Alpha Controlado (40 Usuários)**
  - Monitoramento de 30 dias com coorte fechada de 25 navegadores e 15 familiares.

---

## 🛡️ Definição de Pronto (Definition of Done - DoD)

1. **Tipagem Estrita:** Código 100% tipado em TypeScript, com flag `no-explicit-any` como erro e zero uso de `any`.
2. **Segregação Criptográfica LGPD:** Nenhuma query relacional direta (`JOIN` ou `FK`) entre `auth_security` e `recovery_core`.
3. **Teste da Notificação:** Nenhuma notificação push ou e-mail pode conter palavras estigmatizantes ("droga", "vício", "recaída").
4. **Resiliência de Rede Móvel:** Falhas transitórias de conexão não devem provocar logout do usuário.
5. **Auditoria de Fechamento de Sprint:** Toda sprint deve encerrar com uma revisão de código adversarial antes do merge definitivo na `main`.
