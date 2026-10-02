# 📘 RUNBOOK: Procedimento Operacional Padrão (SOP) de Migrations no Drizzle

**Projeto:** Âncora  
**Objetivo:** Estabelecer o fluxo determinístico e canônico para evolução de schemas no PostgreSQL, evitando *schema drift*, travamento de snapshots e inconsistências em produção.

---

## 1. A Anatomia do Drizzle (O Triângulo de Estado)

Para não se perder, lembre-se de que o Drizzle gerencia o banco através de 3 camadas interdependentes:

```
                  1. CÓDIGO FONTE
             (src/db/schema/*.ts)
                     ▲
                     │ (drizzle-kit generate)
                     ▼
             2. ARQUIVOS DISCO
    (.sql + meta/_journal.json + meta/*_snapshot.json)
                     ▲
                     │ (drizzle-orm db:migrate)
                     ▼
             3. BANCO POSTGRESQL
    (Tabelas Reais + drizzle.__drizzle_migrations)
```

> ⚠️ **Regras de Ouro Inegociáveis:**
> 1. **Nunca altere o banco via DBeaver / GUI:** O banco físico deve ser alterado EXCLUSIVAMENTE pelo comando `db:migrate`.
> 2. **Nunca altere um arquivo `.sql` já carimbado no banco:** Se uma migration já rodou, o Drizzle não a reexecutará. Qualquer correção deve ser uma nova migration à frente (*Forward-Only*).
> 3. **Nunca apague arquivos `.sql` sem limpar o `_journal.json`:** O arquivo `.sql` e o `_journal.json` devem sempre estar 100% espelhados.

---

## 2. O Fluxo Padrão: Como Fazer Qualquer Alteração (Passo a Passo)

Sempre que surgir uma nova tabela, coluna, índice ou remoção de campo:

### Passo 1: Alterar o TypeScript
Edite os arquivos de schema em `apps/api/src/db/schema/` (ex: `recovery.ts` ou `auth.ts`).
* Adicione, renomeie ou remova as colunas desejadas usando a tipagem estrita do Drizzle.

### Passo 2: Gerar a Migration com Nome Semântico
No terminal da raiz, execute:
```bash
pnpm --filter @ancora/api db:generate --name <nome_descritivo_da_mudanca>
```
* *Exemplo:* `pnpm --filter @ancora/api db:generate --name add_safety_plan_table`
* ⚠️ **Atenção ao Terminal:** Se você estiver renomeando ou deletando colunas, o Drizzle Kit fará uma pergunta interativa no terminal. Selecione com as setas se é um *rename* ou *delete/create* e dê Enter.

### Passo 3: Inspecionar o SQL Gerado (Code Review)
Abra a pasta `apps/api/drizzle/` e **leia o arquivo `.sql` recém-criado**:
* O SQL gerado reflete exatamente o que você pretendia?
* Há alguma operação destrutiva inesperada?
* Se algo estiver errado, **não edite o banco ainda**. Apague o arquivo `.sql` novo, remova a última entrada do `_journal.json` e repita o Passo 1.

### Passo 4: Aplicar a Migration no Banco
No terminal:
```bash
pnpm --filter @ancora/api db:migrate
```
* O migrador lerá o arquivo, executará o DDL no PostgreSQL e registrará o carimbo de execução na tabela `drizzle.__drizzle_migrations`.

### Passo 5: Validar e Comitar
1. Abra o DBeaver, dê um **Refresh (`F5`)** e confira a estrutura física atualizada.
2. Rode o typecheck: `pnpm typecheck`.
3. Comite todos os arquivos juntos no Git:
   * O código TS alterado (`src/db/schema/`);
   * O arquivo `.sql` gerado (`drizzle/000X_...sql`);
   * Os metadados (`drizzle/meta/_journal.json` e `drizzle/meta/000X_snapshot.json`).

---

## 3. Guia de Resolução de Problemas (Troubleshooting)

### Cenário A: Erro de `contains null values` ao rodar `db:migrate`
* **Causa:** Você tentou adicionar uma coluna `NOT NULL` em uma tabela que já possui linhas gravadas.
* **Solução em Ambiente de Dev:**
  Limpe os dados de teste locais e rode o migrate novamente:
  ```bash
  docker exec ancora-postgres psql -U postgres -d ancora_db -c "TRUNCATE auth_security.users, recovery_core.profiles, auth_security.sessions CASCADE;"
  pnpm --filter @ancora/api db:migrate
  ```
* **Solução em Produção:**
  A migration deve adicionar a coluna primeiro como nullable, preencher os valores padrão (backfill) e só depois aplicar o `ALTER COLUMN ... SET NOT NULL`.

---

### Cenário B: Editei o schema, rodei `db:migrate`, mas o banco não mudou
* **Causa:** O Drizzle achou que não havia nada novo a executar porque você esqueceu de rodar o `db:generate` antes do `db:migrate`.
* **Solução:** O `migrate` só executa arquivos `.sql` que estão na pasta `drizzle/`. Sempre rode `db:generate` primeiro.

---

### Cenário C: Erro `No file ... found in drizzle folder`
* **Causa:** Alguém deletou ou renomeou um arquivo `.sql` no disco, mas o arquivo `drizzle/meta/_journal.json` ainda referencia o nome antigo.
* **Solução:** Abra o `_journal.json` e garanta que o campo `"tag"` de cada entrada seja exatamente igual ao nome do arquivo `.sql` correspondente (sem a extensão `.sql`).

---

## 4. O "Botão de Pânico" em Desenvolvimento Local (Hard Reset)

Se em algum momento durante o desenvolvimento local o banco de dados e os snapshots ficarem em um nó inexplicável, **não perca tempo**: use o reset determinístico de dev:

```bash
# 1. Derrubar e apagar o volume do banco local
docker compose down -v

# 2. Subir um Postgres novo e zerado
docker compose up -d

# 3. Rodar as migrations da estaca zero até o topo
pnpm --filter @ancora/api db:migrate
