# RFC 003: Vinculação Opcional de E-mail de Recuperação com Criptografia em Repouso

- **Status:** Proposta Aprovada (Extensão Incremental da RFC-002 v3.0)
- **Versão:** 1.0
- **Dependência Normativa:** Estende e complementa a [RFC-002 v3.0](specs/RFC-002.md)
- **Escopo de Entrega:** Sprint 4 (Configurações de Conta / Perfil)
- **Princípio Central:** *Confiança Progressiva (Progressive Trust) e Minimização de Dados (LGPD Art. 6º, III e Art. 8º, § 5º).*

---

## 1. Motivação e Filosofia

O **Jornada Firme** opera sob o paradigma **Zero-PII na porta de entrada**: o cadastro é 100% anônimo, não exigindo e-mail, telefone ou dados civis do usuário em recuperação.

No entanto, para atender à demanda de usuários que temem esquecer sua senha ou perder a Chave Mestra física, esta especificação introduz a **Vinculação Opcional de E-mail**. 

O recurso segue a premissa da **Confiança Progressiva**:
1. O usuário entra no aplicativo de forma anônima;
2. Conhece e valida o ambiente seguro e sereno da plataforma;
3. Se desejar, acessa voluntariamente as Configurações de Perfil e vincula um e-mail para fins exclusivos de socorro e recuperação de acesso;
4. Mantém a **liberdade absoluta de desvincular e apagar o e-mail a qualquer momento**, revertendo a conta ao anonimato total sem perder seu histórico ou check-ins.

---

## 2. Invariantes de Arquitetura e Segurança (Regras Inegociáveis)

1. **Zero E-mail no Cadastro:** O fluxo de onboarding e cadastro inicial permanece estritamente Zero-PII. O e-mail nunca é solicitado na tela de registro.
2. **Criptografia em Repouso Obrigatória (AES-256-GCM):** O endereço de e-mail **NUNCA** é gravado em texto puro no banco de dados. Ele é armazenado como *ciphertext* criptografado com AES-256-GCM.
3. **Busca Cega via Blind Index:** Para permitir a recuperação de conta por e-mail em tempo $O(1)$ sem precisar decifrar todo o banco, utiliza-se um índice cego determinístico derivado por HMAC:
   $$\text{email\_lookup\_hash} = \text{HMAC-SHA256}(\text{email.toLowerCase().trim()}, \text{APP\_PEPPER\_V1})$$
4. **Isolamento de Domínio (Sem Vazamento Clínico):** O e-mail reside exclusivamente no schema de autenticação (`auth_security`). Nenhuma tabela do schema clínico (`recovery_core`) tem acesso ou referência a este dado.
5. **Máscara Visual Estrita:** A interface do aplicativo **nunca exibe o e-mail completo** na tela, prevenindo vazamentos por olhares de terceiros (*shoulder surfing*).
6. **O Teste da Notificação no E-mail:** Nenhuma mensagem transacional enviada para a caixa postal do usuário pode conter palavras estigmatizantes no remetente ou no assunto ("drogas", "vício", "recaída", "fissura", "clínica").
7. **Direito de Desvinculação Instantânea:** O usuário pode remover o e-mail a qualquer momento com 1 clique, acionando a destruição imediata do registro no banco (LGPD Art. 8º, § 5º).

---

## 3. Modelagem de Dados no PostgreSQL

A implementação adota uma tabela isolada dentro do schema de segurança, evitando sobrecarregar a entidade principal de usuários e garantindo separação de responsabilidades.

### 3.1. Schema Drizzle (`apps/api/src/db/schema/auth.ts`)

```ts
export const userRecoveryEmails = authSchema.table(
  "user_recovery_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    encryptedEmail: text("encrypted_email").notNull(), // Formato: "iv:authTag:ciphertext" (AES-256-GCM)
    emailLookupHash: varchar("email_lookup_hash", { length: 64 })
      .notNull()
      .unique(), // Blind index para busca O(1)
    isVerified: boolean("is_verified").notNull().default(false),
    verificationCodeHash: varchar("verification_code_hash", { length: 64 }),
    verificationExpiresAt: timestamp("verification_expires_at", { withTimezone: true }),
    verificationAttempts: integer("verification_attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (table) => ({
    idxEmailLookup: uniqueIndex("idx_user_recovery_emails_lookup").on(table.emailLookupHash),
    idxEmailUserId: uniqueIndex("idx_user_recovery_emails_user_id").on(table.userId),
  })
);
```

