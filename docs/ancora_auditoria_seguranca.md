# RELATÓRIO DE AUDITORIA DE SEGURANÇA — PROJETO ÂNCORA
### Red Team · Engenharia · Direito Digital / LGPD
**Data:** 2026-10-01 | **Classificação:** CRÍTICO — RESTRITO À EQUIPE TÉCNICA E JURÍDICA

---

> **AVISO PREAMBULAR:** Este relatório assume postura adversarial deliberada. O objetivo é expor falhas antes que atacantes, reguladores ou jornalistas o façam. A existência de pontos positivos na arquitetura (Argon2id, redação de dados no logger, segregação de schemas) não é relevada — eles serão usados apenas para calibrar o risco residual. Toda falha abaixo é descrita no cenário de **pior caso plausível**, não de ataque sofisticado de Estado.

---

## PARTE 1 — RELATÓRIO DE VULNERABILIDADES CRÍTICAS E ALTAS

---

### VUL-001 · **Phantom FK: O Desacoplamento Criptográfico que Não Existe no Código**
- **Componente:** `apps/api/src/db/schema/recovery.ts`, `apps/api/src/routes/auth.ts`
- **Severidade:** 🔴 CRÍTICA
- **Vetor de Ataque:**
  A RFC 002 (§3.2) especifica explicitamente o desacoplamento criptográfico via HMAC:
  > *O vínculo entre a conta de login e o perfil comunitário é intermediado exclusivamente em tempo de execução via token opaco derivado por HMAC: `account_token = HMAC-SHA256(user.id, APP_PEPPER_SECRET)`*

  O schema real em `recovery.ts` define:
  ```ts
  accountToken: varchar('account_token', { length: 64 }).notNull().unique(),
  userId: // NÃO EXISTE — não há FK declarada
  ```
  O campo `account_token` existe no schema. **Mas o código de `/register` em `auth.ts:126-139` nunca o popula.** O INSERT em `profiles` envia apenas `{ userId, pseudonym, avatarId, persona }` — e `userId` é o `user.id` da tabela `auth_security.users`. Em Drizzle ORM, a FK indireta ainda existe **como coluna `user_id` no banco**, conforme o SELECT em `auth.ts:224` e `profile.ts:43` que usa `eq(profiles.userId, userId)` sem nenhum HMAC intermediário.

  **O desacoplamento prometido é uma ficção documental.** O banco possui, na prática, uma FK lógica direta de `user_id` → `auth_security.users.id` dentro do schema `recovery_core.profiles`. Um dump completo do banco correlaciona trivialmente e-mail civil com pseudônimo, fissura e humor.

- **Impacto Real:**
  - **Técnico:** Qualquer pessoa com acesso ao dump do PostgreSQL (DBA, backup comprometido, SQL injection em outra rota futura) pode cruzar `recovery_core.profiles.user_id` com `auth_security.users.email` e obter a lista completa de "quem é dependente químico" com sua identidade civil.
  - **Legal:** Viola diretamente o §3.2 do RFC aprovado. Viola o Art. 46 da LGPD (segurança no tratamento). Pode caracterizar propaganda enganosa contra os usuários se a documentação comercial alegar o desacoplamento.
  - **Clínico:** Se esse banco vazar (ex.: credenciais do `docker-compose.yml` usadas em produção), um usuário em fase de recuperação pode ter sua condição exposta a empregadores, família ou imprensa.

- **Solução:**
  ```ts
  // Em register: gerar accountToken via HMAC antes do INSERT
  import { createHmac } from 'node:crypto';
  const accountToken = createHmac('sha256', env.APP_PEPPER_SECRET)
    .update(createdUser.id)
    .digest('hex');

  // INSERT em profiles NÃO deve incluir userId — remover o campo do schema
  await tx.insert(profiles).values({ accountToken, pseudonym, avatarId, persona });

  // Nos SELECTs, usar sempre o accountToken derivado, nunca o userId direto
  const lookupToken = createHmac('sha256', env.APP_PEPPER_SECRET)
    .update(request.user.sub).digest('hex');
  const [profile] = await db.select().from(profiles)
    .where(eq(profiles.accountToken, lookupToken)).limit(1);
  ```

---

### VUL-002 · **Race Condition no Refresh Token Rotation (RTR) — Falso Positivo de Ataque**
- **Componente:** `apps/api/src/routes/auth.ts:360-460`
- **Severidade:** 🔴 CRÍTICA
- **Vetor de Ataque:**
  O `/refresh` atual funciona da seguinte forma:
  1. Busca sessão por hash do token
  2. Verifica se `revokedAt !== null` (detecção de reúso)
  3. Dentro de uma transaction: marca sessão atual como revogada + insere nova sessão
  4. Retorna novo par de tokens

  O problema está entre os passos 1 e 3: **não há lock pessimista (SELECT FOR UPDATE)**. Com conexão mobile instável, o seguinte cenário é plausível:
  - T=0ms: Dispositivo dispara Request A para `/refresh` com token X
  - T=50ms: A rede cai, Request A ainda não completou
  - T=51ms: React Native retry automático dispara Request B com o mesmo token X
  - T=100ms: Request A retorna sucesso, token X é revogado, token Y é emitido
  - T=200ms: Request B encontra `revokedAt !== null` no token X → **revoga TODAS AS SESSÕES DO USUÁRIO**
  - Resultado: Usuário legítimo, em momento de crise, é deslogado e forçado a fazer login novamente

  O comentário no código diz "significa que um token antigo vazou" — mas isso é uma suposição falsa em cenários de retry legítimo.

