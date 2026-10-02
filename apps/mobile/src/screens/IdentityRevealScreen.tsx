import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

export const IdentityRevealScreen: React.FC = () => {
  const { profile, recoveryKey, acknowledgeIdentity } = useAuth();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const [hasCopied, setHasCopied] = useState(false);

  const formattedPseudonym = profile?.pseudonym
    ? profile.pseudonym.startsWith('@')
      ? profile.pseudonym
      : `@${profile.pseudonym}`
    : '@Navegador_000';

  const personaLabel = profile?.persona === 'apoio' ? 'Ponto de Apoio' : 'Navegador';

  const handleCopyKey = async () => {
    if (!recoveryKey) return;

    try {
      if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
        await Clipboard.setStringAsync(recoveryKey);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(recoveryKey);
      }
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(recoveryKey);
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 2500);
          return;
        } catch {
          // Fallback final
        }
      }
      Alert.alert('Chave de Recuperação', recoveryKey);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            Seus dados pessoais nunca serão visíveis para outros membros. Você é livre para ser você
            mesmo, com segurança.
          </Text>
        </View>

        {/* Card de Alto Destaque da Chave Mestra */}
        {recoveryKey ? (
          <View style={styles.recoveryCard}>
            <View style={styles.recoveryHeader}>
              <Text style={styles.recoveryIcon}>🔑</Text>
              <Text style={styles.recoveryTitle}>Chave Mestra de Recuperação</Text>
            </View>

            <View style={styles.keyContainer}>
              <Text style={styles.keyText} selectable>
                {recoveryKey}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.copyButton, hasCopied && styles.copyButtonActive]}
              onPress={handleCopyKey}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Copiar Chave Mestra"
            >
              <Text style={[styles.copyButtonText, hasCopied && styles.copyButtonTextActive]}>
                {hasCopied ? '✓ Copiado com Sucesso!' : 'Copiar Chave'}
              </Text>
            </TouchableOpacity>

            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>🛡️</Text>
              <Text style={styles.warningText}>
                Sua conta é 100% anônima e não possui e-mail vinculado. Guarde esta chave em local
                seguro. Se você esquecer sua senha, ela é a ÚNICA forma de recuperar seu acesso.
              </Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={acknowledgeIdentity}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Entrar no Âncora"
        >
          <Text style={styles.continueButtonText}>Entrar no Âncora</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, theme: 'dark' | 'light') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 48,
      maxWidth: 520,
      width: '100%',
      alignSelf: 'center',
      alignItems: 'center',
    },
    badgeContainer: {
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(15, 118, 110, 0.1)',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 16,
      marginBottom: 20,
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
      padding: 24,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      width: '100%',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    avatarIcon: {
      fontSize: 36,
    },
    pseudonym: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    personaBadge: {
      backgroundColor: theme === 'dark' ? colors.cardBorder : '#e2e8f0',
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 12,
      marginBottom: 16,
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
      marginBottom: 16,
    },
    privacyHeading: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    privacyMessage: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 20,
    },
    privacySubtext: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    recoveryCard: {
      width: '100%',
      padding: 20,
      borderRadius: 20,
      backgroundColor: theme === 'dark' ? '#131e32' : '#f0fdfa',
      borderWidth: 1.5,
      borderColor: colors.primary,
      marginBottom: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
    recoveryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 14,
    },
    recoveryIcon: {
      fontSize: 20,
    },
    recoveryTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme === 'dark' ? '#f8fafc' : '#0f172a',
    },
    keyContainer: {
      backgroundColor: theme === 'dark' ? '#0b1120' : '#ffffff',
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    keyText: {
      fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.5,
    },
    copyButton: {
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    copyButtonActive: {
      backgroundColor: '#10b981',
      borderColor: '#10b981',
    },
    copyButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    copyButtonTextActive: {
      color: '#ffffff',
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.12)',
      borderLeftWidth: 3,
      borderLeftColor: '#f59e0b',
      borderRadius: 8,
      padding: 12,
    },
    warningIcon: {
      fontSize: 16,
      marginTop: 2,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: theme === 'dark' ? '#fde68a' : '#b45309',
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

