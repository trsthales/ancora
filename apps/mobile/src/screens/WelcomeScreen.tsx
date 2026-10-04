import React, { useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { BrandLogo } from '../components/BrandLogo';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const TRUST_POINTS = [
  'Sem e-mail e sem nome civil',
  'No seu ritmo, sem cobrança',
  'SOS funciona mesmo sem internet',
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(14)).current;

  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    let isMounted = true;

    const startAnimation = (reduced: boolean) => {
      if (!isMounted) return;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: reduced ? 0 : 350,
          useNativeDriver,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: reduced ? 0 : 350,
          useNativeDriver,
        }),
      ]).start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        startAnimation(reduced);
      })
      .catch(() => {
        startAnimation(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fadeAnim, translateYAnim, useNativeDriver]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Silhueta decorativa de colinas ao fundo */}
      <View style={styles.backgroundDecor} pointerEvents="none" aria-hidden={true}>
        <View style={styles.sunGlow} />
        <View style={styles.hillBack} />
        <View style={styles.hillFront} />
      </View>

      {/* Barra superior com botão de alternância de tema */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.themeToggleButton}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'
          }
          accessibilityHint="Muda a aparência do aplicativo entre tons claros e escuros"
        >
          <Text style={styles.themeToggleIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo rolável com respiro generoso e proteção ao botão flutuante SOS */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          {/* Cartão principal de apresentação */}
          <View style={styles.card}>
            {/* Logo da marca com símbolo transparente e wordmark */}
            <BrandLogo />

            {/* Linha divisora sutil com detalhe em tom âmbar */}
            <View style={styles.dividerWrapper}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerSunDot} />
              <View style={styles.dividerLine} />
            </View>

            {/* Três pontos de confiança serenos e verdadeiros */}
            <View style={styles.trustList} accessible={true} accessibilityRole="list">
              {TRUST_POINTS.map((point) => (
                <View key={point} style={styles.trustItem} accessibilityRole="text">
                  <View style={styles.trustIconContainer}>
                    <Text style={styles.trustIconText}>✓</Text>
                  </View>
                  <Text style={styles.trustItemText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onNavigateToRegister}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Começar Jornada"
              accessibilityHint="Inicia o cadastro anônimo no aplicativo"
            >
              <Text style={styles.primaryButtonText}>Começar Jornada</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onNavigateToLogin}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
              accessibilityHint="Acessa a sua conta existente com suas chaves de acesso"
            >
              <Text style={styles.secondaryButtonText}>Entrar</Text>
            </TouchableOpacity>
          </View>

          {/* Rodapé discreto de restrição legal */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Apenas para maiores de 18 anos</Text>
          </View>
        </Animated.View>
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
    backgroundDecor: {
      ...StyleSheet.absoluteFill,
      overflow: 'hidden',
    },
    sunGlow: {
      position: 'absolute',
      top: -60,
      alignSelf: 'center',
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.04)' : 'rgba(245, 158, 11, 0.05)',
    },
    hillBack: {
      position: 'absolute',
      bottom: -60,
      left: -80,
      right: -80,
      height: 240,
      borderTopLeftRadius: 360,
      borderTopRightRadius: 280,
      backgroundColor: colors.hillBack,
    },
    hillFront: {
      position: 'absolute',
      bottom: -110,
      left: -40,
      right: -120,
      height: 260,
      borderTopLeftRadius: 260,
      borderTopRightRadius: 380,
      backgroundColor: colors.hillFront,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 4,
      zIndex: 10,
    },
    themeToggleButton: {
      minWidth: 48,
      minHeight: 48,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeToggleIcon: {
      fontSize: 18,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 84,
    },
    animatedContainer: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
    },
    card: {
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 18,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      width: '100%',
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme === 'dark' ? 0.35 : 0.06,
          shadowRadius: 12,
        },
        android: {
          elevation: theme === 'dark' ? 4 : 2,
        },
        web: {
          boxShadow:
            theme === 'dark' ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 8px 24px rgba(0, 0, 0, 0.04)',
        } as unknown as object,
      }),
    },
    dividerWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginVertical: 10,
      paddingHorizontal: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.cardBorder,
    },
    dividerSunDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.brandSun,
      marginHorizontal: 10,
    },
    trustList: {
      width: '100%',
      gap: 8,
      paddingHorizontal: 4,
    },
    trustItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    trustIconContainer: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme === 'dark' ? 'rgba(20, 184, 166, 0.16)' : 'rgba(13, 148, 136, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    trustIconText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 13,
    },
    trustItemText: {
      flex: 1,
      fontSize: 13.5,
      color: colors.text,
      fontWeight: '500',
      lineHeight: 18,
    },
    actions: {
      width: '100%',
      gap: 8,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      minHeight: 48,
      paddingVertical: 13,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 6,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
          cursor: 'pointer',
        } as unknown as object,
      }),
    },
    primaryButtonText: {
      color: colors.primaryText,
      fontSize: 15.5,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    secondaryButton: {
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
      minHeight: 48,
      paddingVertical: 13,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      ...Platform.select({
        web: {
          cursor: 'pointer',
        } as unknown as object,
      }),
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 15.5,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    footer: {
      marginTop: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerText: {
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.3,
      textAlign: 'center',
    },
  });