---

## 4. Especificação das Rotas de API (`apps/api`)

### 4.1. `POST /api/v1/auth/email/bind` (Iniciar Vinculação)
- **Acesso:** Autenticado (`preHandler: [app.authenticate]`).
- **Body:** `{ "email": "usuario@exemplo.com" }` (validado com Zod `.email().toLowerCase().trim()`).
- **Lógica de Execução:**
  1. Calcula `emailLookupHash = deriveEmailLookupHash(email)`.
  2. Verifica se o e-mail já está em uso por outra conta verificada (se sim, retorna erro amigável sem revelar o titular).
  3. Criptografa o e-mail: `encryptedEmail = encryptAES256GCM(email, env.ENCRYPTION_KEY, AAD=userId)`.
  4. Gera código OTP numérico de 6 dígitos aleatórios (`crypto.randomInt(100000, 999999)`).
  5. Salva na tabela `user_recovery_emails` com `isVerified: false`, validade de 15 minutos e hash SHA-256 do código.
  6. Enfileira o envio do e-mail discreto via `pg-boss` para o Mailpit/SMTP.
  7. Retorna HTTP 200: `{ "status": "success", "message": "Código de verificação enviado para o e-mail informado." }`.

### 4.2. `POST /api/v1/auth/email/verify` (Confirmar Código OTP)
- **Acesso:** Autenticado (`preHandler: [app.authenticate]`).
- **Body:** `{ "code": "123456" }` (string de 6 dígitos numéricos).
- **Lógica de Execução:**
  1. Busca o registro de e-mail pendente do usuário logado.
  2. Verifica tentativas: se `verificationAttempts >= 5`, invalida o código e exige reinício do processo.
  3. Valida se o código expirou (`verificationExpiresAt < NOW()`).
  4. Compara com segurança temporal (`crypto.timingSafeEqual`).
  5. Se válido: atualiza `isVerified: true`, `verifiedAt = NOW()`, limpa o hash do código e registra o consentimento específico no histórico da LGPD.
  6. Retorna HTTP 200 com o e-mail mascarado: `{ "status": "success", "data": { "maskedEmail": "us*****@exemplo.com" } }`.

### 4.3. `DELETE /api/v1/auth/email` (Desvincular e Voltar ao Anonimato)
- **Acesso:** Autenticado (`preHandler: [app.authenticate]`).
- **Lógica de Execução:**
  1. Executa `DELETE FROM auth_security.user_recovery_emails WHERE user_id = request.user.sub`.
  2. Atualiza o registro de consentimento correspondente marcando revogação.
  3. A conta permanece ativa, preservando o pseudônimo, check-ins, configurações e a Chave Mestra intactos.
  4. Retorna HTTP 200: `{ "status": "success", "message": "E-mail desvinculado com sucesso. Sua conta voltou ao anonimato absoluto." }`.

### 4.4. `POST /api/v1/auth/recover-by-email` (Fluxo de Recuperação)
- **Acesso:** Público (com Rate Limit estrito de 5 req/min por IP).
- **Body:** `{ "email": "usuario@exemplo.com" }`.
- **Lógica de Execução (Resposta Cega Anti-Enumeração):**
  1. Calcula `emailLookupHash`.
  2. Busca o registro no banco:
     - Se encontrar conta verificada: gera OTP de recuperação de 6 dígitos e despacha e-mail com instruções e código de redefinição.
     - Se NÃO encontrar: executa hash dummy para equiparar o tempo de processamento (~250ms).
  3. Retorna **sempre** a mesma resposta neutra:
     ```json
     {
       "status": "success",
       "message": "Se o e-mail informado estiver vinculado a uma conta, enviamos as instruções de recuperação."
     }
     ```

---

## 5. Interface Mobile e Micro-Copywriting (`apps/mobile`)

A experiência de vincular o e-mail reside exclusivamente nas **Configurações de Conta**, transmitindo acolhimento, transparência e segurança.

### 5.1. Card Informativo de Privacidade e Dica OpSec

