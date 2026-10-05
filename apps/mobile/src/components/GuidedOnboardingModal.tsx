import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getChipById } from '../constants/chips';

interface GuidedOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectHabits: (chipIds: string[]) => Promise<void>;
}

interface DifficultPeriodOption {
  id: string;
  label: string;
  icon: string;
  suggestedChipIds: string[];
}

const PERIOD_OPTIONS: DifficultPeriodOption[] = [
  {
    id: 'morning',
    label: 'Manhã / Começo do dia',
    icon: '🌅',
    suggestedChipIds: ['morn_coffee_01', 'morn_water_01', 'morn_bed_01'],
  },
  {
    id: 'afternoon',
    label: 'Durante a tarde / Transição de rotina',
    icon: '🚶',
    suggestedChipIds: ['mov_walk_after_01', 'mov_stretch_01', 'conn_call_01'],
  },
  {
    id: 'night',
    label: 'Noite / Hora de desacelerar',
    icon: '🌙',
    suggestedChipIds: ['morn_sleep_01', 'mind_reading_01', 'conn_faith_01'],
  },
  {
    id: 'anxiety',
    label: 'Momentos de ansiedade ou tédio',
    icon: '⚡',
    suggestedChipIds: ['mind_journal_01', 'mov_walk_run_01', 'life_clean_01'],
  },
];

export const GuidedOnboardingModal: React.FC<GuidedOnboardingModalProps> = ({
  visible,
  onClose,
  onSelectHabits,
}) => {
  const { colors, theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('morning');
  const [selectedChipIds, setSelectedChipIds] = useState<Set<string>>(
    new Set(['morn_water_01', 'morn_coffee_01']),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePeriod =
    PERIOD_OPTIONS.find((p) => p.id === selectedPeriod) ?? PERIOD_OPTIONS[0]!;

  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriod(periodId);
    const period = PERIOD_OPTIONS.find((p) => p.id === periodId);
    if (period) {
      setSelectedChipIds(new Set(period.suggestedChipIds.slice(0, 2)));
    }
  };

  const toggleChip = (chipId: string) => {
    setSelectedChipIds((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) {
        next.delete(chipId);
      } else {
        if (next.size < 3) {
          next.add(chipId);
        }
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedChipIds.size === 0) return;
    setIsSubmitting(true);
    try {
      await onSelectHabits(Array.from(selectedChipIds));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Cabeçalho */}
            <View style={styles.header}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
                  },
                ]}
              >
                <Text style={styles.headerIcon}>🌱</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Primeiro Uso Guiado
              </Text>
              <Text style={[styles.questionTitle, { color: colors.primary }]}>
                Quando costuma ser mais difícil para você?
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Ao identificar o momento mais delicado, sugerimos de 1 a 3 hábitos simples para
                servirem de ancoragem.
              </Text>
            </View>

            {/* Opções de Períodos Difíceis */}
            <View style={styles.periodsList}>
              {PERIOD_OPTIONS.map((period) => {
                const isSelected = period.id === selectedPeriod;
                return (
                  <TouchableOpacity
                    key={period.id}
                    style={[
                      styles.periodCard,
                      {
                        backgroundColor: isSelected
                          ? theme === 'dark'
                            ? 'rgba(13, 148, 136, 0.2)'
                            : 'rgba(15, 118, 110, 0.1)'
                          : colors.background,
                        borderColor: isSelected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    onPress={() => handlePeriodChange(period.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.periodIcon}>{period.icon}</Text>
                    <Text
                      style={[
                        styles.periodText,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {period.label}
                    </Text>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sugestões Filtradas */}
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsHeader, { color: colors.text }]}>
                Sugestões acolhedoras para este momento (escolha até 3):
              </Text>
              <View style={styles.chipsGrid}>
                {activePeriod.suggestedChipIds.map((chipId) => {
                  const chip = getChipById(chipId);
                  if (!chip) return null;
                  const isChecked = selectedChipIds.has(chipId);

                  return (
                    <TouchableOpacity
                      key={chipId}
                      style={[
                        styles.chipItem,
                        {
                          backgroundColor: isChecked
                            ? theme === 'dark'
                              ? 'rgba(13, 148, 136, 0.25)'
                              : 'rgba(15, 118, 110, 0.15)'
                            : colors.background,
                          borderColor: isChecked ? colors.primary : colors.cardBorder,
                        },
                      ]}
                      onPress={() => toggleChip(chipId)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipIcon}>{chip.icon}</Text>
                      <View style={styles.chipTextContainer}>
                        <Text style={[styles.chipLabel, { color: colors.text }]}>
                          {chip.label}
                        </Text>
                        <Text style={[styles.chipCategory, { color: colors.textMuted }]}>
                          {chip.category}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isChecked ? colors.primary : colors.cardBorder,
                            backgroundColor: isChecked ? colors.primary : 'transparent',
                          },
                        ]}
                      >
                        {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Ações */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: colors.primary },
                  selectedChipIds.size === 0 && styles.disabledButton,
                ]}
                onPress={handleConfirm}
                disabled={selectedChipIds.size === 0 || isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Começar com estes {selectedChipIds.size} hábitos
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipButtonText, { color: colors.textMuted }]}>
                  Explorar catálogo completo depois
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 20,
    borderWidth: 1,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  periodsList: {
    gap: 8,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  periodIcon: {
    fontSize: 20,
  },
  periodText: {
    fontSize: 14,
    flex: 1,
  },
  checkIcon: {
    color: '#0d9488',
    fontWeight: '700',
    fontSize: 16,
  },
  suggestionsContainer: {
    gap: 10,
  },
  suggestionsHeader: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipsGrid: {
    gap: 8,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  chipIcon: {
    fontSize: 20,
  },
  chipTextContainer: {
    flex: 1,
    gap: 2,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipCategory: {
    fontSize: 11,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 10,
    marginTop: 6,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
