import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Termos e Privacidade</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Versão Canônica 2026.1</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Fechar termos de privacidade"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Card de Destaque LGPD */}
          <View style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>Transparência e Proteção Integral</Text>
            <Text style={styles.highlightText}>
              O Âncora foi projetado desde a primeira linha de código para proteger pessoas em
              recuperação. Tratamos a sua privacidade e os seus dados de saúde com a máxima
              responsabilidade ética e rigor da LGPD (Lei nº 13.709/2018).
            </Text>
          </View>

          {/* Seção 1: Sem Anúncios / Sem Venda de Dados */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🔒</Text>
              <Text style={styles.sectionTitle}>
                1. Zero Anúncios e Ausência de Lucro com Seus Dados
              </Text>
            </View>
            <Text style={styles.sectionBody}>
              Nenhum dado pessoal ou de navegação é vendido, alugado, monetizado ou transferido para
              redes de anúncios, seguradoras, empregadores ou governos. O aplicativo é completamente
              isento de publicidade comportamental e trackers invasivos de terceiros.
            </Text>
          </View>

          {/* Seção 2: Dados Sensíveis de Saúde (Art. 11 LGPD) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🩺</Text>
              <Text style={styles.sectionTitle}>
                2. Tratamento de Dados de Saúde e Recuperação (Art. 11 LGPD)
              </Text>
            </View>
            <Text style={styles.sectionBody}>
              Ao registrar seu nível diário de fissura, humor e práticas de autocuidado, você
              fornece dados classificados como sensíveis pela LGPD. O tratamento dessas informações
              ocorre exclusivamente mediante seu consentimento expresso e destacado, servindo aos
              seguintes propósitos:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>
                • Interceptar momentos de vulnerabilidade e oferecer estratégias de ancoragem
                imediata.
              </Text>
              <Text style={styles.bulletItem}>
                • Calcular de forma estritamente privada seu histórico acumulado de progresso.
              </Text>
              <Text style={styles.bulletItem}>
                • Proteger a integridade e acolhimento mútuo da rede comunitária entre pares.
              </Text>
            </View>
          </View>

          {/* Seção 3: Anonimato e Desacoplamento Criptográfico */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🛡️</Text>
              <Text style={styles.sectionTitle}>
                3. Anonimato Estrutural e Desacoplamento Criptográfico
              </Text>
            </View>
            <Text style={styles.sectionBody}>
              Sua identidade civil nunca é revelada para a comunidade. Seus dados de perfil operam
              desacoplados criptograficamente através de tokens HMAC unidirecionais. Nem mesmo os
              administradores do sistema possuem capacidade de correlacionar seus registros de saúde
              à sua identidade civil ou dispositivo sem autorização legal estrita.
            </Text>
          </View>

          {/* Seção 4: Direito ao Esquecimento (Art. 18, VI LGPD) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🗑️</Text>
              <Text style={styles.sectionTitle}>
                4. Direito ao Esquecimento e Expurgo Definitivo
              </Text>
            </View>
            <Text style={styles.sectionBody}>
              Em conformidade com o Art. 18, inciso VI da LGPD, você possui a autonomia total de
              solicitar a qualquer momento a exclusão imediata e permanente de sua conta. O processo
              é atômico e irreversível: todos os check-ins, perfil, chaves e credenciais são
              definitivamente expurgados do banco de dados (zero dados órfãos).
            </Text>
          </View>

          {/* Seção 5: Delimitação Não-Clínica */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🤝</Text>
              <Text style={styles.sectionTitle}>
                5. Apoio Mútuo Horizontal e Delimitação Não-Clínica
              </Text>
            </View>
            <Text style={styles.sectionBody}>
              O Âncora é uma ferramenta de suporte entre pares e acolhimento comunitário. Não
              oferecemos nem substituímos diagnóstico, tratamento médico ou acompanhamento
              psicoterapêutico individualizado. Em caso de crise aguda ou sofrimento intenso,
              utilize o Protocolo SOS ou ligue para o CVV (188).
            </Text>
          </View>

          {/* Botão de Fechamento */}
          <TouchableOpacity
            style={styles.understandButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Compreendi os termos e política de privacidade"
          >
            <Text style={styles.understandButtonText}>Compreendi e Fechar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    headerTitles: {
      gap: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    badge: {
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(15, 118, 110, 0.12)',
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
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    scrollContent: {
      padding: 20,
      gap: 16,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      paddingBottom: 40,
    },
    highlightCard: {
      backgroundColor: theme === 'dark' ? 'rgba(13, 148, 136, 0.12)' : 'rgba(15, 118, 110, 0.08)',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      gap: 8,
    },
    highlightTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    highlightText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 19,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 10,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sectionIcon: {
      fontSize: 20,
    },
    sectionTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 20,
    },
    sectionBody: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 20,
    },
    bulletList: {
      gap: 6,
      marginTop: 4,
      paddingLeft: 4,
    },
    bulletItem: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
    },
    understandButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    understandButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '600',
    },
  });
