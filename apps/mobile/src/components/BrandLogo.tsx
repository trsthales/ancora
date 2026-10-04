import React from 'react';
import { StyleSheet, Text, View, Image, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import logoSymbolDark from '../../assets/logo-symbol-dark.png';
import logoSymbolLight from '../../assets/logo-symbol.png';

interface BrandLogoProps {
  style?: StyleProp<ViewStyle>;
  showSlogan?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ style, showSlogan = true }) => {
  const { theme, colors } = useTheme();

  const symbolSource = theme === 'dark' ? logoSymbolDark : logoSymbolLight;

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="Jornada Firme: Firmeza para atravessar a tempestade"
    >
      <View style={styles.symbolWrapper}>
        <Image
          source={symbolSource}
          style={styles.symbol}
          resizeMode="contain"
          accessible={false}
        />
      </View>

      <View style={styles.wordmarkRow}>
        <Text style={[styles.wordmarkJornada, { color: colors.brandJornada }]}>jornada</Text>
        <Text style={[styles.wordmarkFirme, { color: colors.brandFirme }]}>firme</Text>
      </View>

      {showSlogan && (
        <Text style={[styles.slogan, { color: colors.brandMuted }]}>
          Firmeza para atravessar a tempestade.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  symbol: {
    width: 110,
    height: 48,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  wordmarkJornada: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  wordmarkFirme: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  slogan: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
    marginTop: 3,
    paddingHorizontal: 12,
  },
});
