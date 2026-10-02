import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { BreathingCircle } from '../../components/BreathingCircle';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface BreathingScreenProps {
  onBack: () => void;
}

export const BreathingScreen: React.FC<BreathingScreenProps> = ({ onBack }) => {
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

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
        <View style={styles.titleSection}>
          <Text style={styles.title}>Respiração Guiada 4-7-8</Text>
          <Text style={styles.subtitle}>
            A respiração compassada é uma prática amplamente utilizada para apoiar a autorregulação,
            desacelerar batimentos e auxiliar na travessia de momentos de ansiedade e impulso.
          </Text>
        </View>

        {/* Aviso Clínico de Segurança */}
        <View style={styles.safetyBox}>
          <Text style={styles.safetyIcon}>⚠️</Text>
          <Text style={styles.safetyText}>
            <Text style={styles.safetyBold}>Importante:</Text> caso sinta tontura, desconforto
            respiratório ou mal-estar, interrompa o exercício imediatamente e volte ao seu ritmo
            respiratório natural.
          </Text>
        </View>

        {/* Círculo Interativo Animado */}
        <BreathingCircle />

        {/* Guia Rápido dos 3 Passos */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsCardTitle}>Como funciona o ciclo:</Text>
          <View style={styles.stepItem}>
            <View style={[styles.stepBullet, { backgroundColor: '#10b981' }]} />
            <Text style={styles.stepText}>
              <Text style={styles.stepHighlight}>4 segundos:</Text> Inspire profunda e suavemente
              pelo nariz.
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepBullet, { backgroundColor: '#0d9488' }]} />
            <Text style={styles.stepText}>
              <Text style={styles.stepHighlight}>7 segundos:</Text> Segure o ar sem criar tensão no
              corpo.
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepBullet, { backgroundColor: '#14b8a6' }]} />
            <Text style={styles.stepText}>
              <Text style={styles.stepHighlight}>8 segundos:</Text> Esvazie os pulmões lentamente
              pela boca.
            </Text>
          </View>
        </View>

        {/* Botão de Saída Neutro */}
        <TouchableOpacity
          style={styles.calmExitButton}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Concluir e voltar ao SOS"
        >
          <Text style={styles.calmExitButtonText}>Concluir e voltar ao SOS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, theme: 'dark' | 'light') =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      backgroundColor: colors.card,
    },
    backButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    backButtonText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    badgeNivel1: {
      backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    badgeNivel1Text: {
      color: theme === 'dark' ? '#34d399' : '#059669',
      fontSize: 12,
      fontWeight: '600',
    },
    content: {
      padding: 20,
      gap: 20,
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
      alignItems: 'center',
      paddingBottom: 40,
    },
    titleSection: {
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 420,
    },
    stepsCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 12,
      width: '100%',
    },
    stepsCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    stepBullet: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    stepText: {
      fontSize: 13,
      color: colors.textMuted,
      flex: 1,
      lineHeight: 18,
    },
    stepHighlight: {
      color: colors.text,
      fontWeight: '600',
    },
    calmExitButton: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: '#10b981',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 24,
      width: '100%',
      alignItems: 'center',
      marginTop: 8,
    },
    calmExitButtonText: {
      color: theme === 'dark' ? '#34d399' : '#059669',
      fontSize: 15,
      fontWeight: '700',
    },
    safetyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.15)',
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.5)',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      width: '100%',
    },
    safetyIcon: {
      fontSize: 18,
    },
    safetyText: {
      flex: 1,
      fontSize: 12,
      color: theme === 'dark' ? '#fde68a' : '#92400e',
      lineHeight: 18,
    },
    safetyBold: {
      fontWeight: '700',
    },
  });