- **Impacto Real:**
  - **Clínico/Crítico:** Um usuário que está no meio do exercício de respiração 4-7-8 do SOS, com o token expirando, pode ter a sessão revogada por retry e ser jogado na tela de login **durante uma crise de fissura ou ideação**.
  - **Técnico:** Esgotamento de sessões legítimas. Impossibilidade de usar o app em redes 4G com alta latência/retry.

- **Solução:**
  ```sql
  -- Usar SELECT ... FOR UPDATE NO WAIT dentro da transaction
  ```
  ```ts
  await db.transaction(async (tx) => {
    // Lock pessimista — falha imediata se outra tx já está processando
    const [lockedSession] = await tx.execute(
      sql`SELECT * FROM auth_security.sessions
          WHERE refresh_token_hash = ${tokenHash}
          FOR UPDATE NOWAIT`
    );
    if (!lockedSession) return reply.status(401)...;
    if (lockedSession.revoked_at !== null) { /* revoke all */ }
    // ... resto da lógica
  });
  ```

---

### VUL-003 · **Connection Pool Starvation: Fastify + PgBoss Disputando o Mesmo Pool**
- **Componente:** `apps/api/src/db/index.ts`, `apps/api/src/queue/boss.ts`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  ```ts
  // db/index.ts — postgres-js sem limite explícito de conexões
  export const client = postgres(env.DATABASE_URL); // usa default: max: 10

  // queue/boss.ts — pg-boss com pool próprio
  export const bossConfig = { max: 10, ... };
  ```
  O `postgres-js` (driver do Drizzle) e o `pg-boss` abrem **pools separados** para o mesmo banco PostgreSQL. Com picos de uso (ex.: múltiplos check-ins simultâneos + jobs na fila + healthcheck), o sistema pode chegar a 20 conexões simultâneas. O PostgreSQL padrão (`max_connections = 100`) suporta isso, mas o problema é que **nenhum dos dois pools tem configuração de `idleTimeout` ou `maxUses`**, levando a conexões zumbis que não são recicladas.

  Adicionalmente, o `postgres-js` instanciado globalmente em `db/index.ts` é compartilhado por todas as requisições Fastify **sem connection pooling externo (PgBouncer)**. Sob carga de 50+ usuários simultâneos em crise (ex.: evento público), o pool pode esgotar e o servidor começa a enfileirar requisições, causando timeouts no SOS.

- **Impacto Real:**
  - SOS inoperante exatamente nos picos de crise (finais de semana, madrugadas, datas comemorativas).
  - O `/health` retorna `database: disconnected`, mas não há circuit breaker — o servidor continua aceitando requisições que vão falhar.

- **Solução:**
  ```ts
  // db/index.ts — configurar pool explicitamente
  export const client = postgres(env.DATABASE_URL, {
    max: 15,
    idle_timeout: 30,
    max_lifetime: 3600,
    connect_timeout: 5,
  });
  // boss.ts — reduzir para não ultrapassar limite total
  export const bossConfig = { max: 5, ... };
  ```
  Em produção: adicionar PgBouncer em modo transaction.

---

### VUL-004 · **Checkin Sem Limite de Frequência — Integridade de Dados Clínicos Comprometida**
- **Componente:** `apps/api/src/routes/journey.ts:33-108`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  A rota `POST /journey/checkin` não possui:
  1. Rate limiting
  2. Verificação de "já fez check-in hoje"
  3. Limite de check-ins por período

  Um usuário pode enviar 1.000 check-ins com `cravingLevel: 0, mood: 'calmo'` em sequência, ou pior, `cravingLevel: 5, mood: 'ansioso'` repetidamente. O `GET /journey/history` exibe `totalCheckins` como "contador de dias distintos" (`count(distinct date(created_at))`), então a contagem final está protegida, mas o **histórico bruto** ficará poluído com dezenas de registros no mesmo dia.

  O `GET /journey/today` busca o mais recente do dia (`orderBy desc, limit 1`), mas o motor de interceptação de fissura no frontend é disparado a cada check-in de nível ≥ 4 — logo, um loop de retry pode abrir o modal de alternativas repetidamente, causando sobrecarga cognitiva em momento de crise.

- **Impacto Real:**
  - Crescimento descontrolado da tabela `checkins` (sem soft delete, sem particionamento).
  - Dados de saúde corrompidos que podem gerar relatórios de progresso falsos.
  - Potencial confusão no motor de interceptação que bombardeia modais durante uma crise.

- **Solução:**
  ```ts
  // Antes do INSERT, verificar se já existe check-in do dia
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const [existing] = await tx.select({ id: checkins.id }).from(checkins)
    .where(and(eq(checkins.profileId, profileId), gte(checkins.createdAt, todayStart)))
    .limit(1);
  if (existing) {
    return reply.status(409).send({
      status: 'error',
      message: 'Check-in já registrado para hoje. Você pode atualizar o existente.',
    });
  }
  ```

---

### VUL-005 · **Timing Attack no Login Sobrevive ao Argon2: Bypass por Caminho Diferente**
- **Componente:** `apps/api/src/routes/auth.ts:207-221`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  ```ts
  // Linha 207-213: usuário não existe → retorna IMEDIATAMENTE
  const [user] = await db.select()...where(eq(users.email, email)).limit(1);
  if (!user) {
    return reply.status(401)... // retorna em ~5-10ms (só o SELECT)
  }

  // Linha 216: senha errada → retorna APÓS Argon2 (~200-500ms)
  const isPasswordValid = await verifyPassword(user.passwordHash, password);
  if (!isPasswordValid) {
    return reply.status(401)... // retorna em ~300ms
  }
  ```
  A equipe identificou o timing attack, mas **não o corrigiu**. Um atacante pode, com 100 requisições automatizadas, distinguir e-mails cadastrados dos não cadastrados com alta precisão temporal, sem precisar sequer testar senhas.

  Em um contexto de saúde, saber que `fulano@empresa.com.br` *está* cadastrado no Âncora já **viola o sigilo de condição de saúde** — mesmo sem descobrir a senha.

