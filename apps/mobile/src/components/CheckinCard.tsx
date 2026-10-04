import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { journeyService, Checkin, MoodType } from '../services/journey';

const CRAVING_LEVELS: { level: number; label: string; desc: string }[] = [
  { level: 0, label: '0', desc: 'Nenhuma' },
  { level: 1, label: '1', desc: 'Leve' },
  { level: 2, label: '2', desc: 'Moderada' },
  { level: 3, label: '3', desc: 'Incômoda' },
  { level: 4, label: '4', desc: 'Intensa' },
  { level: 5, label: '5', desc: 'Crítica' },
];

const MOOD_OPTIONS: { key: MoodType; label: string; icon: string }[] = [
  { key: 'calmo', label: 'Calmo', icon: '🌿' },
  { key: 'ansioso', label: 'Ansioso', icon: '⚡' },
  { key: 'cansado', label: 'Cansado', icon: '🌙' },
  { key: 'vulneravel', label: 'Vulnerável', icon: '🛡️' },
  { key: 'motivado', label: 'Motivado', icon: '☀️' },
];

interface CheckinCardProps {
  hasCheckedInToday: boolean;
  todayCheckin: Checkin | null;
  isLoadingInitial?: boolean;
  onCheckinSuccess: (checkin: Checkin) => void;
  onHighCravingIntercept?: (cravingLevel: number) => void;
}

