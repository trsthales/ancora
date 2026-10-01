# ⚓ Plano de Sprints de Engenharia — Projeto Âncora

- **Metodologia:** Scrum / Kanban Adaptado
- **Cadência:** 6 Sprints de 2 semanas (12 semanas / 3 meses)
- **Stack Oficial:** Node.js (TypeScript) + Fastify + PostgreSQL 16+ + Drizzle ORM + React Native (Expo)
- **Diretriz Central:** Simplicidade de infraestrutura (Zero Redis no MVP, foco em estabilidade e conformidade com a RFC 002).

---

## Visão Geral do Cronograma

|    Sprint    | Foco Temático                                                     | Entregável Principal                                                  |
| :----------: | :---------------------------------------------------------------- | :-------------------------------------------------------------------- |
| **Sprint 1** | **Fase 0:** Setup de Monorepo, Migrations e Segregação LGPD       | Infraestrutura local e schemas de banco funcionando.                  |
| **Sprint 2** | **Fase 1 (A):** Autenticação 18+, Pseudonimato e Onboarding       | Cadastro seguro, geração de pseudônimo e fluxo de entrada.            |
| **Sprint 3** | **Fase 1 (B) & 2 (A):** Semáforo SOS e Check-in com Alternativas  | SOS offline-first funcional e check-in com resposta à fissura.        |
| **Sprint 4** | **Fase 2 (B) & 3 (A):** Hábitos, Plano Pré-Crise e Feed da Tríade | Diário criptografado, rotina de hábitos e feed `FAÇO/EVITO/ME AJUDA`. |
| **Sprint 5** | **Fase 3 (B) & 4 (A):** Moderação, Presença Silenciosa e Rodas    | Painel web de moderação, body doubling e salas de texto.              |
| **Sprint 6** | **Fase 4 (B) & 5:** Trilha Família, Pagamentos e Piloto Alpha     | Checkout ético, exclusão de conta LGPD e homologação do piloto.       |

---

## 🏃 SPRINT 1 (Semanas 1 e 2): Fundação, Schemas Segregados e Migrations

**Objetivo da Sprint:** Estabelecer o ambiente de desenvolvimento, criar o pipeline de migrações e implementar os schemas isolados para dados sensíveis no PostgreSQL.

### Tarefas da Sprint 1:

- [x] **TASK-101: Estruturação do Monorepo e Configurações Base**
  - Configurar monorepo (via pnpm workspaces ou npm workspaces) com 3 pacotes: `apps/api` (Fastify), `apps/mobile` (Expo) e `apps/admin` (Vite).
  - Padronizar TypeScript (`tsconfig.base.json` com `strict: true`), ESLint e Prettier.
- [ ] **TASK-102: Setup do PostgreSQL e Drizzle ORM Multi-Schema**
  - Configurar conexão do Node com PostgreSQL via `postgres.js` ou `pg`.
  - Configurar Drizzle Kit para suportar múltiplos schemas: `pgSchema("auth_security")` e `pgSchema("recovery_core")`.
- [ ] **TASK-103: Implementação da Migration 0001 (Schema Inicial)**
  - Criar schema `auth_security`: tabelas `users` (id, email, password_hash, is_adult, role, created_at) e `sessions`.
  - Criar schema `recovery_core`: tabelas `profiles` (id, user_id, pseudonym, avatar_id, persona, last_seen_at) e `checkins`.
  - Configurar scripts no `package.json`: `db:generate`, `db:migrate` e `db:rollback`.
- [ ] **TASK-104: Configuração da Fila de Tarefas no Postgres (`pg-boss`)**
  - Instalar e inicializar o `pg-boss` no schema de suporte do Postgres para processamento assíncrono futuro.
- [ ] **TASK-105: Logger Estruturado com Anonimização de Dados (Pino)**
  - Implementar Pino Logger com middleware que remove/mascara automaticamente campos sensíveis (`password`, `email`, `ip`, `token`) dos logs da API.

> **Critério de Aceite da Sprint 1:**  
> O comando `npm run db:migrate` deve executar com sucesso em um banco limpo, criando os esquemas segregados sem erros. A API deve subir respondendo em `GET /health` e gravando logs sanitizados.

---

## 🏃 SPRINT 2 (Semanas 3 e 4): Autenticação 18+, Pseudonimato e Onboarding

