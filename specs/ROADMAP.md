# 🗺️ Roadmap de Engenharia — Projeto Âncora

```
[ FASE 0 ] Infra & Banco (Segregação LGPD)
    │
    ▼
[ FASE 1 ] Autenticação 18+, Pseudônimos & Sistema SOS (Offline-First)
    │
    ▼
[ FASE 2 ] Jornada Pessoal (Check-in, Alternativas & Micro-Hábitos)
    │
    ▼
[ FASE 3 ] O Painel Vivo (Feed Tríade, Sanitização & Painel Web de Moderação)
    │
    ▼
[ FASE 4 ] Rodas de Texto Agendadas, Trilha Família & Pagamentos
    │
    ▼
[ FASE 5 ] Teste Piloto Alpha (40 Usuários), Hardening & Deploy
```

---

## FASE 0: Arquitetura Base, Banco e Segregação LGPD (Semanas 1-2)

O objetivo desta fase é criar os alicerces de dados com isolamento estrito entre "identidade civil" e "dados de saúde".

### 1. Banco de Dados (PostgreSQL)

- [ ] **Criação de Schemas Isolados:**
  - `schema auth_security`: Tabelas `users_auth` (email, senha com Argon2/Bcrypt, role, status, criado_em), `refresh_tokens`, `audit_logs`.
  - `schema recovery_core`: Tabelas `profiles` (pseudônimo, avatar_id, persona: `navegador | apoio`), `checkins`, `triad_posts`, `emergency_plans`, `my_tools`.
- [ ] **Configuração do Mecanismo de Filas Interno:**
  - Instalação e configuração do **`pg-boss`** para rodar filas no próprio Postgres (usando `SKIP LOCKED` nativo para moderação e disparos assíncronos).
- [ ] **Criptografia em Nível de Campo:**
  - Implementação de helper no Node.js com `crypto` nativo usando **AES-256-GCM** para cifrar o campo `emergency_plans.contacts` e anotações privadas antes de persistir no banco.

### 2. Backend (Node.js + Fastify/NestJS + TypeScript)

- [ ] Inicialização do repositório backend com tipagem estrita (`strict: true`).
- [ ] Configuração do ORM/Query Builder: **Prisma** com suporte a multi-schema ou **Kysely / Drizzle** para tipagem SQL segura e leve.
- [ ] Setup de Logger estruturado (Pino) com mascaramento automático de e-mails e IPs nos logs.

### 3. Frontend Mobile (React Native + Expo)

- [ ] Inicialização do app com `npx create-expo-app` (TypeScript).
- [ ] Configuração de navegação segura (Expo Router ou React Navigation).
- [ ] Criação do Design System base (paleta sóbria: tons de azul petróleo `#0f766e`, verde sálvia e neutros; tipografia legível).

---

## FASE 1: Autenticação 18+, Pseudônimos e SOS Offline-First (Semanas 3-4)

Garantir que a porta de entrada cumpra a legislação (LGPD Art. 14) e que o recurso mais vital (o socorro em crise) funcione mesmo com internet instável.

### 1. Autenticação e Acesso Restrito

- [ ] **Gate de Maioridade (18+):** Checkbox contratual obrigatório com validação em tempo de requisição na API.
- [ ] **Geração de Pseudônimos:** Algoritmo que combina adjetivo neutro + substantivo + número (ex: `CaminhoSereno_42`).
- [ ] **Rotação de Pseudônimo:** Endpoint `POST /api/v1/profile/rotate-identity` que permite ao usuário recriar seu pseudônimo e desvincular o identificador público anterior.
- [ ] **Rate Limiting em Memória:** Implementar `@fastify/rate-limit` no Node para barrar ataques de força bruta no login.

### 2. Módulo SOS (Semáforo de Segurança) — Foco Mobile

- [ ] **Armazenamento Local:** Guardar os exercícios de crise e números de telefone localmente no aparelho (AsyncStorage / SQLite nativo do Expo) para funcionamento **100% offline**.
- [ ] **🟢 Nível 1 (Autocuidado):**
  - Tela de Respiração Guiada (animação suave em React Native com ritmo 4-7-8).
  - Tela interativa da Ancoragem 5-4-3-2-1 (componentes táteis para tocar na tela enquanto ancora os sentidos).
