import React, { useState, useMemo } from 'react';
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
  StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { TermsModal } from '../components/TermsModal';
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
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState<Persona>('navegador');
  const [isAdult, setIsAdult] = useState(false);
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPasswordValid = password.length >= 8;
  const canSubmit = isAdult && healthDataConsent && isPasswordValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await register(password, isAdult, persona, healthDataConsent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível completar o cadastro.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
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

            {/* Campo Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha de proteção</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo de 8 caracteres"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              {password.length > 0 && !isPasswordValid && (
                <Text style={styles.warningText}>A senha precisa ter no mínimo 8 caracteres.</Text>
              )}
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

            {/* Consentimento Específico para Dados de Saúde (Art. 11 LGPD) */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setHealthDataConsent(!healthDataConsent)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: healthDataConsent }}
            >
              <View style={[styles.checkbox, healthDataConsent && styles.checkboxChecked]}>
                {healthDataConsent && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Concordo com o tratamento dos meus registros de recuperação e saúde exclusivamente para o suporte comunitário e proteção deste aplicativo (Art. 11 da LGPD).
              </Text>
            </TouchableOpacity>

            {/* Link para visualização dos Termos v2026.1 */}
            <TouchableOpacity
              style={styles.termsLinkContainer}
              onPress={() => setIsTermsModalOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Ver Termos e Política de Privacidade (v2026.1)"
            >
              <Text style={styles.termsLinkText}>
                📄 Ver Termos e Política de Privacidade (v2026.1)
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
                <ActivityIndicator color={colors.primaryText} />
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

      {/* Modal com Síntese dos Termos e Política de Privacidade v2026.1 */}
      <TermsModal
        visible={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, theme: 'dark' | 'light') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.primary,
      fontSize: 15,
      fontWeight: '500',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
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
      color: theme === 'dark' ? '#fca5a5' : '#b91c1c',
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
      color: colors.text,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
    },
    helperText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    warningText: {
      fontSize: 12,
      color: '#ef4444',
    },
    personaContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    personaCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
    },
    personaCardSelected: {
      borderColor: colors.primary,
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(15, 118, 110, 0.08)',
    },
    personaIcon: {
      fontSize: 26,
      marginBottom: 6,
    },
    personaTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 4,
    },
    personaTitleSelected: {
      color: colors.primary,
    },
    personaDesc: {
      fontSize: 11,
      color: colors.textMuted,
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
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkmark: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '700',
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    termsLinkContainer: {
      alignSelf: 'flex-start',
      paddingVertical: 2,
      paddingHorizontal: 2,
      marginTop: -8,
      marginBottom: 2,
    },
    termsLinkText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    submitButtonDisabled: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    submitButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    submitButtonTextDisabled: {
      color: colors.textMuted,
    },
    footerLinkContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 14,
    },
    footerLink: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
