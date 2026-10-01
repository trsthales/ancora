import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.icon}>⚓</Text>
          <Text style={styles.title}>Âncora</Text>
          <Text style={styles.slogan}>Firmeza para atravessar a tempestade.</Text>
          <Text style={styles.description}>
            Um espaço seguro e anônimo de apoio mútuo para a recuperação e bem-estar.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onNavigateToRegister}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Começar Jornada"
          >
            <Text style={styles.primaryButtonText}>Começar Jornada</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onNavigateToLogin}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Entrar"
          >
            <Text style={styles.secondaryButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    card: {
      alignItems: 'center',
      padding: 32,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      width: '100%',
      marginBottom: 32,
    },
    icon: {
      fontSize: 54,
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    slogan: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    actions: {
      width: '100%',
      gap: 12,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
  });
