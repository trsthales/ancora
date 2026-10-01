import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  StatusBar,
} from 'react-native';
import { useSOS } from '../contexts/SOSContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

interface AlternativesModalProps {
  visible: boolean;
  onClose: () => void;
  cravingLevel?: number;
}

export const AlternativesModal: React.FC<AlternativesModalProps> = ({
  visible,
  onClose,
  cravingLevel = 4,
}) => {
  const { openSOS } = useSOS();
  const { theme, colors } = useTheme();

  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const handleStartBreathing = () => {
    onClose();
    openSOS('breathing');
  };

  const handleStartGrounding = () => {
    onClose();
    openSOS('grounding');
  };

  const handleOpenSOSDashboard = () => {
    onClose();
    openSOS('dashboard');
  };

  const callPhone = (number: string, serviceName: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      alert(`Para suporte imediato (${serviceName}), ligue diretamente para o número ${number}.`);
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Topo do Modal */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              Nível {cravingLevel} • Atenção Acolhedora
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeHeaderButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Fechar modal de alternativas"
          >
            <Text style={styles.closeHeaderButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cabeçalho Acolhedor */}
          <View style={styles.heroSection}>
            <Text style={styles.heroIcon}>⚓</Text>
            <Text style={styles.title}>Você está atravessando um momento difícil.</Text>
            <Text style={styles.subtitle}>
              O que você consegue fazer nos próximos 15 minutos?
            </Text>
            <Text style={styles.supportText}>
              A fissura funciona em ondas: o ápice dura poucos minutos e depois perde força. Não precisa decidir pelo dia todo, apenas pelo momento presente.
            </Text>
          </View>

          {/* Ação 1: Ancoragem Rápida */}
          <View style={[styles.card, styles.groundingCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={styles.cardIcon}>🟢</Text>
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text style={styles.actionTag}>Ação Imediata 1</Text>
                <Text style={styles.cardTitle}>Ancoragem Rápida</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>
              Exercícios guiados para desacelerar seus batimentos e devolver o controle ao seu corpo agora.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.breathingBtn]}
                onPress={handleStartBreathing}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>🌬️ Respiração 4-7-8</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.groundingBtn]}
                onPress={handleStartGrounding}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>🖐️ Ancoragem 5-4-3-2-1</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ação 2: Pausa Ativa de 15 Minutos */}
          <View style={[styles.card, styles.pauseCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={styles.cardIcon}>🟡</Text>
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text style={styles.actionTag}>Ação Imediata 2</Text>
                <Text style={styles.cardTitle}>Pausa Ativa de 15 Minutos</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>
              Mudar o estímulo físico ajuda o cérebro a interromper o circuito da urgência:
            </Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>💧</Text>
                <Text style={styles.tipText}>
                  <Text style={styles.tipBold}>Beba um copo grande de água gelada</Text> devagar, prestando atenção na temperatura.
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>🚿</Text>
                <Text style={styles.tipText}>
                  <Text style={styles.tipBold}>Lave o rosto com água fria</Text> para ativar a resposta parassimpática imediata.
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>🚶</Text>
                <Text style={styles.tipText}>
                  <Text style={styles.tipBold}>Mude de ambiente ou caminhe</Text> até a janela para trocar o ar e a perspectiva.
                </Text>
              </View>
            </View>
          </View>

          {/* Ação 3: Suporte Humano & SOS */}
          <View style={[styles.card, styles.sosCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={styles.cardIcon}>🆘</Text>
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text style={styles.actionTag}>Ação Imediata 3</Text>
                <Text style={styles.cardTitle}>Acionar Semáforo SOS & Suporte</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>
              Você não precisa passar por isso sem companhia. Há suporte humano e gratuito disponível 24h:
            </Text>
            <View style={styles.emergencyRow}>
              <TouchableOpacity
                style={styles.sosActionBtn}
                onPress={() => callPhone('188', 'CVV')}
                activeOpacity={0.8}
              >
                <Text style={styles.sosActionBtnIcon}>📞</Text>
                <Text style={styles.sosActionBtnTitle}>CVV 188</Text>
                <Text style={styles.sosActionBtnSub}>Apoio emocional 24h</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sosActionBtn}
                onPress={() => callPhone('192', 'SAMU')}
                activeOpacity={0.8}
              >
                <Text style={styles.sosActionBtnIcon}>🚑</Text>
                <Text style={styles.sosActionBtnTitle}>SAMU 192</Text>
                <Text style={styles.sosActionBtnSub}>Emergência médica</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.fullSosBtn}
              onPress={handleOpenSOSDashboard}
              activeOpacity={0.85}
            >
              <Text style={styles.fullSosBtnText}>Abrir Painel SOS Completo (Offline)</Text>
            </TouchableOpacity>
          </View>

          {/* Botão de Fechamento Sereno */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onClose}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Estou pronto para tentar uma ação"
          >
            <Text style={styles.dismissButtonText}>Estou pronto para tentar uma ação</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, theme: 'dark' | 'light') =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    badgeContainer: {
      backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.35)',
    },
    badgeText: {
      color: theme === 'dark' ? '#fca5a5' : '#dc2626',
      fontSize: 12,
      fontWeight: '700',
    },
    closeHeaderButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeHeaderButtonText: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      padding: 20,
      gap: 16,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    heroSection: {
      alignItems: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    heroIcon: {
      fontSize: 36,
      marginBottom: 4,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 28,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      lineHeight: 22,
    },
    supportText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
      marginTop: 4,
      paddingHorizontal: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 12,
    },
    groundingCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#10b981',
    },
    pauseCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#f59e0b',
    },
    sosCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIcon: {
      fontSize: 18,
    },
    cardHeaderTextGroup: {
      flex: 1,
      gap: 2,
    },
    actionTag: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    cardDescription: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    primaryActionBtn: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    breathingBtn: {
      backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
      borderWidth: 1,
      borderColor: '#10b981',
    },
    groundingBtn: {
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    primaryActionBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    tipsList: {
      gap: 8,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      padding: 12,
      borderRadius: 10,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    tipBullet: {
      fontSize: 14,
      marginTop: 1,
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    tipBold: {
      color: colors.text,
      fontWeight: '600',
    },
    emergencyRow: {
      flexDirection: 'row',
      gap: 10,
    },
    sosActionBtn: {
      flex: 1,
      backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.35)',
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
      gap: 2,
    },
    sosActionBtnIcon: {
      fontSize: 20,
    },
    sosActionBtnTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme === 'dark' ? '#fca5a5' : '#dc2626',
    },
    sosActionBtnSub: {
      fontSize: 11,
      color: colors.textMuted,
    },
    fullSosBtn: {
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
    },
    fullSosBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    dismissButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 20,
    },
    dismissButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
  });