**Objetivo da Sprint:** Criar o fluxo seguro de registro e login, com verificação de maioridade contratual (18+), geração automática de pseudônimos e navegação inicial.

### Tarefas da Sprint 2:

- [ ] **TASK-201: Endpoint de Registro com Trava 18+ (`POST /api/v1/auth/register`)**
  - Validação de payload com Zod (email válido, senha forte, `is_adult: true` obrigatório).
  - Hashing de senha com **Argon2id**.
  - Transação no banco: cria o registro em `auth_security.users` e dispara a criação do perfil em `recovery_core.profiles`.
- [ ] **TASK-202: Mecanismo de Autenticação JWT com Refresh Token**
  - Emissão de Access Token de curta duração (15 min) e Refresh Token seguro com rotação armazenado no banco.
  - Middleware Fastify para proteção de rotas privadas.
- [ ] **TASK-203: Gerador e Motor de Rotação de Pseudônimos**
  - Serviço de backend para gerar combinações como `CaminhoSereno_88` ou `BrisaFirme_14` garantindo unicidade.
  - Endpoint `POST /api/v1/profile/rotate-identity` permitindo ao usuário trocar de pseudônimo e desvincular o anterior.
- [ ] **TASK-204: Telas de Autenticação e Onboarding no React Native (Expo)**
  - Tela de Boas-Vindas com manifesto institucional discreto.
  - Formulário de Cadastro com checkbox explícito: _"Declaro que tenho 18 anos ou mais e aceito os termos de apoio mútuo"_.
  - Tela de Seleção de Trilha: _Navegador (Em recuperação)_ ou _Ponto de Apoio (Familiar)_.
  - Tela de Revelação do Pseudônimo com opção de regerar o avatar ilustrado.

> **Critério de Aceite da Sprint 2:**  
> Um usuário deve conseguir se cadastrar pelo app Expo, receber um pseudônimo automático, logar com sucesso e persistir a sessão localmente via `expo-secure-store`. Tentativas com `is_adult: false` devem ser bloqueadas na validação.

---

## 🏃 SPRINT 3 (Semanas 5 e 6): Semáforo SOS e Check-in com Alternativas

**Objetivo da Sprint:** Implementar o núcleo de segurança de crise (offline-first) e o motor de check-in que transforma o registro de fissura em ações práticas de alívio.

### Tarefas da Sprint 3:

- [ ] **TASK-301: Estrutura Offline-First do Botão SOS no Mobile**
  - Componente flutuante do SOS acessível globalmente no app.
  - Armazenamento local das rotinas de crise (sem dependência de conexão de internet).
- [ ] **TASK-302: Telas do Semáforo SOS (🟢 🟡 🔴)**
  - **🟢 Nível 1:** Tela de Respiração Guiada (animação fluida 4-7-8 com feedback tátil/haptic) e tela interativa da Ancoragem sensorial 5-4-3-2-1.
  - **🟡 Nível 2:** Exibição dos contatos pessoais do Plano Pré-Crise + Botão nativo para discar **188 (CVV)** (`Linking.openURL('tel:188')`).
  - **🔴 Nível 3:** Botão de discagem direta para **192 (SAMU)** + tela estática explicativa sobre o que é e onde encontrar um CAPS AD.
- [ ] **TASK-303: Backend e Migration para Check-in Diário**
  - Migration `0002_add_checkins_and_plans.sql`: tabela `recovery_core.checkins` (id, profile_id, craving_level [0-5], mood, created_at).
  - Endpoint `POST /api/v1/journey/checkin`.
- [ ] **TASK-304: Motor Mobile "Alternativas para este Momento"**
  - Componente visual no app com a escala 0 a 5 de fissura.
  - Lógica condicional: Se fissura for 4 ou 5, a interface não vai para a Home; exibe a tela: _"O que você consegue fazer nos próximos 15 minutos?"_, sugerindo um exercício do Nível 1 do SOS ou uma atividade simples de distração.

> **Critério de Aceite da Sprint 3:**  
> O botão SOS deve abrir instantaneamente e funcionar em modo avião (sem internet). Ao selecionar discagem para 188 ou 192, o discador nativo do telefone deve abrir preenchido. O check-in com fissura 4/5 deve redirecionar obrigatoriamente para a tela de alternativas.

