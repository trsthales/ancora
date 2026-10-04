import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { storage } from '../services/storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  accent: string;
  brandJornada: string;
  brandFirme: string;
  brandSun: string;
  brandMuted: string;
  hillBack: string;
  hillFront: string;
}

export const darkColors: ThemeColors = {
  background: '#131c2e',
  card: '#1e293b',
  cardBorder: '#2e3d54',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#14b8a6',
  primaryText: '#ffffff',
  accent: '#fbbf24',
  brandJornada: '#f1f5f9',
  brandFirme: '#5eead4',
  brandSun: '#fbbf24',
  brandMuted: '#94a3b8',
  hillBack: 'rgba(20, 184, 166, 0.07)',
  hillFront: 'rgba(94, 234, 212, 0.05)',
};

export const lightColors: ThemeColors = {
  background: '#fbfaf7',
  card: '#ffffff',
  cardBorder: '#e8e5de',
  text: '#1e293b',
  textMuted: '#64748b',
  primary: '#0d9488',
  primaryText: '#ffffff',
  accent: '#f59e0b',
  brandJornada: '#17404c',
  brandFirme: '#386d62',
  brandSun: '#f59e0b',
  brandMuted: '#4e6a72',
  hillBack: 'rgba(13, 148, 136, 0.06)',
  hillFront: 'rgba(56, 109, 98, 0.08)',
};

const THEME_STORAGE_KEY = 'ancora_theme';

export interface ThemeContextData {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  colors: ThemeColors;
}

const defaultContext: ThemeContextData = {
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  colors: lightColors,
};

const ThemeContext = createContext<ThemeContextData>(defaultContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    async function restoreTheme() {
      try {
        const storedTheme = await storage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
        }
      } catch {
        // Fallback para 'light' em caso de erro no storage
      }
    }

    restoreTheme();
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    storage.setItem(THEME_STORAGE_KEY, newTheme).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      storage.setItem(THEME_STORAGE_KEY, nextTheme).catch(() => {});
      return nextTheme;
    });
  }, []);

  const colors = useMemo(() => (theme === 'dark' ? darkColors : lightColors), [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      colors,
    }),
    [theme, toggleTheme, setTheme, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextData => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
