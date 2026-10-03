# 📘 Manual de Metodologia de Desenvolvimento com IA — Projeto Âncora

**Autor:** Thales Ramalho de Souza (Engenheiro de Software Sênior)  
**Projeto:** Âncora — Plataforma Digital de Apoio à Recuperação de Dependências Químicas  
**Objetivo deste Documento:** Estabelecer o padrão operacional, a arquitetura de prompts, o roteamento de modelos de IA e as práticas de engenharia adotadas no desenvolvimento do ecossistema Âncora.

---

## 1. Filosofia Operacional: "Arquiteto Humano + Implementador Autônomo"

O desenvolvimento do Âncora não adota geração cega de código. A dinâmica segue o princípio do **Shift-Left Security** e **Auditoria Adversarial Contínua**:

1. **O Engenheiro Humano (Tech Lead / Arquiteto):**
   - Define a arquitetura, regras de negócio clínicas (RFC 002) e conformidade jurídica (LGPD Art. 11, 13 e 18).
   - Inspeciona diretamente o banco de dados (via DBeaver) e os arquivos de migração gerados antes de aplicar em produção.
   - Poda alucinações e hipérboles das IAs, filtrando riscos reais de rede, concorrência e usabilidade.
2. **A IA (Parceiro de Implementação Autônomo):**
   - Constrói o código completo (sem trechos omitidos ou comentários `// adicione aqui`).
   - Executa comandos no terminal, valida tipagens TypeScript estritas e realiza testes funcionais automatizados via `curl`.
   - Opera sob loops autônomos com **Critérios de Parada (Exit Criteria)** verificáveis.

---

## 2. Ferramentas e Ambiente de Desenvolvimento

* **IDE Principal:** **Google Antigravity IDE** (para edição interativa, diffs visuais e depuração fina) e **Antigravity 2.0** (ambiente standalone para execução autônoma contínua via agente).
* **Inspeção de Dados:** **DBeaver CE** conectado ao PostgreSQL local (`ancora_db`) para auditoria visual de schemas, constraints, foreign keys e índices.
* **Infraestrutura Local:** Docker Compose executando PostgreSQL 16 Alpine na porta 5432 e Mailpit (SMTP/Web UI) para teste de e-mails transacionais.
* **Gerenciador de Pacotes:** `pnpm` workspaces em monorepo:
  - `apps/api`: Node.js (TypeScript strict) + Fastify + Drizzle ORM.
  - `apps/mobile`: React Native com Expo (TypeScript) + React Native Web.
  - `apps/admin`: React + Vite + Tailwind CSS.

---

## 3. Matriz de Roteamento de Modelos de IA (*Model Routing*)

Para maximizar a precisão técnica e manter o consumo de cota abaixo de 15% semanal no plano Google AI Pro, adotamos uma estratégia estrita de divisão de trabalho:

| Modelo de IA | Modo / Thinking | Quando Utilizar (Cenários) |
| :--- | :--- | :--- |
| **Gemini 3.8 Flash** | **Medium** *(Padrão)* | **85% das tarefas do dia a dia:** Scaffolding de monorepo, rotas CRUD no Fastify, componentes em React Native/Expo, estilização de telas, ajustes de CSS/layout e migrations simples. Destaca-se pela velocidade extrema de streaming e execução de terminal. |
| **Claude Sonnet** | **Thinking** *(High)* | **Tarefas de Alta Complexidade e Missões Críticas:**<br>1. Implementações criptográficas (HMAC-SHA256, AES-256-GCM, Argon2 secrets).<br>2. Auditorias de segurança ofensiva (*Red Team*), busca por *timing attacks* e *race conditions*.<br>3. Concorrência e WebSockets.<br>4. Quando o Gemini entrar em loop de autocorreção ou travar em um erro sutil de tipos. |
| **Claude Opus** | **Padrão / Alto** | **Governança e Dilemas Estruturais:** Grandes refatorações de arquitetura, arbitragem de conformidade regulatória (LGPD / ECA Digital) ou revisões macro pré-lançamento. |

---

