# 📘 Especificação Técnica e Funcional — Sprint 1: Fundação, Infraestrutura e Schemas Segregados

- **Documento:** `specs/SPEC-SPRINT-01-FUNDACAO-E-INFRA.md`
- **Projeto:** Jornada Firme (Âncora) — Ecossistema de Saúde Comunitária e Mútua Ajuda (RFC 002)
- **Status:** ✅ Concluída e Auditada
- **Sprint:** Sprint 1 (Fase 0 — Setup de Monorepo, Migrations e Segregação LGPD)
- **Autor/Arquitetura:** Engenharia Jornada Firme
- **Stack Tecnológica:** Node.js 22 LTS, TypeScript 5.7+ (Strict Mode), pnpm Workspaces, Fastify 5.2, PostgreSQL 16 Alpine, Drizzle ORM 0.45, pg-boss 12.35, Pino Logger 9.x, Docker & Docker Compose

---

## 1. Visão Geral e Contexto Clínico/Arquitetural

### 1.1. Propósito da Sprint 1 na Filosofia Jornada Firme

A **Sprint 1** estabelece as fundações operacionais, estruturais e de governança do ecossistema **Jornada Firme**, conforme balizado pela [RFC 002 v3.1](file:///home/thales/Projetos/Ancora/specs/RFC-002.md). O projeto propõe a construção de um ambiente digital seguro, anônimo e sem estigmas para pessoas em recuperação da dependência química e seus familiares (o "NA Virtual").

Para garantir o manifesto do produto (**Apoio > Retenção**, **Horizontalidade Radical**, **Linguagem Não-Prescritiva** e **Privacidade Estrutural**), a infraestrutura construída nesta sprint adota três premissas inegociáveis:
1. **Segurança e Privacidade desde o Primeiro Byte (*Privacy by Design*):** A segregação física/lógica de dados sensíveis de saúde em relação aos dados cadastrais e de sessão, em cumprimento estrito ao Artigo 13, § 4º da LGPD.
2. **Determinismo Operacional e Zero Débito Técnico:** Um monorepo com tipagem estrita de ponta a ponta (`strict: true`, `noImplicitAny: true`, `@typescript-eslint/no-explicit-any: error`), garantindo que tanto o backend da API quanto os frontends compartilhem padrões rigorosos de qualidade.
3. **Simplicidade e Resiliência de Infraestrutura:** Eliminação de dependências operacionais supérfluas no MVP, assegurando que o sistema possa ser implantado e executado com previsibilidade de custos e alta tolerância a falhas.

```
+-----------------------------------------------------------------------------------------+
|                                ARQUITETURA DA SPRINT 1                                  |
+-----------------------------------------------------------------------------------------+
                                      pnpm Monorepo
               +---------------------------+---------------------------+
               |                           |                           |
        apps/api (Fastify)        apps/mobile (Expo)          apps/admin (Vite)
        - Fastify 5.2             - React Native 0.86         - React 18.3
        - Drizzle ORM 0.45        - Expo 57                   - Tailwind CSS 3.4
        - pg-boss 12.35           - Safe Area Context         - Lucide Icons
        - Pino Logger             - Metro Runtime             - PostCSS / Autoprefixer
               |
               +---------------------------+
                                           | Pool TCP (max: 15)
                                           v
                              +--------------------------+
                              |   Docker Compose:        |
                              |   ancora-postgres (PG 16) |
                              +--------------------------+
                                           |
        +----------------------------------+----------------------------------+
        |                                  |                                  |
        v                                  v                                  v
+--------------------+            +--------------------+            +--------------------+
|   auth_security    |            |   recovery_core    |            |       pgboss       |
|  (Acesso / Contas) |            |  (Saúde / Jornada) |            | (Filas Assíncronas)|
| - users            |            | - profiles         |            | - job              |
|                    |            | - checkins         |            | - schedule         |
+--------------------+            +--------------------+            +--------------------+
```

---

### 1.2. Justificativa Técnica: "Zero Redis" no MVP

Uma das decisões de engenharia mais relevantes da Sprint 1 foi a rejeição expressa da introdução de uma instância do Redis na arquitetura inicial, optando pelo **PostgreSQL 16 como storage transacional e motor de mensageria assíncrona**.

| Vetor de Análise | Estratégia Convencional (Postgres + Redis) | Estratégia Adotada (Postgres 16 + pg-boss) | Vantagem para o Jornada Firme |
| :--- | :--- | :--- | :--- |
| **Complexidade Operacional** | Gerenciar dois bancos stateful (Postgres e Redis), configurar persistência RDB/AOF, políticas de evicção de memória e monitoramento duplo. | Apenas um serviço stateful no Docker Compose (`ancora-postgres`). | Redução drástica da superfície de incidentes e simplicidade de manutenção por equipe enxuta. |
| **Consistência e Transacionalidade** | Problema das Duas Fases (*Dual-Write Problem*): gravar no Postgres e enfileirar no Redis pode gerar perda de mensagens se o Redis falhar no meio do fluxo. | **Transações ACID Nativas**: jobs de segundo plano podem ser gravados na mesma transação atômica que manipula dados de negócio. | Garantia de que nenhuma rotina assíncrona (como expurgo LGPD ou notificações) se perca por falha de sincronia. |
| **Mecanismo de Lock em Fila** | Requer locks distribuídos baseados em Redis (Redlock), propensos a condições de corrida em partições de rede. | **`FOR UPDATE SKIP LOCKED` nativo do Postgres**: concorrência ultra-robusta no nível do kernel relacional. | Processamento de tarefas por múltiplos workers sem contenção de lock ou starvation. |
| **Custo de Infraestrutura** | Memória RAM dedicada no cluster para manter filas e chaves voláteis do Redis. | Reaproveitamento do pool de conexões do PostgreSQL já provisionado. | Otimização máxima de recursos financeiros em fase pré-receita. |
| **Backup e Disaster Recovery** | Backups assíncronos descompassados entre o snapshot do Postgres e o dump do Redis. | `pg_dump` único e determinístico abrange estado relacional, filas ativas e histórico de jobs. | RPO e RTO idênticos para dados relacionais e eventos assíncronos. |

---

## 2. Detalhamento Técnico das Tarefas da Sprint 1

### TASK-101: Estruturação do Monorepo e Configurações Base

#### 1. Escopo e Motivação
O repositório foi unificado sob a ferramenta `pnpm` (versão 12.8.1) utilizando a especificação de workspaces, centralizando o controle de dependências, padronização de formatação e linters em uma raiz única. A motivação primária é garantir compatibilidade e compartilhamento imediato de regras contratuais e tipagens TypeScript entre a API (`@ancora/api`), o aplicativo móvel (`@ancora/mobile`) e o painel administrativo (`@ancora/admin`).

#### 2. Configurações Reais Implementadas

##### A. Workspace pnpm (`pnpm-workspace.yaml`)
Define que todos os pacotes residem sob o diretório `apps/*`, com autorização explícita de compilação nativa para as dependências críticas de criptografia e bundle:
```yaml
packages:
  - 'apps/*'
allowBuilds:
  argon2: true
  esbuild: true
```

##### B. Manifesto Raiz (`package.json`)
Centraliza scripts de orquestração do monorepo e dependências de linting/formatting:
```json
{
  "name": "ancora-monorepo",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@12.8.1",
  "scripts": {
    "dev:api": "pnpm --filter @ancora/api dev",
    "dev:admin": "pnpm --filter @ancora/admin dev",
    "dev:mobile": "pnpm --filter @ancora/mobile start",
    "build": "pnpm -r build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r --if-present test"
  },
  "devDependencies": {
    "@eslint/js": "^9.21.0",
    "eslint": "^9.21.0",
    "eslint-config-prettier": "^10.0.1",
    "prettier": "^3.5.2",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.25.0"
  }
}
```

##### C. TypeScript Base (`tsconfig.base.json`)
Fornece a matriz de tipagem estrita para todos os workspaces do monorepo, ativando `strict: true`, `noUncheckedIndexedAccess: true` e módulos modernos `NodeNext`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

##### D. Configuração do ESLint (`eslint.config.mjs`)
Adota o padrão moderno *Flat Config* do ESLint 9+, impondo tolerância zero ao tipo `any`:
```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/vite.config.ts.*',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
```

---

### TASK-102: Setup do PostgreSQL 16 e Docker Compose

#### 1. Escopo e Motivação
Provisionamento da base de dados relacional oficial do projeto através de container isolado. A versão PostgreSQL 16 Alpine foi selecionada pela performance do otimizador de consultas em consultas particionadas/multi-schema e pela leveza da imagem Alpine (~80MB).

#### 2. Configuração do `docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ancora-postgres
    restart: unless-stopped
    ports:
      - '127.0.0.1:5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ancora_db
    volumes:
      - ancora_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d ancora_db']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  ancora_pgdata:
```

#### 3. Decisões de Segurança e Conectividade
- **Binding estrito em Loopback (`127.0.0.1:5432:5432`):** Impede a exposição indevida da porta do banco para a rede local (Wi-Fi/LAN) da máquina do desenvolvedor.
- **Volume persistente nomeado (`ancora_pgdata`):** Garante a preservação de dados entre recriações do container sem poluir pastas relativas do código.
- **Healthcheck Ativo (`pg_isready`):** Monitora periodicamente a prontidão do socket PostgreSQL, permitindo que scripts automatizados e pipelines de CI aguardem o banco antes de executar migrações.

---

### TASK-103: Multi-Schema e Drizzle ORM

#### 1. Escopo e Motivação Legal (LGPD Art. 13, § 4º)
A legislação brasileira de proteção de dados pessoais (Lei 13.709/2018 - LGPD) impõe deveres estritos de salvaguarda sobre dados sensíveis de saúde e vida íntima (Artigo 5º, II e Artigo 11). O Artigo 13, § 4º prevê expressamente:
> *"Para os efeitos deste artigo, a anonimização e a pseudonimização serão mantidas e garantidas em ambiente controlado e seguro..."*

Para atender a esse mandamento desde a fundação, a arquitetura de dados rejeitou o padrão simplista de manter todas as tabelas no schema padrão `public`. Foram criados schemas isolados com fronteiras semânticas e operacionais claras:
1. `auth_security`: Custódia de credenciais de acesso, controle de maioridade (18+), autorização e sessões.
2. `recovery_core`: Custódia dos dados de jornada clínica comunitária, pseudônimos, avatares e check-ins de fissura.

#### 2. Configuração do Drizzle Kit (`apps/api/drizzle.config.ts`)
O arquivo de configuração do Drizzle orquestra o rastreamento exclusivo dos schemas da aplicação, blindando o schema interno `pgboss` e o schema `public` contra interferências do ORM:
```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['auth_security', 'recovery_core'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### 3. Pool de Conexões Postgres.js (`apps/api/src/db/index.ts`)
A camada de acesso a dados utiliza a biblioteca `postgres` (postgres.js) conectada à instância do Drizzle, configurada com dimensionamento controlado de recursos:
```typescript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../env.js';
import * as schema from './schema/index.js';

export const client = postgres(env.DATABASE_URL, {
  max: 15,
  idle_timeout: 30,
  connect_timeout: 5,
  max_lifetime: 3600,
});
export const db = drizzle(client, { schema });
```
- `max: 15`: Pool dimensionado para concorrência de desenvolvimento e microsserviço leve.
- `idle_timeout: 30`: Libera conexões ociosas após 30 segundos.
- `connect_timeout: 5`: Falha rápida (5s) em caso de indisponibilidade do banco.
- `max_lifetime: 3600`: Reciclagem periódica de sockets a cada 1 hora para evitar vazamentos de recursos em conexões de longa duração.

---

### TASK-104: pg-boss e Fila Assíncrona no PostgreSQL

#### 1. Escopo e Motivação
Processamento em segundo plano de tarefas assíncronas (como limpeza de dados, sanitizações periódicas, envio de avisos futuros e expurgos) sem a necessidade de manter workers em nós separados ou introduzir Redis/RabbitMQ. O `pg-boss` opera inteiramente sobre tabelas do PostgreSQL utilizando recursos de lock transacional.

#### 2. Isolamento de Schema e Instanciação (`apps/api/src/queue/boss.ts`)
O engine do pg-boss é direcionado para o schema dedicado `pgboss`, garantindo total separação física das tabelas de negócio:
```typescript
import { PgBoss, type ConstructorOptions } from 'pg-boss';
import { env } from '../env.js';

export const bossConfig: ConstructorOptions = {
  connectionString: env.DATABASE_URL,
  schema: 'pgboss',
  application_name: 'ancora-api',
  max: 5,
  supervise: true,
  monitorVacuum: true,
};

export const boss = new PgBoss(bossConfig);
```
- `schema: 'pgboss'`: Cria e isola automaticamente suas 10+ tabelas internas (`job`, `version`, `schedule`, etc.) sem poluir `auth_security` ou `recovery_core`.
- `application_name: 'ancora-api'`: Facilita rastreamento de conexões via `pg_stat_activity`.
- `max: 5`: Pool independente e reservado de até 5 conexões para as filas.
- `supervise: true` e `monitorVacuum: true`: Gerenciamento automático de jobs travados e limpeza periódica de registros concluídos.

#### 3. Ciclo de Vida e Wrapper da Fila (`apps/api/src/queue/index.ts`)
O wrapper fornece controle de estado de execução (`isRunning`), inicialização assíncrona com tratamento de erros e desligamento gracioso (*graceful shutdown*):
```typescript
import type { SendOptions } from 'pg-boss';
import { boss } from './boss.js';

export { boss, bossConfig } from './boss.js';

let isRunning = false;

boss.on('error', (error) => {
  console.error('❌ [Queue] Erro no PgBoss:', error);
});

boss.on('stopped', () => {
  isRunning = false;
});

export const startQueue = async (): Promise<void> => {
  if (isRunning) {
    return;
  }
  await boss.start();
  isRunning = true;
  console.log('🚀 [Queue] PgBoss iniciado com sucesso no schema "pgboss"');
};

export const stopQueue = async (): Promise<void> => {
  if (!isRunning) {
    return;
  }
  await boss.stop({ graceful: true });
  isRunning = false;
  console.log('🛑 [Queue] PgBoss encerrado graciosamente');
};

export const isQueueRunning = (): boolean => {
  return isRunning;
};

export const DEFAULT_JOB_OPTIONS: SendOptions = {
  retryLimit: 3,
  retryDelay: 5,
  retryBackoff: true,
  expireInSeconds: 15 * 60,
  retentionSeconds: 7 * 24 * 3600,
  deleteAfterSeconds: 7 * 24 * 3600,
};

export const sendJob = async <T extends object>(
  name: string,
  data: T,
  options?: SendOptions,
): Promise<string | null> => {
  return boss.send(name, data, {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
  });
};
```

#### 4. Integração com o Ciclo de Vida do Fastify (`server.ts`)
No bootstrap da aplicação (`apps/api/src/server.ts`), a fila é iniciada antes da abertura do socket HTTP e registrada no gancho de fechamento do servidor:
- **No Startup:** `await startQueue();` garante que os workers estejam prontos para processar tarefas antes de qualquer requisição externa ser aceita.
- **No Encerramento:** `app.addHook('onClose', async () => { await stopQueue(); });` garante que requisições em trânsito ou jobs em execução finalizem normalmente antes da drenagem do processo sob `SIGTERM` ou `SIGINT`.

---

### TASK-105: Pino Logger e Sanitização de Dados (Redaction)

#### 1. Escopo e Motivação de Segurança Clínica
O vazamento acidental de dados sensíveis em logs operacionais (*Log Data Leakage*) é uma das violações de segurança mais severas em sistemas de saúde digital. Caso uma rota capture um parâmetro de query, um payload de check-in de fissura ou um cabeçalho HTTP de autenticação, o logger não pode, sob hipótese alguma, gravar tais informações em texto aberto no disco ou agregadores de logs (ex: Datadog, CloudWatch).

#### 2. Configuração Completa do Logger (`apps/api/src/lib/logger.ts`)
O logger oficial da API foi estruturado com base no **Pino**, com regras de mascaramento profundo (*deep redaction*) de 38 caminhos de propriedades:

```typescript
import type { FastifyServerOptions } from 'fastify';
import { env } from '../env.js';

export const REDACTED_PATHS = [
  // Credenciais e Autenticação
  'password',
  '*.password',
  '*.*.password',
  'passwordHash',
  '*.passwordHash',
  '*.*.passwordHash',
  'token',
  '*.token',
  '*.*.token',
  'refreshToken',
  '*.refreshToken',
  '*.*.refreshToken',
  'accessToken',
  '*.accessToken',
  '*.*.accessToken',

  // Headers sensíveis
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  'authorization',
  '*.authorization',
  'cookie',
  '*.cookie',

  // Dados Pessoais e LGPD
  'email',
  '*.email',
  '*.*.email',
  'ip',
  '*.ip',
  'req.ip',
  'remoteAddress',
  '*.remoteAddress',
  'req.remoteAddress',

  // Dados de Saúde e Recuperação
  'cravingLevel',
  '*.cravingLevel',
  '*.*.cravingLevel',
  'notes',
  '*.notes',
  '*.*.notes',
  'emergencyPlans',
  '*.emergencyPlans',
  '*.*.emergencyPlans',
  'mood',
  '*.mood',
  '*.*.mood',
];

export const loggerConfig: FastifyServerOptions['logger'] = {
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: {
    paths: REDACTED_PATHS,
    censor: '[Redacted]',
  },
  serializers: {
    err: (err: unknown) => {
      const errorObj = err && typeof err === 'object' ? (err as Record<string, unknown>) : {};
      const name = String(errorObj.name || 'Error');
      const constructorName =
        (err as { constructor?: { name?: string } } | null | undefined)?.constructor?.name ?? '';
      const causeObj =
        errorObj.cause && typeof errorObj.cause === 'object'
          ? (errorObj.cause as Record<string, unknown>)
          : undefined;

      const isDb =
        name === 'DrizzleQueryError' ||
        name === 'PostgresError' ||
        constructorName === 'PostgresError' ||
        constructorName === 'DrizzleQueryError' ||
        'query' in errorObj ||
        'params' in errorObj ||
        Boolean(
          causeObj &&
          ('query' in causeObj ||
            'params' in causeObj ||
            causeObj.name === 'PostgresError' ||
            causeObj.name === 'DrizzleQueryError'),
        );

      if (isDb) {
        const code = (errorObj.code || causeObj?.code) as string | undefined;
        const finalName = name === 'Error' ? (causeObj?.name as string) || 'PostgresError' : name;
        return {
          type: finalName,
          name: finalName,
          code,
          message: 'Falha na execução da query de banco de dados',
          stack: '',
        };
      }

      return {
        ...errorObj,
        type: String(errorObj.type || errorObj.name || 'Error'),
        name: String(errorObj.name || 'Error'),
        message: String(errorObj.message || 'Error'),
        stack: String(errorObj.stack || ''),
      };
    },
  },
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
};
```

#### 3. Mecanismo de Sanitização de Exceções de Banco (*SQL Parameter Shielding*)
Um ponto alto da implementação da TASK-105 é o serializer customizado `serializers.err`. Em instâncias padrão do Drizzle ORM ou PostgreSQL, quando uma query falha por violação de constraint ou erro de sintaxe, o driver anexa ao objeto de erro os campos `query` e `params: [...]`. 

Se esse erro for cuspido diretamente para o logger, parâmetros confidenciais (ex: níveis de fissura, pseudônimos, e-mails legados) seriam gravados em disco. O serializer intercepta qualquer erro associado ao Postgres/Drizzle, extrai apenas o código da falha (`errorObj.code`) e suprime completamente as strings de SQL, parâmetros e stack trace interno, registrando a mensagem sanitizada: `"Falha na execução da query de banco de dados"`.

---

## 3. Catálogo de Arquivos Envolvidos e Responsabilidades

A tabela a seguir correlaciona os arquivos reais existentes no repositório com suas finalidades na arquitetura:

| Caminho do Arquivo | Responsabilidade Arquitetural / Função Técnica |
| :--- | :--- |
| [`package.json`](file:///home/thales/Projetos/Ancora/package.json) | Raiz do monorepo; declara workspaces pnpm, scripts globais de build/lint/test e dependências compartilhadas. |
| [`pnpm-workspace.yaml`](file:///home/thales/Projetos/Ancora/pnpm-workspace.yaml) | Configuração de pacotes do workspace (`apps/*`) e permissão de compilação nativa para `argon2` e `esbuild`. |
| [`tsconfig.base.json`](file:///home/thales/Projetos/Ancora/tsconfig.base.json) | Configuração TypeScript global estrita herdada por todos os projetos (`strict: true`, `NodeNext`). |
| [`eslint.config.mjs`](file:///home/thales/Projetos/Ancora/eslint.config.mjs) | Configuração do ESLint 9 (Flat Config) impondo a regra `@typescript-eslint/no-explicit-any: error`. |
| [`docker-compose.yml`](file:///home/thales/Projetos/Ancora/docker-compose.yml) | Definição do container de banco de dados `ancora-postgres` (PostgreSQL 16 Alpine), portas e healthcheck. |
| [`apps/api/package.json`](file:///home/thales/Projetos/Ancora/apps/api/package.json) | Dependências e scripts de execução do backend (`dev`, `build`, `start`, `db:generate`, `db:migrate`). |
| [`apps/api/tsconfig.json`](file:///home/thales/Projetos/Ancora/apps/api/tsconfig.json) | Estende `tsconfig.base.json` direcionando saída para `dist/` e raiz em `src/`. |
| [`apps/api/drizzle.config.ts`](file:///home/thales/Projetos/Ancora/apps/api/drizzle.config.ts) | Configuração do Drizzle Kit com filtro estrito para schemas `auth_security` e `recovery_core`. |
| [`apps/api/src/env.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/env.ts) | Validação e tipagem de variáveis de ambiente em tempo de inicialização via Zod schema. |
| [`apps/api/src/server.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/server.ts) | Bootstrap do servidor Fastify, registro de ganchos (`onClose`), tratamento global de erros e endpoint `/health`. |
| [`apps/api/src/db/index.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/db/index.ts) | Configuração do pool de conexões com `postgres.js` e inicialização da instância Drizzle ORM. |
| [`apps/api/src/db/migrate.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/db/migrate.ts) | Script determinístico e canônico para execução programática de migrações SQL compiladas. |
| [`apps/api/src/db/schema/index.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/index.ts) | Ponto central de reexportação dos schemas da aplicação (`auth.ts` e `recovery.ts`). |
| [`apps/api/src/db/schema/auth.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/auth.ts) | Definição Drizzle do schema `auth_security` (tabelas de credenciais, sessões e consentimentos). |
| [`apps/api/src/db/schema/recovery.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/recovery.ts) | Definição Drizzle do schema `recovery_core` (perfis de recuperação, pseudônimos e check-ins). |
| [`apps/api/src/queue/boss.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/queue/boss.ts) | Instanciação do engine `pg-boss` configurado para operar isolado no schema `pgboss`. |
| [`apps/api/src/queue/index.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/queue/index.ts) | Fachada e controle de ciclo de vida da fila assíncrona (`startQueue`, `stopQueue`, `sendJob`). |
| [`apps/api/src/lib/logger.ts`](file:///home/thales/Projetos/Ancora/apps/api/src/lib/logger.ts) | Configuração do Pino Logger, matriz de redaction de dados sensíveis e sanitização de erros SQL. |
| [`apps/api/drizzle/0000_flat_wild_pack.sql`](file:///home/thales/Projetos/Ancora/apps/api/drizzle/0000_flat_wild_pack.sql) | DDL bruto da migração inicial fundacional (Sprint 1) gerada pelo Drizzle Kit. |
| [`apps/mobile/package.json`](file:///home/thales/Projetos/Ancora/apps/mobile/package.json) | Manifesto do aplicativo React Native / Expo com `@ancora/mobile`. |
| [`apps/admin/package.json`](file:///home/thales/Projetos/Ancora/apps/admin/package.json) | Manifesto da interface web administrativa `@ancora/admin` baseada em Vite + React + Tailwind. |

---

## 4. Modelagem de Dados e Schemas Drizzle

### 4.1. Definição TypeScript Original da Sprint 1

Na Sprint 1, a modelagem foi construída para validar a viabilidade dos múltiplos schemas e as conexões entre o registro de usuário e a persona de recuperação. Abaixo está a representação conceitual das tabelas conforme estruturadas no Drizzle ORM:

```typescript
// --- Schema auth_security ---
export const authSchema = pgSchema('auth_security');

export const users = authSchema.table('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isAdult: boolean('is_adult').notNull().default(false),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Schema recovery_core ---
export const recoverySchema = pgSchema('recovery_core');

export const profiles = recoverySchema.table('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  pseudonym: varchar('pseudonym', { length: 50 }).notNull().unique(),
  avatarId: varchar('avatar_id', { length: 50 }).notNull().default('avatar_default'),
  persona: varchar('persona', { length: 20 }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const checkins = recoverySchema.table('checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  cravingLevel: integer('craving_level').notNull(),
  mood: varchar('mood', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

*(Nota de Governança Arquitetural: Nas sprints subsequentes de Hardening, como a Sprint 3.5, a Foreign Key direta `user_id` e a coluna `email` foram eliminadas em favor do desacoplamento criptográfico Zero-PII via HMAC e chave Crockford, conforme documentado no histórico evolutivo de migrations).*

---

### 4.2. DDL Físico Compilado — Migration 0000 (`0000_flat_wild_pack.sql`)

O arquivo canônico gerado pelo Drizzle Kit para a Sprint 1 reflete a criação literal dos schemas, tabelas, constraints e índices no PostgreSQL:

```sql
CREATE SCHEMA "auth_security";
--> statement-breakpoint
CREATE SCHEMA "recovery_core";
--> statement-breakpoint
CREATE TABLE "auth_security"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_adult" boolean DEFAULT false NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"craving_level" integer NOT NULL,
	"mood" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_core"."profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pseudonym" varchar(50) NOT NULL,
	"avatar_id" varchar(50) DEFAULT 'avatar_default' NOT NULL,
	"persona" varchar(20) NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_pseudonym_unique" UNIQUE("pseudonym")
);
--> statement-breakpoint
ALTER TABLE "recovery_core"."checkins" ADD CONSTRAINT "checkins_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "recovery_core"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recovery_core"."profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_security"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_checkins_profile_created" ON "recovery_core"."checkins" USING btree ("profile_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_profiles_last_seen" ON "recovery_core"."profiles" USING btree ("last_seen_at");
```

---

### 4.3. Pipeline de Versionamento e Execução de Migrations

O Drizzle ORM opera através de uma esteira canônica dividida em geração e aplicação:

```
[ Schemas TypeScript ] ──► (drizzle-kit generate) ──► [ SQL + Snapshots JSON ] ──► (tsx src/db/migrate.ts) ──► [ PostgreSQL ]
```

1. **Compilação DDL:** O comando `pnpm --filter @ancora/api db:generate` inspeciona a AST do TypeScript em `src/db/schema/index.ts`, compara com o snapshot mais recente em `drizzle/meta/` e gera o novo arquivo SQL sequencial em `drizzle/000X_...sql`.
2. **Execução Programática (`apps/api/src/db/migrate.ts`):** O script `migrate.ts` instancia um pool dedicado temporário de concorrência 1 (`max: 1`) para evitar deadlocks de DDL e aplica as migrações pendentes registrando o hash no schema de controle `drizzle.__drizzle_migrations`:
```typescript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  console.log('⏳ Executando migrations...');

  const drizzleFolder = path.resolve(__dirname, '../../drizzle');
  await migrate(db, { migrationsFolder: drizzleFolder });

  console.log('✅ Migrations aplicadas com sucesso!');
  await migrationClient.end();
  process.exit(0);
};

runMigrations().catch(async (error) => {
  console.error('❌ Erro ao aplicar migrations:', error);
  process.exit(1);
});
```

---

## 5. Contratos de Endpoints e Diagnóstico: Rota `GET /health`

### 5.1. Implementação no Fastify (`apps/api/src/server.ts`)

A verificação de saúde foi estruturada não como uma resposta estática de ping, mas como uma **sondagem ativa de subsistemas** (*Active Readiness Probe*), testando a conectividade real com a base de dados via query SQL (`SELECT 1`) e inspecionando o worker do `pg-boss`:

```typescript
app.get('/health', async (request, reply) => {
  let databaseStatus = 'disconnected';
  let queueStatus = 'stopped';

  try {
    await db.execute(sql`SELECT 1`);
    databaseStatus = 'connected';
  } catch (error) {
    request.log.error(error, 'Falha no healthcheck do banco de dados');
  }

  if (isQueueRunning()) {
    queueStatus = 'running';
  }

  const isHealthy = databaseStatus === 'connected' && queueStatus === 'running';

  const response = {
    status: isHealthy ? 'ok' : 'error',
    app: 'ancora-api',
    database: databaseStatus,
    queue: queueStatus,
    timestamp: new Date().toISOString(),
  };

  if (!isHealthy) {
    return reply.status(503).send(response);
  }

  return response;
});
```

### 5.2. Contrato de Resposta HTTP

#### Cenário 1: Todos os Subsistemas Operacionais (HTTP 200 OK)
- **Método:** `GET`
- **URL:** `/health`
- **Headers de Resposta:**
  - `Content-Type: application/json; charset=utf-8`
  - `x-request-id: <uuid>`
- **Corpo da Resposta:**
```json
{
  "status": "ok",
  "app": "ancora-api",
  "database": "connected",
  "queue": "running",
  "timestamp": "2026-10-04T05:30:00.000Z"
}
```

#### Cenário 2: Falha no Banco ou Fila Parada (HTTP 503 Service Unavailable)
Caso o banco de dados caia ou a fila não esteja ativa, o endpoint retorna código HTTP 503, acionando o descarte de tráfego em balanceadores de carga (como NGINX, Traefik ou ingress Kubernetes):
```json
{
  "status": "error",
  "app": "ancora-api",
  "database": "disconnected",
  "queue": "stopped",
  "timestamp": "2026-10-04T05:30:00.000Z"
}
```

---

## 6. Procedimentos Operacionais e Runbook do Desenvolvedor

### 6.1. Pré-Requisitos do Ambiente Local
- **Node.js:** Versão 22.x LTS (mínimo v20.12+)
- **pnpm:** Versão 12.8.x (ou v10+)
- **Docker & Docker Compose:** Versão 24+ com suporte a Compose V2

---

### 6.2. Inicialização do Ambiente do Zero (Bootstrap)

#### Passo 1: Instalação das dependências
Na raiz do projeto:
```bash
pnpm install
```

#### Passo 2: Provisionar as variáveis de ambiente
Crie o arquivo `apps/api/.env` com as configurações locais de desenvolvimento:
```env
NODE_ENV=development
PORT=3333
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/ancora_db
JWT_SECRET=super_secret_jwt_key_with_at_least_32_characters_long!
APP_PEPPER_SECRET=super_secret_pepper_key_with_at_least_32_chars!
APP_PEPPER_V1=super_secret_pepper_v1_key_with_at_least_32_chars!
```

#### Passo 3: Subir a infraestrutura PostgreSQL
```bash
docker compose up -d
```
Verifique se o container está saudável:
```bash
docker ps --filter "name=ancora-postgres"
```

#### Passo 4: Executar as migrações de banco
```bash
pnpm --filter @ancora/api db:migrate
```

#### Passo 5: Inicializar o servidor da API
```bash
pnpm dev:api
```
O console registrará o bootstrap com sucesso:
```
🚀 [Queue] PgBoss iniciado com sucesso no schema "pgboss"
Servidor Âncora API iniciado em http://0.0.0.0:3333
```

#### Passo 6: Validar saúde da aplicação
```bash
curl -i http://localhost:3333/health
```

---

### 6.3. Esteira de Evolução de Schemas (Novas Migrations)

Conforme estabelecido no [Runbook de Migrations](file:///home/thales/Projetos/Ancora/specs/RUNBOOK_MIGRATIONS.md):
1. **Alteração de Código:** Edite os arquivos de schema em `apps/api/src/db/schema/`.
2. **Geração Semântica:**
   ```bash
   pnpm --filter @ancora/api db:generate --name <nome_da_alteracao>
   ```
3. **Revisão Obrigatória:** Inspecione o SQL gerado em `apps/api/drizzle/` para certificar-se de que não há perda destrutiva de dados.
4. **Aplicação:**
   ```bash
   pnpm --filter @ancora/api db:migrate
   ```

---

### 6.4. O "Botão de Pânico": Procedimento de Reset Determinístico Local

Em cenários de desenvolvimento local onde o estado físico do PostgreSQL divergir de migrações em desenvolvimento ou os metadados de snapshot travarem, execute a sequência de reset canônico:

```bash
# 1. Derrubar o container e destruir o volume persistente do Docker
docker compose down -v

# 2. Subir um PostgreSQL virgem do zero
docker compose up -d

# 3. Reaplicar todas as migrações sequenciais desde a 0000
pnpm --filter @ancora/api db:migrate
```

---

### 6.5. Validação Estática e Testes

Antes de submeter código ou criar pull requests para a branch `main`:

```bash
# 1. Checagem estrita de tipos em todos os workspaces
pnpm typecheck

# 2. Execução das regras de linter
pnpm lint

# 3. Verificação de formatação de código
pnpm format:check

# 4. Execução da suíte de testes unitários (Vitest)
pnpm test
```

---

## 7. Critérios de Auditoria e Conformidade (Exit Criteria)

| Requisito / Critério de Parada | Status | Comprovação no Repositório |
| :--- | :---: | :--- |
| **Monorepo e Workspaces pnpm** | ✅ Conforme | Configurado em `pnpm-workspace.yaml` e `package.json` raiz (`@ancora/api`, `@ancora/mobile`, `@ancora/admin`). |
| **PostgreSQL 16 e Multi-Schema** | ✅ Conforme | `docker-compose.yml` (`postgres:16-alpine`), schemas `auth_security`, `recovery_core` e `pgboss`. |
| **Tipagem Estrita e Linters** | ✅ Conforme | `tsconfig.base.json` (`strict: true`), `eslint.config.mjs` (`@typescript-eslint/no-explicit-any: error`). |
| **Fila Assíncrona no Postgres** | ✅ Conforme | `pg-boss` isolado no schema `pgboss`, gerenciado via `apps/api/src/queue/` com lifecycle no Fastify. |
| **Sanitização e Redaction de Logs** | ✅ Conforme | Matriz de redaction em `apps/api/src/lib/logger.ts` cobrindo 38 campos sensíveis e sanitizador de erros SQL. |
| **Healthcheck Ativo** | ✅ Conforme | Rota `GET /health` em `apps/api/src/server.ts` executando `SELECT 1` e validando worker de fila. |
| **Esteira de Migrações e Runbook** | ✅ Conforme | Scripts `db:generate`, `db:migrate` (`apps/api/src/db/migrate.ts`) e SOP de reset via `docker compose down -v`. |
