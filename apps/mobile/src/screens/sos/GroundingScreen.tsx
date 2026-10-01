import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

interface GroundingStep {
  step: number;
  totalItems: number;
  sense: string;
  icon: string;
  title: string;
  instruction: string;
  tip: string;
  itemLabels: string[];
}

const STEPS: GroundingStep[] = [
  {
    step: 1,
    totalItems: 5,
    sense: 'VER',
    icon: '👁️',
    title: '5 Coisas que você pode VER',
    instruction:
      'Olhe ao redor com calma e identifique 5 objetos ou detalhes visuais presentes no seu ambiente agora.',
    tip: 'Pode ser uma caneta, um quadro na parede, a luz pela janela, suas próprias mãos ou uma sombra no chão.',
    itemLabels: [
      '1º detalhe visual',
      '2º detalhe visual',
      '3º detalhe visual',
      '4º detalhe visual',
      '5º detalhe visual',
    ],
  },
  {
    step: 2,
    totalItems: 4,
    sense: 'TOCAR',
    icon: '🖐️',
    title: '4 Coisas que você pode TOCAR',
    instruction:
      'Toque em 4 texturas ou superfícies diferentes ao seu alcance e sinta a sensação tátil com atenção.',
    tip: 'Sinta o tecido da sua roupa, a rigidez da mesa, a temperatura do celular ou a sola dos sapatos tocando o chão.',
    itemLabels: [
      '1ª textura ou objeto',
      '2ª textura ou objeto',
      '3ª textura ou objeto',
      '4ª textura ou objeto',
    ],
  },
  {
    step: 3,
    totalItems: 3,
    sense: 'OUVIR',
    icon: '👂',
    title: '3 Sons que você pode OUVIR',
    instruction:
      'Feche os olhos por alguns instantes ou foque no silêncio para identificar 3 sons diferentes ao fundo.',
    tip: 'Note o ruído do trânsito distante, o barulho do vento ou ventilador, o tique-taque do relógio ou a sua respiração.',
    itemLabels: ['1º som identificado', '2º som identificado', '3º som identificado'],
  },
  {
    step: 4,
    totalItems: 2,
    sense: 'CHEIRAR',
    icon: '👃',
    title: '2 Odores que você pode CHEIRAR',
    instruction: 'Respire fundo pelo nariz e tente notar 2 cheiros presentes no ar ao seu redor.',
    tip: 'O aroma de café, sabonete na pele, o ar fresco da janela ou o perfume da sua própria roupa.',
    itemLabels: ['1º cheiro identificado', '2º cheiro identificado'],
  },
  {
    step: 5,
    totalItems: 1,
    sense: 'SABOR',
    icon: '👅',
    title: '1 Sabor ou Sensação na Boca',
    instruction:
      'Foque em 1 sensação de sabor ou beba um gole de água gelada prestando atenção à temperatura.',
    tip: 'Pode ser o residual da pasta de dente, uma bala de menta ou simplesmente o frescor da água descendo pela garganta.',
    itemLabels: ['Sensação de sabor ou frescor da água'],
  },
];

interface GroundingScreenProps {
  onBack: () => void;
}

