import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, StyleProp, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SOSFloatingButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export const SOSFloatingButton: React.FC<SOSFloatingButtonProps> = ({
  onPress,
  style,
  label = 'SOS',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        { bottom: Math.max(insets.bottom, 12) + 16 },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="SOS - Botão de apoio e emergência imediata"
      accessibilityHint="Abre o painel do semáforo SOS com exercícios de ancoragem e contatos de urgência"
    >
      <Text style={styles.icon}>🛟</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 32,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
        cursor: 'pointer',
      } as unknown as ViewStyle,
    }),
  },
  icon: {
    fontSize: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