- **Impacto Real:**
  - Enumeração completa de usuários por atacante com acesso à internet.
  - Violação do Art. 11 da LGPD (dado sensível de saúde).
  - Combinado com VUL-001 (Phantom FK), um atacante com acesso interno ao banco pode correlacionar e-mails com diagnósticos.

- **Solução:**
  ```ts
  // Sempre executar Argon2 mesmo quando o usuário não existe
  const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$...hash_fixo_de_producao...';

  const [user] = await db.select()...
  const hashToVerify = user?.passwordHash ?? DUMMY_HASH;
  const isPasswordValid = await verifyPassword(hashToVerify, password);

  if (!user || !isPasswordValid) {
    return reply.status(401).send({ status: 'error', message: 'Credenciais inválidas.' });
  }
  ```

---

### VUL-006 · **JWT com `sub` + `profileId` Quebra a Segregação de Schemas por Design**
- **Componente:** `apps/api/src/routes/auth.ts:233-241`, `apps/api/src/routes/journey.ts:45`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  O JWT emitido contém:
  ```json
  {
    "sub": "uuid-do-usuario-auth_security",
    "profileId": "uuid-do-perfil-recovery_core",
    "role": "user",
    "persona": "navegador"
  }
  ```
  Ao incluir `profileId` no JWT, a API elimina a necessidade de lookup adicional no banco para as rotas de jornada — o que parece uma otimização. Mas isso **cria um link direto, interceptável por qualquer um que decodifique o JWT base64**, entre a identidade civil (representada por `sub`) e a identidade comunitária (`profileId`).

  JWTs são apenas base64 encoded — qualquer pessoa que obtiver o token (ex.: via `localStorage` no ambiente web, via `expo-secure-store` comprometido, via log de rede em HTTP) pode decodificá-lo e correlacionar as duas identidades **sem precisar do banco de dados**.

  Adicionalmente, em `journey.ts:45`, o código faz `let profileId = request.user.profileId` com fallback para query no banco — o que significa que o `profileId` do JWT é "confiado" diretamente sem revalidação. Se um token antigo (antes de rotação de identidade) ainda for válido nos 15 minutos de expiração, o usuário pode fazer check-in no `profileId` antigo que não é mais o seu.

- **Impacto Real:**
  - Compromete toda a arquitetura de pseudonimato e desacoplamento.
  - Um token interceptado expõe ambas as identidades simultaneamente.
  - Após rotação de identidade, tokens anteriores ainda "sabem" qual era o profileId antigo.

- **Solução:**
  Remover `profileId` do payload do JWT. O lookup no banco é necessário por segurança. O custo de uma query adicional é irrelevante diante do risco.

---

### VUL-007 · **Pseudônimo Antigo Liberado Imediatamente Permite Personificação**
- **Componente:** `apps/api/src/routes/profile.ts:127-131`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  ```ts
  // UPDATE direto: novo pseudônimo substituí o antigo instantaneamente
  const [updatedProfile] = await db.update(profiles)
    .set({ pseudonym: newPseudonym, ... })
    .where(eq(profiles.userId, userId))
    .returning();
  ```
  Quando `@FarolSeguro_42` rotaciona para `@PortoCalmo_88`, o pseudônimo `@FarolSeguro_42` é **liberado imediatamente** no banco (a constraint UNIQUE é removida). Um atacante que estava monitorando pode registrar um novo usuário e obter `@FarolSeguro_42` novamente, ou disparar a rotação num segundo usuário para capturar o pseudônimo. A intenção é que "publicações passadas fiquem desvinculadas", mas o histórico de sessões no Painel Vivo (funcionalidade futura) pode referenciar o pseudônimo antigo, causando confusão de identidade.

  Mais grave: a rotação na `profile.ts` **não está dentro de uma transaction atômica com verificação de unicidade**. O loop de 5 tentativas busca um pseudônimo disponível, mas **não reserva** esse pseudônimo durante a busca. Há uma janela de race condition entre o último `SELECT` (que confirma disponibilidade) e o `UPDATE` (que aplica). Dois usuários rodando rotação simultânea podem tentar usar o mesmo pseudônimo, causando violação da constraint UNIQUE e um HTTP 500 não tratado (o `catch` na `profile.ts:153` apenas loga e retorna 500 genérico — sem revelar que a causa é a violação de unicidade, mas também sem tentar novamente).

- **Impacto Real:**
  - Personificação de identidade dentro da comunidade de recuperação.
  - HTTP 500 silencioso durante rotação concorrente engana o usuário.

- **Solução:**
  Adicionar período de quarentena de 30 dias para pseudônimos liberados. Usar `INSERT ... ON CONFLICT` ou `UPDATE ... WHERE pseudonym = $old_pseudonym` para garantir atomicidade.

---