---

## 🏃 SPRINT 4 (Semanas 7 e 8): Hábitos, Plano Pré-Crise e o Feed da Tríade

**Objetivo da Sprint:** Construir as ferramentas de rotina (hábitos sem cobrança de sequências) e o feed comunitário estruturado na tríade `FAÇO/EVITO/ME AJUDA`.

### Tarefas da Sprint 4:

- [ ] **TASK-401: Criptografia AES-256 do Plano Pessoal Pré-Crise**
  - Tabela `recovery_core.emergency_plans` com coluna `encrypted_data TEXT`.
  - Helper no backend para cifrar/decifrar os contatos de confiança e anotações pessoais usando chave mestra de aplicação (`crypto` nativo com AES-256-GCM).
- [ ] **TASK-402: Gestão de 1 a 3 Micro-Hábitos e Contador Cumulativo**
  - Tabela `recovery_core.habits` e `recovery_core.habit_logs`.
  - Interface mobile para definir no máximo 3 hábitos simples diários.
  - Implementação do cálculo neutro de dias acumulados (sem contadores punitivos ou telas vermelhas em caso de recaída).
- [ ] **TASK-403: Backend do Feed sob a Tríade Semântica**
  - Migration `0003_add_triad_posts.sql`: tabela `recovery_core.triad_posts` (id, profile_id, category [`FACO`, `EVITO`, `ME_AJUDA`], content, status, saved_count, created_at).
  - Endpoint `POST /api/v1/posts` com validação de categoria obrigatória e limite de 280 caracteres.
  - Rate-limiting estrito: máximo de 3 postagens por dia por usuário via `@fastify/rate-limit`.
- [ ] **TASK-404: Ação "Vou Tentar Isso" e Ferramentas Salvas**
  - Tabela `recovery_core.my_tools` (relação usuário x post salvo).
  - Endpoint `POST /api/v1/posts/:id/try`.
  - Criação de job no `pg-boss` para enfileirar notificação interna ao autor: _"Sua estratégia inspirou um colega hoje."_.
- [ ] **TASK-405: Interface do Feed Mobile**
  - Renderização visual com separação nítida das cores da Tríade (🟢 Verde, 🔴 Vermelho, 🔵 Azul).
  - Botões funcionais _"Vou Tentar Isso"_ e _"Estamos Juntos"_ (sem contadores de likes ou rankings).

> **Critério de Aceite da Sprint 4:**  
> Usuários devem conseguir postar selecionando uma das 3 categorias. Ao clicar em "Vou Tentar Isso", o card deve ser adicionado à aba pessoal "Minhas Âncoras". Nenhuma métrica de vaidade pública deve ser exibida.

---

## 🏃 SPRINT 5 (Semanas 9 e 10): Moderação, Presença Silenciosa e Rodas de Texto

**Objetivo da Sprint:** Implementar a esteira de segurança para moderação de conteúdo, o mecanismo de _Body Doubling_ sem Redis e as salas de escuta temporárias em texto.

### Tarefas da Sprint 5:

- [ ] **TASK-501: Presença Silenciosa (Body Doubling) via Postgres**
  - Rota leve de heartbeat enviada pelo mobile a cada 3 minutos:
    ```sql
    UPDATE recovery_core.profiles SET last_seen_at = NOW() WHERE id = $1;
    ```
  - Endpoint `GET /api/v1/community/presence` com a lógica de threshold:
    - Se contagem < 15: Retornar payload `{ display_mode: "text", message: "Você não está sozinho..." }`.
    - Se contagem ≥ 15: Retornar payload `{ display_mode: "count", active_count: N }`.
- [ ] **TASK-502: Motor de Higienização de Conteúdo e Interceptação Ativa**
  - **Sanitização do `EVITO`:** Regex bloqueando nomes comuns de logradouros, praças, bares e gírias de compra.
  - **Interceptação Ativa de Ideação Autolítica:** Se o conteúdo contiver palavras-chave de autolesão/suicídio, o post é marcado como `blocked`, o backend retorna erro estruturado que dispara o modal do CVV (188) no mobile e um alerta crítico é criado no banco.