- [ ] **🟡 Nível 2 (Apoio Humano):**
  - Tela do Plano Pré-Crise pessoal (exibindo os contatos cadastrados).
  - Botão com deep-link nativo para discagem telefônica do **188 (CVV)** (`Linking.openURL('tel:188')`).
- [ ] **🔴 Nível 3 (Emergência Médica):**
  - Botão de discagem direta para o **192 (SAMU)**.
  - Tela informativa com instruções claras sobre como buscar atendimento gratuito no CAPS AD.

---

## FASE 2: Jornada Pessoal e Motor Comportamental (Semanas 5-6)

Construção das ferramentas individuais que a pessoa utiliza diariamente sem pressão de engajamento social.

### 1. Check-in Diário e Motor "Alternativas para o Momento"

- [ ] **Endpoint de Check-in (`POST /api/v1/journey/checkin`):**
  - Salva nível de fissura (0 a 5) e humor.
- [ ] **Gatilho de Interface:**
  - Se fissura for marcada como 4 ou 5, a interface não vai para a home; ela intercepta o fluxo e renderiza: _"O que você consegue fazer nos próximos 15 minutos?"_.
  - Sugere 1 micro-ação de distração do `FAÇO` ou ativação do Nível 1 do SOS.

### 2. Contador Neutro e Micro-Hábitos

- [ ] **Lógica do Contador Cumulativo:**
  - Cálculo de marcos por dias acumulados no banco, sem "zeramento agressivo" após recaída.
  - Se houver recaída registrada: acionar modal reflexivo: _"O que aprendemos com o gatilho de hoje?"_.
- [ ] **Gestão de Micro-Hábitos:**
  - Interface permitindo cadastrar no máximo **3 hábitos simples do dia** (ex: tomar água, caminhar 15 min, arrumar a cama).
  - Registro de conclusão com 1 toque, sem gráficos punitivos ou sequências obrigatórias (_streaks_).

---

## FASE 3: O Painel Vivo e Mecânicas Sociais Saudáveis (Semanas 7-8)

O coração comunitário do app: substituir likes por utilidade real e estruturar a moderação.

### 1. Feed sob a Tríade Semântica

- [ ] **Modelo de Dados `triad_posts`:**
  - Colunas: `id`, `profile_id`, `category` (`FACO | EVITO | ME_AJUDA`), `content` (max 280 caracteres), `status` (`published | quarantined | hidden`), `saved_count`.
- [ ] **Módulo "Vou Tentar Isso":**
  - Endpoint `POST /api/v1/posts/:id/try`: Salva a estratégia na tabela `my_tools` do usuário e envia uma notificação silenciosa para o autor: _"Sua estratégia inspirou um colega hoje."_.
- [ ] **Ação "Estamos Juntos":** Incrementa contador interno sem expor ranking público.

### 2. Presença Silenciosa (Body Doubling) sem Redis

- [ ] **Implementação no Postgres:**
  - Endpoint leve de _heartbeat_ acionado pelo app a cada 3 minutos:
    ```sql
    UPDATE profiles SET last_seen_at = NOW() WHERE id = $1;
    ```
  - Endpoint `GET /api/v1/community/presence`:
    ```sql
    SELECT COUNT(*) FROM profiles WHERE last_seen_at > NOW() - INTERVAL '5 minutes';
    ```
  - **Regra de Exibição no App:**
    - `< 15 usuários`: Exibir texto qualitativo: _"Você não está sozinho. Outras pessoas estão cuidando de si hoje."_
    - `≥ 15 usuários`: Exibir: _"🌿 X pessoas estão ativas cuidando de sua rotina agora."_

### 3. Pipeline de Moderação e Sanitização

- [ ] **Interceptação Ativa de Ideação Autolítica:**
  - Hook no backend: Se o texto contiver termos explícitos de autolesão/overdose, o post é marcado como `blocked`, a resposta HTTP aciona o modal do CVV (188) na tela do usuário e uma tarefa de alta prioridade vai para o `pg-boss`.
- [ ] **Sanitização Geográfica no `EVITO`:**
  - Filtro regex bloqueando palavras como "Rua", "Avenida", "Praça", "Bar", "Estação" e gírias de compra.