### VUL-008 · **Espaço de Nomes do Gerador de Pseudônimos: 7.920 combinações, não ~79.000**
- **Componente:** `apps/api/src/lib/pseudonym.ts`
- **Severidade:** 🟡 MÉDIA-ALTA
- **Vetor de Ataque:**
  ```ts
  const NOUNS = [...] // 10 palavras
  const QUALIFIERS = [...] // 8 palavras
  // suffix: randomInt(10, 1000) = 990 valores (10 a 999)
  // Total: 10 × 8 × 990 = 79.200 combinações
  ```
  O briefing menciona ~79 mil. O cálculo real é `10 × 8 × 990 = 79.200`. Com crescimento da plataforma e usuários realizando rotações frequentes, o espaço se esgota rapidamente. Com apenas 79.200 slots e suposição de ~5% de taxa de colisão em 10% de ocupação do espaço, o loop de 5 tentativas começará a falhar silenciosamente **quando a plataforma atingir ~8.000 usuários ativos com histórico de rotações**.

  O pior caso: quando todas as 5 tentativas colidem, o `INSERT` falha com violação `23505` — mas esse erro é capturado no `catch` do `/register` e retorna **"E-mail já cadastrado no sistema."** (uma mensagem completamente enganosa). O usuário em crise tenta criar uma conta e recebe uma mensagem sobre e-mail, quando na verdade o bug é interno ao gerador.

- **Impacto Real:**
  - Usuários incapazes de se cadastrar sem mensagem de erro compreensível.
  - Esgotamento do espaço de nomes invisível ao monitoramento (sem alertas de colisão).

- **Solução:**
  Aumentar NOUNS para 50+ palavras e QUALIFIERS para 30+. Adicionar sufixo de 4 dígitos (`1000-9999`). Monitorar taxa de colisão. Separar o erro de violação `23505` por tabela afetada no handler de erros.

---

### VUL-009 · **`/register` Retorna `user.id` e `profile.id` para o Cliente**
- **Componente:** `apps/api/src/routes/auth.ts:166-169`
- **Severidade:** 🟡 MÉDIA
- **Vetor de Ataque:**
  ```json
  // Resposta do POST /register:
  {
    "status": "success",
    "data": {
      "user": { "id": "uuid-real-da-tabela-auth_security", "email": "...", ... },
      "profile": { "id": "uuid-real-da-tabela-recovery_core", ... }
    }
  }
  ```
  O endpoint de cadastro retorna os UUIDs internos de ambas as tabelas. O `AuthContext.tsx` faz login imediatamente após o registro e esses dados ficam em memória, mas o payload da resposta de registro expõe os dois IDs brutos que, combinados com VUL-001 (Phantom FK), permitem a correlação direta. Se um proxy de interceptação (Burp Suite, Charles) estiver ativo durante o cadastro de um novo usuário, o atacante captura ambos os UUIDs.

---

### VUL-010 · **`/me` Expõe `user.email` e `user.isAdult` em Rotas Autenticadas**
- **Componente:** `apps/api/src/routes/auth.ts:280-357`
- **Severidade:** 🟡 MÉDIA
- **Vetor de Ataque:**
  O `GET /auth/me` retorna `email` e `isAdult` no mesmo payload do `profile`. Qualquer componente do frontend que chame esta rota pode exibir o e-mail acidentalmente — o que já ocorre na `HomeScreen.tsx:216`:
  ```tsx
  Nenhuma informação pessoal como e-mail ({user?.email}) ou identificadores reais
  ```
  O campo `isAdult: true` nunca deveria sair do backend — é uma flag de compliance interno, não dado de UI.

---

### VUL-011 · **Ausência de `updatedAt` Automático no Schema**
- **Componente:** `apps/api/src/db/schema/auth.ts:12`
- **Severidade:** 🟡 MÉDIA
- **Vetor de Ataque:**
  O campo `updatedAt` é definido como `defaultNow()`, mas **não há trigger** ou `.$onUpdate(() => new Date())` do Drizzle para atualizá-lo. Em qualquer UPDATE em `users` (senha, role), o campo permanece com o valor do `createdAt`, tornando-o inútil para auditoria forense e violando requisitos de rastreabilidade do Art. 37 da LGPD.

---

### VUL-012 · **`APP_PEPPER_SECRET` Declarado mas Nunca Usado**
- **Componente:** `apps/api/src/env.ts:17`, `apps/api/src/lib/hash.ts`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  O `envSchema` valida `APP_PEPPER_SECRET`, o `.env.example` o define. Mas a função `hashPassword` em `hash.ts` chama apenas `argon2.hash(password, { type: argon2.argon2id })` — **sem incorporar o pepper**. O pepper existe para que, mesmo que o banco seja vazado (hashes incluídos), um atacante sem acesso ao `APP_PEPPER_SECRET` não possa fazer dictionary attacks offline. Sem o pepper incorporado no hash, esse layer de defesa não existe — os hashes são atacáveis offline com GPUs assim que o banco vazar.

- **Solução:**
  ```ts
  export async function hashPassword(password: string, pepper: string): Promise<string> {
    return argon2.hash(password + pepper, { type: argon2.argon2id });
  }
  // Ou usar argon2 com secret option:
  return argon2.hash(password, {
    type: argon2.argon2id,
    secret: Buffer.from(pepper),
  });
  ```

---

### VUL-013 · **Token de Sessão SHA-256 sem Salt — Downgrades para SHA-1 em Colisão**
- **Componente:** `apps/api/src/routes/auth.ts:244`
- **Severidade:** 🟡 MÉDIA
- **Vetor de Ataque:**
  ```ts
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  ```
  O token de refresh é 32 bytes aleatórios (256 bits de entropia) — adequado. O hash SHA-256 sem salt é aceitável para refresh tokens (pois o token em si tem alta entropia e o hash é apenas para armazenamento seguro no banco). Porém, sem índice no campo `refreshTokenHash` na tabela `sessions`, cada chamada a `/refresh` faz um sequential scan na tabela inteira. Com centenas de sessões ativas, isso causa degradação de performance mensurável.

  **Ausência de índice confirmada:** o schema de `sessions` não declara `index('idx_sessions_token').on(table.refreshTokenHash)`.