export const CheckinCard: React.FC<CheckinCardProps> = ({
  hasCheckedInToday,
  todayCheckin,
  isLoadingInitial = false,
  onCheckinSuccess,
  onHighCravingIntercept,
}) => {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const [cravingLevel, setCravingLevel] = useState<number>(0);
  const [mood, setMood] = useState<MoodType>('calmo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sincroniza estado quando recebe checkin existente
  useEffect(() => {
    if (todayCheckin) {
      setCravingLevel(todayCheckin.cravingLevel);
      setMood(todayCheckin.mood);
    }
  }, [todayCheckin]);

  const isHighCraving = cravingLevel >= 4;

  const handleSubmit = async () => {
    setErrorMessage(null);

    // Motor de Interceptação Local e Imediata:
    // Se a fissura for 4 ou 5, dispara o acolhimento localmente antes/concomitantemente ao fetch,
    // garantindo suporte de 15 minutos mesmo se a rede falhar ou estiver lenta.
    if (cravingLevel >= 4) {
      onHighCravingIntercept?.(cravingLevel);
    }

    setIsSubmitting(true);

    try {
      const response = await journeyService.createCheckin(cravingLevel, mood);
      setIsEditing(false);
      onCheckinSuccess(response.checkin);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível registrar seu check-in. Tente novamente.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCravingDesc = (level: number) => {
    return CRAVING_LEVELS.find((c) => c.level === level)?.desc || '';
  };

  const getMoodLabel = (m: MoodType) => {
    const item = MOOD_OPTIONS.find((item) => item.key === m);
    return item ? `${item.icon} ${item.label}` : m;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isLoadingInitial) {
    return (
      <View style={[styles.card, styles.centerContent]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando seu check-in de hoje...</Text>
      </View>
    );
  }

  // Estado Pós-Check-in: Usuário já fez check-in hoje e não está em modo de edição
  if (hasCheckedInToday && todayCheckin && !isEditing) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.checkinBadge}>
            <Text style={styles.checkinBadgeIcon}>✓</Text>
            <Text style={styles.checkinBadgeText}>Check-in de Hoje Concluído</Text>
          </View>
          {todayCheckin.createdAt ? (
            <Text style={styles.timestampText}>às {formatTime(todayCheckin.createdAt)}</Text>
          ) : null}
        </View>

        <Text style={styles.completedSubheading}>
          Obrigado por dedicar um momento para escutar o seu corpo e as suas emoções.
        </Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nível de Fissura:</Text>
            <View style={styles.summaryValueGroup}>
              <View
                style={[
                  styles.miniDot,
                  todayCheckin.cravingLevel >= 4 ? styles.coralDot : styles.tealDot,
                ]}
              />
              <Text
                style={[styles.summaryValue, todayCheckin.cravingLevel >= 4 && styles.coralText]}
              >
                {todayCheckin.cravingLevel} • {getCravingDesc(todayCheckin.cravingLevel)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estado de Humor:</Text>
            <Text style={styles.summaryValue}>{getMoodLabel(todayCheckin.mood)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.updateStateButton}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Atualizar estado de hoje"
        >
          <Text style={styles.updateStateButtonText}>Atualizar estado</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Formulário de Registro / Atualização de Check-in
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📝</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.subtitle}>Check-in Diário</Text>
          <Text style={styles.title}>
            {hasCheckedInToday ? 'Atualizar seu Estado' : 'Como você está agora?'}
          </Text>
        </View>
      </View>

      {/* Seção 1: Escala de Fissura (0 a 5) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nível de Fissura</Text>
          <Text style={[styles.cravingBadgeDesc, isHighCraving && styles.coralText]}>
            {cravingLevel} • {getCravingDesc(cravingLevel)}
          </Text>
        </View>

        <View style={styles.cravingScaleRow}>
          {CRAVING_LEVELS.map((item) => {
            const isSelected = cravingLevel === item.level;
            const isWarningItem = item.level >= 4;

            let buttonStyle = styles.cravingCircle;
            let textStyle = styles.cravingCircleText;

            if (isSelected) {
              if (isWarningItem) {
                buttonStyle = { ...buttonStyle, ...styles.cravingCircleWarningSelected };
                textStyle = { ...textStyle, ...styles.cravingCircleTextSelected };
              } else {
                buttonStyle = { ...buttonStyle, ...styles.cravingCircleSelected };
                textStyle = { ...textStyle, ...styles.cravingCircleTextSelected };
              }
            } else if (isWarningItem) {
              buttonStyle = { ...buttonStyle, ...styles.cravingCircleWarningUnselected };
            }

            return (
              <TouchableOpacity
                key={item.level}
                style={buttonStyle}
                onPress={() => setCravingLevel(item.level)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Fissura ${item.level}: ${item.desc}`}
              >
                <Text style={textStyle}>{item.label}</Text>
                <Text
                  style={[styles.cravingMiniDesc, isSelected && styles.cravingMiniDescSelected]}
                  numberOfLines={1}
                >
                  {item.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isHighCraving && (
          <View style={styles.highCravingBanner}>
            <Text style={styles.highCravingIcon}>⚠️</Text>
            <Text style={styles.highCravingNotice}>
              Fissura intensa/crítica: o protocolo de acolhimento e suporte será ativado para te
              apoiar.
            </Text>
          </View>
        )}
      </View>

      {/* Seção 2: Seletor de Humor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seu Humor Predominante</Text>
        <View style={styles.moodChipsContainer}>
          {MOOD_OPTIONS.map((item) => {
            const isSelected = mood === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.moodChip, isSelected && styles.moodChipSelected]}
                onPress={() => setMood(item.key)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Humor: ${item.label}`}
              >
                <Text style={styles.moodChipIcon}>{item.icon}</Text>
                <Text style={[styles.moodChipText, isSelected && styles.moodChipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Feedback de Erro */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Ações de Envio */}
      <View style={styles.actionsRow}>
        {hasCheckedInToday && isEditing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsEditing(false)}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitButton, hasCheckedInToday && isEditing && styles.submitButtonFlex]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={hasCheckedInToday ? 'Atualizar Check-in' : 'Registrar Check-in'}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.primaryText} />
          ) : (
            <Text style={styles.submitButtonText}>
              {hasCheckedInToday ? 'Atualizar Check-in' : 'Registrar Check-in'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, theme: 'dark' | 'light') =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 16,
    },
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(15, 118, 110, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    iconText: {
      fontSize: 18,
    },
    titleContainer: {
      flex: 1,
      gap: 2,
    },
    subtitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    checkinBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    checkinBadgeIcon: {
      color: '#10b981',
      fontSize: 12,
      fontWeight: 'bold',
    },
    checkinBadgeText: {
      color: '#10b981',
      fontSize: 12,
      fontWeight: '700',
    },
    timestampText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    completedSubheading: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    summaryContainer: {
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 10,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500',
    },
    summaryValueGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    miniDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    tealDot: {
      backgroundColor: '#10b981',
    },
    coralDot: {
      backgroundColor: '#f87171',
    },
    coralText: {
      color: '#ef4444',
      fontWeight: '700',
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    updateStateButton: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    updateStateButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    section: {
      gap: 10,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    cravingBadgeDesc: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    cravingScaleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    cravingCircle: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 2,
      borderRadius: 10,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 2,
    },
    cravingCircleSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    cravingCircleWarningUnselected: {
      borderColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.3)',
      backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)',
    },
    cravingCircleWarningSelected: {
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
    },
    cravingCircleText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    cravingCircleTextSelected: {
      color: '#ffffff',
    },
    cravingMiniDesc: {
      fontSize: 9,
      color: colors.textMuted,
      textAlign: 'center',
    },
    cravingMiniDescSelected: {
      color: '#ffffff',
      fontWeight: '600',
    },
    highCravingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.35)',
      padding: 10,
      borderRadius: 8,
      marginTop: 2,
    },
    highCravingIcon: {
      fontSize: 16,
    },
    highCravingNotice: {
      flex: 1,
      fontSize: 12,
      color: theme === 'dark' ? '#fcd34d' : '#b45309',
      lineHeight: 16,
      fontWeight: '500',
    },
    moodChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    moodChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    moodChipSelected: {
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.25)' : 'rgba(15, 118, 110, 0.15)',
      borderColor: colors.primary,
    },
    moodChipIcon: {
      fontSize: 14,
    },
    moodChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
    },
    moodChipTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    errorContainer: {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: 8,
      padding: 10,
    },
    errorText: {
      color: '#ef4444',
      fontSize: 12,
      textAlign: 'center',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    submitButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonFlex: {
      flex: 1,
    },
    submitButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryText,
    },
  });
