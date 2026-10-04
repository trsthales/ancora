# 🗺️ Roadmap de Engenharia — Projeto Âncora

```
[ FASE 0 ] Infra & Banco (Segregação LGPD) [✅ CONCLUÍDA]
    │
    ▼
[ FASE 1 ] Autenticação 18+, Pseudônimos & SOS (Offline-First) [✅ CONCLUÍDA]
    │
    ▼
[ FASE 2 ] Jornada Pessoal (Check-in, Alternativas & Temas) [✅ CONCLUÍDA]
    │
    ▼
[ FASE 2.5 / SPRINT 3.5 ] Hardening: Zero-PII, HMAC & Concorrência [✅ CONCLUÍDA]
    │
    ▼
[ FASE 3 / SPRINT 4 ] O Painel Vivo (Feed Tríade, Hábitos & Cripto AES-256) [🚀 PRÓXIMA]
    │
    ▼
[ FASE 4 / SPRINT 5 ] Rodas de Texto Agendadas & Moderação Web
    │
    ▼
[ FASE 5 / SPRINT 6 ] Trilha Família, Pagamentos B2C & Piloto Alpha (40 Usuários)
```

---

## FASE 0: Arquitetura Base, Banco e Segregação LGPD (Semanas 1-2) — [✅ CONCLUÍDA]

- [x] **Monorepo com pnpm:** Setup de `apps/api` (Fastify), `apps/mobile` (Expo) e `apps/admin` (Vite) com TypeScript strict.
- [x] **PostgreSQL 16 Multi-Schema:** Schemas isolados `auth_security`, `recovery_core` e `pgboss` via Docker Compose.
- [x] **Drizzle ORM & Runbook de Migrations:** Esteira canônica de migrations com nomes semânticos e histórico auditável.
- [x] **Filas Assíncronas no Postgres:** Configuração do `pg-boss` para processamento em background (Zero Redis no MVP).
- [x] **Pino Logger com Redaction:** Mascaramento automático de senhas, tokens, IPs e dados de saúde.

---

## FASE 1: Autenticação, Identidade e SOS Offline-First (Semanas 3-4) — [✅ CONCLUÍDA]

- [x] **Trava Contratual 18+ (LGPD Art. 14):** Validação Zod estrita no registro.
- [x] **Autenticação JWT com RTR:** Access Token (15m) e Refresh Token criptográfico com rotação e detecção de reúso.
- [x] **Semáforo SOS Universal (100% Offline):** Acessível na raiz do app móvel (inclusive deslogado) com Respiração 4-7-8, Ancoragem 5-4-3-2-1, CVV 188 (com chat oficial) e SAMU 192/CAPS AD.
- [x] **Onboarding Mobile:** Telas de Boas-Vindas, Cadastro com Trava Dupla, Revelação de Identidade e Login.

---

## FASE 2: Jornada Pessoal e Motor Comportamental (Semanas 5-6) — [✅ CONCLUÍDA]

- [x] **Backend de Check-in Diário:** Endpoints `/journey/checkin`, `/today` e `/history` com fuso horário `America/Sao_Paulo`.
- [x] **Contador de Dias Distintos:** Agrupamento por data (`COUNT(DISTINCT DATE)`), eliminando o bug das 21h em Brasília.
- [x] **Motor "Alternativas para este Momento":** Interceptação local imediata na interface quando fissura $\ge$ 4.
- [x] **Autonomia Visual:** Suporte e alternador nativo de Tema Escuro (Slate/Teal) e Tema Claro (Off-white linho/papel) persistido em storage.

---

## FASE 2.5 / SPRINT 3.5: Hardening de Segurança, Zero-PII e Concorrência — [✅ CONCLUÍDA]

