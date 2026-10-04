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
import { RecoverAccountModal } from './RecoverAccountModal';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToWelcome: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onNavigateToWelcome,
}) => {
  const { login } = useAuth();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecoverModalVisible, setIsRecoverModalVisible] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(identifier.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Credenciais inválidas ou erro ao conectar.';
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
            <Text style={styles.title}>Entrar no Âncora</Text>
            <Text style={styles.subtitle}>Bem-vindo de volta ao seu porto seguro.</Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Campo Pseudônimo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Seu Pseudônimo</Text>
              <TextInput
                style={styles.input}
                placeholder="@FarolLivre_836"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            {/* Campo Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Sua senha secreta"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>

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
                  Entrar
                </Text>
              )}
            </TouchableOpacity>

            {/* Link para Recuperação por Chave Mestra */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => setIsRecoverModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.forgotPasswordText}>
                Esqueceu a senha?{' '}
                <Text style={styles.forgotPasswordHighlight}>Recuperar com Chave Mestra</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Ainda não possui conta?</Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.footerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <RecoverAccountModal
        visible={isRecoverModalVisible}
        onClose={() => setIsRecoverModalVisible(false)}
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
      marginBottom: 28,
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
      marginTop: 16,
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
    forgotPasswordButton: {
      alignItems: 'center',
      paddingVertical: 10,
      marginTop: 4,
    },
    forgotPasswordText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    forgotPasswordHighlight: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