## 4. Gestão de Contexto e Ciclo de Sessões (A Regra de Ouro)

> **"Nova Task / Nova Branch = Novo Chat Limpo no Agente."**

- **Nunca acumular tarefas diferentes na mesma conversa:** Quando uma task é concluída e testada, o código está seguro no disco e no Git. O agente não deve carregar megabytes de histórico de terminal passado.
- **Evitar alucinações de contexto:** Chats longos causam lentidão e fazem o agente sugerir códigos antigos ou reintroduzir colunas que já foram deletadas.
- **Manter a mesma conversa apenas para correções iterativas da mesma task.**

---

## 5. Anatomia do Prompt Canônico (O Padrão `/goal`)

Todo prompt de implementação no Antigravity 2.0 deve obrigatoriamente seguir a estrutura em 4 blocos:

```markdown
/goal [Declaração concisa do objetivo técnico e da task correspondente]

---

### 1. CONDIÇÃO DE PARADA OBRIGATÓRIA (EXIT CRITERIA)
[Lista de 4 a 8 critérios verificáveis no terminal. O agente NÃO PODE finalizar antes de comprovar cada um]
1. Dependências instaladas no package.json correto.
2. Comandos de teste executados via curl com códigos HTTP esperados (ex: 200, 201, 400, 401).
3. Verificação no banco via psql/query comprovando a alteração.
4. pnpm typecheck passando com 0 erros em todos os workspaces (@ancora/api, @ancora/mobile, @ancora/admin).
5. Metro Bundler / API iniciando sem warnings ou erros de runtime.

---

### 2. ARQUITETURA DE ARQUIVOS A CRIAR / MODIFICAR
[Árvore ASCII explícita dos arquivos impactados com anotação do que muda]
apps/api/src/
├── db/schema/recovery.ts       (Remover coluna legada e adicionar novo token)
└── routes/auth.ts              (Ajustar injeção do token derivado)

---

### 3. ESPECIFICAÇÃO TÉCNICA DETALHADA
[Regras de negócio, assinaturas de funções TypeScript, modelos Zod, trechos SQL e regras de segurança]
- Detalhes de criptografia (algoritmo, tamanho de chaves, salt/pepper).
- Respostas de erro padronizadas (evitar enumeração de e-mails, censurar dados sensíveis).
- Tratamento de exceções e atomicidade via transações (db.transaction).

---

### 4. FLUXO DE EXECUÇÃO AUTÔNOMA REQUERIDO
[Passo a passo sequencial ordenado para a IA executar sem hesitar]
1. Altere o schema e instale pacotes.
2. Gere e aplique as migrations.
3. Refatore as rotas.
4. Rode pnpm typecheck.
5. Inicie a API e execute a bateria de testes via curl demonstrando as saídas no relatório final.
```

---

### Exemplo Real de Prompt Utilizado no Projeto:

```markdown
/goal Implementar o desacoplamento criptográfico entre auth_security e recovery_core na API: remover a Foreign Key user_id da tabela profiles, adicionar o campo account_token (varchar 64 unique) derivado via HMAC-SHA256(user.id, APP_PEPPER_V1), gerar e aplicar a migration Drizzle e refatorar as rotas de registro e login.

---

### 1. CONDIÇÃO DE PARADA OBRIGATÓRIA (EXIT CRITERIA)
1. Coluna `user_id` e a constraint `profiles_user_id_users_id_fk` inexistentes no PostgreSQL.
2. Coluna `account_token` ativa, única e preenchida via HMAC determinístico no cadastro.
3. Rota `POST /register` cadastrando o usuário e perfil sem violar constraints.
4. Rota `POST /login` autenticando e resolvendo o perfil pelo `account_token`.
5. pnpm typecheck passando com 0 erros no monorepo.
6. curl em GET /health respondendo HTTP 200 com database: connected.

---

### 2. ARQUITETURA DE ARQUIVOS
apps/api/src/
├── db/schema/recovery.ts        (Atualizar: tabela profiles)
├── lib/crypto-token.ts          (Criar: deriveAccountToken com HMAC)
└── routes/auth.ts               (Refatorar: insert e select usando accountToken)

---

### 3. ESPECIFICAÇÃO TÉCNICA
- Usar crypto.createHmac('sha256', env.APP_PEPPER_V1).update(userId).digest('hex').
- profiles.accountToken deve ser varchar(64).notNull().unique().
- created_at de profiles deve truncar para hora cheia (date_trunc('hour', now())) contra correlação temporal.

---

### 4. FLUXO DE EXECUÇÃO
1. Atualize src/lib/crypto-token.ts e src/db/schema/recovery.ts.
2. Gere a migration via pnpm --filter @ancora/api db:generate --name decouple_account_token_lgpd.
3. Aplique via pnpm --filter @ancora/api db:migrate.
4. Refatore src/routes/auth.ts.
5. Valide via pnpm typecheck e execute testes via curl comprovando o sucesso.
```

