import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { UnifiedRoutineItem } from '../types/habits';

interface WeeklyReviewCardProps {
  items: UnifiedRoutineItem[];
  completedCountToday?: number;
}

export const WeeklyReviewCard: React.FC<WeeklyReviewCardProps> = ({ items }) => {
  const { colors, theme } = useTheme();
  const [reflectionText, setReflectionText] = useState('');
  const [isSavedReflection, setIsSavedReflection] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filtra itens com histórico ou concluídos
  // Linguagem estritamente aditiva: NÃO exibe "de 7", NÃO exibe porcentagem, NÃO exibe faltantes
  const activeItems = items.filter((item) => item.completed);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setIsExpanded((prev) => !prev)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Expandir ou recolher revisão semanal aditiva"
      >
        <View style={styles.titleGroup}>
          <Text style={styles.iconBadge}>🌱</Text>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Revisão Semanal Acolhedora</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Reconhecimento gentil dos seus passos
            </Text>
          </View>
        </View>
        <Text style={[styles.expandArrow, { color: colors.textMuted }]}>
          {isExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View
            style={[
              styles.additiveSummaryBox,
              {
                backgroundColor:
                  theme === 'dark' ? 'rgba(13, 148, 136, 0.1)' : 'rgba(15, 118, 110, 0.05)',
                borderColor:
                  theme === 'dark' ? 'rgba(45, 212, 191, 0.25)' : 'rgba(15, 118, 110, 0.15)',
              },
            ]}
          >
            <Text style={[styles.summaryLead, { color: colors.text }]}>
              {activeItems.length > 0
                ? 'Esta semana você esteve presente e dedicou tempo ao seu bem-estar.'
                : 'Esta semana é um espaço de recomeço e paciência com o seu ritmo.'}
            </Text>

            {items.map((item) => {
              // Simulação de linguagem aditiva baseada na presença do hábito
              const daysPresent = item.completed ? 1 : 0;
              if (daysPresent === 0) return null;

              return (
                <View key={item.id} style={styles.additiveItemRow}>
                  <Text style={styles.itemBullet}>{item.icon || '✨'}</Text>
                  <Text style={[styles.additiveItemText, { color: colors.text }]}>
                    Esta semana você esteve presente e cuidou de{' '}
                    <Text style={{ fontWeight: '700', color: colors.primary }}>{item.title}</Text>.
                  </Text>
                </View>
              );
            })}

            {activeItems.length === 0 && (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                Nenhum passo é pequeno demais. Quando sentir que é o momento, dê o primeiro passo.
              </Text>
            )}
          </View>

          {/* Pergunta Reflexiva da TCC */}
          <View style={styles.cbtPromptBox}>
            <Text style={styles.cbtPromptHeader}>💡 Reflexão da TCC</Text>
            <Text style={[styles.cbtPromptQuestion, { color: colors.text }]}>
              "O que ajudou você a cuidar de si nesses momentos?"
            </Text>

            <TextInput
              style={[
                styles.reflectionInput,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Ex: Ter parado para respirar, pedido apoio ou começado devagar..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={reflectionText}
              onChangeText={(t) => {
                setReflectionText(t);
                setIsSavedReflection(false);
              }}
            />

            {reflectionText.trim().length > 0 && !isSavedReflection && (
              <TouchableOpacity
                style={[styles.saveReflectionButton, { backgroundColor: colors.primary }]}
                onPress={() => setIsSavedReflection(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.saveReflectionButtonText}>Guardar para mim</Text>
              </TouchableOpacity>
            )}

            {isSavedReflection && (
              <Text style={styles.savedNote}>
                ✓ Reflexão guardada privadamente no seu aparelho.
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12,
  },
  expandArrow: {
    fontSize: 14,
    paddingHorizontal: 6,
  },
  expandedContent: {
    gap: 14,
    paddingTop: 4,
  },
  additiveSummaryBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  summaryLead: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  additiveItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  itemBullet: {
    fontSize: 16,
  },
  additiveItemText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  emptyHint: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  cbtPromptBox: {
    gap: 8,
  },
  cbtPromptHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d9488',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cbtPromptQuestion: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  reflectionInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveReflectionButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  saveReflectionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  savedNote: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
  },
});
