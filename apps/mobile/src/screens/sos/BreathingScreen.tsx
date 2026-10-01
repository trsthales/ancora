import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { BreathingCircle } from '../../components/BreathingCircle';

interface BreathingScreenProps {
  onBack: () => void;
}

export const BreathingScreen: React.FC<BreathingScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao menu SOS"
        >
          <Text style={styles.backButtonText}>← Voltar ao SOS</Text>
        </TouchableOpacity>
        <View style={styles.badgeNivel1}>
          <Text style={styles.badgeNivel1Text}>Nível 1 • Autocuidado</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Respiração Guiada 4-7-8</Text>
          <Text style={styles.subtitle}>
            A técnica de respiração 4-7-8 atua diretamente no sistema parassimpático, desacelerando
            os batimentos e reduzindo a intensidade de impulsos e fissuras.
          </Text>
        </View>

        {/* Círculo Interativo Animado */}
        <BreathingCircle />

        {/* Guia Rápido dos 3 Passos */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsCardTitle}>Como funciona o ciclo:</Text>
          <View style={styles.stepItem}>
            <View style={[styles.stepBullet, { backgroundColor: '#10b981' }]} />
            <Text style={styles.stepText}>
              <Text style={styles.stepHighlight}>4 segundos:</Text> Inspire profunda e suavemente
              pelo nariz.
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepBullet, { backgroundColor: '#0d9488' }]} />
            <Text style={styles.stepText}>
              <Text style={styles.stepHighlight}>7 segundos:</Text> Segure o ar sem criar tensão no
              corpo.
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepBullet, { backgroundColor: '#14b8a6' }]} />
            <Text style={styles.stepText}>
              <Text style={styles.stepHighlight}>8 segundos:</Text> Esvazie os pulmões lentamente
              pela boca.
            </Text>
          </View>
        </View>

        {/* Botão de Saída Rápida Obrigatório */}
        <TouchableOpacity
          style={styles.calmExitButton}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Estou mais calmo, voltar"
        >
          <Text style={styles.calmExitButtonText}>🌿 Estou mais calmo, voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  badgeNivel1: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeNivel1Text: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    gap: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420,
  },
  stepsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
    width: '100%',
  },
  stepsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 18,
  },
  stepHighlight: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
  calmExitButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  calmExitButtonText: {
    color: '#34d399',
    fontSize: 15,
    fontWeight: '700',
  },
});