---

### VUL-014 · **`AuthContext` Expõe Senha em Plaintext Durante Login Automático Pós-Registro**
- **Componente:** `apps/mobile/src/contexts/AuthContext.tsx:84-93`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  ```ts
  // register() faz:
  // 1. POST /auth/register com {email, password, ...}
  // 2. POST /auth/login com {email, password} — usando a mesma senha em plaintext
  ```
  A senha do usuário permanece em memória JavaScript entre as chamadas 1 e 2. Em React Native, o garbage collector não garante limpeza imediata de strings. Em um dispositivo com memória agressivamente compartilhada ou com debugging habilitado (modo dev), a senha pode ser capturada em heap dump.

  Solução correta: o `/register` deve retornar um token de sessão diretamente, eliminando a necessidade de login subsequente com credencial em plaintext.

---

### VUL-015 · **`/test-log` com Logging do Body em Qualquer Ambiente Não-Produção**
- **Componente:** `apps/api/src/server.ts:120-128`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  ```ts
  if (env.NODE_ENV !== 'production') {
    app.post('/test-log', async (request, reply) => {
      request.log.info({ body: request.body }, 'Validando mascaramento de dados sensíveis');
    });
  }
  ```
  Esta rota está ativa em `development` E `test`. O problema: o `loggerConfig` usa `pino-pretty` em desenvolvimento e `redact` para certos campos, mas a rota `/test-log` recebe qualquer corpo JSON e o loga integralmente. Se alguém enviar `{ email: "vitima@email.com", password: "senha123" }`, o `email` é redactado — mas campos como `cpf`, `telefone`, `endereco` não estão na lista de redação. Pior: a rota existe **para testar o mascaramento**, mas o próprio teste pode gerar logs com dados reais se apontada para um servidor de staging com dados de produção.

  A rota aceita **qualquer método POST sem autenticação**.

---

### VUL-016 · **`SecureStore` Falha Silenciosamente com Tela Bloqueada no iOS**
- **Componente:** `apps/mobile/src/services/storage.ts:14-16`
- **Severidade:** 🟠 ALTA
- **Vetor de Ataque:**
  ```ts
  await SecureStore.setItemAsync(key, value);
  ```
  O `expo-secure-store` no iOS usa o Keychain com `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` como padrão. Quando o dispositivo está bloqueado (tela travada), **qualquer operação de leitura/escrita no SecureStore lança uma exceção**. O código em `storage.ts` não tem try/catch. Se o app for aberto em background (ex.: notificação de crise) com o telefone bloqueado, a restauração de sessão em `AuthContext.tsx:36` (`storage.getItem('accessToken')`) vai falhar com exceção não tratada, derrubando o contexto de auth e apresentando a tela de login para o usuário em crise.

---

### VUL-017 · **Motor de Interceptação de Crise Falha Silenciosamente em Erro de Rede**
- **Componente:** `apps/mobile/src/screens/HomeScreen.tsx:56-62`
- **Severidade:** 🟠 ALTA (Clínica)
- **Vetor de Ataque:**
  ```ts
  } catch {
    // Falhas transitórias mantêm os estados neutros padrão
  }
  ```
  O `catch` vazio na carga dos dados de jornada garante que o usuário não veja um erro — mas também garante que `hasCheckedInToday = false` e `totalCheckins = 0`, mesmo que o usuário já tenha checado in com `cravingLevel: 5`. Se o usuário carregar o HomeScreen em rede ruim, ver `hasCheckedInToday = false` e tentar fazer check-in novamente, o motor de interceptação **NÃO será disparado** porque o backend recusará o check-in duplicado (após VUL-004 ser corrigido) e o app ficará em estado inconsistente — ou, sem a correção de VUL-004, inserirá um segundo check-in que pode ou não acionar o modal.

---

### VUL-018 · **Ideação Suicida Offline: Detecção não Existe, Bypass Garantido**
- **Componente:** Todo o sistema de check-in e SOS
- **Severidade:** 🔴 CRÍTICA (Clínica)
- **Vetor de Ataque:**
  Não existe, em nenhum componente do codebase atual, nenhuma lógica de detecção de palavras-chave indicativas de ideação suicida (funcionalidade prevista no RFC). O RFC menciona "interceptação de ideação suicida" mas **nenhum código implementa isso**. O check-in captura `cravingLevel` e `mood` — nenhum campo de texto livre existe. A triagem é **exclusivamente quantitativa** (número de fissura).

  Cenário: usuário com `cravingLevel: 1, mood: 'calmo'` mas em ideação suicida não aciona nenhum alerta.

  Adicionalmente, se o usuário estiver offline durante a escrita de um relato (funcionalidade futura no Painel Vivo), a mensagem ficará na fila e só será processada quando a rede voltar — **sem que o sistema saiba que passou X horas desde que o usuário escreveu sobre ideação**.

---

## PARTE 2 — AUDITORIA DE RESPONSABILIDADE CLÍNICA E PSICOLÓGICA

---

### CLIN-001 · **Alegação Fisiológica Sem Embasamento Científico Citado**
- **Localização:** `BreathingScreen.tsx:34-36`
- **Texto Problemático:**
  > *"A técnica de respiração 4-7-8 atua diretamente no sistema parassimpático, desacelerando os batimentos e reduzindo a intensidade de impulsos e fissuras."*
