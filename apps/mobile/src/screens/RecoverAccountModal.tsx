import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

interface RecoverAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RecoverAccountModal: React.FC<RecoverAccountModalProps> = ({ visible, onClose }) => {
  const { recoverAccount } = useAuth();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const [pseudonym, setPseudonym] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado da chave rotacionada obtida com sucesso
  const [newRotatedKey, setNewRotatedKey] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const isFormValid =
    pseudonym.trim().length > 0 &&
    recoveryKey.trim().length > 0 &&
    newPassword.length >= 8 &&
    !isSubmitting;

  const handleResetAndClose = () => {
    setPseudonym('');
    setRecoveryKey('');
    setNewPassword('');
    setErrorMessage(null);
    setNewRotatedKey(null);
    setHasCopied(false);
    onClose();
  };

  const handleRecover = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formattedPseudonym = pseudonym.trim();
      const formattedKey = recoveryKey.trim();

      const rotatedKey = await recoverAccount(formattedPseudonym, formattedKey, newPassword);
      setNewRotatedKey(rotatedKey);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao recuperar conta. Verifique os dados.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyNewKey = async () => {
    if (!newRotatedKey) return;

    try {
      if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
        await Clipboard.setStringAsync(newRotatedKey);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(newRotatedKey);
      }
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(newRotatedKey);
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 2500);
          return;
        } catch {
          // Fallback
        }
      }
      Alert.alert('Nova Chave de Recuperação', newRotatedKey);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleResetAndClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalCard}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {!newRotatedKey ? (
                // FASE 1: Formulário de Recuperação
                <>
                  <View style={styles.header}>
                    <Text style={styles.headerIcon}>🔐</Text>
                    <Text style={styles.headerTitle}>Recuperar Acesso</Text>
                    <Text style={styles.headerSubtitle}>
                      Insira seu pseudônimo, sua Chave Mestra e defina uma nova senha para restabelecer
                      sua conta anônima.
                    </Text>
                  </View>

                  {errorMessage && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  )}

                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Seu Pseudônimo</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="@FarolLivre_836"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={pseudonym}
                        onChangeText={setPseudonym}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Chave Mestra de Recuperação</Text>
                      <TextInput
                        style={[styles.input, styles.monoInput]}
                        placeholder="ANCORA-XXXX-XXXX-XXXX"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        value={recoveryKey}
                        onChangeText={setRecoveryKey}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Nova Senha de Proteção</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Mínimo de 8 caracteres"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        autoCapitalize="none"
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      {newPassword.length > 0 && newPassword.length < 8 && (
                        <Text style={styles.warningHint}>
                          A nova senha deve ter no mínimo 8 caracteres.
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
                      onPress={handleRecover}
                      disabled={!isFormValid}
                      activeOpacity={0.8}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color={colors.primaryText} />
                      ) : (
                        <Text
                          style={[
                            styles.submitButtonText,
                            !isFormValid && styles.submitButtonTextDisabled,
                          ]}
                        >
                          Redefinir Senha e Entrar
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleResetAndClose}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // FASE 2: Exibição da Nova Chave Rotacionada
                <View style={styles.successPhase}>
                  <View style={styles.successBadge}>
                    <Text style={styles.successBadgeText}>Senha Redefinida com Sucesso</Text>
                  </View>

                  <Text style={styles.successTitle}>Sua Nova Chave Mestra</Text>
                  <Text style={styles.successDesc}>
                    Por motivos de segurança, a sua chave anterior foi invalidada. Salve a sua nova
                    chave agora mesmo.
                  </Text>

                  <View style={styles.newKeyCard}>
                    <View style={styles.keyContainer}>
                      <Text style={styles.keyText} selectable>
                        {newRotatedKey}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.copyButton, hasCopied && styles.copyButtonActive]}
                      onPress={handleCopyNewKey}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.copyButtonText, hasCopied && styles.copyButtonTextActive]}
                      >
                        {hasCopied ? '✓ Chave Copiada!' : 'Copiar Nova Chave'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.warningBox}>
                      <Text style={styles.warningIcon}>🛡️</Text>
                      <Text style={styles.warningText}>
                        Guarde esta chave em local seguro. Sem ela e sem e-mail cadastrado, não é
                        possível recuperar seu acesso futuro.
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleResetAndClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.submitButtonText}>Acessar Minha Conta</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, theme: 'dark' | 'light') =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    keyboardContainer: {
      width: '100%',
      maxWidth: 480,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
      maxHeight: '90%',
    },
    scrollContent: {
      paddingBottom: 8,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    headerIcon: {
      fontSize: 36,
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    errorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderWidth: 1,
      borderColor: '#ef4444',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      color: theme === 'dark' ? '#fca5a5' : '#b91c1c',
      fontSize: 13,
      lineHeight: 18,
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    input: {
      backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 14,
    },
    monoInput: {
      fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
      letterSpacing: 1,
    },
    warningHint: {
      fontSize: 12,
      color: '#ef4444',
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    submitButtonDisabled: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    submitButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '600',
    },
    submitButtonTextDisabled: {
      color: colors.textMuted,
    },
    cancelButton: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
    },
    successPhase: {
      alignItems: 'center',
    },
    successBadge: {
      backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
      borderWidth: 1,
      borderColor: '#10b981',
      borderRadius: 20,
      paddingVertical: 5,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    successBadgeText: {
      color: '#10b981',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    successTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    successDesc: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
    },
    newKeyCard: {
      width: '100%',
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme === 'dark' ? '#131e32' : '#f0fdfa',
      borderWidth: 1.5,
      borderColor: colors.primary,
      marginBottom: 20,
    },
    keyContainer: {
      backgroundColor: theme === 'dark' ? '#0b1120' : '#ffffff',
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    keyText: {
      fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.2,
    },
    copyButton: {
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      marginBottom: 12,
    },
    copyButtonActive: {
      backgroundColor: '#10b981',
      borderColor: '#10b981',
    },
    copyButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    copyButtonTextActive: {
      color: '#ffffff',
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.12)',
      borderLeftWidth: 3,
      borderLeftColor: '#f59e0b',
      borderRadius: 8,
      padding: 10,
    },
    warningIcon: {
      fontSize: 15,
      marginTop: 2,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      color: theme === 'dark' ? '#fde68a' : '#b45309',
    },
  });
