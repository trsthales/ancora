import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import type { Persona } from '../types/auth';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToWelcome: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onNavigateToWelcome,
}) => {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState<Persona>('navegador');
  const [isAdult, setIsAdult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPasswordValid = password.length >= 8;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = isAdult && isPasswordValid && isEmailValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await register(email.trim(), password, isAdult, persona);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível completar o cadastro.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onNavigateToWelcome}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Text style={styles.backButtonText}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Começar Jornada</Text>
            <Text style={styles.subtitle}>
              Crie seu acesso seguro. Sua identidade real nunca será revelada a outros membros.
            </Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Campo E-mail */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail confidencial</Text>
              <TextInput
                style={styles.input}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
              <Text style={styles.helperText}>Usado estritamente para login e recuperação.</Text>
            </View>

            {/* Campo Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha de proteção</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo de 8 caracteres"
                placeholderTextColor="#64748b"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              {password.length > 0 && !isPasswordValid && (
                <Text style={styles.warningText}>A senha precisa ter no mínimo 8 caracteres.</Text>
              )}
            </View>

            {/* Seletor de Trilha (Persona) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Escolha sua trilha inicial</Text>
              <View style={styles.personaContainer}>
                <TouchableOpacity
                  style={[
                    styles.personaCard,
                    persona === 'navegador' && styles.personaCardSelected,
                  ]}
                  onPress={() => setPersona('navegador')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.personaIcon}>🧭</Text>
                  <Text
                    style={[
                      styles.personaTitle,
                      persona === 'navegador' && styles.personaTitleSelected,
                    ]}
                  >
                    Navegador
                  </Text>
                  <Text style={styles.personaDesc}>
                    Buscando suporte, acolhimento e trilhas de superação.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.personaCard, persona === 'apoio' && styles.personaCardSelected]}
                  onPress={() => setPersona('apoio')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.personaIcon}>🤝</Text>
                  <Text
                    style={[
                      styles.personaTitle,
                      persona === 'apoio' && styles.personaTitleSelected,
                    ]}
                  >
                    Ponto de Apoio
                  </Text>
                  <Text style={styles.personaDesc}>
                    Disposto a oferecer escuta solidária e apoio fraterno.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Trava Obrigatória 18+ */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsAdult(!isAdult)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAdult }}
            >
              <View style={[styles.checkbox, isAdult && styles.checkboxChecked]}>
                {isAdult && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Declaro que tenho 18 anos ou mais e aceito os termos de apoio mútuo.
              </Text>
            </TouchableOpacity>

            {/* Botão de Envio */}
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#f8fafc" />
              ) : (
                <Text
                  style={[styles.submitButtonText, !canSubmit && styles.submitButtonTextDisabled]}
                >
                  Criar Conta Segura
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Já possui uma conta?</Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.footerLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#0d9488',
    fontSize: 15,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 15,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
  },
  warningText: {
    fontSize: 12,
    color: '#f87171',
  },
  personaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  personaCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  personaCardSelected: {
    borderColor: '#0d9488',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
  personaIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  personaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  personaTitleSelected: {
    color: '#0d9488',
  },
  personaDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  checkmark: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#0d9488',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  submitButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#64748b',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  footerLink: {
    color: '#0d9488',
    fontSize: 14,
    fontWeight: '600',
  },
});