- **Análise:**
  Esta frase contém afirmações médico-fisiológicas apresentadas como fato estabelecido sem:
  1. Citação de referência científica (artigo, consenso de sociedade médica)
  2. Qualificação ("estudos sugerem que...", "pode contribuir para...")
  3. Aviso de segurança (a técnica 4-7-8 pode causar tontura, síncope vagal em hiperventilação)
  A frase "atua diretamente" é linguagem prescritiva de eficácia terapêutica — o que pode caracterizar **exercício irregular da medicina** (Art. 282 do Código Penal) e gerar responsabilidade civil sob o CDC (Art. 14 — responsabilidade do fornecedor por serviço defeituoso).
- **Texto Substituto Seguro:**
  > *"A respiração lenta e consciente é uma estratégia de manejo de ansiedade amplamente utilizada. Interrompa e sente-se caso sinta tontura."*

---

### CLIN-002 · **"Superou este momento" — Presunção Perigosa de Sucesso**
- **Localização:** Mencionado no briefing como presente na interface (não localizado em código aberto atual — pode estar em componente não auditado ou em versão anterior)
- **Análise:**
  Em contexto de dependência química, **presumir que o usuário "superou" um momento de crise ao fechar o modal ou concluir um exercício** é clinicamente perigoso. A fissura pode reiniciar segundos após o fim do exercício. O texto induz falsa segurança e pode fazer o usuário dispensar busca por apoio humano real por acreditar que "já superou". Nenhum profissional de saúde certificaria este texto sem uma qualificação explícita.

---

### CLIN-003 · **Botão "🌿 Estou mais calmo, voltar" — Pressão Implícita de Recuperação**
- **Localização:** `BreathingScreen.tsx:76`
- **Análise:**
  O único botão de saída da tela de respiração é *"Estou mais calmo, voltar"*. Isso cria pressão implícita para o usuário **auto-declarar** que está calmo para poder sair da tela. Em dispositivos lentos ou em momento de pânico, o usuário pode toque neste botão **independentemente de seu estado real**, apenas para sair da tela. O app então pode registrar isso como saída positiva (se houver logging de comportamento futuro), gerando dado clínico incorreto. O botão deveria ser "Voltar ao SOS" sem presunção de estado.

---

### CLIN-004 · **Ausência de Aviso de Segurança para 4-7-8 (Síncope Vagal)**
- **Localização:** `BreathingScreen.tsx`
- **Análise:**
  A técnica 4-7-8 requer segurar a respiração por 7 segundos. Em pessoas com:
  - Hipertensão
  - Arritmias cardíacas
  - DPOC
  - Em estado de intoxicação
  ...segurar a respiração pode causar síncope vagal (desmaio) ou agravamento de sintomas. A AUSÊNCIA de qualquer aviso como *"Interrompa se sentir tontura ou dor no peito"* é uma omissão de segurança com potencial de dano físico. Juridicamente, o app **sabe que atende dependentes químicos** que podem estar em estado alterado quando acessam o SOS.

---

### CLIN-005 · **Declaração Falsa "100% Offline" Compromete Segurança em Crise**
- **Localização:** `HomeScreen.tsx:184` (card SOS) e `SOSDashboardModal.tsx:247-249`
- **Texto:**
  > *"Semáforo de Crise 100% Offline"*
  > *"⚓ Este aplicativo opera 100% offline. Todos os recursos acima estão permanentemente salvos em seu dispositivo."*
- **Análise:**
  Esta é uma mentira documentada no código. O SOS e os exercícios de respiração/grounding são locais — mas **login, restauração de sessão, check-in e qualquer funcionalidade futura de Painel Vivo exigem rede**. Um usuário em crise que vê esta declaração pode:
  1. Abrir o app em área sem sinal acreditando que funcionará
  2. Encontrar uma tela de login exigindo rede (se o token expirou)
  3. Não conseguir acessar o SOS porque está preso no loading da restauração de sessão
  O dano clínico é concreto e a responsabilidade legal é clara (publicidade enganosa — CDC Art. 37).

---

### CLIN-006 · **O SOS não é Realmente Offline: Requer Autenticação Prévia**
- **Componente:** `App.tsx` (navegação), `AuthContext.tsx`
- **Análise:**
  O SOSFloatingButton só aparece na `HomeScreen`, que só é renderizada se `isAuthenticated === true`. A autenticação requer token válido, que requer rede para refresh. Um usuário com token expirado e sem rede não consegue acessar o SOS — exatamente quando mais precisa dele. O SOS deveria ser uma tela acessível **sem autenticação**, armazenada localmente.

---

### CLIN-007 · **Nível 2 do SOS Referencia "Plano Pré-Crise" Inexistente**
- **Localização:** RFC-001.md linha 94 e arquitetura do SOS
- **Análise:**
  O RFC especifica que o Nível 2 inclui "Plano Pré-Crise". Este plano não foi modelado no banco, não existe na interface e não está implementado. O usuário que chega no Nível 2 de sofrimento emocional agudo encontra apenas o botão de ligar para o CVV (188). Para um usuário que não tem condições de ligar (ambiente público, surdo, crise de pânico com dificuldade de fala), não há alternativa textual ou de chat. A ausência de fallback em crise de Nível 2 é uma lacuna de segurança clínica grave.

---

## PARTE 3 — AUDITORIA DE CONFORMIDADE LGPD E RISCOS DE MULTA/SANÇÃO

---

