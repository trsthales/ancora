import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { habitsService, getTodayDateKey } from '../services/habits';
import {
  encryptedStorageService,
  MAX_LOCAL_TASKS,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
} from '../services/encryptedStorage';
import { FACO_CHIPS, CHIP_CATEGORIES, getChipById } from '../constants/chips';
import { UnifiedRoutineItem, Habit, LocalTask, MomentConfig } from '../types/habits';
import { RoutineChecklist } from '../components/RoutineChecklist';
import { LightDayBanner } from '../components/LightDayBanner';
import { GuidedOnboardingModal } from '../components/GuidedOnboardingModal';
import { MyMomentsModal } from '../components/MyMomentsModal';
import { WeeklyReviewCard } from '../components/WeeklyReviewCard';

interface RoutineScreenProps {
  onBack: () => void;
  todayCravingLevel?: number; // Passado pela HomeScreen (fissura 0 a 5)
}

export const RoutineScreen: React.FC<RoutineScreenProps> = ({
  onBack,
  todayCravingLevel = 0,
}) => {
  const { colors, theme } = useTheme();

  // Estados de dados
  const [officialHabits, setOfficialHabits] = useState<Habit[]>([]);
  const [localTasks, setLocalTasks] = useState<LocalTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modo Dia Leve
  // Acionamento automático quando fissura do check-in for >= 4
  const triggeredByCraving = todayCravingLevel >= 4;
  const [isLightDay, setIsLightDay] = useState<boolean>(triggeredByCraving);
  const [isExpandedFull, setIsExpandedFull] = useState<boolean>(false);

  // Modais
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [isMomentsModalVisible, setIsMomentsModalVisible] = useState(false);
  const [momentsModalMode, setMomentsModalMode] = useState<'trigger' | 'config'>('config');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Estado do modal de adição (aba 'official' ou 'local')
  const [addTab, setAddTab] = useState<'official' | 'local'>('official');
  const [selectedCategory, setSelectedCategory] = useState<string>(CHIP_CATEGORIES[0]);
  const [localTaskTitle, setLocalTaskTitle] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const dateKey = useMemo(() => getTodayDateKey(), []);

  // Carrega hábitos da API e tarefas locais cifradas
  const loadRoutineData = useCallback(async () => {
    setIsLoading(true);
    setSyncError(null);

    try {
      const [apiRes, localList] = await Promise.all([
        habitsService.getHabits(dateKey).catch((err) => {
          console.warn('[RoutineScreen] Falha ao carregar hábitos da API:', err);
          setSyncError('Falha temporária ao sincronizar com o servidor. Hábitos locais preservados.');
          return { habits: [], dateKey };
        }),
        encryptedStorageService.loadLocalTasks().catch((err) => {
          console.warn('[RoutineScreen] Falha ao decifrar tarefas locais:', err);
          return [] as LocalTask[];
        }),
      ]);

      setOfficialHabits(apiRes.habits || []);
      setLocalTasks(localList || []);

      // Se o usuário não possui hábitos nem tarefas e não abriu onboarding ainda
      if ((!apiRes.habits || apiRes.habits.length === 0) && (!localList || localList.length === 0)) {
        setIsOnboardingVisible(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    loadRoutineData();
  }, [loadRoutineData]);

  // Se a fissura for atualizada para >= 4, ativa o modo Dia Leve
  useEffect(() => {
    if (todayCravingLevel >= 4) {
      setIsLightDay(true);
    }
  }, [todayCravingLevel]);

  // Unifica hábitos oficiais e tarefas locais
  const unifiedItems: UnifiedRoutineItem[] = useMemo(() => {
    const list: UnifiedRoutineItem[] = [];

    // Hábitos da API
    for (const h of officialHabits) {
      const chip = getChipById(h.chipId);
      list.push({
        id: h.id,
        type: 'official',
        title: chip ? chip.label : 'Hábito da Rotina',
        icon: chip ? chip.icon : '✨',
        category: chip ? chip.category : undefined,
        completed: h.completed,
        chipId: h.chipId,
        createdAt: h.createdAt,
      });
    }

    // Tarefas Locais Cifradas
    for (const t of localTasks) {
      list.push({
        id: t.id,
        type: 'local',
        title: t.title,
        icon: '📱',
        completed: t.completed,
        createdAt: t.createdAt,
      });
    }

    return list;
  }, [officialHabits, localTasks]);

  // Filtra itens se o modo Dia Leve estiver ativo e não expandido
  const displayedItems = useMemo(() => {
    if (!isLightDay || isExpandedFull) {
      return unifiedItems;
    }
    // No modo Dia Leve: colapsa para 1 a 2 itens básicos (sem pendências vermelhas)
    return unifiedItems.slice(0, 2);
  }, [unifiedItems, isLightDay, isExpandedFull]);

  // Alterna conclusão de item (idempotente para API e local)
  const handleToggleItem = async (item: UnifiedRoutineItem) => {
    const newCompleted = !item.completed;

    if (item.type === 'official') {
      // Atualização otimista
      setOfficialHabits((prev) =>
        prev.map((h) => (h.id === item.id ? { ...h, completed: newCompleted } : h)),
      );

      try {
        await habitsService.updateHabitLog(item.id, dateKey, newCompleted);
      } catch (err) {
        console.warn('[RoutineScreen] Erro ao atualizar hábito na API:', err);
        // Reverte em caso de falha crítica
        setOfficialHabits((prev) =>
          prev.map((h) => (h.id === item.id ? { ...h, completed: !newCompleted } : h)),
        );
        Alert.alert('Aviso', 'Não foi possível salvar a alteração no servidor.');
      }
    } else {
      // Tarefa local privada cifrada
      try {
        const updated = await encryptedStorageService.toggleLocalTask(item.id);
        setLocalTasks(updated);
      } catch (err) {
        console.warn('[RoutineScreen] Erro ao atualizar tarefa local:', err);
      }
    }
  };

  // Exclusão de item
  const handleDeleteItem = async (item: UnifiedRoutineItem) => {
    Alert.alert(
      'Remover Hábito',
      `Deseja remover "${item.title}" da sua rotina?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (item.type === 'official') {
              try {
                await habitsService.deleteHabit(item.id);
                setOfficialHabits((prev) => prev.filter((h) => h.id !== item.id));
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Falha ao remover hábito.';
                Alert.alert('Erro', msg);
              }
            } else {
              try {
                const updated = await encryptedStorageService.deleteLocalTask(item.id);
                setLocalTasks(updated);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Falha ao remover tarefa local.';
                Alert.alert('Erro', msg);
              }
            }
          },
        },
      ],
    );
  };

  // Criação de hábitos a partir do onboarding guiado
  const handleOnboardingSelect = async (chipIds: string[]) => {
    for (const chipId of chipIds) {
      try {
        const res = await habitsService.createHabit(chipId);
        setOfficialHabits((prev) => [
          ...prev,
          {
            id: res.habit.id,
            chipId: res.habit.chipId,
            completed: false,
            createdAt: res.habit.createdAt,
          },
        ]);
      } catch (err) {
        console.warn('[RoutineScreen] Erro ao adicionar hábito do onboarding:', err);
      }
    }
  };

  // Adicionar Hábito Oficial via Catálogo
  const handleAddOfficialHabit = async (chipId: string) => {
    setIsSubmittingAdd(true);
    try {
      const res = await habitsService.createHabit(chipId);
      setOfficialHabits((prev) => [
        ...prev,
        {
          id: res.habit.id,
          chipId: res.habit.chipId,
          completed: false,
          createdAt: res.habit.createdAt,
        },
      ]);
      setIsAddModalVisible(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar hábito.';
      Alert.alert('Atenção', msg);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Adicionar Tarefa Privada Local Cifrada
  const handleAddLocalTask = async () => {
    const trimmed = localTaskTitle.trim();
    if (trimmed.length < MIN_TITLE_LENGTH || trimmed.length > MAX_TITLE_LENGTH) {
      Alert.alert(
        'Título Inválido',
        `O título deve conter entre ${MIN_TITLE_LENGTH} e ${MAX_TITLE_LENGTH} caracteres.`,
      );
      return;
    }

    if (localTasks.length >= MAX_LOCAL_TASKS) {
      Alert.alert(
        'Limite Atingido',
        `Você já atingiu o teto de ${MAX_LOCAL_TASKS} tarefas locais privadas.`,
      );
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const newTask = await encryptedStorageService.addLocalTask(trimmed);
      setLocalTasks((prev) => [newTask, ...prev]);
      setLocalTaskTitle('');
      setIsAddModalVisible(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar tarefa cifrada.';
      Alert.alert('Erro', msg);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const existingChipIds = useMemo(
    () => new Set(officialHabits.map((h) => h.chipId)),
    [officialHabits],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />

      {/* Cabeçalho */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a página inicial"
          >
            <Text style={[styles.backButtonIcon, { color: colors.text }]}>←</Text>
            <Text style={[styles.backButtonText, { color: colors.text }]}>Início</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Minha Rotina</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.momentsButton,
              {
                backgroundColor:
                  theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.1)',
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => {
              setMomentsModalMode('config');
              setIsMomentsModalVisible(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Configurar Meus Momentos"
          >
            <Text style={styles.momentsButtonIcon}>⏰</Text>
            <Text style={[styles.momentsButtonText, { color: colors.primary }]}>Momentos</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner de Sincronização transitória */}
        {syncError && (
          <View style={styles.syncBanner}>
            <Text style={styles.syncBannerIcon}>ℹ️</Text>
            <Text style={styles.syncBannerText}>{syncError}</Text>
          </View>
        )}

        {/* Modo Dia Leve (🌿 Hoje basta isso) */}
        <LightDayBanner
          isLightDay={isLightDay}
          onToggleLightDay={() => {
            setIsLightDay((prev) => !prev);
            setIsExpandedFull(false);
          }}
          isExpandedFull={isExpandedFull}
          onToggleExpandFull={() => setIsExpandedFull((prev) => !prev)}
          triggeredByCraving={triggeredByCraving}
        />

        {/* Revisão Semanal Aditiva (sem déficits nem sequências) */}
        <WeeklyReviewCard items={unifiedItems} />

        {/* Checklist Diário */}
        <RoutineChecklist
          items={displayedItems}
          onToggleItem={handleToggleItem}
          onDeleteItem={handleDeleteItem}
          onAddNewPress={() => setIsAddModalVisible(true)}
          isLoading={isLoading}
        />
      </ScrollView>

      {/* Modal de Primeiro Uso Guiado */}
      <GuidedOnboardingModal
        visible={isOnboardingVisible}
        onClose={() => setIsOnboardingVisible(false)}
        onSelectHabits={handleOnboardingSelect}
      />

      {/* Modal de Meus Momentos */}
      <MyMomentsModal
        visible={isMomentsModalVisible}
        onClose={() => setIsMomentsModalVisible(false)}
        mode={momentsModalMode}
        availableActionOptions={unifiedItems.map((i) => i.title)}
      />

      {/* Modal para Adicionar Hábito ou Tarefa Local */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.addModalContainer,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.addModalHeader}>
              <Text style={[styles.addModalTitle, { color: colors.text }]}>
                Adicionar à Rotina
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                style={styles.closeAddModalBtn}
              >
                <Text style={[styles.closeAddModalText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Alternador de Tipo: Catálogo Oficial vs Tarefa Local Cifrada */}
            <View
              style={[
                styles.tabSelector,
                {
                  backgroundColor:
                    theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  addTab === 'official' && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setAddTab('official')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: addTab === 'official' ? '#ffffff' : colors.textMuted },
                  ]}
                >
                  Catálogo Oficial (30)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  addTab === 'local' && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setAddTab('local')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: addTab === 'local' ? '#ffffff' : colors.textMuted },
                  ]}
                >
                  📱 Hábito Local Cifrado
                </Text>
              </TouchableOpacity>
            </View>

            {addTab === 'official' ? (
              /* Catálogo Oficial de 30 Chips */
              <View style={styles.catalogArea}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CHIP_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor:
                            selectedCategory === cat ? colors.primary : colors.background,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          {
                            color: selectedCategory === cat ? '#ffffff' : colors.text,
                            fontWeight: selectedCategory === cat ? '700' : '500',
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView style={styles.chipsScrollList}>
                  <View style={styles.chipsListContainer}>
                    {FACO_CHIPS.filter((c) => c.category === selectedCategory).map((chip) => {
                      const isAlreadyAdded = existingChipIds.has(chip.id);

                      return (
                        <TouchableOpacity
                          key={chip.id}
                          style={[
                            styles.chipCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: isAlreadyAdded ? colors.cardBorder : colors.primary,
                              opacity: isAlreadyAdded ? 0.5 : 1,
                            },
                          ]}
                          onPress={() => !isAlreadyAdded && handleAddOfficialHabit(chip.id)}
                          disabled={isAlreadyAdded || isSubmittingAdd}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.chipCardIcon}>{chip.icon}</Text>
                          <View style={styles.chipCardTexts}>
                            <Text style={[styles.chipCardLabel, { color: colors.text }]}>
                              {chip.label}
                            </Text>
                            <Text style={[styles.chipCardSub, { color: colors.textMuted }]}>
                              {chip.category}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.chipAddAction,
                              { color: isAlreadyAdded ? colors.textMuted : colors.primary },
                            ]}
                          >
                            {isAlreadyAdded ? 'Já adicionado' : '+ Adicionar'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : (
              /* Formulário de Tarefa Privada Local Cifrada */
              <View style={styles.localTaskForm}>
                <View
                  style={[
                    styles.privacyNoticeBox,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? 'rgba(139, 92, 246, 0.15)'
                          : 'rgba(139, 92, 246, 0.08)',
                      borderColor:
                        theme === 'dark'
                          ? 'rgba(167, 139, 250, 0.3)'
                          : 'rgba(139, 92, 246, 0.2)',
                    },
                  ]}
                >
                  <Text style={styles.privacyNoticeIcon}>🔒</Text>
                  <Text style={[styles.privacyNoticeText, { color: colors.text }]}>
                    Esta tarefa será salva exclusivamente neste aparelho usando criptografia AES-GCM
                    com chave protegida em hardware (THIS_DEVICE_ONLY). Nenhum dado trafega pela
                    rede.
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Título do hábito pessoal:
                </Text>
                <TextInput
                  style={[
                    styles.taskTextInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Ex: Ler 10 páginas, regar minhas plantas..."
                  placeholderTextColor={colors.textMuted}
                  maxLength={MAX_TITLE_LENGTH}
                  value={localTaskTitle}
                  onChangeText={setLocalTaskTitle}
                />
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {localTaskTitle.length}/{MAX_TITLE_LENGTH} caracteres (mínimo {MIN_TITLE_LENGTH})
                </Text>

                <TouchableOpacity
                  style={[
                    styles.saveLocalTaskBtn,
                    { backgroundColor: colors.primary },
                    (localTaskTitle.trim().length < MIN_TITLE_LENGTH || isSubmittingAdd) &&
                      styles.disabledBtn,
                  ]}
                  onPress={handleAddLocalTask}
                  disabled={
                    localTaskTitle.trim().length < MIN_TITLE_LENGTH || isSubmittingAdd
                  }
                  activeOpacity={0.85}
                >
                  {isSubmittingAdd ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.saveLocalTaskBtnText}>
                      Salvar Hábito Localmente ({localTasks.length}/{MAX_LOCAL_TASKS})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backButtonIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  momentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  momentsButtonIcon: {
    fontSize: 14,
  },
  momentsButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 10,
    borderRadius: 10,
  },
  syncBannerIcon: {
    fontSize: 14,
  },
  syncBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#f59e0b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  addModalContainer: {
    borderRadius: 20,
    borderWidth: 1,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    padding: 20,
    gap: 16,
  },
  addModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeAddModalBtn: {
    padding: 6,
  },
  closeAddModalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  catalogArea: {
    gap: 12,
    flexShrink: 1,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 12,
  },
  chipsScrollList: {
    maxHeight: 380,
  },
  chipsListContainer: {
    gap: 8,
  },
  chipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  chipCardIcon: {
    fontSize: 22,
  },
  chipCardTexts: {
    flex: 1,
    gap: 2,
  },
  chipCardLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipCardSub: {
    fontSize: 11,
  },
  chipAddAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  localTaskForm: {
    gap: 12,
    paddingVertical: 6,
  },
  privacyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  privacyNoticeIcon: {
    fontSize: 18,
  },
  privacyNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  taskTextInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
  },
  saveLocalTaskBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  saveLocalTaskBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
