# ⚓ Âncora — Plataforma Digital de Apoio Contínuo à Recuperação

Plataforma de apoio contínuo à recuperação de dependências químicas e hábitos de proteção, estruturada como um **Monorepo** moderno com TypeScript estrito, arquitetura modular e conformidade com diretrizes de privacidade e anonimização (LGPD/RFC 002).

---

## 🏗️ Estrutura do Monorepo

O projeto é gerenciado via **pnpm workspaces** e composto por 3 aplicações principais:

```text
ancora/
├── .gitignore
├── .prettierrc
├── .prettierignore
├── eslint.config.mjs
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── README.md
└── apps/
    ├── api/          # Backend Fastify + TypeScript (porta padrão: 3333)
    ├── mobile/       # Aplicativo Mobile React Native / Expo
    └── admin/        # Painel Web de Moderação com React + Vite + Tailwind CSS
```

---

## 🚀 Guia de Início Rápido

### Pré-requisitos

- **Node.js**: >= 20.x (recomendado Node 22+)
- **pnpm**: >= 9.x ou 10+ (instalado globalmente via `npm install -g pnpm`)

### 1. Instalação das Dependências

Execute na raiz do projeto:

```bash
pnpm install
```

### 2. Validações de Qualidade de Código

- **Checagem de Tipos (TypeScript estrito em todos os apps):**
  ```bash
  pnpm typecheck
  ```
- **Linter (ESLint Flat Config):**
  ```bash
  pnpm lint
  ```
- **Formatação (Prettier):**
  ```bash
  pnpm format
  ```

---

## 📦 Execução dos Apps em Desenvolvimento

Você pode rodar cada aplicação diretamente a partir da raiz:

| Aplicação     | Comando           | Descrição                                    | URL / Ambiente          |
| :------------ | :---------------- | :------------------------------------------- | :---------------------- |
| **API**       | `pnpm dev:api`    | Fastify com recarga automática (`tsx watch`) | `http://localhost:3333` |
| **Admin Web** | `pnpm dev:admin`  | Vite + React + Tailwind CSS                  | `http://localhost:5173` |
| **Mobile**    | `pnpm dev:mobile` | Expo CLI (bundler Metro)                     | Expo Go / Emulador      |

### Verificação do Backend (`apps/api`)

Com a API rodando, teste a rota de integridade:

```bash
curl http://localhost:3333/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "app": "ancora-api",
  "timestamp": "2026-10-01T..."
}
```

---

## 🛡️ Padrões Arquiteturais e Segurança

- **TypeScript Estrito:** Definido centralizadamente em [`tsconfig.base.json`](./tsconfig.base.json) com `strict: true` e `noUncheckedIndexedAccess: true`.
- **Estilo Unificado:** Regras de linting e formatação compartilhadas por toda a base de código.
- **Isolamento de Domínio:** Segregação rígida entre os pacotes com workspaces declarados em [`pnpm-workspace.yaml`](./pnpm-workspace.yaml).
