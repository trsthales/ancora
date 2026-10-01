import React, { useState } from 'react';
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

export const HomeScreen: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const formattedPseudonym = profile?.pseudonym
    ? profile.pseudonym.startsWith('@')
      ? profile.pseudonym
      : `@${profile.pseudonym}`
    : '@Navegador';

  const personaLabel =
    profile?.persona === 'apoio' ? 'Ponto de Apoio' : 'Navegador';

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
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

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

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sair / Logout"
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#94a3b8" />
          ) : (
            <Text style={styles.logoutButtonText}>Sair</Text>
          )}
        </TouchableOpacity>
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

        {/* Informações da Trilha */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sua Trilha no Âncora</Text>
          <Text style={styles.cardText}>
            Como <Text style={styles.highlightText}>{personaLabel}</Text>, você faz parte de um ecossistema construído para oferecer firmeza, escuta ativa e acolhimento nos momentos mais delicados.
          </Text>
        </View>

        {/* Compromisso de Anonimato */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Garantia de Anonimato</Text>
          <Text style={styles.cardText}>
            Nenhuma informação pessoal como e-mail ({user?.email}) ou identificadores reais é compartilhada com outros participantes. Somente seu pseudônimo <Text style={styles.highlightText}>{formattedPseudonym}</Text> é visível.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderWidth: 1.5,
    borderColor: '#0d9488',
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
    color: '#f8fafc',
  },
  badge: {
    backgroundColor: '#334155',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#0d9488',
    fontSize: 11,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  logoutButtonText: {
    color: '#94a3b8',
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
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  cardSubheading: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
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
    color: '#2dd4bf',
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  cardText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
  },
  highlightText: {
    color: '#0d9488',
    fontWeight: '600',
  },
});
