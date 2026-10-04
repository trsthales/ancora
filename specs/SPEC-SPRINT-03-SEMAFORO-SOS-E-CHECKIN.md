# 📘 Especificação Técnica e Funcional — Sprint 3: Semáforo SOS, Check-in com Interceptação e Motor de Temas

- **Documento:** `specs/SPEC-SPRINT-03-SEMAFORO-SOS-E-CHECKIN.md`
- **Projeto:** Jornada Firme (Âncora) — Ecossistema de Saúde Comunitária e Mútua Ajuda ([RFC 002](file:///home/thales/Projetos/Ancora/specs/RFC-002.md))
- **Status:** ✅ Concluída e Auditada
- **Sprint:** Sprint 3 (Fase 1 (B) & 2 (A) — Semáforo SOS 100% Offline-First, Backend da Jornada com Fuso BR e Motor de Interceptação de Fissura)
- **Autor/Arquitetura:** Engenharia Jornada Firme & Coordenação Clínica de Redução de Danos
- **Stack Tecnológica:** Node.js 22 LTS, TypeScript 5.7+ (Strict Mode), Fastify 5.2, PostgreSQL 16 Alpine, Drizzle ORM 0.45, React Native 0.86, Expo 57, React Native Animated API, Zod 3.24, Linking API

---

## 1. Visão Geral e Princípios Clínicos de Redução de Danos e Prevenção de Recaída

### 1.1. O Conceito da "Onda de Fissura" (*Urge Surfing*) e a Neurobiologia da Crise

A dependência química e os comportamentos compulsivos operam sob circuitos neurobiológicos hiperestimulados de recompensa e saliência incentiva, centrados na via dopaminérgica mesolímbica (da Área Tegmentar Ventral ao Núcleo Accumbens e Córtex Pré-Frontal). Diante de gatilhos ambientais, memórias afetivas ou desregulação emocional interna (estresse agudo, exaustão física, frustração), desencadeia-se o fenômeno clínico da **fissura** (*craving*).

Na abordagem clássica da Terapia Cognitivo-Comportamental de Prevenção de Recaída, desenvolvida pelo Dr. G. Alan Marlatt, a fissura não deve ser encarada como uma força destrutiva intransponível que exige luta frontal violenta, mas sim como uma **onda oceânica**:

1. **Início e Ascensão (*Rising Phase*):** O estímulo gatilho gera pensamentos intrusivos, taquicardia, tensão muscular e urgência de alívio imediato.
2. **Pico ou Crista da Onda (*Crest Phase*):** A intensidade atinge seu ponto neurofisiológico máximo. Estudos clínicos comprovam que esse ápice sustenta-se tipicamente entre **15 e 30 minutos** antes que a depleção de neurotransmissores e a habituação do sistema nervoso autônomo iniciem o declínio.
3. **Decaimento e Resolução (*Falling Phase*):** Se o indivíduo não alimenta o circuito com o consumo ou com ruminações de autoacusação, a curva de urgência decresce espontaneamente, restabelecendo a homeostase fisiológica.

```
       INTENSIDADE DA FISSURA
          ▲
  Crítica │                  ╭─────╮  <--- ÁPICE DA ONDA (15 a 30 min)
   (Nív 5)│                 ╭╯     ╰╮      [Ponto Crítico de Interceptação]
          │                ╭╯       ╰╮
  Intensa │               ╭╯         ╰╮
   (Nív 4)│              ╭╯           ╰╮
          │             ╭╯             ╰╮
 Moderada │            ╭╯               ╰╮
(Nív 2-3) │           ╭╯                 ╰╮
          │    ╭─────╮╯                   ╰─────╮  <--- RESOLUÇÃO NATURAL
     Leve │   ╭╯                                ╰╮      (Tônus Parassimpático)
  (Nív 0-1│───╯                                  ╰────────────────────────►
          └───────────────────────────────────────────────────────────── TEMPO (min)
              0 min         10 min        20 min        30 min        40 min
```

O princípio clínico fundamental do Jornada Firme é o de que **a fissura é temporária, mas a recaída é permanente se não houver acolhimento**. Quando a pessoa aprende a "surfar a onda" (*Urge Surfing*) por meio de técnicas somáticas de ativação do tônus parassimpático (estimulação do nervo vago) e distração atencional ativa, ela neutraliza a urgência da crise sem entrar em pânico moral.

---

### 1.2. O Semáforo SOS como Arquitetura de Contenção em Três Camadas Estratificadas

Em momentos agudos de sofrimento psíquico, o córtex pré-frontal sofre hipoativação, sequestrado pela amígdala cerebral. Diante disso, qualquer interface que exija tomada de decisão complexa, preenchimento de formulários densos ou navegação labiríntica falhará categoricamente.

O **Semáforo SOS** foi concebido como uma estrutura de triagem cognitiva mínima, dividida em três níveis cromáticos universais, intuitivos e não-estigmatizantes:

```
+─────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    ARQUITETURA DO SEMÁFORO SOS                                  |
+─────────────────────────────────────────────────────────────────────────────────────────────────+

 🟢 NÍVEL 1: AUTOCUIDADO & DESACELERAÇÃO
    ├─ Escopo: Fissura leve a moderada, ansiedade flutuante, inquietude e impulsos iniciais.
    ├─ Estratégia: Estimulação parassimpática imediata e reorientação sensorial atencional.
    ├─ Ferramentas:
    │   ├─ Respiração Guiada 4-7-8 (Círculo expansivo, contagem de ciclos e travas de segurança).
    │   └─ Ancoragem Sensorial 5-4-3-2-1 (Progressão tátil pelos sentidos com checklist físico).
    └─ Dependência de Rede: 0% (Totalmente executado no hardware móvel local).

 🟡 NÍVEL 2: SUPORTE HUMANO & ESCUTA COMPASSIVA
    ├─ Escopo: Sofrimento emocional agudo, solidão incapacitante e sensação de colapso anímico.
    ├─ Estratégia: Descompressão relacional externa sem julgamento moral ou coerção médica.
    ├─ Ferramentas:
    │   ├─ Discagem Telefônica Direta CVV 188 (Canal gratuito, 24 horas e confidencial).
    │   ├─ Acesso ao Chat Web Oficial CVV (Alternativa para quem não pode verbalizar sons).
    │   └─ Aviso Obrigatório de Cuidado (Esclarecimento de escuta voluntária de suporte à vida).
    └─ Dependência de Rede: Discagem GSM nativa (sem internet) ou HTTP para o webchat.

 🔴 NÍVEL 3: EMERGÊNCIA MÉDICA & REDE SUS
    ├─ Escopo: Suspeita de intoxicação severa, overdose, perda sensorial, convulsões ou risco à vida.
    ├─ Estratégia: Socorro móvel pré-hospitalar e redirecionamento para acolhimento de porta aberta.
    ├─ Ferramentas:
    │   ├─ Discagem Telefônica Direta SAMU 192 (Serviço Móvel de Urgência pré-hospitalar).
    │   ├─ Guia Informativo CAPS AD (Rede de Atenção Psicossocial - SUS, acolhimento de porta aberta).
    │   └─ Discagem Telefônica Disque Saúde 136 (Informações de localização da rede pública).
    └─ Dependência de Rede: Discagem GSM nativa (independe de plano de dados ou sinal de internet).
```

---

### 1.3. O Princípio da Horizontalidade e a Eliminação do Zeramento Punitivo (*Anti-Relapse Shame*)

A literatura médica contemporânea em dependência química evidencia que a dinâmica tradicional de "contagem de dias limpos ininterruptos" — predominante em aplicativos comerciais e fóruns de sobriedade — carrega um efeito colateral devastador: o **Efeito de Violação da Abstinência** (*Abstinence Violation Effect — AVE*).

Quando um usuário passa 90 dias em sobriedade e vivencia um deslize pontual, os sistemas tradicionais "zeram o contador" para o dia zero, disparando:
1. **Vergonha Tóxica (*Relapse Shame*):** O usuário sente que todos os 90 dias de aprendizado, superação e desenvolvimento foram anulados e desprovidos de valor.
2. **Abandono do Tratamento:** Diante do "fracasso total", a taxa de abandono do suporte comunitário atinge seu ápice exatamente nas 48 horas seguintes à recaída.
3. **Episódios de Compulsão Desenfreada:** A sensação de "já que perdi tudo, tanto faz" induz o indivíduo a consumir doses massivas, potencializando o risco de overdose fatal.

No **Jornada Firme**, o zeramento punitivo foi categoricamente abolido:
- **Contagem Cumulativa de Vitórias:** A métrica celebrada é o **total cumulativo de dias com check-in realizado** (`COUNT(DISTINCT DATE(...))`). Cada dia de autocuidado registrado é uma vitória eterna e gravada na pedra.
- **Não Existe "Dia Zero":** Se o indivíduo realizou 45 check-ins ao longo do ano, ele acumulou 45 vitórias. Um deslize no dia 46 não apaga as 45 conquistas prévias; ele apenas reflete um dia que precisou de acolhimento intensivo.
- **Foco Radical no Hoje:** A interface do [HomeScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/HomeScreen.tsx) e do [ProgressCard.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/ProgressCard.tsx) nunca exibe sequências quebradas (*streaks*) ou mensagens em tom acusatório. A mensagem padrão é: *"Sem cobrança de dias seguidos ou metas rígidas. O que importa é você estar aqui agora."*

---

## 2. Detalhamento Técnico das Tarefas da Sprint 3

```
+─────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    MAPA DE TAREFAS DA SPRINT 3                                  |
+─────────────────────────────────────────────────────────────────────────────────────────────────+

  [TASK-301 & 302: Semáforo SOS 100% Offline] ────► [TASK-304: Interceptação Fissura >= 4 & Temas]
                    │                                                        ▲
                    │                                                        │
                    ▼                                                        │
  [TASK-303: Backend da Jornada e Fuso SP] ──────────────────────────────────┘
```

---

### TASK-301 & 302: Semáforo SOS em Três Níveis (100% Offline-First)

#### 1. Escopo e Motivação
Garantir que a qualquer momento de crise, sem depender de autenticação, sessão válida, sinal de internet móvel ou latência de banco de dados, o usuário tenha acesso imediato a ferramentas fisiológicas de contenção e contatos de emergência.

#### 2. Componentes de Desaceleração Parassimpática (Nível 1)
O Nível 1 decompõe a autorregulação em duas ferramentas complementares:

##### A. Respiração Guiada 4-7-8 ([BreathingScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/BreathingScreen.tsx) e [BreathingCircle.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/BreathingCircle.tsx))
A técnica 4-7-8, popularizada pelo Dr. Andrew Weil e fundamentada nas práticas de *Pranayama*, utiliza tempos assimétricos para forçar a expiração a ter o dobro da duração da inspiração:
- **Inspiração Nasal (4 segundos):** Estimula a ventilação diafragmática profunda sem sobrecarga torácica.
- **Retenção do Ar (7 segundos):** Permite a saturação de oxigênio nos alvéolos pulmonares e induz uma desaceleração temporária do nó sinoatrial.
- **Expiração Bucal (8 segundos):** Aumenta a pressão intratorácica de forma suave, ativando os barorreceptores carotídeos e o nervo vago, promovendo relaxamento parassimpático e queda imediata dos batimentos cardíacos.

**Mecanismo de Animação e Imunidade a Stale Closures:**
A animação visual do círculo utiliza a `Animated API` nativa do React Native combinada com referências (`useRef`) para gerenciar timers e variáveis de controle sem engasgos de re-renderização:

```typescript
// apps/mobile/src/components/BreathingCircle.tsx
const PHASE_CONFIG: Record<
  BreathingPhase,
  { duration: number; text: string; subtext: string; targetScale: number }
> = {
  idle: { duration: 0, text: 'Preparar...', subtext: 'Toque em Iniciar para começar o ciclo 4-7-8', targetScale: 1.0 },
  inhale: { duration: 4, text: 'Inspire pelo nariz...', subtext: 'Puxe o ar suavemente enchendo o abdômen', targetScale: 1.6 },
  hold: { duration: 7, text: 'Segure o ar suavemente...', subtext: 'Mantenha o ar sem forçar a respiração', targetScale: 1.6 },
  exhale: { duration: 8, text: 'Solte o ar pela boca...', subtext: 'Esvazie o peito de maneira lenta e contínua', targetScale: 1.0 },
};
```

A transição entre fases não utiliza `useCallback` vulnerável a closures obsoletas; em vez disso, sincroniza `activeRef.current` e `phaseRef.current` em tempo real:

```typescript
// apps/mobile/src/components/BreathingCircle.tsx
const runPhase = (nextPhase: BreathingPhase) => {
  if (!activeRef.current) return;
  setPhase(nextPhase);
  const config = PHASE_CONFIG[nextPhase];
  setSecondsLeft(config.duration);
  stopAnimation();

  const anim = Animated.timing(scaleAnim, {
    toValue: config.targetScale,
    duration: config.duration * 1000,
    useNativeDriver: false,
  });
  currentAnimationRef.current = anim;
  anim.start();

  let remaining = config.duration;
  clearTimer();
  currentTimerRef.current = setInterval(() => {
    if (!activeRef.current) {
      clearTimer();
      return;
    }
    remaining -= 1;
    if (remaining > 0) {
      setSecondsLeft(remaining);
    } else {
      clearTimer();
      if (nextPhase === 'inhale') runPhase('hold');
      else if (nextPhase === 'hold') runPhase('exhale');
      else if (nextPhase === 'exhale') {
        setCompletedCycles((c) => {
          const next = c + 1;
          onCycleComplete?.(next);
          return next;
        });
        runPhase('inhale');
      }
    }
  }, 1000);
};
```

**Aviso Mandatório de Segurança Clínica:**
Para evitar riscos de alcalose respiratória transitória decorrente de hiperventilação involuntária, a tela inclui em destaque o alerta:
> *⚠️ Importante: caso sinta tontura, desconforto respiratório ou mal-estar, interrompa o exercício imediatamente e volte ao seu ritmo respiratório natural.*

##### B. Ancoragem Sensorial 5-4-3-2-1 ([GroundingScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/GroundingScreen.tsx))
A técnica de grounding baseia-se na **terapia de redirecionamento atencional**. Ao exigir que o cérebro processe estímulos sensoriais presentes no ambiente físico, retira-se o foco das alucinações de fissura e das ruminações persecutórias da amígdala.

A progressão estruturada compreende:
1. **5 Coisas que você pode VER (Visão):** Localizar objetos ou contrastes de luz reais ao redor.
2. **4 Coisas que você pode TOCAR (Tato):** Sentir texturas físicas (tecido da calça, frieza da mesa, tela do celular).
3. **3 Sons que você pode OUVIR (Audição):** Identificar ruídos de fundo (tráfego distante, vento, relógio, respiração).
4. **2 Odores que você pode CHEIRAR (Olfato):** Café, aroma de sabonete, ar externo pela janela.
5. **1 Sabor ou Sensação na Boca (Paladar):** Gole de água gelada, sabor residual da pasta de dente ou frescor na garganta.

A tela oferece uma barra de progresso em 5 segmentos (`progressBarSegmentActive`), suporte a checkboxes táteis para marcação individual e card final tranquilizador lembrando a natureza ondulatória do pico de urgência.

#### 3. Integração de Apoio Humano e Emergência (Níveis 2 e 3)
A conexão com os serviços essenciais de utilidade pública do Brasil ocorre sem atrito:
- **Nível 2 — CVV (Centro de Valorização da Vida):**
  - Acionamento telefônico direto: `Linking.openURL('tel:188')`.
  - Fallback informativo em navegadores/desktop sem discador celular nativo (`alert`).
  - Integração com chat web oficial: `Linking.openURL('https://cvv.org.br/chat')` para usuários impossibilitados de falar no ambiente doméstico ou profissional.
  - Aviso de cuidado: esclarecimento formal de que o 188 oferece escuta empática voluntária e não substitui pronto-socorro médico.
- **Nível 3 — SAMU e Rede SUS:**
  - Acionamento médico imediato: `Linking.openURL('tel:192')`.
  - Modal informativo completo da rede **CAPS AD (SUS)** ([CapsInfoModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/CapsInfoModal.tsx)):
    - Orientações de **porta aberta** (acolhimento direto sem necessidade de encaminhamento ou agendamento).
    - Desmistificação da documentação: ausência de documento civil ou comprovante de residência **nunca** pode impedir o acolhimento imediato pelo SUS.
    - Discagem direta para a ouvidoria do **Disque Saúde 136** (`tel:136`).

#### 4. Promoção do Botão SOS para a Raiz de [App.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/App.tsx)
Na Sprint 3.5, em conformidade com o princípio de preservação da vida, o botão flutuante [SOSFloatingButton.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/SOSFloatingButton.tsx) foi promovido para o wrapper principal em `App.tsx`:

```tsx
// apps/mobile/App.tsx
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SOSProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SOSProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

O `SOSProvider` engloba o `SOSDashboardModal` de forma global. Assim, mesmo quando o usuário estiver:
1. Deslogado na tela de boas-vindas ([WelcomeScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/WelcomeScreen.tsx));
2. No meio de uma tentativa de login ([LoginScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/LoginScreen.tsx));
3. Criando sua conta anônima ([RegisterScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/RegisterScreen.tsx));
4. Ou autenticado no painel principal ([HomeScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/HomeScreen.tsx));

O botão flutuante vermelho (`#ef4444`) com z-index `999` e suporte à área segura (`useSafeAreaInsets`) permanece visível no canto inferior direito, com disparo instantâneo em 1 toque.

---

### TASK-303: Backend da Jornada Pessoal e Check-in com Fuso Horário

#### 1. Escopo e Motivação
A [TASK-303](file:///home/thales/Projetos/Ancora/apps/api/src/routes/journey.ts) implementa o ciclo de vida do check-in diário no backend Fastify. O usuário informa seu nível de fissura (0 a 5) e humor predominante. O backend deve calcular se já houve check-in no dia civil corrente e agregar o total acumulado de vitórias sem duplicidades.

#### 2. Estrutura da Tabela `recovery_core.checkins`
A persistência reside no schema `recovery_core`, vinculada de forma segura ao perfil pseudonimizado:

```typescript
// apps/api/src/db/schema/recovery.ts
export const checkins = recoverySchema.table(
  'checkins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    cravingLevel: integer('craving_level').notNull(),
    mood: varchar('mood', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_checkins_profile_created').on(table.profileId, table.createdAt)],
);
```

O vínculo entre a credencial autenticada (`request.user.sub`) e o perfil de saúde dá-se por derivação de token anônimo via HMAC-SHA256 (`deriveAccountToken(userId)`), eliminando Foreign Keys diretas que pudessem violar o Artigo 11 da LGPD.

#### 3. A Regra do Fuso Brasileiro (`America/Sao_Paulo`) e a Eliminação do Bug das 21h UTC
O Brasil adota o fuso horário oficial de Brasília (`America/Sao_Paulo`), que corresponde a **UTC-3** durante todo o ano (desde a suspensão do Horário de Verão pelo Decreto nº 9.772/2019).

##### O Problema da Virada de Data Prematura em UTC:
Se o backend calculasse as datas utilizando o padrão UTC do banco de dados relacional (`CURRENT_DATE` ou `date_trunc('day', now())`):
- Às **21h00min00s BRT**, o relógio UTC atinge **00h00min00s UTC do dia seguinte**.
- Um usuário que registrasse check-in às **21h30 BRT** de uma terça-feira seria classificado pelo Postgres como estando na **quarta-feira**.
- Ao tentar registrar outro check-in na manhã de quarta-feira (ex: 09h00 BRT), o sistema detectaria falsamente que o check-in de quarta-feira já havia sido feito!
- Pior: dois check-ins efetuados na mesma terça-feira (um às 18h00 BRT e outro às 21h30 BRT) contabilizariam **dois dias distintos** no histórico de vitórias!

```
HORÁRIO LOCAL (SP - UTC-3)    18:00 (Terça)               21:30 (Terça)
─────────────────────────────┼───────────────────────────┼─────────────────────────►
HORÁRIO UTC DO SERVIDOR      21:00 (Terça)               00:30 (QUARTA-FEIRA!)
                             ▲                           ▲
                             │                           │
                    DATE(created_at) = Terça     DATE(created_at) = Quarta-feira (BUG!)
```

##### A Solução Matemática Canônica:
Para exterminar anomalias temporais, todas as comparações e agregações foram convertidas estritamente no fuso `America/Sao_Paulo`:

1. **Determinação do Início do Dia Atual (`/journey/today`):**
   Converte-se `now()` para o fuso brasileiro, trunca-se no início do dia (`date_trunc('day', ...)`) e converte-se de volta para o timestamp comparável com o índice `createdAt`:
   ```sql
   created_at >= (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo'
   ```

2. **Cálculo de Vitórias Acumuladas em Dias Distintos (`/journey/history`):**
   A contagem ignora horários fragmentados e agrupa puramente dias civis brasileiros únicos:
   ```sql
   COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/Sao_Paulo'))
   ```

Essa formulação garante que:
- Múltiplos check-ins realizados no mesmo dia civil em São Paulo contem como **1 dia de vitória**.
- Check-ins feitos às 21h05, 22h30 ou 23h55 pertençam legitimamente ao dia em que a pessoa os viveu.

---

### TASK-304: Motor Mobile de Interceptação Local ($\ge 4$) e Sistema de Temas (`ThemeContext`)

#### 1. Escopo e Motivação
A [TASK-304](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/CheckinCard.tsx) estabelece a sincronização de estados no aplicativo móvel, integrando o envio de check-ins à detecção precoce de fissura aguda ($\ge 4$) e fornecendo a infraestrutura visual dos temas Claro e Escuro.

#### 2. Motor de Interceptação Síncrono e Local de Fissura Aguda ($\ge 4$)
Em situações de emergência clínica, o tempo de resposta da rede móvel (latência 4G/5G, filas de pacotes, eventuais timeouts) pode retardar em segundos o apoio ao usuário. Para impedir que a pessoa espere a resposta do servidor para receber acolhimento, o cliente mobile implementa **interceptação local síncrona**:

```typescript
// apps/mobile/src/components/CheckinCard.tsx
const handleSubmit = async () => {
  setErrorMessage(null);

  // Motor de Interceptação Local e Imediata:
  // Se a fissura for 4 (Intensa) ou 5 (Crítica), dispara o modal de acolhimento
  // localmente no componente antes ou concomitantemente ao fetch de rede.
  if (cravingLevel >= 4) {
    onHighCravingIntercept?.(cravingLevel);
  }

  setIsSubmitting(true);
  try {
    const response = await journeyService.createCheckin(cravingLevel, mood);
    setIsEditing(false);
    onCheckinSuccess(response.checkin);
  } catch (err: unknown) {
    // Mesmo em falha transitória de rede, o acolhimento já foi exibido!
    const message = err instanceof Error ? err.message : 'Não foi possível registrar seu check-in.';
    setErrorMessage(message);
  } finally {
    setIsSubmitting(false);
  }
};
```

Quando interceptado, o aplicativo abre o modal [AlternativesModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/AlternativesModal.tsx), que propõe uma **Pausa Ativa de 15 Minutos**:
- **Pergunta Acolhedora:** *"Você está atravessando um momento difícil. O que você consegue fazer nos próximos 15 minutos?"*
- **Revisão Neurobiológica:** Lembra que a onda de fissura dura poucos minutos e não requer decisão pelo dia todo.
- **Três Opções Práticas Imediatas:**
  1. *Ancoragem Rápida:* Atalhos para iniciar o ciclo 4-7-8 ou a ancoragem 5-4-3-2-1 em 1 toque.
  2. *Pausa Ativa de 15 Minutos:* Beber um copo de água gelada, lavar o rosto com água fria (reflexo de mergulho para desacelerar o coração) ou caminhar até a janela.
  3. *Apoio Humano SOS:* Botões rápidos de discagem para o CVV 188 ou SAMU 192, com atalho para abrir o Semáforo SOS completo.

#### 3. Arquitetura de Temas (`ThemeContext`)
O design do Jornada Firme rejeita tons neon agressivos, alertas alarmistas ou brancos ofuscantes. O [ThemeContext.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/contexts/ThemeContext.tsx) gerencia a alternância e persistência da paleta:

```
+─────────────────────────────────────────────────────────────────────────────────────────────────+
|                                PALETAS DE DESIGN DO JORNADA FIRME                               |
+─────────────────────────────────────────────────────────────────────────────────────────────────+

 TOKEN SEMÂNTICO      TEMA ESCURO (Dark Slate)          TEMA CLARO (Light Linen)
 ────────────────    ───────────────────────────────   ──────────────────────────────────────────
 background          #131c2e (Slate Profundo Noite)    #fbfaf7 (Off-white Linho / Papel Antigo)
 card                #1e293b (Slate Médio Suave)       #ffffff (Branco Puro Acolhedor)
 cardBorder          #2e3d54 (Azul Cinzento Fino)      #e8e5de (Borda Areia Sutil)
 text                #f8fafc (Cinza Claro Quase Branco)#1e293b (Azul Ardósia Escuro)
 textMuted           #94a3b8 (Cinza Médio Neutro)      #64748b (Cinza Médio Confortável)
 primary             #14b8a6 (Teal Esmeralda Sereno)   #0d9488 (Teal Profundo Equilibrado)
 primaryText         #ffffff (Branco Contraste Alto)   #ffffff (Branco Contraste Alto)
 accent              #fbbf24 (Âmbar Solar Suave)       #f59e0b (Âmbar Dourado Quente)
 brandFirme          #5eead4 (Teal Brilhante Alvorada) #386d62 (Verde Musgo Oceânico)
```

- **Persistência Assíncrona Segura:** O modo escolhido é gravado no storage sob a chave `ancora_theme`. Se o storage falhar ou estiver bloqueado temporariamente no iOS, o sistema recorre graciosamente ao tema `light`.
- **Hook `useTheme()`:** Expõe `theme`, `colors`, `toggleTheme()` e `setTheme()` para todos os componentes da árvore.
- **Ajuste Automático da Barra de Status:** O `StatusBar` alterna entre `light-content` (no tema escuro) e `dark-content` (no tema claro).

---

## 3. Catálogo de Arquivos Envolvidos e Responsabilidades

| Caminho do Arquivo | Módulo | Responsabilidade Técnica na Sprint 3 |
| :--- | :--- | :--- |
| [apps/api/src/db/schema/recovery.ts](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/recovery.ts) | Backend DB | Define a tabela `recovery_core.checkins`, chave estrangeira para `profiles.id` com cascade e índice composto `idx_checkins_profile_created`. |
| [apps/api/src/routes/journey.ts](file:///home/thales/Projetos/Ancora/apps/api/src/routes/journey.ts) | Backend API | Implementa as rotas `/journey/checkin`, `/journey/today` e `/journey/history` com validações Zod e regras de fuso horário `America/Sao_Paulo`. |
| [apps/api/src/server.ts](file:///home/thales/Projetos/Ancora/apps/api/src/server.ts) | Backend Core | Registra o plugin `journeyRoutes` sob o prefixo canônico `/api/v1/journey`. |
| [apps/mobile/App.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/App.tsx) | Mobile Root | Injeta os provedores `SafeAreaProvider`, `ThemeProvider`, `SOSProvider` e `AuthProvider`. Renderiza o `SOSFloatingButton` na raiz. |
| [apps/mobile/src/contexts/ThemeContext.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/contexts/ThemeContext.tsx) | Mobile State | Define a tipagem `ThemeColors`, paletas Dark Slate e Light Linen, persistência em storage e hook `useTheme()`. |
| [apps/mobile/src/contexts/SOSContext.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/contexts/SOSContext.tsx) | Mobile State | Gerencia a visibilidade do modal SOS e a transição entre telas (`dashboard`, `breathing`, `grounding`, `caps`). |
| [apps/mobile/src/components/SOSFloatingButton.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/SOSFloatingButton.tsx) | Mobile UI | Botão flutuante acessível globalmente, com tratamento de insets de área segura e feedback visual. |
| [apps/mobile/src/screens/sos/SOSDashboardModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/SOSDashboardModal.tsx) | Mobile UI | Painel central do Semáforo SOS em 3 níveis (Autocuidado, Suporte Humano 188 e Emergência Médica 192). |
| [apps/mobile/src/screens/sos/BreathingScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/BreathingScreen.tsx) | Mobile UI | Container de respiração com avisos médicos contra tontura e guia textual dos 3 tempos (4-7-8). |
| [apps/mobile/src/components/BreathingCircle.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/BreathingCircle.tsx) | Mobile UI | Círculo animado com `Animated.timing`, timers em `useRef` imunes a stale closures e contador de ciclos. |
| [apps/mobile/src/screens/sos/GroundingScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/GroundingScreen.tsx) | Mobile UI | Exercício sensorial 5-4-3-2-1 com barra de progresso em 5 etapas, checkboxes interativos e card de encorajamento. |
| [apps/mobile/src/screens/sos/CapsInfoModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/CapsInfoModal.tsx) | Mobile UI | Guia informativo da Rede CAPS AD (SUS) com destaque de porta aberta, desmistificação documental e Disque Saúde 136. |
| [apps/mobile/src/components/AlternativesModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/AlternativesModal.tsx) | Mobile UI | Modal acolhedor de 15 minutos disparado na interceptação de fissura $\ge 4$, com microações de alívio e discagem. |
| [apps/mobile/src/components/CheckinCard.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/CheckinCard.tsx) | Mobile UI | Card de registro diário de fissura (0 a 5) e humor com motor de interceptação síncrono local e feedback visual. |
| [apps/mobile/src/components/ProgressCard.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/ProgressCard.tsx) | Mobile UI | Card cumulativo de vitórias sem streaks punitivos (*Anti-Relapse Shame*). |
| [apps/mobile/src/screens/HomeScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/HomeScreen.tsx) | Mobile UI | Tela principal da jornada do usuário autenticado, integrando check-in, progresso cumulativo, SOS e botão de alternância de tema. |
| [apps/mobile/src/services/journey.ts](file:///home/thales/Projetos/Ancora/apps/mobile/src/services/journey.ts) | Mobile API | Cliente de serviços para comunicação HTTP com os endpoints `/journey/checkin`, `/journey/today` e `/journey/history`. |
| [apps/mobile/src/services/api.ts](file:///home/thales/Projetos/Ancora/apps/mobile/src/services/api.ts) | Mobile Core | Cliente HTTP resiliente com injeção de Bearer Token, rotação transparente de refresh tokens e controle de timeout de 15s. |

---

## 4. Modelagem de Dados e Consultas SQL Canônicas

### 4.1. Definição Relacional em DDL (PostgreSQL 16)

```sql
-- Criação da tabela de check-ins no schema isolado recovery_core
CREATE TABLE IF NOT EXISTS "recovery_core"."checkins" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL REFERENCES "recovery_core"."profiles"("id") ON DELETE CASCADE,
    "craving_level" INTEGER NOT NULL CHECK ("craving_level" >= 0 AND "craving_level" <= 5),
    "mood" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índice composto para otimização de queries temporais por perfil
CREATE INDEX IF NOT EXISTS "idx_checkins_profile_created" 
ON "recovery_core"."checkins" ("profile_id", "created_at" DESC);
```

### 4.2. Schema em Drizzle ORM

```typescript
// apps/api/src/db/schema/recovery.ts
import { sql } from 'drizzle-orm';
import { index, integer, pgSchema, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const recoverySchema = pgSchema('recovery_core');

export const checkins = recoverySchema.table(
  'checkins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    cravingLevel: integer('craving_level').notNull(),
    mood: varchar('mood', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_checkins_profile_created').on(table.profileId, table.createdAt)],
);
```

### 4.3. Consultas SQL Canônicas

#### A. Consulta do Check-in de Hoje (Fuso de Brasília)
Identifica o check-in mais recente registrado a partir da meia-noite do fuso `America/Sao_Paulo`:

```sql
SELECT 
    id, 
    craving_level, 
    mood, 
    created_at
FROM "recovery_core"."checkins"
WHERE 
    "profile_id" = :profileId
    AND "created_at" >= (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo'
ORDER BY "created_at" DESC
LIMIT 1;
```

#### B. Contagem de Vitórias Acumuladas em Dias Distintos
Agrupa as datas convertidas para o dia civil brasileiro, eliminando repetições no mesmo dia e desvios de fuso:

```sql
SELECT 
    CAST(COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/Sao_Paulo')) AS INTEGER) AS total_checkins
FROM "recovery_core"."checkins"
WHERE "profile_id" = :profileId;
```

#### C. Inserção Transacional com Atualização de `lastSeenAt`
Executa o registro atômico do check-in e atualiza o carimbo de atividade do perfil comunitário sem travar conexões:

```sql
BEGIN;
  INSERT INTO "recovery_core"."checkins" ("profile_id", "craving_level", "mood")
  VALUES (:profileId, :cravingLevel, :mood)
  RETURNING id, craving_level, mood, created_at;

  UPDATE "recovery_core"."profiles"
  SET "last_seen_at" = NOW()
  WHERE "id" = :profileId;
COMMIT;
```

---

## 5. Contratos de Endpoints da API Fastify

Todos os endpoints da jornada exigem autenticação prévia via middleware `app.authenticate` e prefixo `/api/v1/journey`. O `profileId` é resolvido de forma opaca através de `deriveAccountToken(request.user.sub)`.

### 5.1. `POST /api/v1/journey/checkin`

Registra um novo evento de check-in diário de humor e fissura.

#### Schema de Validação de Entrada (Zod)
```typescript
export const createCheckinSchema = z.object({
  cravingLevel: z
    .number({
      required_error: 'O nível de fissura deve ser um número inteiro de 0 a 5.',
      invalid_type_error: 'O nível de fissura deve ser um número inteiro de 0 a 5.',
    })
    .int('O nível de fissura deve ser um número inteiro de 0 a 5.')
    .min(0, 'O nível de fissura deve ser um número inteiro de 0 a 5.')
    .max(5, 'O nível de fissura deve ser um número inteiro de 0 a 5.'),
  mood: z.enum(['calmo', 'ansioso', 'cansado', 'vulneravel', 'motivado'], {
    errorMap: () => ({
      message: 'Humor inválido. Escolha: calmo, ansioso, cansado, vulneravel ou motivado.',
    }),
  }),
});
```

#### Requisição HTTP de Exemplo
```http
POST /api/v1/journey/checkin HTTP/1.1
Host: api.ancora.local:3333
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "cravingLevel": 4,
  "mood": "ansioso"
}
```

#### Respostas HTTP

##### Sucesso (201 Created)
```json
{
  "status": "success",
  "data": {
    "checkin": {
      "id": "e4f8b2d1-7c93-4a1b-9e2e-8a9d12345678",
      "cravingLevel": 4,
      "mood": "ansioso",
      "createdAt": "2026-10-04T19:45:00.000Z"
    }
  }
}
```

##### Erro de Validação (400 Bad Request)
```json
{
  "status": "error",
  "message": "O nível de fissura deve ser um número inteiro de 0 a 5.",
  "errors": {
    "cravingLevel": ["O nível de fissura deve ser um número inteiro de 0 a 5."]
  }
}
```

##### Perfil Inexistente (404 Not Found)
```json
{
  "status": "error",
  "message": "Perfil de usuário não encontrado."
}
```

---

### 5.2. `GET /api/v1/journey/today`

Consulta se o usuário já efetuou check-in no dia civil corrente segundo o fuso de Brasília (`America/Sao_Paulo`).

#### Requisição HTTP de Exemplo
```http
GET /api/v1/journey/today HTTP/1.1
Host: api.ancora.local:3333
Authorization: Bearer <accessToken>
```

#### Respostas HTTP

##### Sucesso — Check-in Realizado (200 OK)
```json
{
  "status": "success",
  "data": {
    "hasCheckedInToday": true,
    "checkin": {
      "id": "e4f8b2d1-7c93-4a1b-9e2e-8a9d12345678",
      "cravingLevel": 2,
      "mood": "calmo",
      "createdAt": "2026-10-04T12:30:00.000Z"
    }
  }
}
```

##### Sucesso — Sem Check-in no Dia (200 OK)
```json
{
  "status": "success",
  "data": {
    "hasCheckedInToday": false,
    "checkin": null
  }
}
```

---

### 5.3. `GET /api/v1/journey/history`

Retorna a contagem total de vitórias acumuladas em dias distintos e o histórico recente dos últimos registros.

#### Schema de Parâmetros de Query (Zod)
```typescript
export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(90).default(30),
});
```

#### Requisição HTTP de Exemplo
```http
GET /api/v1/journey/history?limit=7 HTTP/1.1
Host: api.ancora.local:3333
Authorization: Bearer <accessToken>
```

#### Resposta HTTP de Sucesso (200 OK)
```json
{
  "status": "success",
  "data": {
    "totalCheckins": 14,
    "history": [
      {
        "id": "e4f8b2d1-7c93-4a1b-9e2e-8a9d12345678",
        "cravingLevel": 1,
        "mood": "motivado",
        "createdAt": "2026-10-04T14:10:00.000Z"
      },
      {
        "id": "f5a9c3e2-8d04-4b2c-af3f-9b0e23456789",
        "cravingLevel": 4,
        "mood": "ansioso",
        "createdAt": "2026-10-03T21:15:00.000Z"
      }
    ]
  }
}
```

---

## 6. Arquitetura e Fluxos de Componentes Mobile

### 6.1. Árvore de Contextos e Injeção de Provedores

A montagem dos contextos em [App.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/App.tsx) obedece à hierarquia estrita de dependências:

```
[SafeAreaProvider]
       │
       ▼
[ThemeProvider] (Injeta paletas e persistência 'ancora_theme')
       │
       ▼
[SOSProvider] (Gerencia modal e visibilidade global do Semáforo SOS)
       │
       ▼
[AuthProvider] (Gerencia autenticação JWT, chaves e sessão segura)
       │
       ▼
[AppContent]
       ├── [MainNavigator] (Alterna entre Boas-Vindas, Login, Cadastro e HomeScreen)
       └── [SOSFloatingButton] (Botão flutuante '🛟 SOS' sempre visível na raiz)
```

Essa ordenação garante que o `SOSProvider` e o `SOSFloatingButton` estejam operacionais antes mesmo da inicialização do `AuthProvider`. Se um usuário deslogado estiver em pânico, ele clica em SOS sem precisar de login.

---

### 6.2. Ciclo de Vida da Animação do `BreathingCircle`

A animação do círculo 4-7-8 baseia-se em interpolação linear suave de escala com easing padrão:

```
  FASE        DURAÇÃO      ESCALA DO CÍRCULO     OPACIDADE DO HALO     TEXTO PRINCIPAL
  ─────       ───────      ─────────────────     ─────────────────     ───────────────
  idle        0s           1.0 (Base)            0.20                  "Preparar..."
  inhale      4s           1.0 ──────► 1.6       0.20                  "Inspire pelo nariz..."
  hold        7s           1.6 (Mantido)         0.35 (Brilho intenso) "Segure o ar suavemente..."
  exhale      8s           1.6 ──────► 1.0       0.20                  "Solte o ar pela boca..."
                               │
                               └─────────► Ciclo Concluído (Incrementa Contador de Ciclos)
```

Ao pausar o exercício via `pauseExercise()`, o sistema interrompe imediatamente a animação em voo, limpa os timers de contagem regressiva e transiciona suavemente o círculo de volta à escala `1.0` em 500ms, evitando saltos visuais bruscos que pudessem gerar desconforto.

---

### 6.3. Fluxo de Interceptação de Fissura no Mobile

O diagrama abaixo detalha a interceptação síncrona do `CheckinCard` conectada ao `AlternativesModal`:

```
   Usuário no CheckinCard                  CheckinCard.tsx                     AlternativesModal.tsx
          │                                      │                                       │
          │ 1. Seleciona Fissura = 4 ou 5        │                                       │
          ├─────────────────────────────────────►│                                       │
          │                                      │ 2. Disparo Síncrono Imediato          │
          │ 2. Clica "Registrar Check-in"        │    onHighCravingIntercept(level)      │
          ├─────────────────────────────────────►├──────────────────────────────────────►│
          │                                      │                                       │  3. Abre Modal de
          │                                      │  4. Executa HTTP POST em paralelo     │     15 Minutos na tela
          │                                      │     journeyService.createCheckin(...) │     sem esperar API!
          │                                      │     (Se rede falhar, apoio já abriu)  │
          │                                      │                                       │
          │ 5. Usuário escolhe microação:         │                                       │
          │    - Ancoragem (4-7-8 / 5-4-3-2-1)   │                                       │
          │    - Água gelada / Pausa de 15 min   │                                       │
          │    - Ligar CVV 188 / SAMU 192        │                                       │
          │◄─────────────────────────────────────┴───────────────────────────────────────┤
```

---

## 7. Matriz de Conformidade e Critérios de Aceite (DoD)

| Requisito / Tarefa | Especificação Clínica e Técnica | Arquivos de Implementação | Critério de Aceite (DoD) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SOS Nível 1 — 4-7-8** | Respiração diafragmática 4s/7s/8s com animação fluida, imune a closures e aviso explícito de segurança contra tontura. | [BreathingScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/BreathingScreen.tsx), [BreathingCircle.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/BreathingCircle.tsx) | Animação sem travamentos; aviso médico visível; contagem precisa de ciclos. | ✅ Aprovado |
| **SOS Nível 1 — 5-4-3-2-1** | Ancoragem pelos 5 sentidos com barra de progresso, checkboxes interativos e card tranquilizador. | [GroundingScreen.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/GroundingScreen.tsx) | Navegação passo a passo reversível; feedback visual ao marcar itens. | ✅ Aprovado |
| **SOS Nível 2 — CVV 188** | Discagem nativa `tel:188`, link para chat oficial `cvv.org.br/chat` e aviso de escuta voluntária não-médica. | [SOSDashboardModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/SOSDashboardModal.tsx) | Abertura correta de discador/navegador; aviso de escuta compassiva claro. | ✅ Aprovado |
| **SOS Nível 3 — Emergência** | Discagem nativa `tel:192` para SAMU e guia informativo dos CAPS AD / Rede SUS com Disque 136. | [SOSDashboardModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/SOSDashboardModal.tsx), [CapsInfoModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/screens/sos/CapsInfoModal.tsx) | Discagem direta 192 operacional; guia CAPS explicando porta aberta e acolhimento gratuito. | ✅ Aprovado |
| **SOS Offline & Raiz** | Disponibilidade total sem conexão e botão flutuante acessível para usuários logados ou deslogados. | [App.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/App.tsx), [SOSFloatingButton.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/SOSFloatingButton.tsx), [SOSContext.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/contexts/SOSContext.tsx) | Botão flutuante funcional em Welcome, Login, Register e Home mesmo em modo avião. | ✅ Aprovado |
| **Backend de Jornada** | Tabela `recovery_core.checkins`, endpoints `/checkin`, `/today`, `/history` com fuso `America/Sao_Paulo`. | [schema/recovery.ts](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/recovery.ts), [routes/journey.ts](file:///home/thales/Projetos/Ancora/apps/api/src/routes/journey.ts) | Queries utilizam conversão `AT TIME ZONE 'America/Sao_Paulo'`; eliminação de bugs às 21h UTC. | ✅ Aprovado |
| **Anti-Relapse Shame** | Contagem de vitórias acumuladas em dias distintos (`COUNT(DISTINCT DATE(...))`) sem zeramento punitivo. | [routes/journey.ts](file:///home/thales/Projetos/Ancora/apps/api/src/routes/journey.ts), [ProgressCard.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/ProgressCard.tsx) | Total reflete presença cumulativa; interface acolhedora sem cobrança de sequências ininterruptas. | ✅ Aprovado |
| **Motor de Interceptação** | Disparo imediato no cliente para fissura $\ge 4$, abrindo modal de 15 minutos antes/concomitantemente à rede. | [CheckinCard.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/CheckinCard.tsx), [AlternativesModal.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/components/AlternativesModal.tsx) | Modal abre em 0ms mesmo com falha de conexão; oferece microações de alívio e contatos de urgência. | ✅ Aprovado |
| **Arquitetura de Temas** | Alternância suave entre Dark Slate e Light Linen, persistência em storage e tipagem estrita de tokens. | [ThemeContext.tsx](file:///home/thales/Projetos/Ancora/apps/mobile/src/contexts/ThemeContext.tsx) | Cores fiéis à especificação de baixo contraste agressivo; alternância sem quebra de tela. | ✅ Aprovado |
| **Conformidade LGPD** | Desacoplamento Zero-PII via HMAC `deriveAccountToken`, sem dados civis expostos nas rotas de saúde. | [routes/journey.ts](file:///home/thales/Projetos/Ancora/apps/api/src/routes/journey.ts), [schema/recovery.ts](file:///home/thales/Projetos/Ancora/apps/api/src/db/schema/recovery.ts) | Zero foreign key direta entre `auth_security.users` e `recovery_core.checkins`. | ✅ Aprovado |

---

*Documento canônico auditado e homologado para a Sprint 3 do Ecossistema Jornada Firme.*
