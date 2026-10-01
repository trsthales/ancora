import React, { useState } from 'react';
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
import { BreathingScreen } from './BreathingScreen';
import { GroundingScreen } from './GroundingScreen';
import { CapsInfoModal } from './CapsInfoModal';

type SOSViewMode = 'dashboard' | 'breathing' | 'grounding' | 'caps';

interface SOSDashboardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SOSDashboardModal: React.FC<SOSDashboardModalProps> = ({ visible, onClose }) => {
  const [viewMode, setViewMode] = useState<SOSViewMode>('dashboard');

  const handleClose = () => {
    setViewMode('dashboard');
    onClose();
  };

  const callPhone = (number: string, serviceName: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      // Fallback amigável caso esteja rodando no navegador desktop sem discador nativo
      alert(
        `Para discagem de emergência ou apoio (${serviceName}), ligue diretamente para o número ${number}.`,
      );
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {viewMode === 'breathing' && <BreathingScreen onBack={() => setViewMode('dashboard')} />}

      {viewMode === 'grounding' && <GroundingScreen onBack={() => setViewMode('dashboard')} />}

      {viewMode === 'caps' && <CapsInfoModal onClose={() => setViewMode('dashboard')} />}

      {viewMode === 'dashboard' && (
        <SafeAreaView style={styles.safeArea}>
          {/* Cabeçalho do SOS */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.pulseDot} />
              <Text style={styles.headerTitle}>SOS • Semáforo de Apoio</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Fechar painel de emergência SOS"
            >
              <Text style={styles.closeButtonText}>✕ Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Mensagem Acolhedora Inicial */}
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeTitle}>Você está em um porto seguro.</Text>
              <Text style={styles.welcomeSubtitle}>
                Não há julgamentos aqui. Escolha abaixo a intensidade do que você está sentindo para
                receber o apoio adequado agora mesmo:
              </Text>
            </View>

            {/* 🟢 NÍVEL 1: AUTOCUIDADO (Fissura Leve/Moderada) */}
            <View style={[styles.levelCard, styles.level1Border]}>
              <View style={styles.levelHeader}>
                <View style={[styles.levelBadge, styles.level1Badge]}>
                  <Text style={styles.levelBadgeText}>🟢 NÍVEL 1</Text>
                </View>
                <Text style={styles.levelSubtitle}>AUTOCUIDADO</Text>
              </View>

              <Text style={styles.levelName}>Fissura Leve ou Ansiedade</Text>
              <Text style={styles.levelDesc}>
                Técnicas sensoriais e respiratórias para recuperar a calma e quebrar o ciclo
                automático do impulso.
              </Text>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.level1Button]}
                  onPress={() => setViewMode('breathing')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir exercício de respiração 4-7-8"
                >
                  <Text style={styles.actionIcon}>🫁</Text>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionTitle}>Respiração Guiada 4-7-8</Text>
                    <Text style={styles.actionDescription}>
                      Regulação do ritmo cardíaco em 3 tempos
                    </Text>
                  </View>
                  <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.level1Button]}
                  onPress={() => setViewMode('grounding')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir exercício de ancoragem sensorial 5-4-3-2-1"
                >
                  <Text style={styles.actionIcon}>⚓</Text>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionTitle}>Ancoragem Sensorial 5-4-3-2-1</Text>
                    <Text style={styles.actionDescription}>
                      Reconecte a atenção com os 5 sentidos no presente
                    </Text>
                  </View>
                  <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 🟡 NÍVEL 2: SUPORTE HUMANO (Sofrimento Emocional Agudo) */}
            <View style={[styles.levelCard, styles.level2Border]}>
              <View style={styles.levelHeader}>
                <View style={[styles.levelBadge, styles.level2Badge]}>
                  <Text style={styles.levelBadgeText}>🟡 NÍVEL 2</Text>
                </View>
                <Text style={styles.levelSubtitle}>SUPORTE HUMANO</Text>
              </View>

              <Text style={styles.levelName}>Sofrimento Emocional Agudo</Text>
              <Text style={styles.levelDesc}>
                Quando a dor psicológica parecer pesada demais para atravessar sozinho. Alguém está
                pronto para te ouvir agora.
              </Text>

              <TouchableOpacity
                style={[styles.actionButton, styles.level2Button]}
                onPress={() => callPhone('188', 'Centro de Valorização da Vida')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ligar gratuitamente para o CVV 188"
              >
                <Text style={styles.actionIcon}>📞</Text>
                <View style={styles.actionTextGroup}>
                  <Text style={styles.actionTitleHighlight}>Ligar para o CVV (188)</Text>
                  <Text style={styles.actionDescriptionHighlight}>
                    Apoio emocional confidencial, gratuito e 24 horas por dia
                  </Text>
                </View>
                <Text style={styles.phoneBadge}>DISCAR 188</Text>
              </TouchableOpacity>

              {/* Aviso obrigatório de apoio emocional sem caráter médico */}
              <View style={styles.level2Disclaimer}>
                <Text style={styles.disclaimerIcon}>ℹ️</Text>
                <Text style={styles.disclaimerText}>
                  <Text style={styles.disclaimerBold}>Aviso de Cuidado:</Text> O 188 é um canal
                  gratuito de apoio emocional e escuta compassiva gerido pelo CVV. Não se trata de
                  emergência médica ou hospitalar.
                </Text>
              </View>
            </View>

            {/* 🔴 NÍVEL 3: EMERGÊNCIA MÉDICA (Risco Físico / Suspeita de Overdose) */}
            <View style={[styles.levelCard, styles.level3Border]}>
              <View style={styles.levelHeader}>
                <View style={[styles.levelBadge, styles.level3Badge]}>
                  <Text style={styles.levelBadgeText}>🔴 NÍVEL 3</Text>
                </View>
                <Text style={styles.levelSubtitle}>EMERGÊNCIA MÉDICA</Text>
              </View>

              <Text style={styles.levelName}>Risco Físico ou Intoxicação Severa</Text>
              <Text style={styles.levelDesc}>
                Em caso de perda de consciência, confusão extrema, convulsões ou suspeita de
                overdose, cada minuto é decisivo.
              </Text>

              <TouchableOpacity
                style={[styles.actionButton, styles.level3Button]}
                onPress={() => callPhone('192', 'SAMU - Emergência')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ligar com urgência para o SAMU 192"
              >
                <Text style={styles.actionIcon}>🚑</Text>
                <View style={styles.actionTextGroup}>
                  <Text style={styles.actionTitleHighlight}>Ligar para o SAMU (192)</Text>
                  <Text style={styles.actionDescriptionHighlight}>
                    Atendimento móvel de urgência e socorro médico imediato
                  </Text>
                </View>
                <Text style={[styles.phoneBadge, styles.phoneBadgeRed]}>DISCAR 192</Text>
              </TouchableOpacity>

              {/* Cartão Informativo CAPS AD */}
              <TouchableOpacity
                style={styles.capsCardButton}
                onPress={() => setViewMode('caps')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Conhecer o serviço gratuito CAPS AD do SUS"
              >
                <Text style={styles.capsIcon}>🏥</Text>
                <View style={styles.actionTextGroup}>
                  <Text style={styles.capsTitle}>Conheça a Rede CAPS AD (SUS)</Text>
                  <Text style={styles.capsSubtitle}>
                    Acolhimento público, 100% gratuito e sem necessidade de encaminhamento
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Rodapé Tranquilizador */}
            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                ⚓ Este aplicativo opera 100% offline. Todos os recursos acima estão permanentemente
                salvos em seu dispositivo.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: 18,
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
  },
  levelCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    gap: 12,
  },
  level1Border: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  level2Border: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  level3Border: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  level1Badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  level2Badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  level3Badge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  levelSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  levelName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  levelDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  level1Button: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  level2Button: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  level3Button: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionTextGroup: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  actionDescription: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionTitleHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionDescriptionHighlight: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  phoneBadge: {
    backgroundColor: '#f59e0b',
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  phoneBadgeRed: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
  level2Disclaimer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  disclaimerIcon: {
    fontSize: 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#fde68a',
    lineHeight: 16,
  },
  disclaimerBold: {
    fontWeight: '700',
  },
  capsCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 14,
    borderRadius: 12,
  },
  capsIcon: {
    fontSize: 22,
  },
  capsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bae6fd',
  },
  capsSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  footerNote: {
    padding: 12,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
