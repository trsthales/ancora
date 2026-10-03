import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSOS } from '../contexts/SOSContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { CheckinCard } from '../components/CheckinCard';
import { ProgressCard } from '../components/ProgressCard';
import { AlternativesModal } from '../components/AlternativesModal';
import { journeyService, Checkin } from '../services/journey';

export const HomeScreen: React.FC = () => {
  const { profile, logout, deleteAccount } = useAuth();
  const { openSOS } = useSOS();
  const { theme, toggleTheme, colors } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Estados para Exclusão Definitiva de Conta (LGPD Art. 18, VI)
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados da Jornada Pessoal
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState<Checkin | null>(null);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [isLoadingJourney, setIsLoadingJourney] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Estado do Motor de Interceptação para fissura alta
  const [isAlternativesOpen, setIsAlternativesOpen] = useState(false);
  const [interceptedCravingLevel, setInterceptedCravingLevel] = useState(4);

  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  // Carrega status de check-in do dia e histórico de vitórias acumuladas
  useEffect(() => {
    let isMounted = true;

    async function loadJourneyData() {
      setIsLoadingJourney(true);
      try {
        const [todayRes, historyRes] = await Promise.all([
          journeyService.getTodayCheckin(),
          journeyService.getJourneyHistory(30),
        ]);

        if (isMounted) {
          setHasCheckedInToday(todayRes.hasCheckedInToday);
          setTodayCheckin(todayRes.checkin);
          setTotalCheckins(historyRes.totalCheckins);
          setSyncError(null);
        }
      } catch (err) {
        console.warn('[HomeScreen] Falha transitória ao sincronizar jornada:', err);
        if (isMounted) {
          setSyncError(
            'Não foi possível sincronizar sua jornada com o servidor no momento. Seus registros locais permanecem preservados.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingJourney(false);
        }
      }
    }

    loadJourneyData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckinSuccess = (newCheckin: Checkin) => {
    setTodayCheckin(newCheckin);
    setHasCheckedInToday(true);
    setTotalCheckins((prev) => (hasCheckedInToday ? prev : prev + 1));

    // Motor de Interceptação: dispara modal imediatamente se fissura >= 4
    if (newCheckin.cravingLevel >= 4) {
      setInterceptedCravingLevel(newCheckin.cravingLevel);
      setIsAlternativesOpen(true);
    }
  };

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

  const handleConfirmDelete = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      setIsDeleteModalVisible(false);
      Alert.alert(
        'Conta Excluída com Sucesso',
        'Conta e dados associados foram expurgados definitivamente em conformidade com o Art. 18, VI da LGPD.',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao expurgar a conta.';
      setDeleteError(msg);
      setIsDeletingAccount(false);
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

        {/* Notificação de Sincronização Transitória (VUL-017) */}
        {syncError && (
          <View style={styles.syncErrorBanner}>
            <Text style={styles.syncErrorIcon}>ℹ️</Text>
            <Text style={styles.syncErrorText}>{syncError}</Text>
          </View>
        )}

        {/* Card de Progresso Cumulativo Neutro (RFC 002) */}
        <ProgressCard totalCheckins={totalCheckins} isLoading={isLoadingJourney} />

        {/* Card de Check-in Diário */}
        <CheckinCard
          hasCheckedInToday={hasCheckedInToday}
          todayCheckin={todayCheckin}
          isLoadingInitial={isLoadingJourney}
          onCheckinSuccess={handleCheckinSuccess}
          onHighCravingIntercept={(level) => {
            setInterceptedCravingLevel(level);
            setIsAlternativesOpen(true);
          }}
        />

        {/* Card SOS Integrado (R03) */}
        <View style={styles.sosCard}>
          <View style={styles.sosCardTop}>
            <View style={styles.sosIconContainer}>
              <Text style={styles.sosCardIcon}>🛟</Text>
            </View>
            <View style={styles.sosCardHeaderTexts}>
              <Text style={styles.sosCardTitle}>Apoio Imediato • SOS</Text>
              <Text style={styles.sosCardSub}>Semáforo de Crise (Operação Local)</Text>
            </View>
          </View>
          <Text style={styles.sosCardBody}>
            Os exercícios de ancoragem e contatos de emergência deste Semáforo operam salvos
            localmente no seu aparelho.
          </Text>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => openSOS()}
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

        {/* Compromisso de Anonimato (Shoulder Surfing Protection) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Garantia de Anonimato</Text>
          <Text style={styles.cardText}>
            Sua conta está ativa e protegida. Nenhum identificador civil é compartilhado com a
            comunidade. Somente seu pseudônimo é visível.
          </Text>
        </View>

        {/* Seção Governança e Privacidade LGPD */}
        <View style={styles.governanceCard}>
          <View style={styles.governanceHeader}>
            <Text style={styles.governanceIcon}>⚖️</Text>
            <View style={styles.governanceTitles}>
              <Text style={styles.governanceTitle}>Governança e Direitos do Titular</Text>
              <Text style={styles.governanceSub}>LGPD • Lei nº 13.709/2018</Text>
            </View>
          </View>
          <Text style={styles.governanceBody}>
            Você tem total soberania sobre seus dados pessoais e de saúde. A qualquer momento, você pode
            exercer seu Direito ao Esquecimento e solicitar o expurgo completo e irreversível da sua conta.
          </Text>
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={() => {
              setDeleteStep(1);
              setDeleteError(null);
              setIsDeleteModalVisible(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Excluir Conta e Dados (LGPD Art. 18)"
          >
            <Text style={styles.deleteAccountButtonText}>
              🗑️ Excluir Conta e Dados (LGPD Art. 18)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Motor de Interceptação: Alternativas para este Momento */}
      <AlternativesModal
        visible={isAlternativesOpen}
        onClose={() => setIsAlternativesOpen(false)}
        cravingLevel={interceptedCravingLevel}
      />

      {/* Modal de Confirmação em 2 Etapas de Exclusão Definitiva (LGPD Art. 18, VI) */}
      <Modal
        visible={isDeleteModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!isDeletingAccount) {
            setIsDeleteModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            {deleteStep === 1 ? (
              <>
                <View style={styles.deleteModalHeader}>
                  <View style={styles.warningIconBadge}>
                    <Text style={styles.warningIconText}>⚠️</Text>
                  </View>
                  <Text style={styles.deleteModalTitle}>Excluir Conta e Dados</Text>
                  <Text style={styles.deleteModalSubtitle}>LGPD Art. 18, VI • Etapa 1 de 2</Text>
                </View>

                <View style={styles.warningBox}>
                  <Text style={styles.warningBoxTitle}>Aviso de Irreversibilidade</Text>
                  <Text style={styles.warningBoxText}>
                    Esta ação é definitiva. Todos os seus check-ins, dias acumulados e chaves de acesso serão expurgados imediatamente dos nossos servidores.
                  </Text>
                </View>

                <View style={styles.impactList}>
                  <Text style={styles.impactItem}>❌ Seus registros de fissura e humor serão apagados permanentemente.</Text>
                  <Text style={styles.impactItem}>❌ Seu pseudônimo e perfil serão deletados sem chance de restauração.</Text>
                  <Text style={styles.impactItem}>❌ Todas as sessões e consentimentos serão revogados e destruídos.</Text>
                </View>

                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={() => setDeleteStep(2)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.proceedButtonText}>Compreendo, prosseguir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelModalButton}
                    onPress={() => setIsDeleteModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelModalButtonText}>Cancelar e Manter Conta</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.deleteModalHeader}>
                  <View style={[styles.warningIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Text style={styles.warningIconText}>🛑</Text>
                  </View>
                  <Text style={[styles.deleteModalTitle, { color: '#ef4444' }]}>Confirmação Definitiva</Text>
                  <Text style={styles.deleteModalSubtitle}>LGPD Art. 18, VI • Etapa 2 de 2</Text>
                </View>

                {deleteError && (
                  <View style={styles.deleteErrorBox}>
                    <Text style={styles.deleteErrorText}>{deleteError}</Text>
                  </View>
                )}

                <Text style={styles.confirmPromptText}>
                  Tem certeza absoluta de que deseja expurgar definitivamente todos os seus dados agora? Não será possível recuperar nenhum histórico.
                </Text>

                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={[styles.confirmDeleteButton, isDeletingAccount && styles.buttonDisabled]}
                    onPress={handleConfirmDelete}
                    disabled={isDeletingAccount}
                    activeOpacity={0.85}
                  >
                    {isDeletingAccount ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.confirmDeleteButtonText}>
                        Sim, Excluir Definitivamente
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelModalButton}
                    onPress={() => {
                      if (!isDeletingAccount) {
                        setDeleteStep(1);
                      }
                    }}
                    disabled={isDeletingAccount}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelModalButtonText}>Voltar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    syncErrorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.12)',
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.4)',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    syncErrorIcon: {
      fontSize: 16,
    },
    syncErrorText: {
      flex: 1,
      fontSize: 12,
      color: theme === 'dark' ? '#fde68a' : '#92400e',
      lineHeight: 17,
    },
    governanceCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 12,
      marginTop: 8,
      marginBottom: 16,
    },
    governanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    governanceIcon: {
      fontSize: 22,
    },
    governanceTitles: {
      flex: 1,
      gap: 2,
    },
    governanceTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    governanceSub: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500',
    },
    governanceBody: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
    },
    deleteAccountButton: {
      backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(239, 68, 68, 0.6)',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 4,
    },
    deleteAccountButtonText: {
      color: '#ef4444',
      fontSize: 14,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    deleteModalContainer: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 24,
      width: '100%',
      maxWidth: 480,
      borderWidth: 1.5,
      borderColor: '#ef4444',
      gap: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
    deleteModalHeader: {
      alignItems: 'center',
      gap: 6,
    },
    warningIconBadge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    warningIconText: {
      fontSize: 26,
    },
    deleteModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    deleteModalSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      textAlign: 'center',
    },
    warningBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: '#ef4444',
      borderRadius: 10,
      padding: 14,
      gap: 6,
    },
    warningBoxTitle: {
      color: '#ef4444',
      fontSize: 13,
      fontWeight: '700',
    },
    warningBoxText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 19,
    },
    impactList: {
      gap: 8,
      paddingVertical: 4,
    },
    impactItem: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    confirmPromptText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 21,
      textAlign: 'center',
      paddingVertical: 8,
    },
    deleteErrorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderRadius: 8,
      padding: 10,
    },
    deleteErrorText: {
      color: '#ef4444',
      fontSize: 13,
      textAlign: 'center',
    },
    modalActionButtons: {
      gap: 10,
      marginTop: 8,
    },
    proceedButton: {
      backgroundColor: '#ef4444',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    proceedButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
    confirmDeleteButton: {
      backgroundColor: '#dc2626',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    confirmDeleteButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    cancelModalButton: {
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cancelModalButtonText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
  });