Antes do campo de digitação, a interface exibe os seguintes cartões com identidade visual serena:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  💡 Dica para sua Proteção e Privacidade                               │
│                                                                        │
│  Para sua total tranquilidade, evite utilizar o e-mail do seu          │
│  trabalho ou o seu e-mail pessoal principal.                           │
│                                                                        │
│  Se preferir, crie um e-mail gratuito exclusivo apenas para o          │
│  Jornada Firme, ou utilize recursos como o "Ocultar meu E-mail"        │
│  da Apple ou serviços seguros como o Proton.                           │
│                                                                        │
│  A sua privacidade e a sua paz estão sempre em primeiro lugar.         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  🔒 Nosso Compromisso de Segurança com seu E-mail                      │
│                                                                        │
│  • Criptografia em Repouso:                                            │
│    Seu e-mail é guardado com criptografia avançada (AES-256). Nem       │
│    mesmo a nossa equipe consegue visualizar seu e-mail em texto puro   │
│    no banco de dados.                                                  │
│                                                                        │
│  • Finalidade Exclusiva de Socorro:                                    │
│    Este dado NUNCA será vendido, compartilhado ou usado para           │
│    propagandas. Ele serve unicamente para você recuperar sua senha.    │
│                                                                        │
│  • Liberdade Total de Escolha:                                         │
│    Você pode desvincular e apagar este e-mail do nosso sistema a       │
│    qualquer momento com apenas 1 clique, sem perder sua conta.         │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2. Modal de Confirmação de Desvinculação

Ao clicar no botão *"Desvincular e-mail e voltar ao anonimato total"*, o aplicativo apresenta confirmação preventiva:

> 🛡️ **Voltar ao Anonimato Absoluto**  
> *"Ao remover seu e-mail, este dado será apagado definitivamente dos nossos servidores. A partir de agora, caso esqueça sua senha, a **Chave Mestra** será sua única forma de recuperação de acesso. Certifique-se de tê-la anotada."*  
> **[ Cancelar ]** &nbsp;&nbsp;&nbsp;&nbsp; **[ Sim, Remover Meu E-mail ]**

---

## 6. O Teste da Notificação nos E-mails Enviados

Para proteger o usuário contra olhares de familiares ou colegas que possam ver a tela de bloqueio do celular ou notificações no computador:

| Parâmetro | Padrão Incorreto (Violador de Sigilo) | Padrão Canônico Jornada Firme |
| :--- | :--- | :--- |
| **Remetente:** | `Jornada Firme - Recuperação de Dependentes` | **`Jornada Firme`** (ou `Equipe Jornada`) |
| **Endereço De:** | `nao-responda@recuperacao.com.br` | **`seguranca@jornadafirme.com.br`** |
| **Assunto:** | `Código para tratar seu vício / recuperação` | **`Código de segurança da sua conta`** |
| **Pré-visualização:** | `Seu código para vencer a fissura é 123456...` | **`Seu código de verificação é 123456. Válido por 15 minutos.`** |

---

## 7. Matriz de Ameaças e Mitigações (Threat Model)

| Vetor de Ameaça | Cenário de Risco | Mitigação Implementada |
| :--- | :--- | :--- |
| **Dump Completo do Banco** | Invasor obtém cópia SQL da tabela `user_recovery_emails`. | O campo é cifrado com AES-256-GCM. Sem a chave de ambiente da API, os e-mails são indecifráveis. |
| **Enumeração de Contas por E-mail** | Curioso tenta cadastrar e-mail de terceiro para testar se ele usa o app. | Resposta estritamente idêntica no endpoint público de recuperação, equiparada por tempo de processamento. |
| **Força Bruta no Código OTP** | Atacante tenta adivinhar os 6 dígitos numéricos ($10^6$ combinações). | Bloqueio automático e invalidação da tentativa após 5 erros consecutivos de digitação. |
| **Vazamento Visual (Shoulder Surfing)** | Colega de trabalho olha a tela do celular do usuário aberta no app. | Exibição exclusivamente mascarada (`us*****@exemplo.com`). |
| **E-mail Fantasma / Lixo no Banco** | Usuário inicia vinculação de e-mail errado e nunca verifica. | Registros com `is_verified = false` e data expirada são purgados automaticamente após 24h via job no `pg-boss`. |
