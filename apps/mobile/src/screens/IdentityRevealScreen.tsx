import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const IdentityRevealScreen: React.FC = () => {
  const { profile, acknowledgeIdentity } = useAuth();

  const formattedPseudonym = profile?.pseudonym
    ? profile.pseudonym.startsWith('@')
      ? profile.pseudonym
      : `@${profile.pseudonym}`
    : '@Navegador_000';

  const personaLabel = profile?.persona === 'apoio' ? 'Ponto de Apoio' : 'Navegador';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1,
    borderColor: '#0d9488',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  badgeText: {
    color: '#2dd4bf',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderWidth: 2,
    borderColor: '#0d9488',
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
    color: '#f8fafc',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  personaBadge: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  personaBadgeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 20,
  },
  privacyHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d9488',
    marginBottom: 6,
  },
  privacyMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  privacySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#0d9488',
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
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
