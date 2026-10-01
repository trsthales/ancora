import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSOS } from '../contexts/SOSContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { SOSFloatingButton } from '../components/SOSFloatingButton';

export const HomeScreen: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const { openSOS } = useSOS();
  const { theme, toggleTheme, colors } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const formattedPseudonym = profile?.pseudonym
    ? profile.pseudonym.startsWith('@')
      ? profile.pseudonym
      : `@${profile.pseudonym}`
    : '@Navegador';

  const personaLabel = profile?.persona === 'apoio' ? 'Ponto de Apoio' : 'Navegador';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />

      {/* Cabeçalho Autenticado */}
      <View style={styles.header}>
        <View style={styles.userProfileGroup}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>⚓</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.pseudonym}>{formattedPseudonym}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{personaLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.themeToggleButton}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'
            }
          >
            <Text style={styles.themeToggleIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sair / Logout"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={colors.textMuted} />
            ) : (
              <Text style={styles.logoutButtonText}>Sair</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card Principal - Boas-Vindas */}
        <View style={styles.welcomeCard}>
          <Text style={styles.cardHeading}>Porto Seguro</Text>
          <Text style={styles.cardSubheading}>
            Você está conectado a uma rede protegida e anônima.
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Identidade protegida e criptografada</Text>
          </View>
        </View>

        {/* Card SOS Integrado */}
        <View style={styles.sosCard}>
          <View style={styles.sosCardTop}>
            <View style={styles.sosIconContainer}>
              <Text style={styles.sosCardIcon}>🛟</Text>
            </View>
            <View style={styles.sosCardHeaderTexts}>
              <Text style={styles.sosCardTitle}>Apoio Imediato • SOS</Text>
              <Text style={styles.sosCardSub}>Semáforo de Crise 100% Offline</Text>
            </View>
          </View>
          <Text style={styles.sosCardBody}>
            Em momentos de fissura, ansiedade intensa ou urgência emocional, utilize nossos
            exercícios guiados e contatos de socorro.
          </Text>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={openSOS}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Acionar Protocolo SOS"
          >
            <Text style={styles.sosButtonText}>Acionar Protocolo SOS ( 🟢 🟡 🔴 )</Text>
          </TouchableOpacity>
        </View>

        {/* Informações da Trilha */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sua Trilha no Âncora</Text>
          <Text style={styles.cardText}>
            Como <Text style={styles.highlightText}>{personaLabel}</Text>, você faz parte de um
            ecossistema construído para oferecer firmeza, escuta ativa e acolhimento nos momentos
            mais delicados.
          </Text>
        </View>

        {/* Compromisso de Anonimato */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Garantia de Anonimato</Text>
          <Text style={styles.cardText}>
            Nenhuma informação pessoal como e-mail ({user?.email}) ou identificadores reais é
            compartilhada com outros participantes. Somente seu pseudônimo{' '}
            <Text style={styles.highlightText}>{formattedPseudonym}</Text> é visível.
          </Text>
        </View>
      </ScrollView>

      {/* Botão Flutuante SOS permanente */}
      <SOSFloatingButton onPress={openSOS} />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, theme: 'dark' | 'light') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    userProfileGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 22,
    },
    userInfo: {
      gap: 2,
    },
    pseudonym: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    badge: {
      backgroundColor: theme === 'dark' ? colors.cardBorder : '#e2e8f0',
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    badgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '600',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeToggleButton: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeToggleIcon: {
      fontSize: 16,
    },
    logoutButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    },
    logoutButtonText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    content: {
      padding: 20,
      gap: 16,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    welcomeCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 8,
    },
    cardHeading: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    cardSubheading: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.1)' : 'rgba(15, 118, 110, 0.08)',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10b981',
    },
    statusText: {
      color: theme === 'dark' ? '#2dd4bf' : colors.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    cardText: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 22,
    },
    highlightText: {
      color: colors.primary,
      fontWeight: '600',
    },
    sosCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1.5,
      borderColor: '#ef4444',
      gap: 12,
    },
    sosCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    sosIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sosCardIcon: {
      fontSize: 22,
    },
    sosCardHeaderTexts: {
      flex: 1,
      gap: 2,
    },
    sosCardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    sosCardSub: {
      fontSize: 12,
      color: '#f87171',
      fontWeight: '600',
    },
    sosCardBody: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
    },
    sosButton: {
      backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1.5,
      borderColor: '#ef4444',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 4,
    },
    sosButtonText: {
      color: theme === 'dark' ? '#ffffff' : '#dc2626',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
