import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { MomentConfig } from '../types/habits';
import { momentsService, MAX_MOMENTS } from '../services/moments';

interface MyMomentsModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: 'trigger' | 'config';
  currentMoment?: MomentConfig | null;
  onMomentsUpdated?: () => void;
  availableActionOptions?: string[];
}

const DAY_OPTIONS: { id: number | null; label: string }[] = [
  { id: null, label: 'Diário (Todos os dias)' },
  { id: 2, label: 'Segunda-feira' },
  { id: 3, label: 'Terça-feira' },
  { id: 4, label: 'Quarta-feira' },
  { id: 5, label: 'Quinta-feira' },
  { id: 6, label: 'Sexta-feira' },
  { id: 7, label: 'Sábado' },
  { id: 1, label: 'Domingo' },
];

const DEFAULT_ACTION_PRESETS = [
  'Beber água com calma',
  'Respirar fundo por 1 minuto',
  'Caminhada leve de 5 minutos',
  'Ligar para alguém de confiança',
  'Alongar o corpo',
  'Ouvir uma música relaxante',
];

export const MyMomentsModal: React.FC<MyMomentsModalProps> = ({
  visible,
  onClose,
  mode = 'config',
  currentMoment = null,
  onMomentsUpdated,
  availableActionOptions = [],
}) => {
  const { colors, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'trigger' | 'config'>(mode);
  const [moments, setMoments] = useState<MomentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do formulário de novo momento
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newHour, setNewHour] = useState('18');
  const [newMinute, setNewMinute] = useState('00');
  const [newDayOfWeek, setNewDayOfWeek] = useState<number | null>(6);
  const [selectedActions, setSelectedActions] = useState<string[]>(['Beber água com calma']);

  useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  async function loadData() {
    setIsLoading(true);
    try {
      const list = await momentsService.loadMoments();
      setMoments(list);
    } finally {
      setIsLoading(false);
    }
  }

  const allActions = Array.from(
    new Set([...availableActionOptions, ...DEFAULT_ACTION_PRESETS]),
  ).filter(Boolean);

  const handleToggleMoment = async (momentId: string) => {
    const updated = moments.map((m) =>
      m.id === momentId ? { ...m, enabled: !m.enabled } : m,
    );
    setMoments(updated);
    await momentsService.saveMoments(updated);
    onMomentsUpdated?.();
  };

  const handleDeleteMoment = async (momentId: string) => {
    const updated = moments.filter((m) => m.id !== momentId);
    setMoments(updated);
    await momentsService.saveMoments(updated);
    onMomentsUpdated?.();
  };

  const handleCreateMoment = async () => {
    const h = parseInt(newHour, 10);
    const m = parseInt(newMinute, 10);

    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      Alert.alert('Horário Inválido', 'Por favor, informe um horário válido (00-23 horas e 00-59 minutos).');
      return;
    }

    if (selectedActions.length === 0 || selectedActions.length > 3) {
      Alert.alert('Ações', 'Selecione entre 1 e 3 ações para este momento.');
      return;
    }

    const dayObj = DAY_OPTIONS.find((d) => d.id === newDayOfWeek);
    const dayLabel = dayObj ? dayObj.label.split(' ')[0] : 'Horário';
    const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const newMoment: MomentConfig = {
      id: `moment_${Date.now()}`,
      label: `${dayLabel} ${timeFormatted}`,
      hour: h,
      minute: m,
      dayOfWeek: newDayOfWeek,
      selectedActions,
      enabled: true,
    };

    const updated = [...moments, newMoment];
    setMoments(updated);
    await momentsService.saveMoments(updated);
    setIsAddingNew(false);
    onMomentsUpdated?.();
  };

  const toggleActionSelection = (action: string) => {
    if (selectedActions.includes(action)) {
      setSelectedActions(selectedActions.filter((a) => a !== action));
    } else {
      if (selectedActions.length < 3) {
        setSelectedActions([...selectedActions, action]);
      }
    }
  };

  // Moment ativo para visualização (ou o primeiro com ações)
  const displayMoment = currentMoment ?? moments[0] ?? null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {/* Se estiver no modo de trigger (notificação recebida ou consulta ao momento) */}
          {activeTab === 'trigger' ? (
            <View style={styles.triggerView}>
              <View style={styles.triggerHeader}>
                <View style={styles.calmIconBadge}>
                  <Text style={styles.calmIcon}>🕊️</Text>
                </View>
                <Text style={[styles.triggerTitle, { color: colors.text }]}>
                  Seu momento do dia chegou
                </Text>
                <Text style={[styles.triggerSubtitle, { color: colors.textMuted }]}>
                  Quer olhar sua lista? Não há cobranças nem pressa.
                </Text>
              </View>

              <View
                style={[
                  styles.actionsBox,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(13, 148, 136, 0.12)' : 'rgba(15, 118, 110, 0.08)',
                    borderColor:
                      theme === 'dark' ? 'rgba(45, 212, 191, 0.3)' : 'rgba(15, 118, 110, 0.2)',
                  },
                ]}
              >
                <Text style={[styles.actionsBoxHeading, { color: colors.primary }]}>
                  Ações que você escolheu com carinho para este instante:
                </Text>

                {displayMoment?.selectedActions.map((action, index) => (
                  <View key={index} style={styles.actionItemRow}>
                    <Text style={styles.actionBullet}>🌱</Text>
                    <Text style={[styles.actionItemText, { color: colors.text }]}>
                      {action}
                    </Text>
                  </View>
                ))}

                {(!displayMoment || displayMoment.selectedActions.length === 0) && (
                  <Text style={[styles.emptyActionText, { color: colors.textMuted }]}>
                    Respire devagar e beba um copo d'água.
                  </Text>
                )}
              </View>

              <View style={styles.reliefActionRow}>
                {/* Botão de alívio explícito: Agora não */}
                <TouchableOpacity
                  style={[styles.reliefButton, { borderColor: colors.cardBorder }]}
                  onPress={onClose}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Agora não"
                >
                  <Text style={[styles.reliefButtonText, { color: colors.textMuted }]}>
                    Agora não
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.openRoutineButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    onClose();
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Estou pronto, abrir rotina"
                >
                  <Text style={styles.openRoutineButtonText}>Estou pronto</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Modo Configuração de Meus Momentos */
            <ScrollView contentContainerStyle={styles.configContent}>
              <View style={styles.configHeader}>
                <View style={styles.clockIconBadge}>
                  <Text style={styles.clockIcon}>⏰</Text>
                </View>
                <Text style={[styles.configTitle, { color: colors.text }]}>Meus Momentos</Text>
                <Text style={[styles.configSubtitle, { color: colors.textMuted }]}>
                  Defina até {MAX_MOMENTS} horários críticos na semana. O app enviará lembretes
                  estritamente neutros e 100% offline via notificações locais.
                </Text>
              </View>

              {/* Lista de momentos configurados */}
              <View style={styles.momentsList}>
                {moments.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.momentCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: m.enabled ? colors.primary : colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.momentInfo}>
                      <Text style={[styles.momentLabel, { color: colors.text }]}>
                        {m.label}
                      </Text>
                      <Text style={[styles.momentDetails, { color: colors.textMuted }]}>
                        {m.selectedActions.join(' • ')}
                      </Text>
                    </View>

                    <View style={styles.momentActions}>
                      <TouchableOpacity
                        style={[
                          styles.toggleBtn,
                          {
                            backgroundColor: m.enabled ? colors.primary : 'transparent',
                            borderColor: m.enabled ? colors.primary : colors.cardBorder,
                          },
                        ]}
                        onPress={() => handleToggleMoment(m.id)}
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            { color: m.enabled ? '#ffffff' : colors.textMuted },
                          ]}
                        >
                          {m.enabled ? 'Ativo' : 'Pausado'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteMoment(m.id)}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {moments.length === 0 && !isAddingNew && (
                  <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                    Nenhum momento agendado. Adicione um horário para receber um lembrete sereno.
                  </Text>
                )}
              </View>

              {/* Formulário para novo momento */}
              {isAddingNew ? (
                <View
                  style={[
                    styles.formContainer,
                    {
                      backgroundColor:
                        theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.formTitle, { color: colors.text }]}>
                    Novo Momento Crítico
                  </Text>

                  {/* Dia da semana */}
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>
                    Dia da semana:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
                    {DAY_OPTIONS.map((d) => (
                      <TouchableOpacity
                        key={String(d.id)}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor:
                              newDayOfWeek === d.id ? colors.primary : colors.card,
                            borderColor: colors.cardBorder,
                          },
                        ]}
                        onPress={() => setNewDayOfWeek(d.id)}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            { color: newDayOfWeek === d.id ? '#ffffff' : colors.text },
                          ]}
                        >
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Horário */}
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>Horário:</Text>
                  <View style={styles.timeInputsRow}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        { borderColor: colors.cardBorder, color: colors.text },
                      ]}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={newHour}
                      onChangeText={setNewHour}
                      placeholder="HH"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        { borderColor: colors.cardBorder, color: colors.text },
                      ]}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={newMinute}
                      onChangeText={setNewMinute}
                      placeholder="MM"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  {/* Seleção de ações (1 a 3) */}
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>
                    Ações para exibir quando este momento chegar (escolha até 3):
                  </Text>
                  <View style={styles.actionsGrid}>
                    {allActions.map((act) => {
                      const isSel = selectedActions.includes(act);
                      return (
                        <TouchableOpacity
                          key={act}
                          style={[
                            styles.actionChip,
                            {
                              backgroundColor: isSel
                                ? theme === 'dark'
                                  ? 'rgba(13, 148, 136, 0.3)'
                                  : 'rgba(15, 118, 110, 0.15)'
                                : colors.card,
                              borderColor: isSel ? colors.primary : colors.cardBorder,
                            },
                          ]}
                          onPress={() => toggleActionSelection(act)}
                        >
                          <Text
                            style={[
                              styles.actionChipText,
                              { color: isSel ? colors.primary : colors.text },
                            ]}
                          >
                            {isSel ? '✓ ' : '+ '}
                            {act}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.formButtonsRow}>
                    <TouchableOpacity
                      style={[styles.saveMomentBtn, { backgroundColor: colors.primary }]}
                      onPress={handleCreateMoment}
                    >
                      <Text style={styles.saveMomentBtnText}>Salvar Momento</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelFormBtn}
                      onPress={() => setIsAddingNew(false)}
                    >
                      <Text style={[styles.cancelFormBtnText, { color: colors.textMuted }]}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                moments.length < MAX_MOMENTS && (
                  <TouchableOpacity
                    style={[styles.addBtn, { borderColor: colors.primary }]}
                    onPress={() => setIsAddingNew(true)}
                  >
                    <Text style={[styles.addBtnText, { color: colors.primary }]}>
                      + Agendar Novo Momento ({moments.length}/{MAX_MOMENTS})
                    </Text>
                  </TouchableOpacity>
                )
              )}

              <View style={styles.modalFooterButtons}>
                <TouchableOpacity
                  style={[styles.closeConfigBtn, { borderColor: colors.cardBorder }]}
                  onPress={onClose}
                >
                  <Text style={[styles.closeConfigBtnText, { color: colors.text }]}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  triggerView: {
    padding: 24,
    gap: 18,
  },
  triggerHeader: {
    alignItems: 'center',
    gap: 6,
  },
  calmIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calmIcon: {
    fontSize: 26,
  },
  triggerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  triggerSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionsBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  actionsBoxHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBullet: {
    fontSize: 16,
  },
  actionItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyActionText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  reliefActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  reliefButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  reliefButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openRoutineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  openRoutineButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  configContent: {
    padding: 20,
    gap: 16,
  },
  configHeader: {
    alignItems: 'center',
    gap: 6,
  },
  clockIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockIcon: {
    fontSize: 24,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  configSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  momentsList: {
    gap: 8,
  },
  momentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  momentInfo: {
    flex: 1,
    gap: 2,
  },
  momentLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  momentDetails: {
    fontSize: 11,
  },
  momentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 14,
    color: '#ef4444',
  },
  emptyHint: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  addBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formContainer: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    width: 50,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  timeColon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  saveMomentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveMomentBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelFormBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelFormBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooterButtons: {
    marginTop: 8,
  },
  closeConfigBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeConfigBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