---

## 6. Higiene de Git e Controle de Versão

* **Uma Branch por Lote/Feature:** Nomes padronizados seguindo a convenção `tipo/escopo-descricao` (ex: `fix/sprint-3.5-lote-1-clinical-safety`).
* **Um Commit Atômico por Prompt:** Cada prompt executado com sucesso e validado pelo engenheiro gera um commit semântico imediato:
  - Formato: `fix(modulo): RXX - descrição concisa da alteração`.
* **Merge Limpo na Main:** Concluído o lote e testado o fluxo de ponta a ponta, a branch é mesclada na `main` e enviada ao GitHub remoto.

---

## 7. Invariantes de Arquitetura e Segurança do Âncora

Qualquer IA que atue neste projeto deve respeitar obrigatoriamente as seguintes diretrizes fundamentais:

1. **Desacoplamento Criptográfico LGPD (Art. 13, § 4º):**
   - Dados civis/cadastrais (`auth_security.users`) **NUNCA** se conectam via Foreign Key direta com dados comunitários ou de saúde (`recovery_core.profiles`, `checkins`).
   - O vínculo existe apenas na memória da API via token derivado por HMAC com segredo versionado (`APP_PEPPER_V1`).
   - Um dump bruto do PostgreSQL não pode permitir correlação por `JOIN` relacional ou por proximidade de milissegundos de timestamps.
2. **Zero Injeção de Identidade no JWT:**
   - O token JWT transporta apenas `{ sub: user.id, role, persona }`. **Nunca incluir `profileId` ou e-mail no payload base64**.
3. **Semáforo SOS Offline-First:**
   - As ferramentas de contenção de crise (Respiração 4-7-8, Ancoragem 5-4-3-2-1, discagem para 188 CVV e 192 SAMU) devem funcionar sem internet e estar acessíveis na raiz do app mobile, **mesmo para usuários deslogados**.
4. **Linguagem Clínica Responsável (RFC 002):**
   - Proibido o uso de termos deterministas como *"Você superou este momento"* ou promessas fisiológicas sem citação científica. Utilizar linguagem de acolhimento e travessia temporária.
5. **Cálculo de Dias Distintos na Jornada:**
   - O contador de dias acumulados deve sempre utilizar `COUNT(DISTINCT DATE(created_at))`. Múltiplos check-ins no mesmo dia registram a oscilação da fissura sem inflar a contagem de dias.
6. **Política Anti-Enumeração:**
   - O sistema nunca deve confirmar publicamente se um e-mail possui ou não cadastro. Respostas de erro devem ser uniformes e com tempo de resposta equiparado.

---

## 8. Procedimento de Banco de Dados (Drizzle Migrations)
Conforme documentado no `RUNBOOK_MIGRATIONS.md`, as migrações seguem o modelo **Forward-Only**:
- Nunca editar arquivos `.sql` já carimbados na tabela `drizzle.__drizzle_migrations`.
- Nunca alterar o banco físico via GUI do DBeaver sem registrar migration.
- Sempre gerar migrações com nomes semânticos via `--name`.
- Em caso de inconsistência de metadados em ambiente de desenvolvimento local, utilizar o reset determinístico:
  `docker compose down -v && docker compose up -d && pnpm --filter @ancora/api db:migrate`.