- [ ] **Quarentena de Contas Novas:**
  - Usuários com `< 48h` de cadastro têm postagens salvas como `quarantined` até aprovação no painel.

### 4. Painel Web de Moderação (React + Vite)

- [ ] Painel web simples para moderadores:
  - Lista de postagens em quarentena (aprovar/rejeitar com 1 clique).
  - Fila de denúncias recebidas.
  - Curadoria manual: Botão para marcar uma publicação como a **"Estratégia da Semana"**.

---

## FASE 4: Rodas de Texto Agendadas, Família & Sustentabilidade (Semanas 9-10)

### 1. Rodas de Apoio Agendadas (Apenas Texto via WebSockets)

- [ ] Implementação de gateway WebSocket no Node (via `ws` ou `socket.io`).
- [ ] Criação de salas temporárias com horário fixo (ex: Roda Noturna — 20h às 21h).
- [ ] Limite rígido de 20 conexões ativas por sala.
- [ ] Mensagens não são indexadas no feed; são destruídas após o término da sessão (salas efêmeras).

### 2. Trilha do Familiar & Conteúdo Ponte

- [ ] Implementação da alternância de trilha no perfil do usuário (`Navegador` <-> `Familiar`).
- [ ] Bloqueio de visibilidade: Relatos da área de dependentes não aparecem para familiares e vice-versa.
- [ ] Seção compartilhada: **Conteúdo Ponte** (artigos estáticos e reflexões em markdown curadas pela equipe).

### 3. Integração de Pagamento Ético

- [ ] Integração com gateway de pagamentos (Stripe, Asaas ou Pagar.me).
- [ ] Criação do checkout para os dois planos pagos:
  - **Plano Ponto de Apoio:** Assinatura para familiares.
  - **Apoiador Solidário:** Contribuição voluntária (R$ 14,90 a R$ 29,90) para usuários que desejam manter o app gratuito para quem precisa.
- [ ] Webhook de confirmação de pagamento atualizando o schema `auth_security.users_auth` (isolado dos dados de saúde).

---

## FASE 5: Piloto Alpha (40 Usuários), Hardening e Submissão (Semanas 11-12)

### 1. Hardening e Conformidade

- [ ] **Direito ao Esquecimento:** Endpoint `DELETE /api/v1/account` que executa exclusão em cascata de todos os dados do usuário em ambos os schemas do banco.
- [ ] **Auditoria de Notificações:** Garantir que nenhuma notificação push contenha palavras como "vício", "recaída", "droga" ou "fissura".
- [ ] **Conformidade Apple/Google UGC:** Telas com botões de bloquear usuário e denunciar conteúdo visíveis em 100% dos posts.

### 2. Execução do Piloto Alpha Controlado

- [ ] Onboarding de 40 voluntários (25 em recuperação e 15 familiares) com código de convite fechado.
- [ ] Monitoramento diário do tempo de resposta a denúncias.
- [ ] **Aplicação dos Critérios de Parada da RFC 002:**
  - _Kill Switch:_ Se houver tentativa confirmada de tráfico ou vazamento de identidade, o piloto é pausado imediatamente para correção.

---

## 📋 Resumo da Alocação de Componentes (Stack Final)

| Componente                   | Tecnologia                              | Papel no Sistema                                                  |
| :--------------------------- | :-------------------------------------- | :---------------------------------------------------------------- |
| **Mobile App**               | React Native (Expo)                     | Interface principal do usuário (iOS e Android), modo SOS offline. |
| **Painel Admin**             | React (Vite) + Tailwind                 | Gestão de denúncias, aprovação de quarentena e moderação humana.  |
| **Backend API**              | Node.js (TypeScript) + Fastify          | Regras de negócio, WebSockets das salas e API REST.               |
| **Banco de Dados**           | PostgreSQL 16+                          | Schemas segregados (LGPD), criptografia de campos e RLS.          |
| **Filas e Jobs**             | `pg-boss` (no próprio Postgres)         | Moderação assíncrona e alertas de crise sem precisar de Redis.    |
| **Presença / Body Doubling** | Query de Timestamp no Postgres          | Contagem de usuários ativos com custo zero de infraestrutura.     |
| **Rate Limiting**            | Memória do Node (`@fastify/rate-limit`) | Proteção contra spam de requisições na API.                       |
