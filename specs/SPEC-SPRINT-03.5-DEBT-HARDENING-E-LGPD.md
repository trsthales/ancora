# 📘 Especificação Técnica e Funcional — Sprint 3.5: Hardening de Segurança, Privacidade Zero-PII e Governança LGPD

- **Documento:** `specs/SPEC-SPRINT-03.5-DEBT-HARDENING-E-LGPD.md`
- **Projeto:** Jornada Firme (Âncora) — Ecossistema de Saúde Comunitária e Mútua Ajuda ([RFC 002](file:///home/thales/Projetos/Ancora/specs/RFC-002.md))
- **Status:** ✅ Concluída e Auditada
- **Sprint:** Sprint 3.5 (Fase 2.5 — Debt Hardening: Blindagem Criptográfica Zero-PII, Desacoplamento Relacional e Conformidade LGPD)
- **Autor/Arquitetura:** Engenharia Jornada Firme, Especialista em Criptografia Aplicada & Encarregado de Proteção de Dados (DPO)
- **Stack Tecnológica:** Node.js 22 LTS, TypeScript 5.7+ (Strict Mode), Fastify 5.2, PostgreSQL 16 Alpine, Drizzle ORM 0.45, Argon2id, HMAC-SHA256, Crockford Base32, React Native 0.86, Expo 57, Vitest 5.0

---

## 1. Visão Geral e Contexto de Ameaças (Threat Model & Fundamentação Jurídico-Regulatória)

### 1.1. O Desafio de Privacidade na Dependência Química e Sofrimento Psíquico

O aplicativo **Jornada Firme** atua no apoio contínuo a pessoas em processo de recuperação de dependência química e comportamentos compulsivos, bem como seus pontos de apoio familiares. Em um ambiente de saúde comportamental, a exposição da identidade de um indivíduo acarreta consequências existenciais devastadoras: estigmatização social, demissão sumária no trabalho, perda de guarda judicial de filhos, extorsão e discriminação institucional.

Sob a ótica da Lei Geral de Proteção de Dados Pessoais brasileira (Lei Federal nº 13.709/2018 — LGPD):
- **Dados Sensíveis de Saúde (Art. 5º, II):** Informações referentes a histórico de fissuras, níveis de compulsão, estado de ânimo e adesão a programas de sobriedade constituem dados pessoais sensíveis sobre a saúde do titular.
- **Vedação à Coleta Desnecessária (Art. 6º, III — Princípio da Necessidade):** O tratamento de dados deve limitar-se ao mínimo indispensável para a realização de suas finalidades, com abrangência dos dados pertinentes, proporcionais e não excessivos.
- **Risco Inaceitável do E-mail Tradicional:** Modelos convencionais de autenticação utilizam o endereço de e-mail como chave primária ou identificador de login. Todavia, endereços corporativos ou pessoais quase sempre contêm o nome civil (`nome.sobrenome@empresa.com.br`), transformando qualquer vazamento de banco de dados em identificação imediata e incontestável do titular.

Por conseguinte, a Sprint 3.5 realizou uma refatoração arquitetural cirúrgica: **a eliminação definitiva do e-mail do sistema**, estabelecendo uma arquitetura **Zero-PII** (*Zero Personally Identifiable Information*).

---

### 1.2. O Imperativo do Artigo 13, § 4º da LGPD: Pseudonimização e Segregação Física de Schemas

O Artigo 13, § 4º da LGPD preconiza que, para os fins da lei, a pseudonimização é o procedimento por meio do qual um dado perde a possibilidade de associação, direta ou indireta, a um indivíduo, senão pelo uso de informação adicional mantida separadamente pelo controlador em ambiente seguro e controlado.

Na arquitetura da Sprint 3.5, a pseudonimização não é meramente cosmética; ela é garantida no nível físico do banco de dados relacional (PostgreSQL 16) através de **dois schemas segregados**:
1. `auth_security`: Custodia as credenciais cegas de acesso (`login_token`, `password_hash`, `recovery_key_hash`, `token_version` e consentimentos legais).
2. `recovery_core`: Custodia a jornada clínica e os perfis comunitários (`profiles`, `checkins`, `quarantined_pseudonyms`).

```
+──────────────────────────────────────────────────────────────────────────────────────────────────────────+
│                                       ISOLAMENTO FÍSICO DE SCHEMAS                                       │
+──────────────────────────────────────────────────────────────────────────────────────────────────────────+

     SCHEMA: auth_security (Credenciais Cegas)           SCHEMA: recovery_core (Saúde Comunitária)
   +─────────────────────────────────────────+         +─────────────────────────────────────────+
   │ TABLE users                             │         │ TABLE profiles                          │
   │  - id: UUID (PK)                        │         │  - id: UUID (PK)                        │
   │  - login_token: VARCHAR(64) [UNIQUE]    │         │  - account_token: VARCHAR(64) [UNIQUE]  │
   │  - password_hash: VARCHAR(255)          │         │  - pseudonym: VARCHAR(50) [UNIQUE]      │
   │  - recovery_key_hash: VARCHAR(64)       │         │  - avatar_id: VARCHAR(50)               │
   │  - token_version: INTEGER               │         │  - persona: VARCHAR(20)                 │
   │  - is_adult: BOOLEAN                    │         │  - last_seen_at: TIMESTAMP (NULL)       │
   │  - role: VARCHAR(50)                    │         │  - created_at: date_trunc('day', now()) │
   +─────────────────────────────────────────+         +─────────────────────────────────────────+
                        │                                                   ▲
                        │                                                   │
                        │       HMAC-SHA256(user.id, APP_PEPPER_V1)         │
                        └───────────────────────────────────────────────────┘
                                  (VÍNCULO MATEMÁTICO UNIDIRECIONAL)
                               ❌ SEM FOREIGN KEY FÍSICA NO BANCO DE DADOS
```

A Foreign Key direta física (`profiles.user_id -> users.id`) foi **extirpada na migração SQL 0002**. O único elo de ligação entre um registro de credencial e um registro de saúde é o `account_token`, computado exclusivamente em memória pela aplicação através de HMAC-SHA256 alimentado por um segredo de ambiente (`APP_PEPPER_V1`).

---

### 1.3. O Direito ao Esquecimento Transacional: LGPD Art. 18, VI

O Artigo 18, inciso VI da LGPD garante ao titular o direito de obter a eliminação dos dados pessoais tratados com o seu consentimento. Em plataformas de saúde mental, a exclusão de conta não pode ser um *soft delete* (marcar `deleted_at = NOW()`) que preserva os registros médicos nos servidores da empresa para fins de monetização ou telemetria.

O endpoint `DELETE /api/v1/account` foi concebido com garantias transacionais ACID estritas: uma única transação atômica que localiza o perfil clínico via `account_token`, remove todos os check-ins de fissura, exclui o perfil comunitário, revoga todas as sessões ativas, apaga os termos de consentimento e destrói o registro do usuário na tabela de credenciais, sem deixar nenhum registro órfão.

---

### 1.4. Modelo de Ameaças Estruturado (Threat Model)

A tabela a seguir consolida os vetores de ataque mitigados pelas defesas implementadas na Sprint 3.5:

| Vetor de Ataque | Mecanismo da Ameaça | Impacto Potencial | Defesa Implementada na Sprint 3.5 |
| :--- | :--- | :--- | :--- |
| **Dump Parcial de BD** | Invasor compromete e extrai apenas a tabela `recovery_core.profiles` e `checkins`. | Exposição de histórico clínico e hábitos de usuários. | **Isolamento de Schemas:** A tabela de perfis não contém IDs de usuários nem e-mails. Possui apenas `account_token` (hash cego). |
| **Dump Total de BD** | Invasor obtém um dump completo contendo ambos os schemas `auth_security` e `recovery_core`. | Reassociação relacional entre credenciais e histórico de saúde mental. | **Desacoplamento HMAC-SHA256:** A relação $user \leftrightarrow profile$ depende de `APP_PEPPER_V1` que reside estritamente nas variáveis de ambiente da aplicação e nunca no disco do banco. |
| **Correlação Temporal por Dumps** | Invasor ordena registros vazados de `users` e `profiles` pelo campo `created_at` com precisão de milissegundos. | Reassociação probabilística de identidade através da simultaneidade do insert ($\Delta t < 50\text{ms}$). | **Truncamento de Timestamp:** `profiles.created_at` é truncado para o dia (`date_trunc('day', now())`) e `last_seen_at` é inicializado como `NULL`. |
| **Timing Attacks / Account Enumeration** | Atacante mede a latência de `/auth/login` (rejeição rápida de ~2ms indica conta inexistente; ~250ms indica conta existente). | Descoberta em massa de pseudônimos válidos cadastrados no sistema. | **Dummy Hash Argon2id:** Se o usuário não existir, executa-se `verifyPassword(getDummyHash(), password)`, equiparando a latência em ~250ms. |
| **DoS Criptográfico por Exaustão de CPU** | Atacante submete milhões de requisições de login para pseudônimos fictícios, forçando o cálculo dinâmico de Argon2id. | Esgotamento de 100% de CPU e memória do servidor API, derrubando a infraestrutura. | **Pré-computação no Startup:** O `DUMMY_HASH` é gerado apenas uma vez na inicialização e reutilizado da memória RAM. |
| **Bloqueio em Clínicas / NAT Coletivo** | Múltiplos pacientes compartilham o mesmo IP público (Wi-Fi de clínica de recuperação). Ataque de força bruta bloqueia o IP de todos. | Bloqueio acidental e negação de socorro para dezenas de pacientes em crise no mesmo ambiente físico. | **Dual-Bucket Rate Limiter:** Balde de IP amplo (100 req/min) conjugado a Balde de Conta estrito (5 falhas por `login_token` em 15 min). |
| **Log Poisoning** | Injeção de quebras de linha e caracteres de controle via cabeçalho `x-request-id`. | Corrupção de arquivos de log, injeção de falsos eventos de auditoria e exploração SIEM. | **Sanitização por Regex:** Validação estrita `/^[a-zA-Z0-9_-]{1,64}$/`. IDs fora do padrão são descartados em favor de um UUIDv4. |
| **Shoulder Surfing** | Curiosos ou familiares observam a tela do dispositivo em ambientes compartilhados. | Quebra de sigilo sobre o tratamento de dependência química. | **Neutralização de UI:** Eliminação de qualquer nome ou e-mail civil na tela inicial; exibição exclusiva de pseudônimo poético neutro. |
| **Crash por Tela Bloqueada no iOS** | O iOS bloqueia o Keychain do SecureStore quando a tela é travada por senha/FaceID, disparando exceções nativas. | Falha de inicialização e encerramento abrupto do aplicativo móvel. | **Storage Defensivo:** Tratamento com `try/catch` defensivo no [storage.ts](file:///home/thales/Projetos/Ancora/apps/mobile/src/services/storage.ts), evitando travamentos de bootstrap. |

---

## 2. Detalhamento Técnico das Tarefas (TASK-351 a TASK-356)

```
+──────────────────────────────────────────────────────────────────────────────────────────────────────────+
│                                    MAPA DE EXECUÇÃO DA SPRINT 3.5                                        │
+──────────────────────────────────────────────────────────────────────────────────────────────────────────+

   [TASK-351: Segurança de Vida & UI Resilience] ──► [TASK-354: Concorrência, Anti-DoS & Resiliência]
                          │                                                        ▲
                          ▼                                                        │
   [TASK-352: Desacoplamento Criptográfico HMAC] ──► [TASK-355: Governança LGPD & Expurgo Transacional]
                          │                                                        │
                          ▼                                                        │
   [TASK-353: Autenticação Zero-PII & Crockford] ──► [TASK-356: Saneamento Estrutural & Vitest P0]
```

---

### TASK-351: Segurança de Vida & UI Resilience

#### 1. Escopo e Justificativa Clínica
O aplicativo deve priorizar a salvaguarda da vida acima de qualquer barreira computacional. Usuários em crise aguda de fissura ou ideação autolítica não podem ser bloqueados por formulários de autenticação ou impedidos de acessar socorro por falhas de inicialização do sistema.

#### 2. Implementações Críticas Realizadas
1. **Promoção do Botão SOS para a Raiz de [App.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/App.tsx):**
   O botão flutuante `SOSFloatingButton` foi desacoplado de telas internas autenticadas e posicionado no componente raiz `AppContent`, imediatamente sob o `SOSProvider`. Dessa forma, mesmo que o usuário esteja deslogado, no fluxo de boas-vindas, na tela de login ou sem conectividade, o botão de emergência permanece permanentemente visível e operável em 1 toque.

2. **Storage Defensivo contra Chaveiro Bloqueado no iOS ([storage.ts](file:///home/thales/Projetos/Ancora/apps/mobile/src/services/storage.ts)):**
   No sistema operacional iOS, quando a tela do aparelho se encontra bloqueada por PIN/biometria, operações de leitura/escrita no `expo-secure-store` lançam exceções não tratadas se os atributos de acessibilidade do chaveiro forem restritivos. O módulo foi encapsulado em blocos `try/catch` defensivos:
   ```typescript
   // apps/mobile/src/services/storage.ts
   async getItem(key: string): Promise<string | null> {
     if (Platform.OS === 'web') {
       try {
         if (typeof window !== 'undefined' && window.localStorage) {
           return window.localStorage.getItem(key);
         }
         return null;
       } catch {
         return null;
       }
     }
     try {
       return await SecureStore.getItemAsync(key);
     } catch (error) {
       console.warn(`[storage] Erro ao recuperar item do SecureStore (${key}):`, error);
       return null;
     }
   }
   ```

3. **Neutralização de UI e Proteção contra *Shoulder Surfing* ([HomeScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/HomeScreen.tsx)):**
   Foi removida qualquer referência a nomes civis ou dados cadastrais na interface inicial. O cabeçalho exibe unicamente o avatar náutico e o pseudônimo poético (ex: `@FarolSeguro_1042`), garantindo que olhares curiosos no transporte público ou no trabalho não identifiquem a pessoa.

4. **Avisos de Segurança Fisiológica:**
   No exercício de respiração 4-7-8, foi incorporado aviso de segurança alertando sobre sensações de tontura ou hiperventilação passageira, instruindo o usuário a interromper o exercício e respirar em ritmo natural caso sinta desconforto.

---

### TASK-352: Desacoplamento Criptográfico e Defesa contra Correlação Temporal

#### 1. Extirpação da Foreign Key e Modelo Matemático do `account_token`
A integridade referencial convencional via chave estrangeira SQL cria uma dependência física indelével entre o registro de usuário e seu histórico de saúde. Diante de um ataque que comprometa o banco de dados via SQL Injection ou extração não autorizada de backups, tabelas interligadas por `user_id` expõem de imediato qual indivíduo registrou cada nível de fissura.

Na migração `0002_decouple_account_token_lgpd.sql`, removeu-se a coluna `user_id` de `recovery_core.profiles` e inseriu-se a coluna `account_token`:
```sql
ALTER TABLE "recovery_core"."profiles" DROP CONSTRAINT "profiles_user_id_users_id_fk";
ALTER TABLE "recovery_core"."profiles" ADD COLUMN "account_token" varchar(64) NOT NULL;
CREATE INDEX "idx_profiles_account_token" ON "recovery_core"."profiles" USING btree ("account_token");
ALTER TABLE "recovery_core"."profiles" DROP COLUMN "user_id";
ALTER TABLE "recovery_core"."profiles" ADD CONSTRAINT "profiles_account_token_unique" UNIQUE("account_token");
```

#### 2. Modelo Matemático Formal
Seja $U$ o identificador universalmente único do usuário ($U = \text{user.id} \in \text{UUIDv4}$) e $K$ o segredo de aplicação mantido exclusivamente em memória ($K = \text{APP\_PEPPER\_V1} \in \{0,1\}^{\ge 256}$).

O `account_token` é definido pela função de autenticação de mensagem baseada em hash:
$$\text{account\_token} = \text{HMAC-SHA256}_K(U) = \text{SHA256}\Big((K \oplus \text{opad}) \parallel \text{SHA256}\big((K \oplus \text{ipad}) \parallel U\big)\Big)$$

Onde:
- $\text{ipad} = \text{byte } 0\text{x}36 \text{ repetido 64 vezes}$ (bloco interno).
- $\text{opad} = \text{byte } 0\text{x}5C \text{ repetido 64 vezes}$ (bloco externo).
- $\parallel$ representa a concatenação de sequências de bytes.
- $\oplus$ representa a operação de disjunção exclusiva bit a bit (*XOR*).

**Propriedades de Segurança Garantidas:**
1. **Unidirecionalidade (Pre-image Resistance):** Dado o `account_token`, é computacionalmente inviável calcular $U$ sem o conhecimento do segredo $K$.
2. **Resistência a Colisão:** A probabilidade de dois usuários distintos gerarem o mesmo `account_token` é de $2^{-256}$, virtualmente zero.
3. **Cegueira do Banco de Dados:** Sem acesso à chave $K$ (injetada via variável de ambiente no runtime do Node.js), um invasor de posse do dump completo do PostgreSQL é incapaz de correlacionar qual linha de `auth_security.users` corresponde a qual linha de `recovery_core.profiles`.

Implementação real em [crypto-token.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/crypto-token.ts):
```typescript
// apps/api/src/lib/crypto-token.ts
export function deriveAccountToken(userId: string): string {
  const pepper = env.APP_PEPPER_V1 || env.APP_PEPPER_SECRET;
  return crypto.createHmac('sha256', pepper).update(userId).digest('hex');
}
```

#### 3. Defesa contra Correlação Temporal (*Temporal Correlation Defense*)
Mesmo com o desacoplamento relacional por HMAC, constatou-se um vetor de ataque residual: a **análise forense de timestamps**.
Se um usuário é registrado em `2026-10-04 14:22:18.492104` em `users` e um perfil em `profiles` é gerado em `2026-10-04 14:22:18.498312`, a correlação por ordenação cronológica e proximidade de milissegundos ($\Delta t \approx 6\text{ms}$) permitiria associar credencial e perfil de saúde com índice de acerto superior a 95% em ambientes com baixa taxa de cadastros concorrentes.

Para aniquilar esse vetor (migrações `0006` e `0007`), duas travas estruturais foram aplicadas:
1. **Truncamento de Timestamp na Criação do Perfil:**
   O campo `created_at` em `recovery_core.profiles` não registra milissegundos ou horas; ele é truncado para a meia-noite do dia corrente via função SQL nativa:
   ```sql
   ALTER TABLE "recovery_core"."profiles" ALTER COLUMN "created_at" SET DEFAULT date_trunc('day', now());
   ```
   No Drizzle ([recovery.ts](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/recovery.ts)):
   ```typescript
   createdAt: timestamp('created_at', { withTimezone: true })
     .default(sql`date_trunc('day', now())`)
     .notNull(),
   ```
   Todos os perfis criados ao longo de um mesmo dia compartilham a marca idêntica `YYYY-MM-DD 00:00:00+00`, eliminando a variância temporal de microssegundos.
2. **Neutralização do `last_seen_at`:**
   O campo `last_seen_at` em `recovery_core.profiles` era inicialmente gravado com `now()` no cadastro, reintroduzindo a correlação temporal. Na Sprint 3.5, a coluna passou a ser inicializada obrigatoriamente como `NULL`, sendo atualizada apenas em acessos subsequentes ou rotações de identidade:
   ```typescript
   lastSeenAt: timestamp('last_seen_at', { withTimezone: true }), // default NULL
   ```

---

### TASK-353: Autenticação Zero-PII e Chave Mestra Crockford

#### 1. Eliminação Definitiva da Coluna de E-mail
Na migração `0006_drop_email_and_truncate_profile_timestamp.sql`, o campo `email` foi fisicamente descartado da tabela de usuários:
```sql
ALTER TABLE "auth_security"."users" DROP CONSTRAINT "users_email_unique";
ALTER TABLE "auth_security"."users" DROP COLUMN "email";
```
A partir desse momento, a base de dados tornou-se tecnicamente incapaz de vazar endereços de correio eletrônico de seus usuários, mesmo sob intimações judiciais ou exfiltrações criminosas.

#### 2. Autenticação Cega com Double-Blind HMAC (`login_token`)
Sem o e-mail, o login passa a ser realizado exclusivamente pelo **Pseudônimo** comunitário (ex: `@FarolSeguro_1042`). No entanto, armazenar o pseudônimo em texto claro na tabela `auth_security.users` exporia a identidade pública do membro caso a tabela de autenticação fosse comprometida.

Para solucionar essa fragilidade, implementou-se a **Autenticação Double-Blind via `login_token`**:
$$\text{pseudonym}_{\text{norm}} = \text{toLowerCase}\big(\text{trim}(\text{pseudonym})\big)$$
$$\text{login\_token} = \text{HMAC-SHA256}_K(\text{pseudonym}_{\text{norm}})$$

A tabela `auth_security.users` armazena apenas o `login_token` (64 caracteres hexadecimais) sob um índice único `idx_users_login_token`. Quando o usuário insere seu pseudônimo na tela de login, a API deriva o `login_token` em memória e realiza a busca $O(1)$ indexada:
```typescript
// apps/api/src/lib/crypto-token.ts
export function deriveLoginToken(pseudonym: string): string {
  const pepper = env.APP_PEPPER_V1 || env.APP_PEPPER_SECRET;
  const normalized = pseudonym.trim().toLowerCase();
  return crypto.createHmac('sha256', pepper).update(normalized).digest('hex');
}
```

```typescript
// apps/api/src/routes/auth.ts (POST /login)
const loginToken = deriveLoginToken(identifier);
const [user] = await db.select().from(users).where(eq(users.loginToken, loginToken)).limit(1);
```

#### 3. Chave Mestra de Recuperação em Alfabeto Crockford Base32
Sem e-mail cadastrado, mecanismos convencionais de recuperação de senha baseados em *"Clique no link enviado para sua caixa de entrada"* são impossíveis. A custódia do acesso recai integralmente sobre o usuário através de uma **Chave Mestra Criptográfica**.

##### O Alfabeto Seguro Crockford Base32
Desenvolvido pelo cientista da computação Douglas Crockford, esse conjunto de 32 caracteres foi projetado para legibilidade e digitação humana resiliente:
$$\Sigma_{\text{Crockford}} = \{ \texttt{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F, G, H, J, K, M, N, P, Q, R, S, T, V, W, X, Y, Z} \}$$

**Exclusões Deliberadas:**
1. `I` e `L`: Excluídos para evitar confusão visual com o dígito `1` ou entre si em diferentes tipografias.
2. `O`: Excluído para evitar confusão com o dígito `0`.
3. `U`: Excluído propositalmente da especificação Crockford para **evitar a formação involuntária de vocábulos ofensivos ou obscenos** quando cadeias aleatórias são geradas.

##### Formato Canônico e Entropia Matemática
A chave mestra é estruturada no formato:
$$\texttt{FIRME-XXXXX-XXXXX-XXXXX-XXXXX}$$
Totalizando 20 caracteres úteis de entropia divididos em 4 blocos de 5 caracteres.

**Cálculo da Entropia:**
$$S = |\Sigma_{\text{Crockford}}|^{20} = 32^{20} = (2^5)^{20} = 2^{100} \text{ estados possíveis}$$
$$H = \log_2(2^{100}) = 100 \text{ bits de entropia criptográfica}$$

Um espaço amostral de $2^{100} \approx 1,267 \times 10^{30}$ combinações torna matematicamente inalcançável qualquer tentativa de ataque de força bruta por dicionário ou colisão pré-computada.

Implementação da geração em [crypto-token.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/crypto-token.ts):
```typescript
export const CROCKFORD_BASE32_CHARSET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateRecoveryKey(): string {
  let chars = '';
  for (let i = 0; i < 20; i++) {
    const randomIndex = crypto.randomInt(0, CROCKFORD_BASE32_CHARSET.length);
    chars += CROCKFORD_BASE32_CHARSET[randomIndex];
  }
  const block1 = chars.slice(0, 5);
  const block2 = chars.slice(5, 10);
  const block3 = chars.slice(10, 15);
  const block4 = chars.slice(15, 20);
  return `FIRME-${block1}-${block2}-${block3}-${block4}`;
}
```

##### Normalizador Tolerante a Falhas Humanas
Para mitigar erros de digitação de usuários idosos ou sob tensão emocional, a função `normalizeRecoveryKey` aplica regras de normalização:
1. Converte caracteres para maiúsculas e remove espaços em branco das extremidades.
2. Remove prefixos `FIRME-`, `FIRME`, `ANCORA-` ou `ANCORA` (suporte a chaves legadas emitidas nas fases iniciais).
3. Remove espaços e hífens internos.
4. Mapeia caracteres ambíguos: `O -> 0`, `I -> 1`, `L -> 1`.
5. Rejeita o caractere proibido `U`, lançando erro explicativo.

```typescript
export function normalizeRecoveryKey(key: string): string {
  let normalized = key.trim().toUpperCase();
  if (normalized.startsWith('FIRME')) {
    normalized = normalized.slice(5);
  } else if (normalized.startsWith('ANCORA')) {
    normalized = normalized.slice(6);
  }
  normalized = normalized.replace(/[\s-]+/g, '');

  if (normalized.includes('U')) {
    throw new Error('Chave de recuperação inválida: caractere proibido "U".');
  }

  normalized = normalized.replace(/O/g, '0').replace(/[IL]/g, '1');
  return normalized;
}
```

##### Armazenamento Criptográfico e Comparação Timing-Safe
A chave mestra bruta em texto claro é exibida uma única vez ao usuário e jamais é armazenada no banco. O servidor armazena apenas o hash criptográfico:
$$\text{recovery\_key\_hash} = \text{SHA256}\big(\text{normalizeRecoveryKey}(\text{key})\big)$$

No endpoint `/api/v1/auth/recover`, a validação da chave submetida utiliza comparação em tempo constante (`crypto.timingSafeEqual`), impedindo ataques baseados em variação de milissegundos na checagem de bytes:
```typescript
const isKeyValid =
  providedKeyHash.length === user.recoveryKeyHash.length &&
  crypto.timingSafeEqual(Buffer.from(providedKeyHash), Buffer.from(user.recoveryKeyHash));
```

#### 4. Fluxo de Retenção Mandante no Mobile ([IdentityRevealScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/IdentityRevealScreen.tsx))
Para impedir que o usuário ignore a chave e fique irremediavelmente trancado fora de sua conta no futuro, foi construído um fluxo de retenção compulsória:
1. Ao concluir o cadastro, o backend retorna a `recoveryKey`.
2. O aplicativo salva a chave no estado e no SecureStore local sob a chave `pendingKeyReveal`.
3. A navegação bloqueia a transição para a Home e apresenta a tela `IdentityRevealScreen`.
4. O botão "Começar" permanece **desabilitado** até que o usuário:
   - Toque no botão "Copiar Chave" (acionando a Clipboard API); OU
   - Marque a caixa de seleção explícita: *"Salvei minha Chave Mestra em local seguro"*.
5. Apenas após a confirmação (`acknowledgeIdentity()`), o aplicativo expurga a chave de `pendingKeyReveal` e libera a interface principal. Se o app for fechado ou reiniciado antes da confirmação, ele reabre diretamente na tela de revelação da chave.

---

### TASK-354: Concorrência, Anti-DoS e Resiliência de Rede

#### 1. Rate Limiting de Dois Baldes (*Dual-Bucket Rate Limiter*)

Em ambientes hospitalares, CAPS AD ou comunidades terapêuticas, é frequente que 20 a 100 residentes acessem a internet através do mesmo gateway Wi-Fi corporativo sob NAT. Se a API aplicasse uma regra ingênua de rate limit (ex: "máximo de 5 erros de login por IP"), bastaria um único usuário errar a senha repetidas vezes para paralisar o acesso de toda a comunidade terapêutica.

A Sprint 3.5 solucionou essa dicotomia através do modelo **Dual-Bucket**:

```
+──────────────────────────────────────────────────────────────────────────────────────────────────────────+
│                                 ARQUITETURA DUAL-BUCKET DE RATE LIMIT                                    │
+──────────────────────────────────────────────────────────────────────────────────────────────────────────+

                  REQUISIÇÃO POST /api/v1/auth/login
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │ BALDE 1: Rede / Infraestrutura (IP)          │
         │ - Limite: 100 requisições / minuto por IP    │
         │ - Permite dezenas de pacientes em mesmo NAT  │
         │ - Mitiga saturação volumétrica (DDoS/Flood)  │
         └──────────────────────────────────────────────┘
                                │ (Passou)
                                ▼
         ┌──────────────────────────────────────────────┐
         │ DERIVAÇÃO DO LOGIN_TOKEN                     │
         │ login_token = HMAC(pseudonym, PEPPER)        │
         └──────────────────────────────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │ BALDE 2: Identidade / Conta (login_token)    │
         │ - Limite: 5 falhas consecutivas em 15 min    │
         │ - Bloqueio individual da conta por 15 min    │
         │ - Retorno HTTP 429 + Cabeçalho Retry-After   │
         │ - Login com sucesso zera as falhas           │
         └──────────────────────────────────────────────┘
```

Implementação em [rate-limit.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/rate-limit.ts):
```typescript
interface AccountFailureRecord {
  failedAttempts: number;
  firstFailedAt: number;
  lastFailedAt: number;
  lockedUntil?: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

const accountFailures = new Map<string, AccountFailureRecord>();
```
O módulo conta com rotina de limpeza periódica (`cleanupExpiredLocks`) executada a cada 5 minutos via `setInterval.unref()`, evitando vazamento de memória RAM (*memory leaks*) por acúmulo de tentativas antigas.

#### 2. Proteção contra Timing Attacks & CPU Exhaustion no Login (`DUMMY_HASH`)

O algoritmo de hash de senhas **Argon2id** (padrão de ouro recomendado pela OWASP) utiliza configurações propositalmente pesadas de memória e tempo de CPU para inviabilizar ataques por GPU/ASIC. Uma verificação típica de senha consome aproximadamente **250 milissegundos** de processamento intensivo.

Isso cria dois vetores de ataque antagônicos:
1. **Ataque de Temporização (Timing Attack):** Se a API verifica o banco e responde "Credenciais inválidas" em 2ms para usuários inexistentes, mas gasta 250ms para verificar a senha de um usuário existente, o invasor pode testar dicionários de pseudônimos e descobrir quais existem no sistema medindo a latência da resposta.
2. **DoS Criptográfico por Usuários Fictícios:** Se, para equiparar o tempo, o backend gerasse um novo hash Argon2id dinâmico a cada tentativa falha, uma rajada de requisições maliciosas com pseudônimos aleatórios consumiria 100% da CPU do cluster, travando a API.

**A Solução Implementada:**
Na inicialização do servidor ([server.ts](file:///home/thales/Projetos/Ancora/apps/api/src/server.ts) e [hash.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/hash.ts)), a função `initDummyHash()` calcula **uma única vez** um hash Argon2id válido para uma senha estática (`DUMMY_STARTUP_PASSWORD`) e o retém em memória RAM.

Diante de uma tentativa de login com pseudônimo inexistente, o servidor executa a verificação contra o hash dummy:
```typescript
// apps/api/src/routes/auth.ts
if (!user) {
  recordLoginFailure(loginToken);
  // Executa dummy hash do Argon2id (tempo equiparado anti-timing attack)
  await verifyPassword(getDummyHash(), password).catch(() => false);
  return reply.status(401).send({
    status: 'error',
    message: 'Credenciais inválidas.',
  });
}
```
**Resultado:** Tanto para contas existentes quanto inexistentes, a requisição consome rigorosamente ~250ms de CPU, neutralizando a enumeração de contas sem incorrer no custo de alocar novas estruturas de hash.

#### 3. RTR com Grace Period de 10s e Mutex no Mobile

Em conexões móveis 3G/4G/5G oscilantes (túneis, metrô, áreas rurais), a rotação de Refresh Tokens (*Refresh Token Rotation — RTR*) gera problemas de corrida (*race conditions*):
1. O cliente móvel envia `POST /refresh`.
2. A API gira o token, grava a nova sessão no banco e despacha a resposta HTTP 200.
3. A torre de telefonia celular perde o pacote de retorno; o app móvel não recebe o novo token.
4. Ao restabelecer conexão, o app reenvia o refresh token original.
5. Em sistemas ingênuos, o reenvio de um refresh token já rotacionado é classificado como "ataque de roubo de token", resultando na revogação sumária de todas as sessões e deslogando o usuário involuntariamente.

##### Grace Period de 10 Segundos no Backend ([auth.ts](file:///home/thales/Projetos/Ancora/apps/api/src/routes/auth.ts))
Dentro da transação com bloqueio pessimista (`.for('update')`):
- Se `session.revokedAt !== null` e `elapsedSeconds <= 10` e `session.rotatedToSessionId !== null`:
  - A API reconhece como um **retry legítimo de rede móvel**.
  - Devolve os tokens da sessão sucessora diretamente do cache em memória `recentRotations`.
  - Nenhuma sessão é revogada.
- Se `elapsedSeconds > 10`:
  - Trata-se de uma tentativa de reúso tardio (indicativo de ataque de replay/roubo).
  - A API revoga imediatamente todas as sessões ativas daquele usuário e retorna HTTP 401.

##### Mutex de Concorrência no Cliente Móvel ([api.ts](file:///home/thales/Projetos/Ancora/apps/mobile/src/services/api.ts))
No cliente móvel, requisições paralelas concorrentes que recebam HTTP 401 são sincronizadas por um Mutex via Promise:
```typescript
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAuthTokens(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise; // Reutiliza a Promise em andamento (Mutex)
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Executa a rotação única...
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
```
Além disso, se a chamada de refresh falhar por erro de rede (queda de sinal, DNS offline, timeout de 15s via `AbortController`), o cliente **NUNCA apaga os tokens locais**. Os tokens só são removidos se o servidor responder com status estritamente igual a `HTTP 401`.

#### 4. Expansão do Namespace de Pseudônimos e Quarentena de 30 Dias

O gerador de pseudônimos poéticos e neutros ([pseudonym.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/pseudonym.ts)) foi ampliado com 32 substantivos acolhedores (`Caminho`, `Farol`, `Brisa`, `Porto`, etc.), 26 qualificadores serenos (`Calmo`, `Seguro`, `Livre`, `Firme`, etc.) e um sufixo numérico aleatório de 4 dígitos (1000 a 9999):
$$\text{Espaço Amostral} = 32 \times 26 \times 9.000 = 7.488.000 \text{ identidades únicas}$$

Quando um usuário opta por alternar sua identidade em `POST /api/v1/profile/rotate-identity`:
1. Um novo pseudônimo é sorteado e validado contra colisões.
2. O pseudônimo antigo é inserido na tabela `recovery_core.quarantined_pseudonyms` com prazo de expiração de 30 dias:
   ```sql
   quarantined_until = now() + interval '30 days'
   ```
3. Durante a vigência da quarentena, a função `isPseudonymAvailable` rejeita a alocação desse nome para qualquer outro usuário, impedindo falsificação de identidade ou usurpação de reputação em postagens comunitárias prévias.
4. O `login_token` em `auth_security.users` é atualizado na mesma transação atômica.

---

### TASK-355: Governança LGPD e Expurgo Transacional de Contas

#### 1. Registro de Consentimento de Saúde (Art. 11 da LGPD)
O Artigo 11 da LGPD exige consentimento específico e destacado do titular para o tratamento de dados pessoais sensíveis. Na Sprint 3.5, criou-se a tabela `auth_security.consents` (migração `0005`), associada ao usuário com integridade relacional em cascata:
```sql
CREATE TABLE "auth_security"."consents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "auth_security"."users"("id") ON DELETE cascade,
  "terms_version" varchar(20) NOT NULL,
  "privacy_policy_version" varchar(20) NOT NULL,
  "health_data_consent" boolean NOT NULL,
  "consented_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone
);
```
No payload de cadastro, os termos e políticas são travados pelo servidor na versão canônica `2026.1`. O consentimento `healthDataConsent` deve ser explicitamente `true`.

#### 2. Expurgo Atômico Definitivo (`DELETE /api/v1/account`)
Em estrita conformidade com o Artigo 18, VI da LGPD, a exclusão da conta foi desenhada como uma operação destrutiva atômica e irreversível que não deixa rastros em nenhum dos schemas:

```typescript
// apps/api/src/routes/auth.ts (deleteAccountHandler)
export const deleteAccountHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = request.user.sub;
  const accountToken = deriveAccountToken(userId);

  await db.transaction(async (tx) => {
    // 1. Localiza o perfil clínico pelo accountToken derivado
    const [profile] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.accountToken, accountToken))
      .limit(1);

    // 2. Deleta todos os check-ins de saúde vinculados
    if (profile) {
      await tx.delete(checkins).where(eq(checkins.profileId, profile.id));
      // 3. Deleta o perfil na tabela recovery_core.profiles
      await tx.delete(profiles).where(eq(profiles.id, profile.id));
    }

    // 4. Deleta todas as sessões em auth_security.sessions
    await tx.delete(sessions).where(eq(sessions.userId, userId));

    // 5. Deleta os consentimentos em auth_security.consents
    await tx.delete(consents).where(eq(consents.userId, userId));

    // 6. Deleta a credencial em auth_security.users
    await tx.delete(users).where(eq(users.id, userId));
  });

  return reply.status(200).send({
    status: 'success',
    message:
      'Conta e dados associados foram expurgados definitivamente em conformidade com o Art. 18, VI da LGPD.',
  });
};
```

**Propriedades de Auditoria do Expurgo:**
- **Atomicidade Total:** Qualquer erro em qualquer etapa reverte a transação inteira via `ROLLBACK`, impedindo contas fantasmas com registros de saúde órfãos.
- **Mapeamento Amplo de Rotas:** O handler está registrado em `DELETE /api/v1/account` ([account.ts](file:///home/thales/Projetos/Ancora/apps/api/src/routes/account.ts)) e também em `DELETE /api/v1/auth/account` para backward compatibility.
- **Confirmação em Dois Passos no Mobile:** O modal em [HomeScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/HomeScreen.tsx) exige confirmação explícita de risco irreversível antes do envio do disparo destrutivo. Os tokens locais no SecureStore só são limpos após o recebimento de `HTTP 200 OK` do backend.

#### 3. Invalidação Instantânea de JWTs via `token_version`
Tokens JWT stateless possuem o inconveniente de continuarem válidos até o encerramento de sua janela temporal (`expiresIn: '15m'`), mesmo que o usuário tenha trocado a senha ou solicitado recuperação de conta.

Para sanar essa vulnerabilidade:
1. Inseriu-se a coluna `token_version integer DEFAULT 0 NOT NULL` em `auth_security.users` (migração `0007`).
2. O payload do access token assinado contém a claim `tv: user.tokenVersion`.
3. O decorator global `app.authenticate` em [server.ts](file:///home/thales/Projetos/Ancora/apps/api/src/server.ts) valida se a versão informada no token coincide com o registro atual do banco:
   ```typescript
   if (!user || user.tokenVersion !== request.user.tv) {
     return reply.status(401).send({
       status: 'error',
       message: 'Sessão revogada ou conta inexistente.',
     });
   }
   ```
4. Ao recuperar a conta em `POST /recover`, o campo `token_version` é incrementado em $+1$, revogando de forma instantânea todos os JWTs anteriormente em circulação em outros dispositivos.

#### 4. Sanitização contra Log Poisoning
Em [server.ts](file:///home/thales/Projetos/Ancora/apps/api/src/server.ts), a função `genReqId` foi blindada para prevenir injeções de quebra de linha (`\r`, `\n`) ou códigos de escape ANSI em sistemas de logging:
```typescript
genReqId: (req) => {
  const headerReqId = req.headers['x-request-id'];
  if (typeof headerReqId === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(headerReqId)) {
    return headerReqId;
  }
  return crypto.randomUUID();
},
```

---

### TASK-356: Saneamento Estrutural e Testes de Invariantes com Vitest

#### 1. Padronização Institucional da Marca
A marca do projeto foi unificada canonicamente como **Jornada Firme** (mantendo o repositório sob o codinome de engenharia Âncora). Todas as chaves mestras e referências de interface adotaram o prefixo oficial `FIRME-` (mantendo tolerância retroativa a `ANCORA-` no normalizador).

#### 2. Saneamento de Código e Tipagem Estrita
- Erradicação de `any` explícito nas rotas e utilitários de criptografia.
- Remoção de blocos `try/catch` vazios ou redundantes (*no-useless-catch*).
- Tipagem estrita Zod sincronizada em tempo de compilação com o Drizzle ORM.

#### 3. Suíte de Testes de Invariantes com Vitest
Foi configurada a primeira suíte formal de testes automatizados com **Vitest** (`pnpm --filter @ancora/api test`), cobrindo rigorosamente as propriedades criptográficas, a integridade da chave Crockford, a insensibilidade de casing e o isolamento entre contas no rate limiter.

---

## 3. Catálogo de Arquivos Envolvidos e Responsabilidades

| Caminho do Arquivo | Camada / Módulo | Responsabilidade na Sprint 3.5 |
| :--- | :--- | :--- |
| `apps/api/src/env.ts` | Configuração | Validação Zod das variáveis `APP_PEPPER_V1` e `APP_PEPPER_SECRET` (min 32 bytes). |
| `apps/api/src/server.ts` | Núcleo API | Inicialização do `initDummyHash()`, decorator `app.authenticate` com checagem de `tokenVersion`, sanitização de `x-request-id` e registro de rotas. |
| `apps/api/src/db/schema/auth.ts` | Banco de Dados | DDL Drizzle do schema `auth_security`: tabelas `users` (Zero-PII, sem email), `sessions` (com `rotatedToSessionId`) e `consents` (LGPD). |
| `apps/api/src/db/schema/recovery.ts` | Banco de Dados | DDL Drizzle do schema `recovery_core`: tabelas `profiles` (com `accountToken`, timestamp truncado ao dia e `lastSeenAt: null`) e `quarantined_pseudonyms`. |
| `apps/api/src/lib/crypto-token.ts` | Criptografia | Implementação formal de `deriveAccountToken`, `deriveLoginToken`, `generateRecoveryKey`, `normalizeRecoveryKey` e `hashRecoveryKey`. |
| `apps/api/src/lib/hash.ts` | Criptografia | Algoritmo Argon2id com pepper, pré-computação do `DUMMY_HASH` de startup e `verifyPassword`. |
| `apps/api/src/lib/rate-limit.ts` | Segurança | Motor in-memory do Balde de Conta (limite de 5 falhas por 15 min, lockout e limpeza periódica). |
| `apps/api/src/lib/pseudonym.ts` | Domínio | Gerador de pseudônimos neutros ($>7,48\text{M}$ combinações) e checagem de quarentena ativa de 30 dias. |
| `apps/api/src/routes/auth.ts` | Rotas REST | Endpoints `/register`, `/login` (com blind token e dummy hash), `/recover`, `/refresh` (com grace period de 10s), `/logout` e `deleteAccountHandler`. |
| `apps/api/src/routes/account.ts` | Rotas REST | Endpoint canônico `DELETE /api/v1/account` com expurgo transacional e delegação para `deleteAccountHandler`. |
| `apps/api/src/routes/profile.ts` | Rotas REST | Resolução de perfil via `accountToken` e endpoint `/rotate-identity` com quarentena atômica e rotação de `loginToken`. |
| `apps/api/src/routes/journey.ts` | Rotas REST | Função `resolveProfileId` operando de forma cega via `deriveAccountToken(userId)` sem expor dados de credencial. |
| `apps/api/src/lib/crypto-token.test.ts` | Testes Vitest | Suíte com 10 testes validando alfabeto Crockford, tolerância de erros, entropia e determinismo dos HMACs. |
| `apps/api/src/lib/rate-limit.test.ts` | Testes Vitest | Suíte com 4 testes validando bloqueio na 5ª falha, tempo de retry e isolamento entre contas. |
| `apps/mobile/App.tsx` | Mobile App | Promoção do botão SOS flutuante para a raiz e trava de navegação com tela de retenção de chave mestra. |
| `apps/mobile/src/services/storage.ts` | Mobile Services | Encapsulamento com `try/catch` defensivo no SecureStore para iOS em tela bloqueada. |
| `apps/mobile/src/services/api.ts` | Mobile Services | Mutex de concorrência no refresh de tokens, timeout via `AbortController` e preservação de tokens em erros de rede. |
| `apps/mobile/src/contexts/AuthContext.tsx` | Mobile Context | Gerenciamento de estado de autenticação, retenção compulsória via `pendingKeyReveal` e expurgo local condicional a HTTP 200. |
| `apps/mobile/src/screens/IdentityRevealScreen.tsx` | Mobile Screen | Interface mandante de cópia e confirmação da Chave Mestra antes de liberar o acesso à Home. |
| `apps/mobile/src/screens/HomeScreen.tsx` | Mobile Screen | Interface do usuário limpa de qualquer dado pessoal civil, exibindo pseudônimo poético e fluxo de exclusão de conta em dois passos. |

---

## 4. Modelagem de Dados e Criptografia

### 4.1. Esquemas Finais Drizzle ORM

#### Schema `auth_security` ([auth.ts](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/auth.ts))
```typescript
export const authSchema = pgSchema('auth_security');

export const users = authSchema.table(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    loginToken: varchar('login_token', { length: 64 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    recoveryKeyHash: varchar('recovery_key_hash', { length: 64 }).notNull(),
    tokenVersion: integer('token_version').notNull().default(0),
    isAdult: boolean('is_adult').notNull().default(false),
    role: varchar('role', { length: 50 }).notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('idx_users_login_token').on(table.loginToken)],
);

export const sessions = authSchema.table(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    rotatedToSessionId: uuid('rotated_to_session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('idx_sessions_refresh_token_hash').on(table.refreshTokenHash)],
);

export const consents = authSchema.table('consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  termsVersion: varchar('terms_version', { length: 20 }).notNull(),
  privacyPolicyVersion: varchar('privacy_policy_version', { length: 20 }).notNull(),
  healthDataConsent: boolean('health_data_consent').notNull(),
  consentedAt: timestamp('consented_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});
```

#### Schema `recovery_core` ([recovery.ts](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/recovery.ts))
```typescript
export const recoverySchema = pgSchema('recovery_core');

export const profiles = recoverySchema.table(
  'profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountToken: varchar('account_token', { length: 64 }).notNull().unique(),
    pseudonym: varchar('pseudonym', { length: 50 }).notNull().unique(),
    avatarId: varchar('avatar_id', { length: 50 }).notNull().default('avatar_default'),
    persona: varchar('persona', { length: 20 }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`date_trunc('day', now())`)
      .notNull(),
  },
  (table) => [
    index('idx_profiles_account_token').on(table.accountToken),
    index('idx_profiles_last_seen').on(table.lastSeenAt),
  ],
);

export const quarantinedPseudonyms = recoverySchema.table('quarantined_pseudonyms', {
  id: uuid('id').defaultRandom().primaryKey(),
  pseudonym: varchar('pseudonym', { length: 50 }).notNull().unique(),
  quarantinedUntil: timestamp('quarantined_until', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

### 4.2. Comparativo Visual: Schema Antes vs Schema Blindado

```
+──────────────────────────────────────────────────────────────────────────────────────────────────────────+
│                                COMPARATIVO ARQUITETURAL DE MODELAGEM                                     │
+──────────────────────────────────────────────────────────────────────────────────────────────────────────+

 ANTES (Sprint 1 e 2 - Arquitetura Relacional Direta):
 ---------------------------------------------------
 [auth_security.users]
    ├── id: UUID (PK)
    ├── email: VARCHAR(255) ─────────────► [PII CRÍTICA EXPOSTA NO BANCO]
    └── password_hash: VARCHAR(255)
            │
            │  FOREIGN KEY FÍSICA DIRETA (profiles_user_id_users_id_fk)
            ▼  (Compromisso total de privacidade se houver dump SQL)
 [recovery_core.profiles]
    ├── id: UUID (PK)
    ├── user_id: UUID (FK) ──────────────► [LIGAÇÃO DIRETA E EXPLÍCITA]
    ├── pseudonym: VARCHAR(50)
    ├── created_at: TIMESTAMP (now()) ──► [CORRELAÇÃO TEMPORAL POR MILISSEGUNDOS]
    └── checkins: históricos de fissura vinculados diretamente ao indivíduo.


 DEPOIS (Sprint 3.5 - Blindagem Zero-PII e Desacoplamento Criptográfico):
 ----------------------------------------------------------------------
 [auth_security.users]
    ├── id: UUID (PK)
    ├── login_token: VARCHAR(64) ────────► [HMAC-SHA256(pseudonym, PEPPER) - Sem email]
    ├── password_hash: VARCHAR(255) ─────► [Argon2id + PEPPER de Aplicação]
    ├── recovery_key_hash: VARCHAR(64) ──► [SHA256(normalizeRecoveryKey(Crockford))]
    └── token_version: INTEGER ──────────► [Revogação instantânea de JWTs]
            │
            ✕ (NÃO EXISTE FOREIGN KEY NEM REFERÊNCIA DIRETA)
            │
 [recovery_core.profiles]
    ├── id: UUID (PK)
    ├── account_token: VARCHAR(64) ──────► [HMAC-SHA256(user.id, PEPPER) - Vínculo cego]
    ├── pseudonym: VARCHAR(50) ──────────► [Identidade poética neutra pública]
    ├── last_seen_at: NULL ──────────────► [Sem correlação imediata de cadastro]
    └── created_at: date_trunc('day') ───► [Microssegundos destruídos]
```

---

## 5. Contratos de Endpoints e Diagnóstico de Segurança

### 5.1. `POST /api/v1/auth/register`
- **Autenticação:** Pública (Rate Limit: 10 req/min por IP).
- **Finalidade:** Criação anônima de conta, geração de pseudônimo único, emissão da Chave Mestra Crockford, registro de consentimento LGPD e concessão de tokens de sessão.

#### Requisição
```http
POST /api/v1/auth/register HTTP/1.1
Host: api.jornadafirme.app
Content-Type: application/json

{
  "password": "SenhaUltraSegura#2026",
  "isAdult": true,
  "persona": "navegador",
  "termsVersion": "2026.1",
  "privacyPolicyVersion": "2026.1",
  "healthDataConsent": true
}
```

#### Resposta de Sucesso (`HTTP 201 Created`)
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "4a7f9b8c2d1e0f3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
    "recoveryKey": "FIRME-7K9MW-2P4VX-8B3NQ-9R5TC",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "role": "user",
      "createdAt": "2026-10-04T06:10:00.000Z"
    },
    "profile": {
      "id": "7ca64b12-9218-4b71-a4ef-1b2c3d4e5f6a",
      "pseudonym": "@FarolSeguro_1042",
      "avatarId": "avatar_default",
      "persona": "navegador"
    }
  }
}
```

---

### 5.2. `POST /api/v1/auth/login`
- **Autenticação:** Pública (Rate Limit: Balde 1 = 100 req/min por IP; Balde 2 = 5 falhas em 15 min por `login_token`).
- **Finalidade:** Autenticação anônima utilizando pseudônimo e senha com proteção anti-timing attack.

#### Requisição
```http
POST /api/v1/auth/login HTTP/1.1
Host: api.jornadafirme.app
Content-Type: application/json

{
  "identifier": "@FarolSeguro_1042",
  "password": "SenhaUltraSegura#2026"
}
```

#### Respostas de Erro de Segurança
- **Bloqueio por Força Bruta (`HTTP 429 Too Many Requests`):**
  ```http
  HTTP/1.1 429 Too Many Requests
  Retry-After: 900
  Content-Type: application/json

  {
    "status": "error",
    "message": "Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em 15 minutos."
  }
  ```
- **Credenciais Inválidas ou Conta Inexistente (`HTTP 401 Unauthorized` — Tempo equiparado via `DUMMY_HASH`):**
  ```json
  {
    "status": "error",
    "message": "Credenciais inválidas."
  }
  ```

---

### 5.3. `POST /api/v1/auth/recover`
- **Autenticação:** Pública (Rate Limit: 5 req/min por IP).
- **Finalidade:** Redefinição de senha utilizando a Chave Mestra Crockford Base32. Invalida tokens prévios via `tokenVersion + 1`.

#### Requisição
```http
POST /api/v1/auth/recover HTTP/1.1
Host: api.jornadafirme.app
Content-Type: application/json

{
  "pseudonym": "@FarolSeguro_1042",
  "recoveryKey": "firme-7k9mw-2p4vx-8b3nq-9r5tc",
  "newPassword": "NovaSenhaSegura#2026"
}
```

#### Resposta de Sucesso (`HTTP 200 OK`)
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e",
    "recoveryKey": "FIRME-3M8XY-9W2TR-1K5NP-7V4BZ",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "role": "user",
      "createdAt": "2026-10-04T06:10:00.000Z"
    },
    "profile": {
      "id": "7ca64b12-9218-4b71-a4ef-1b2c3d4e5f6a",
      "pseudonym": "@FarolSeguro_1042",
      "avatarId": "avatar_default",
      "persona": "navegador"
    }
  }
}
```

---

### 5.4. `DELETE /api/v1/account` (Direito ao Esquecimento — LGPD Art. 18, VI)
- **Autenticação:** Obrigatória (`Bearer <JWT>`).
- **Finalidade:** Expurgo atômico transacional definitivo de todas as tabelas em ambos os schemas.

#### Requisição
```http
DELETE /api/v1/account HTTP/1.1
Host: api.jornadafirme.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Resposta de Sucesso (`HTTP 200 OK`)
```json
{
  "status": "success",
  "message": "Conta e dados associados foram expurgados definitivamente em conformidade com o Art. 18, VI da LGPD."
}
```

---

## 6. Arquitetura da Suíte de Testes Automatizados (Vitest)

A suíte de testes de invariantes criptográficas e controle de concorrência foi consolidada em `apps/api/src/lib/` e é executada através do comando:
```bash
pnpm --filter @ancora/api test
```

### 6.1. Especificação dos Testes em [crypto-token.test.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/crypto-token.test.ts)

A suíte cobre 10 asserções fundamentais divididas em 4 grupos:

```typescript
describe('crypto-token: Chave Mestra e Derivações Criptográficas', () => {
  describe('generateRecoveryKey', () => {
    // 1. Validação de formato canônico
    it('deve gerar chave no formato canônico FIRME-XXXXX-XXXXX-XXXXX-XXXXX');

    // 2. Validação estrita do alfabeto Crockford (50 iterações estatísticas)
    it('deve conter estritamente caracteres do alfabeto Crockford Base32 (sem I, L, O, U)');
  });

  describe('normalizeRecoveryKey', () => {
    // 3. Normalização canônica do prefixo oficial
    it('deve normalizar chave padrão com prefixo FIRME-');

    // 4. Tolerância retroativa a chaves com prefixo de desenvolvimento
    it('deve manter tolerância e normalizar chave com prefixo legado ANCORA- ou ANCORA');

    // 5. Tolerância a espaços e variações de maiúsculas/minúsculas
    it('deve ignorar variações de maiúsculas/minúsculas e espaços/hífens');

    // 6. Mapeamento heurístico de caracteres ambíguos
    it('deve mapear caracteres ambíguos: "O" -> "0" e "I"/"L" -> "1"');

    // 7. Rejeição explícita do caractere proibido
    it('deve rejeitar estritamente o caractere proibido "U"');
  });

  describe('hashRecoveryKey', () => {
    // 8. Consistência determinística do hash SHA-256 pós-normalização
    it('deve produzir o mesmo SHA-256 para representações equivalentes da mesma chave');
  });

  describe('deriveAccountToken e deriveLoginToken', () => {
    // 9. Determinismo e unicidade do vínculo cego de perfil
    it('deriveAccountToken deve ser determinístico para o mesmo userId');

    // 10. Insensibilidade a variações de digitação no pseudônimo
    it('deriveLoginToken deve ser determinístico e insensível a espaços e casing do pseudônimo');
  });
});
```

---

### 6.2. Especificação dos Testes em [rate-limit.test.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/rate-limit.test.ts)

A suíte cobre 4 asserções de controle de fluxo e anti-brute force:

```typescript
describe('rate-limit: Controle de Falhas e Bloqueio por Conta', () => {
  // 1. Tolerância nas primeiras 4 tentativas
  it('não deve bloquear a conta nas primeiras 4 tentativas falhas');

  // 2. Acionamento do bloqueio e emissão de tempo de espera
  it('deve bloquear a conta na 5ª tentativa falha consecutiva e informar retryAfterSeconds');

  // 3. Reset imediato do balde após autenticação bem-sucedida
  it('recordLoginSuccess deve zerar as falhas e desbloquear imediatamente a conta');

  // 4. Não-contaminação entre contas distintas sob o mesmo ambiente
  it('deve manter isolamento estrito entre diferentes contas/tokens');
});
```

**Resultado de Homologação dos Testes:**
```
✓ src/lib/rate-limit.test.ts (4 tests) 6ms
✓ src/lib/crypto-token.test.ts (10 tests) 33ms

Test Files  2 passed (2)
     Tests  14 passed (14)
  Duration  205ms
```

---

## 7. Matriz de Conformidade e Critérios de Aceite (Definition of Done)

A tabela abaixo valida a conformidade exaustiva contra todos os requisitos da Sprint 3.5:

| ID | Critério de Aceite / Requisito | Status | Evidência Técnica Auditada |
| :---: | :--- | :---: | :--- |
| **DOD-01** | SOS na raiz de `App.tsx` para usuários anônimos e deslogados | ✅ **Concluído** | [App.tsx:L103](file:///home/thales/Projetos/Ancora/apps/mobile/App.tsx#L103) encapsulado em `AppContent` independente de sessão. |
| **DOD-02** | Captura defensiva de exceções de Keychain bloqueado no iOS | ✅ **Concluído** | [storage.ts:L35-L39](file:///home/thales/Projetos/Ancora/apps/mobile/src/services/storage.ts#L35-L39) com blocos `try/catch` protegendo `SecureStore`. |
| **DOD-03** | Remoção de Foreign Key direta entre credencial e perfil | ✅ **Concluído** | Migração SQL `0002` executada; `profiles.user_id` extirpado. |
| **DOD-04** | Vínculo unidirecional via `account_token = HMAC-SHA256(user.id, PEPPER)` | ✅ **Concluído** | [crypto-token.ts:L6-L9](file:///home/thales/Projetos/Ancora/apps/api/src/lib/crypto-token.ts#L6-L9) e [recovery.ts:L10](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/recovery.ts#L10). |
| **DOD-05** | Destruição de correlação temporal em dumps de banco de dados | ✅ **Concluído** | `profiles.created_at = date_trunc('day', now())` e `last_seen_at = NULL` no cadastro. |
| **DOD-06** | Remoção definitiva da coluna de e-mail do banco de dados | ✅ **Concluído** | Migração SQL `0006` executada; `users.email` extirpado. |
| **DOD-07** | Busca cega $O(1)$ por pseudônimo via `login_token = HMAC(pseudonym, PEPPER)` | ✅ **Concluído** | [crypto-token.ts:L14-L18](file:///home/thales/Projetos/Ancora/apps/api/src/lib/crypto-token.ts#L14-L18) e índice `idx_users_login_token`. |
| **DOD-08** | Chave Mestra Crockford Base32 com 100 bits de entropia (`FIRME-`) | ✅ **Concluído** | [crypto-token.ts:L49-L60](file:///home/thales/Projetos/Ancora/apps/api/src/lib/crypto-token.ts#L49-L60), sem caracteres `I, L, O, U`. |
| **DOD-09** | Tela de retenção mandante de chave mestra no cliente móvel | ✅ **Concluído** | [IdentityRevealScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/IdentityRevealScreen.tsx) com persistência em `pendingKeyReveal`. |
| **DOD-10** | Rate Limiter de Dois Baldes (100 req/min IP vs 5 falhas/15 min conta) | ✅ **Concluído** | [rate-limit.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/rate-limit.ts) e integração no endpoint `/login`. |
| **DOD-11** | Startup `DUMMY_HASH` Argon2id anti-timing attack e anti-DoS de CPU | ✅ **Concluído** | [hash.ts:L39-L53](file:///home/thales/Projetos/Ancora/apps/api/src/lib/hash.ts#L39-L53) e [server.ts:L57](file:///home/thales/Projetos/Ancora/apps/api/src/server.ts#L57). |
| **DOD-12** | RTR com Grace Period de 10s para 4G e Mutex de concorrência mobile | ✅ **Concluído** | [auth.ts:L668-L763](file:///home/thales/Projetos/Ancora/apps/api/src/routes/auth.ts#L668-L763) e [api.ts:L73-L140](file:///home/thales/Projetos/Ancora/apps/mobile/src/services/api.ts#L73-L140). |
| **DOD-13** | Namespace de pseudônimos $> 7,48\text{M}$ e quarentena atômica de 30 dias | ✅ **Concluído** | [pseudonym.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/pseudonym.ts) e tabela `recovery_core.quarantined_pseudonyms`. |
| **DOD-14** | Tabela `consents` gravando consentimento LGPD Art. 11 (v2026.1) | ✅ **Concluído** | Migração SQL `0005`, [auth.ts:L45-L55](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/auth.ts#L45-L55) e validação no cadastro. |
| **DOD-15** | Endpoint atômico `DELETE /api/v1/account` de expurgo total (LGPD Art. 18, VI) | ✅ **Concluído** | [auth.ts:L919-L953](file:///home/thales/Projetos/Ancora/apps/api/src/routes/auth.ts#L919-L953) e [account.ts](file:///home/thales/Projetos/Ancora/apps/api/src/routes/account.ts) com exclusão transacional em 6 etapas. |
| **DOD-16** | Invalidação instantânea de JWTs via claim `token_version` | ✅ **Concluído** | Migração SQL `0007`, payload JWT `tv` e validação no decorator `app.authenticate`. |
| **DOD-17** | Sanitização rigorosa de cabeçalhos `x-request-id` contra Log Poisoning | ✅ **Concluído** | [server.ts:L62-L70](file:///home/thales/Projetos/Ancora/apps/api/src/server.ts#L62-L70) com regex `/^[a-zA-Z0-9_-]{1,64}$/`. |
| **DOD-18** | Suíte de testes automatizados com Vitest com 100% de sucesso | ✅ **Concluído** | 14 testes executados e validados em [crypto-token.test.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/crypto-token.test.ts) e [rate-limit.test.ts](file:///home/thales/Projetos/Ancora/apps/api/src/lib/rate-limit.test.ts). |