- [ ] **TASK-503: Painel Web de Moderação (React + Vite + Tailwind)**
  - Autenticação de moderador (`role = 'moderator'`).
  - Fila de triagem para postagens de contas novas em quarentena (< 48h de cadastro).
  - Painel de denúncias recebidas com botão de banimento por dispositivo e remoção de conteúdo.
  - Ação de marcar manualmente uma postagem como a **"Estratégia da Semana"**.
- [ ] **TASK-504: Salas de Apoio Agendadas em Texto (WebSockets)**
  - Gateway WebSocket simples no Fastify via `@fastify/websocket`.
  - Criação de salas temporárias com horário marcado (ex: Roda das 20h às 21h).
  - Trava de limite de 20 conexões simultâneas por sala.
  - Mensagens efêmeras mantidas apenas em memória durante a sessão e descartadas ao fechar a sala.

> **Critério de Aceite da Sprint 5:**  
> Postagens com ideação suicida explícita não devem ser publicadas no feed sob nenhuma hipótese, disparando o modal do CVV. Postagens com nomes de ruas devem ser rejeitadas ou sanitizadas. As salas de texto devem bloquear o 21º participante ao atingir o limite.

---

## 🏃 SPRINT 6 (Semanas 11 e 12): Trilha Família, Pagamentos e Homologação Alpha

**Objetivo da Sprint:** Finalizar o isolamento da trilha de familiares, integrar o gateway de pagamento ético, implementar o direito ao esquecimento (LGPD) e executar a homologação do piloto fechado com 40 usuários.

### Tarefas da Sprint 6:

- [ ] **TASK-601: Alternância de Perfil (Dupla Persona) e Conteúdo Ponte**
  - Seletor na barra superior do app: _"Navegador"_ vs _"Ponto de Apoio (Familiar)"_.
  - Garantir que as postagens e salas de uma trilha nunca apareçam na outra.
  - Área compartilhada de **Conteúdo Ponte**: artigos estáticos curados em Markdown sobre codependência e comunicação não-violenta.
- [ ] **TASK-602: Integração de Pagamento Ético (Stripe / Asaas)**
  - Checkout seguro para o **Plano Ponto de Apoio (Assinatura de Familiares)**.
  - Checkout para o **Apoiador Solidário (Contribuição Voluntária de R$ 14,90 a R$ 29,90)**.
  - Webhook de confirmação atualizando `auth_security.users` com o status da assinatura (sem misturar dados financeiros com os dados de saúde).
- [ ] **TASK-603: Direito ao Esquecimento (LGPD Art. 18)**
  - Endpoint `DELETE /api/v1/account`.
  - Execução de deleção em cascata total: expurgo de registros em `auth_security` e `recovery_core`, sem deixar logs órfãos.
- [ ] **TASK-604: Auditoria de Segurança e Teste do Piloto Alpha (40 Usuários)**
  - Auditoria das notificações push: verificar que nenhuma notificação cita termos como "vício", "fissura" ou "droga".
  - Teste do Kill Switch: validar que moderadores conseguem pausar postagens do feed instantaneamente caso o critério de parada seja atingido.
  - Submissão das builds para TestFlight (iOS) e Google Play Internal Testing (Android).

> **Critério de Aceite da Sprint 6:**  
> O fluxo completo de ponta a ponta deve estar funcional: cadastro 18+ com pseudônimo, check-in diário com desvio de fissura, feed Tríade sem métricas de vaidade, modo SOS em 3 níveis e exclusão completa da conta. Build homologada e pronta para os 40 convidados do Alpha.

---

## 🛡️ Definição de Pronto (Definition of Done - DoD)

Para que qualquer tarefa ou história seja considerada concluída ao longo das sprints, ela deve cumprir:

1. **Tipagem Estrita:** Código 100% tipado em TypeScript, sem uso de `any`.
2. **Segregação LGPD:** Nenhuma query SQL pode juntar (`JOIN`) tabelas de `auth_security` com `recovery_core` sem justificativa documentada de auditoria.
3. **Teste da Notificação:** Nenhuma push notification pode conter linguagem estigmatizante.
4. **Tratamento de Erros:** Endpoints devem responder com códigos HTTP semânticos e mensagens amigáveis sem vazar stack trace.
5. **Aprovada em Code Review:** Revisão de código focada em segurança, ausência de gatilhos visuais e conformidade com a RFC 002.
