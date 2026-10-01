import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface CapsInfoModalProps {
  onClose: () => void;
}

export const CapsInfoModal: React.FC<CapsInfoModalProps> = ({ onClose }) => {
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const handleCallDisqueSaude = () => {
    Linking.openURL('tel:136').catch(() => {
      alert('Para informações sobre o SUS e CAPS AD, ligue para o Disque Saúde no 136.');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🏥</Text>
          <Text style={styles.headerTitle}>Rede CAPS AD (SUS)</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Voltar ou fechar guia do CAPS AD"
        >
          <Text style={styles.closeButtonText}>✕ Fechar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card Destaque */}
        <View style={styles.highlightCard}>
          <Text style={styles.highlightTag}>100% GRATUITO E PÚBLICO</Text>
          <Text style={styles.highlightTitle}>
            Centro de Atenção Psicossocial — Álcool e Drogas
          </Text>
          <Text style={styles.highlightDescription}>
            O CAPS AD é um serviço especializado do SUS voltado ao cuidado humanizado, redução de
            danos e acolhimento de pessoas com sofrimento decorrente do uso de substâncias.
          </Text>
        </View>

        {/* Informações Práticas */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Como Funciona o Acolhimento?</Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletIcon}>🚪</Text>
            <View style={styles.bulletContent}>
              <Text style={styles.bulletTitle}>Porta Aberta (Sem Agendamento)</Text>
              <Text style={styles.bulletDesc}>
                Você não precisa de encaminhamento médico ou agendamento prévio. Basta comparecer à
                unidade durante o horário de funcionamento.
              </Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletIcon}>🤝</Text>
            <View style={styles.bulletContent}>
              <Text style={styles.bulletTitle}>Equipe Multidisciplinar Completa</Text>
              <Text style={styles.bulletDesc}>
                Atendimento com psicólogos, psiquiatras, assistentes sociais, terapeutas
                ocupacionais e equipe de enfermagem.
              </Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletIcon}>🛡️</Text>
            <View style={styles.bulletContent}>
              <Text style={styles.bulletTitle}>Sigilo e Respeito à sua Dignidade</Text>
              <Text style={styles.bulletDesc}>
                O tratamento respeita a sua autonomia, o seu tempo e a sua história de vida, sem
                coerção ou julgamentos morais.
              </Text>
            </View>
          </View>
        </View>

        {/* O que levar */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>O que levar na primeira visita?</Text>
          <Text style={styles.cardBody}>
            Documento de identificação com foto e Cartão SUS (se tiver em mãos).
          </Text>
          <View style={styles.tipBox}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Importante:</Text> A ausência de documentos ou
              comprovante de residência <Text style={styles.tipBold}>NUNCA</Text> pode impedir o
              acolhimento imediato.
            </Text>
          </View>
        </View>

        {/* Como encontrar */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Como Encontrar o CAPS AD mais Próximo?</Text>
          <Text style={styles.cardBody}>
            1. Procure a Unidade Básica de Saúde (Posto de Saúde/UBS) do seu bairro e peça a
            indicação do CAPS AD de referência.{'\n'}
            2. Entre em contato com a Secretaria Municipal de Saúde de sua cidade.{'\n'}
            3. Ou ligue gratuitamente para o Disque Saúde 136.
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCallDisqueSaude}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ligar para o Disque Saúde 136"
          >
            <Text style={styles.actionButtonIcon}>📞</Text>
            <Text style={styles.actionButtonText}>Ligar para o Disque Saúde (136)</Text>
          </TouchableOpacity>
        </View>

        {/* Botão de Fechar no final */}
        <TouchableOpacity style={styles.bottomCloseButton} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.bottomCloseButtonText}>Entendido, Voltar ao SOS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      backgroundColor: colors.card,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerIcon: {
      fontSize: 22,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    closeButtonText: {
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
      paddingBottom: 40,
    },
    highlightCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#38bdf8' : '#0284c7',
      gap: 8,
    },
    highlightTag: {
      fontSize: 11,
      fontWeight: '800',
      color: theme === 'dark' ? '#38bdf8' : '#0284c7',
      letterSpacing: 1,
    },
    highlightTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 24,
    },
    highlightDescription: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 12,
    },
    cardHeading: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    cardBody: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 22,
    },
    bulletItem: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    bulletIcon: {
      fontSize: 20,
      marginTop: 2,
    },
    bulletContent: {
      flex: 1,
      gap: 2,
    },
    bulletTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    bulletDesc: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    tipBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.25)',
    },
    tipIcon: {
      fontSize: 18,
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      color: theme === 'dark' ? '#bae6fd' : '#0369a1',
      lineHeight: 18,
    },
    tipBold: {
      fontWeight: '700',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#0284c7',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginTop: 6,
    },
    actionButtonIcon: {
      fontSize: 16,
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    bottomCloseButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    bottomCloseButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
  });
