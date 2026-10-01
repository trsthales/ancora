import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

export const IdentityRevealScreen: React.FC = () => {
  const { profile, acknowledgeIdentity } = useAuth();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const formattedPseudonym = profile?.pseudonym
    ? profile.pseudonym.startsWith('@')
      ? profile.pseudonym
      : `@${profile.pseudonym}`
    : '@Navegador_000';

  const personaLabel = profile?.persona === 'apoio' ? 'Ponto de Apoio' : 'Navegador';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={styles.content}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Identidade Gerada com Sucesso</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>⚓</Text>
          </View>

          <Text style={styles.pseudonym}>{formattedPseudonym}</Text>
          <View style={styles.personaBadge}>
            <Text style={styles.personaBadgeText}>{personaLabel}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.privacyHeading}>Proteção Absoluta</Text>
          <Text style={styles.privacyMessage}>
            Sua identidade na comunidade está protegida pelo anonimato.
          </Text>
          <Text style={styles.privacySubtext}>
            Seu e-mail ou dados pessoais nunca serão visíveis para outros navegadores ou pontos de
            apoio. Você é livre para ser você mesmo, com segurança.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={acknowledgeIdentity}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Entrar no Âncora"
        >
          <Text style={styles.continueButtonText}>Entrar no Âncora</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, theme: 'dark' | 'light') =>
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
    badgeContainer: {
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(15, 118, 110, 0.1)',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    badgeText: {
      color: theme === 'dark' ? '#2dd4bf' : colors.primary,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    card: {
      alignItems: 'center',
      padding: 32,
      borderRadius: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      width: '100%',
      marginBottom: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    avatarIcon: {
      fontSize: 40,
    },
    pseudonym: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    personaBadge: {
      backgroundColor: theme === 'dark' ? colors.cardBorder : '#e2e8f0',
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 12,
      marginBottom: 20,
    },
    personaBadgeText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    divider: {
      width: '100%',
      height: 1,
      backgroundColor: colors.cardBorder,
      marginBottom: 20,
    },
    privacyHeading: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 6,
    },
    privacyMessage: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 10,
      lineHeight: 22,
    },
    privacySubtext: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    continueButton: {
      width: '100%',
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    continueButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
  });