> **Especificação Canônica:** Veja o documento detalhado em [specs/SPEC-SPRINT-03.5-DEBT-HARDENING-E-LGPD.md](file:///home/thales/Projetos/Ancora/specs/SPEC-SPRINT-03.5-DEBT-HARDENING-E-LGPD.md).

- [x] **Arquitetura Zero-PII:** Remoção definitiva da coluna e do campo de e-mail no cadastro. Login por Pseudônimo.
- [x] **Chave Mestra de Recuperação (Crockford Base32):** 20 caracteres sem ambiguidade (`FIRME-XXXXX-...`) com normalizador tolerante.
- [x] **Desacoplamento Criptográfico HMAC:** Eliminação da Foreign Key física no banco; correlação temporal neutralizada por truncamento de timestamp e `last_seen_at` inicializado como `NULL`.
- [x] **Rate Limiting de Dois Baldes:** 100 req/min por IP para proteger clínicas de reabilitação/NAT + bloqueio de 5 falhas por pseudônimo.
- [x] **RTR Idempotente & Mutex no Mobile:** Grace Period de 10s contra retries 4G e fila única de refresh no client mobile.
- [x] **Governança LGPD Efetiva:** Tabela `consents` (Art. 11), exclusão transacional atômica `DELETE /account` (Art. 18, VI) e proteção contra Log Poisoning.
- [x] **Segurança Clínica & Resiliência:** Aviso de tontura no 4-7-8, textos serenos sem presunção de cura e tokens blindados contra queda de rede.

---

## FASE 3 / SPRINT 4: O Painel Vivo e Mecânicas Sociais Saudáveis (Semanas 7-8) — [🚀 PRÓXIMA]

- [ ] **TASK-401: Criptografia AES-256-GCM do Plano Pessoal Pré-Crise:** Criptografia em repouso com IV de 12 bytes, Auth Tag de 16 bytes e AAD na tabela `emergency_plans`.
- [ ] **TASK-402: Gestão de 1 a 3 Micro-Hábitos Diários:** Definição e conclusão diária sem cobrança de dias seguidos ou metas rígidas.
- [ ] **TASK-403: Backend do Feed sob a Tríade Semântica:** Modelo de dados `triad_posts` (`FAÇO`, `EVITO`, `ME AJUDA`), sanitização geográfica e rate limit.
- [ ] **TASK-404: Microação "Vou Tentar Isso":** Salvar estratégias em `my_tools` e notificação assíncrona para o autor via `pg-boss`.
- [ ] **TASK-405: Interface do Feed Mobile:** Componentes visuais da Tríade sem likes ou rankings de vaidade.

---

## FASE 4 / SPRINT 5: Moderação, Presença Silenciosa e Rodas de Texto (Semanas 9-10)

- [ ] **TASK-501: Presença Silenciosa (Body Doubling) via Postgres:** Indicador de usuários ativos com regra de threshold ($\ge 15$).
- [ ] **TASK-502: Interceptação Ativa de Ideação Autolítica:** Bloqueio pré-publicação de termos de autolesão com redirecionamento para CVV 188.
- [ ] **TASK-503: Painel Web de Moderação (React + Vite + Tailwind):** Triagem de quarentena de novos usuários, denúncias e curadoria da "Estratégia da Semana".
- [ ] **TASK-504: Salas de Apoio Agendadas em Texto (WebSockets):** Salas de escuta temporárias com limite de 20 conexões simultâneas e mensagens efêmeras.

---

## FASE 5 / SPRINT 6: Trilha Família, Pagamentos e Homologação Alpha (Semanas 11-12)

- [ ] **TASK-601: Alternância de Perfil e Conteúdo Ponte:** Trilha isolada de familiares com materiais compartilhados de codependência.
- [ ] **TASK-602: Integração de Pagamento Ético:** Assinatura para familiares e canal voluntário do Apoiador Solidário.
- [ ] **TASK-603: Auditoria Final Pré-Piloto:** Checklist rigoroso de UGC para App Store e Google Play.
- [ ] **TASK-604: Execução do Piloto Alpha Controlado (40 Usuários):** Teste de 30 dias com monitoramento diário e métricas de acolhimento.

---

## 📋 Resumo da Alocação de Componentes (Stack Consolidada)

| Componente         | Tecnologia                           | Papel no Sistema                                                                          |
| :----------------- | :----------------------------------- | :---------------------------------------------------------------------------------------- |
| **Mobile App**     | React Native (Expo)                  | Interface do usuário (iOS, Android e Web), SOS offline deslogado e client mutex.          |
| **Painel Admin**   | React (Vite) + Tailwind              | Gestão de moderação, quarentena e denúncias.                                              |
| **Backend API**    | Node.js (TypeScript) + Fastify       | Regras de negócio, autenticação Zero-PII, WebSockets e API REST.                          |
| **Banco de Dados** | PostgreSQL 16+                       | Schemas segregados (`auth_security`, `recovery_core`, `pgboss`) com HMAC e sem FK direta. |
| **Filas e Jobs**   | `pg-boss` (Postgres nativo)          | Notificações de ferramentas e alertas de crise sem Redis.                                 |
| **Criptografia**   | Argon2id + HMAC-SHA256 + AES-256-GCM | Proteção de credenciais, derivação de identidade e dados em repouso.                      |