### LGPD-001 · **Ausência de Consentimento Específico e Destacado (Art. 9º e 11)**
- **Localização:** `RegisterScreen.tsx:186-189`
- **Texto atual:**
  > *"Declaro que tenho 18 anos ou mais e aceito os termos de apoio mútuo."*
- **Gaps Legais:**
  - Art. 9º LGPD: O titular deve ser informado sobre: finalidade, prazo de conservação, identificação do controlador, compartilhamento e direitos do titular — **nada disso está presente**.
  - Art. 11 LGPD: O tratamento de **dados sensíveis de saúde** exige "consentimento do titular, de forma destacada, para finalidades específicas". Um checkbox único para 18+ + "termos de apoio mútuo" **não atende este requisito**.
  - O link "termos de apoio mútuo" não existe — é texto morto sem destino.
  - Não há menção explícita de que se trata de coleta de **dados de saúde sensíveis** (dependência química).
- **Risco de Sanção:** Multa de até 2% do faturamento (limitado a R$ 50 milhões por infração) pela ANPD. Mais grave: como envolve dados de saúde de pessoas potencialmente vulneráveis, pode haver agravamento da sanção.

---

### LGPD-002 · **Ausência de Base Legal Clara para Mood e CravingLevel (Art. 11)**
- **Localização:** `apps/api/src/db/schema/recovery.ts`, check-in endpoints
- **Análise:**
  Os campos `mood` e `cravingLevel` são dados sensíveis de saúde pela definição do Art. 5º, II da LGPD ("dado referente à saúde"). Para tratamento desses dados, o Art. 11 exige uma das hipóteses taxativas: consentimento expresso (não coletado adequadamente — ver LGPD-001), tutela da saúde (não se aplica sem profissional de saúde responsável), ou proteção da vida (não aplicável como base geral).

---

### LGPD-003 · **Direito ao Esquecimento sem Implementação Atômica (Art. 18, IV)**
- **Localização:** Ausência de endpoint `DELETE /account`
- **Análise:**
  Não existe nenhuma rota de exclusão de conta no codebase. O RFC menciona expurgo em "até 48 horas", mas:
  1. Não há endpoint implementado
  2. Não há mecanismo de job na fila (pg-boss) para processar o expurgo
  3. Sem cascade cross-schema (o `CASCADE` em `checkins` funciona apenas dentro do `recovery_core`, mas o registro em `auth_security.users` precisaria de deleção separada)
  4. Logs do Pino (arquivos externos ao banco) não são contemplados
  O Art. 18, IV da LGPD garante ao titular o direito de solicitar "anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade". A ausência de implementação é uma violação em aberto a partir do primeiro usuário cadastrado.

---

### LGPD-004 · **Ausência de Política de Retenção de Dados (Art. 13 e 16)**
- **Análise:**
  - Não há prazo definido para retenção de check-ins históricos
  - Sessões revogadas (`revokedAt != null`) nunca são deletadas do banco
  - Logs do Pino em produção (JSON) não têm política de rotação ou anonimização
  - O `DEFAULT_JOB_OPTIONS` do pg-boss define `retentionSeconds: 7 * 24 * 3600` (7 dias) e `deleteAfterSeconds: 7 * 24 * 3600`, mas isso é para **metadados de jobs** — não para dados de saúde dos usuários.

---

### LGPD-005 · **Transferência Internacional Implícita via Dependências (Art. 33)**
- **Análise:**
  O app mobile usa Expo (servidores nos EUA para OTA updates e telemetria), React Native (Meta). Em produção, se hospedado em cloud estrangeira (AWS, GCP, Azure fora do Brasil), caracteriza transferência internacional de dados sensíveis. O Art. 33 da LGPD exige que esta transferência seja feita apenas para países com proteção equivalente ou com cláusulas contratuais padrão aprovadas pela ANPD. Não há nenhuma menção a isso na documentação.

---

### LGPD-006 · **Menores de Idade: Verificação por Autodeclaração (Art. 14)**
- **Localização:** `registerBodySchema` + `RegisterScreen.tsx`
- **Análise:**
  O Art. 14 da LGPD proíbe o tratamento de dados de crianças e adolescentes sem consentimento específico dos responsáveis. A "trava 18+" do Âncora é apenas um checkbox de autodeclaração — juridicamente equivalente a nada. Qualquer menor pode marcar o checkbox e se cadastrar. A RFC reconhece este risco mas não implementa nenhuma verificação adicional (CPF, cartão de crédito, validação por responsável). Em uma plataforma que lida com dependência química, a presença de um menor é um risco jurídico e clínico grave.

---

### LGPD-007 · **Log do `x-request-id` Controlado pelo Cliente**
- **Localização:** `apps/api/src/server.ts:17-20`
- **Análise:**
  ```ts
  const headerReqId = req.headers['x-request-id'];
  if (typeof headerReqId === 'string' && headerReqId.length > 0) {
    return headerReqId; // usa o valor fornecido pelo cliente diretamente
  }
  ```
  O request ID é controlado pelo cliente e vai para os logs sem sanitização. Um atacante pode injetar valores como `" OR 1=1 --"` ou strings de log poisoning (`\n`, `\r`, ANSI escape codes para pino-pretty) para manipular logs de auditoria. Em contexto de LGPD, logs de auditoria corrompidos comprometem a capacidade de demonstrar conformidade perante a ANPD.

---

## PARTE 4 — PLANO DE REMEDIAÇÃO PRIORIZADO (Sprint 3.5 — "Debt Hardening")

*Ordenado por: Risco de Vida/Legal > Risco Técnico Crítico > Risco Técnico Alto*

