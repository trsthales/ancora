import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

interface ProgressCardProps {
  totalCheckins: number;
  isLoading?: boolean;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  totalCheckins,
  isLoading = false,
}) => {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const progressLabel = useMemo(() => {
    if (totalCheckins === 0) {
      return 'Seu primeiro passo começa hoje';
    }
    if (totalCheckins === 1) {
      return '1 dia de autocuidado registrado';
    }
    return `${totalCheckins} dias de autocuidado registrados`;
  }, [totalCheckins]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>⚓</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.subtitle}>Jornada Pessoal • Vitórias Acumuladas</Text>
          <Text style={styles.title}>Presença e Autocuidado</Text>
        </View>
      </View>

      <View style={styles.statContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.countWrapper}>
            <Text style={styles.countNumber}>{totalCheckins}</Text>
            <View style={styles.countTextGroup}>
              <Text style={styles.countLabel}>{progressLabel}</Text>
              <Text style={styles.philosophyNote}>
                Registro cumulativo • Cada momento acolhido fortalece sua autonomia
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footerNote}>
        <View style={styles.gentleDot} />
        <Text style={styles.footerText}>
          Sem streaks punitivos ou cobrança de sequências. O que importa é você estar aqui agora.
        </Text>
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
      gap: 14,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    iconText: {
      fontSize: 20,
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
    statContainer: {
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    countWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    countNumber: {
      fontSize: 38,
      fontWeight: '800',
      color: colors.primary,
      minWidth: 46,
      textAlign: 'center',
    },
    countTextGroup: {
      flex: 1,
      gap: 2,
    },
    countLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    philosophyNote: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 16,
    },
    footerNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingTop: 4,
    },
    gentleDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 5,
    },
    footerText: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
      fontStyle: 'italic',
    },
  });
