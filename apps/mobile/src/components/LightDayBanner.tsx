import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LightDayBannerProps {
  isLightDay: boolean;
  onToggleLightDay: () => void;
  isExpandedFull: boolean;
  onToggleExpandFull: () => void;
  triggeredByCraving?: boolean;
}

export const LightDayBanner: React.FC<LightDayBannerProps> = ({
  isLightDay,
  onToggleLightDay,
  isExpandedFull,
  onToggleExpandFull,
  triggeredByCraving = false,
}) => {
  const { colors, theme } = useTheme();

  if (!isLightDay) {
    return (
      <View style={[styles.triggerContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.triggerInfo}>
          <Text style={styles.leafIcon}>🌿</Text>
          <View style={styles.triggerTexts}>
            <Text style={[styles.triggerTitle, { color: colors.text }]}>Dia mais pesado?</Text>
            <Text style={[styles.triggerSub, { color: colors.textMuted }]}>
              Você pode diminuir a exigência e focar só no essencial.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.lightDayButton, { borderColor: colors.primary }]}
          onPress={onToggleLightDay}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ativar modo Hoje está pesado"
        >
          <Text style={[styles.lightDayButtonText, { color: colors.primary }]}>Hoje está pesado</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.activeBanner,
        {
          backgroundColor:
            theme === 'dark' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(15, 118, 110, 0.08)',
          borderColor: theme === 'dark' ? 'rgba(45, 212, 191, 0.4)' : 'rgba(15, 118, 110, 0.3)',
        },
      ]}
    >
      <View style={styles.bannerHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.bannerTitle}>🌿 Hoje basta isso</Text>
          {triggeredByCraving && (
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>Modo acolhimento ativo</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={onToggleLightDay}
          activeOpacity={0.7}
        >
          <Text style={[styles.exitButtonText, { color: colors.textMuted }]}>Desativar</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.bannerQuote, { color: colors.text }]}>
        "Em dias difíceis, diminuir a exigência é um ato de coragem. Cuide apenas do essencial hoje."
      </Text>

      <View style={styles.bannerFooter}>
        <Text style={[styles.bannerHint, { color: colors.textMuted }]}>
          {isExpandedFull
            ? 'Visualizando rotina completa (sem pendências ou cobranças).'
            : 'Mostrando apenas 1 a 2 itens básicos para hoje.'}
        </Text>
        <TouchableOpacity
          onPress={onToggleExpandFull}
          activeOpacity={0.7}
          style={styles.expandButton}
        >
          <Text style={[styles.expandText, { color: colors.primary }]}>
            {isExpandedFull ? '🌿 Ver apenas o essencial' : '👁️ Ver rotina completa'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  triggerContainer: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  triggerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leafIcon: {
    fontSize: 22,
  },
  triggerTexts: {
    flex: 1,
    gap: 2,
  },
  triggerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  triggerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  lightDayButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  lightDayButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14b8a6',
  },
  autoBadge: {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#14b8a6',
  },
  exitButton: {
    padding: 4,
  },
  exitButtonText: {
    fontSize: 12,
  },
  bannerQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  bannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  bannerHint: {
    fontSize: 12,
    flex: 1,
  },
  expandButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
