import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { UnifiedRoutineItem } from '../types/habits';

interface RoutineChecklistProps {
  items: UnifiedRoutineItem[];
  onToggleItem: (item: UnifiedRoutineItem) => Promise<void>;
  onDeleteItem: (item: UnifiedRoutineItem) => Promise<void>;
  onAddNewPress: () => void;
  isLoading?: boolean;
}

export const RoutineChecklist: React.FC<RoutineChecklistProps> = ({
  items,
  onToggleItem,
  onDeleteItem,
  onAddNewPress,
  isLoading = false,
}) => {
  const { colors, theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithCount}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Checklist do Dia</Text>
          <View
            style={[
              styles.counterBadge,
              {
                backgroundColor:
                  theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
              },
            ]}
          >
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {items.filter((i) => i.completed).length} de {items.length} cuidados
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={onAddNewPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Adicionar novo hábito ou tarefa local"
        >
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Carregando sua rotina...
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nenhum hábito na sua rotina ainda
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Você pode começar com 1 hábito pequeno ou cadastrar uma tarefa privada local.
          </Text>
          <TouchableOpacity
            style={[styles.startFirstButton, { backgroundColor: colors.primary }]}
            onPress={onAddNewPress}
          >
            <Text style={styles.startFirstButtonText}>Adicionar primeiro hábito</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item) => {
            const isCompleted = item.completed;
            const isLocal = item.type === 'local';

            return (
              <View
                key={`${item.type}_${item.id}`}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isCompleted
                      ? theme === 'dark'
                        ? 'rgba(16, 185, 129, 0.35)'
                        : 'rgba(16, 185, 129, 0.3)'
                      : colors.cardBorder,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.itemMainArea}
                  onPress={() => onToggleItem(item)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isCompleted }}
                  accessibilityLabel={`${item.title}, ${isCompleted ? 'concluído' : 'não concluído'}`}
                >
                  {/* Caixa de seleção com check suave */}
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isCompleted ? '#10b981' : colors.cardBorder,
                        backgroundColor: isCompleted ? '#10b981' : 'transparent',
                      },
                    ]}
                  >
                    {isCompleted && <Text style={styles.checkMark}>✓</Text>}
                  </View>

                  <Text style={styles.itemIcon}>{item.icon || (isLocal ? '🔒' : '✨')}</Text>

                  <View style={styles.itemTexts}>
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: isCompleted ? colors.textMuted : colors.text,
                          textDecorationLine: isCompleted ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <View style={styles.badgesRow}>
                      {isLocal ? (
                        /* Selo visual obrigatório: 📱 Hábito Local */
                        <View
                          style={[
                            styles.localBadge,
                            {
                              backgroundColor:
                                theme === 'dark'
                                  ? 'rgba(139, 92, 246, 0.2)'
                                  : 'rgba(139, 92, 246, 0.12)',
                              borderColor:
                                theme === 'dark'
                                  ? 'rgba(167, 139, 250, 0.4)'
                                  : 'rgba(139, 92, 246, 0.3)',
                            },
                          ]}
                        >
                          <Text style={styles.localBadgeText}>📱 Hábito Local</Text>
                        </View>
                      ) : (
                        item.category && (
                          <View
                            style={[
                              styles.categoryBadge,
                              { backgroundColor: colors.background },
                            ]}
                          >
                            <Text style={[styles.categoryBadgeText, { color: colors.textMuted }]}>
                              {item.category}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => onDeleteItem(item)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${item.title}`}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Rodapé Obrigatório com Aviso Médico */}
      <View
        style={[
          styles.disclaimerContainer,
          {
            backgroundColor:
              theme === 'dark' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.03)',
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={styles.disclaimerIcon}>🩺</Text>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          O Jornada Firme não monitora nem substitui acompanhamento médico ou farmacológico.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  counterBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  startFirstButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  startFirstButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  itemMainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemIcon: {
    fontSize: 22,
  },
  itemTexts: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  localBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  disclaimerIcon: {
    fontSize: 18,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