---

| # | Vulnerabilidade | Componente(s) | Complexidade | Prazo |
|---|---|---|---|---|
| **R01** | **[VUL-018] Tornar SOS acessível sem autenticação** | `App.tsx`, `AuthContext.tsx`, navegação | Alta | Sprint 3.5, Semana 1 |
| **R02** | **[CLIN-004] Adicionar avisos de segurança nas técnicas respiratórias** | `BreathingScreen.tsx` | Baixa | Sprint 3.5, Semana 1 |
| **R03** | **[CLIN-005/006] Corrigir/remover declaração "100% offline"** | `HomeScreen.tsx`, `SOSDashboardModal.tsx` | Baixa | Sprint 3.5, Semana 1 |
| **R04** | **[VUL-001] Implementar desacoplamento criptográfico HMAC real** | `auth.ts`, `profile.ts`, `recovery.ts`, migration | Muito Alta | Sprint 3.5, Semana 1-2 |
| **R05** | **[VUL-012] Incorporar APP_PEPPER_SECRET no hash Argon2** | `hash.ts`, migration de re-hash | Alta | Sprint 3.5, Semana 1 |
| **R06** | **[VUL-005] Corrigir timing attack no login com dummy hash** | `auth.ts:207` | Baixa | Sprint 3.5, Semana 1 |
| **R07** | **[VUL-002] Adicionar SELECT FOR UPDATE no /refresh** | `auth.ts:360` | Média | Sprint 3.5, Semana 1 |
| **R08** | **[LGPD-001] Implementar tela de consentimento LGPD completa** | `RegisterScreen.tsx`, nova tela `ConsentScreen.tsx` | Alta | Sprint 3.5, Semana 2 |
| **R09** | **[LGPD-003] Implementar DELETE /account com job de expurgo** | Nova rota, `queue/index.ts`, migration | Alta | Sprint 3.5, Semana 2 |
| **R10** | **[VUL-006] Remover profileId do payload do JWT** | `auth.ts:233-241`, `journey.ts` | Média | Sprint 3.5, Semana 1 |
| **R11** | **[VUL-014] /register deve retornar tokens, eliminar login duplo** | `auth.ts`, `AuthContext.tsx` | Média | Sprint 3.5, Semana 1-2 |
| **R12** | **[VUL-003] Configurar pool explícito no postgres-js** | `db/index.ts`, `boss.ts` | Baixa | Sprint 3.5, Semana 1 |
| **R13** | **[VUL-004] Limitar check-in a 1 por dia (verificação no backend)** | `journey.ts` | Baixa | Sprint 3.5, Semana 1 |
| **R14** | **[VUL-016] Adicionar try/catch no storage.ts para SecureStore** | `storage.ts` | Baixa | Sprint 3.5, Semana 1 |
| **R15** | **[VUL-007] Quarentena de 30 dias para pseudônimos liberados** | `profile.ts`, nova coluna + migration | Média | Sprint 3.5, Semana 2 |
| **R16** | **[VUL-008] Expandir espaço de nomes do gerador de pseudônimos** | `pseudonym.ts` | Baixa | Sprint 3.5, Semana 1 |
| **R17** | **[VUL-011] Adicionar $onUpdateFn para updatedAt** | `auth.ts` schema | Baixa | Sprint 3.5, Semana 1 |
| **R18** | **[VUL-013] Adicionar índice em sessions.refreshTokenHash** | Migration | Baixa | Sprint 3.5, Semana 1 |
| **R19** | **[VUL-015] Remover ou proteger /test-log com auth + envs restritos** | `server.ts` | Baixa | Sprint 3.5, Semana 1 |
| **R20** | **[LGPD-007] Sanitizar e validar x-request-id header** | `server.ts` | Baixa | Sprint 3.5, Semana 1 |
| **R21** | **[CLIN-001/003] Revisar todos os textos clínicos com psicólogo** | Todos os SOS screens | Alta (processo) | Sprint 3.5, Semana 2 |
| **R22** | **[docker-compose] Remover binding de porta pública do Postgres** | `docker-compose.yml` | Baixa | Imediato |
| **R23** | **[LGPD-004] Implementar política de retenção e job de limpeza** | `queue/index.ts`, documentação | Média | Sprint 4 |
| **R24** | **[VUL-009] Não retornar user.id/profile.id no /register** | `auth.ts` | Baixa | Sprint 3.5, Semana 1 |
| **R25** | **[VUL-010] Não retornar email/isAdult no /me** | `auth.ts` | Baixa | Sprint 3.5, Semana 1 |

---

## SUMÁRIO EXECUTIVO DE RISCO

| Categoria | Contagem | Risco Residual se Não Corrigido |
|---|---|---|
| 🔴 Crítico (Vida + Legal) | 3 | Processo criminal, dano a usuário em crise, vazamento de dados de saúde |
| 🟠 Alto | 9 | Multa ANPD, enumeração de usuários, falha do SOS em produção |
| 🟡 Médio | 7 | Degradação de performance, dados corrompidos, auditoria inviabilizada |
| 📋 Processo/Docs | 6 | Contradições que invalidam defesas jurídicas |

**Prioridade absoluta antes de qualquer usuário real:** R01 (SOS sem auth), R02 (avisos segurança), R04 (HMAC real), R05 (pepper), R06 (timing attack), R08 (consentimento LGPD), R22 (postgres exposto).

---

*Relatório gerado por auditoria adversarial completa do codebase em 2026-10-01. Próxima revisão recomendada: após Sprint 3.5.*