export const GroundingScreen: React.FC<GroundingScreenProps> = ({ onBack }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean[]>>({
    0: [false, false, false, false, false],
    1: [false, false, false, false],
    2: [false, false, false],
    3: [false, false],
    4: [false],
  });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentStep: GroundingStep = STEPS[currentStepIndex] ?? STEPS[0]!;
  const stepChecks = checkedItems[currentStepIndex] || [];
  const allCurrentChecked = stepChecks.every(Boolean);

  const toggleItem = (itemIndex: number) => {
    setCheckedItems((prev) => {
      const currentList = [...(prev[currentStepIndex] || [])];
      currentList[itemIndex] = !currentList[itemIndex];
      return {
        ...prev,
        [currentStepIndex]: currentList,
      };
    });
  };

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCheckedItems({
      0: [false, false, false, false, false],
      1: [false, false, false, false],
      2: [false, false, false],
      3: [false, false],
      4: [false],
    });
    setCurrentStepIndex(0);
    setIsCompleted(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao menu SOS"
        >
          <Text style={styles.backButtonText}>← Voltar ao SOS</Text>
        </TouchableOpacity>
        <View style={styles.badgeNivel1}>
          <Text style={styles.badgeNivel1Text}>Nível 1 • Autocuidado</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!isCompleted ? (
          <>
            {/* Título e Barra de Progresso */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Ancoragem Sensorial 5-4-3-2-1</Text>
              <Text style={styles.subtitle}>
                Ao direcionar a atenção para estímulos físicos concretos, você interrompe o ciclo
                mental de fissura e reancora o cérebro no momento presente.
              </Text>

              {/* Indicador de Passos */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarWrapper}>
                  {STEPS.map((s, idx) => (
                    <View
                      key={s.step}
                      style={[
                        styles.progressBarSegment,
                        idx <= currentStepIndex && styles.progressBarSegmentActive,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.progressStepLabel}>
                  Etapa {currentStepIndex + 1} de 5 • {currentStep.sense}
                </Text>
              </View>
            </View>

            {/* Card Principal da Etapa */}
            <View style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <Text style={styles.stepIcon}>{currentStep.icon}</Text>
                <View style={styles.stepTitleContainer}>
                  <Text style={styles.stepTitle}>{currentStep.title}</Text>
                  <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>
                </View>
              </View>

              {/* Dica amigável */}
              <View style={styles.tipBox}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>{currentStep.tip}</Text>
              </View>

              {/* Lista Interativa Tátil de Itens */}
              <View style={styles.checklist}>
                <Text style={styles.checklistPrompt}>
                  Toque conforme for identificando cada um:
                </Text>
                {currentStep.itemLabels.map((label, itemIdx) => {
                  const isChecked = stepChecks[itemIdx];
                  return (
                    <TouchableOpacity
                      key={itemIdx}
                      style={[styles.checklistItem, isChecked && styles.checklistItemActive]}
                      onPress={() => toggleItem(itemIdx)}
                      activeOpacity={0.7}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                      accessibilityLabel={`${label} ${isChecked ? 'marcado' : 'não marcado'}`}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                        {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
                      </View>
                      <Text style={[styles.checklistText, isChecked && styles.checklistTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Ações de Navegação */}
            <View style={styles.actionsRow}>
              {currentStepIndex > 0 && (
                <TouchableOpacity
                  style={styles.prevButton}
                  onPress={handlePreviousStep}
                  activeOpacity={0.8}
                >
                  <Text style={styles.prevButtonText}>← Anterior</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.nextButton, currentStepIndex === 0 && { flex: 1 }]}
                onPress={handleNextStep}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={
                  currentStepIndex === STEPS.length - 1 ? 'Concluir Ancoragem' : 'Próxima Etapa'
                }
              >
                <Text style={styles.nextButtonText}>
                  {currentStepIndex === STEPS.length - 1
                    ? 'Concluir Ancoragem ✓'
                    : allCurrentChecked
                      ? 'Concluído / Próximo →'
                      : 'Próximo →'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Tela de Sucesso / Conclusão da Ancoragem */
          <View style={styles.successContainer}>
            <View style={styles.successIconWrapper}>
              <Text style={styles.successIcon}>⚓</Text>
            </View>
            <Text style={styles.successTitle}>Você está no presente.</Text>
            <Text style={styles.successSubheading}>
              Seus pés estão firmes no chão. Você respirou, sentiu o ambiente e superou este momento
              com consciência.
            </Text>

            <View style={styles.reassuranceCard}>
              <Text style={styles.reassuranceText}>
                Lembre-se: as ondas de fissura sobem e descem como uma maré. O pico costuma durar de
                15 a 20 minutos e diminui gradualmente. Você deu um passo importante hoje.
              </Text>
            </View>

            <View style={styles.successButtonsGroup}>
              <TouchableOpacity
                style={styles.primarySuccessButton}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Text style={styles.primarySuccessButtonText}>Voltar ao SOS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondarySuccessButton}
                onPress={handleRestart}
                activeOpacity={0.8}
              >
                <Text style={styles.secondarySuccessButtonText}>Repetir Exercício</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#1e293b',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  badgeNivel1: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeNivel1Text: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    gap: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420,
  },
  progressContainer: {
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  progressBarSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
  },
  progressBarSegmentActive: {
    backgroundColor: '#10b981',
  },
  progressStepLabel: {
    color: '#2dd4bf',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stepCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 16,
  },
  stepCardHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepIcon: {
    fontSize: 32,
  },
  stepTitleContainer: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  stepInstruction: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#a7f3d0',
    lineHeight: 18,
  },
  checklist: {
    gap: 10,
  },
  checklistPrompt: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  checklistItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxTick: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  checklistText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  checklistTextActive: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  prevButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderWidth: 2,
    borderColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successIcon: {
    fontSize: 36,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  successSubheading: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 420,
  },
  reassuranceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 8,
    width: '100%',
  },
  reassuranceText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
    textAlign: 'center',
  },
  successButtonsGroup: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  primarySuccessButton: {
    backgroundColor: '#0d9488',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  primarySuccessButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondarySuccessButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  secondarySuccessButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
});
