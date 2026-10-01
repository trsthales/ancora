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
}

export const darkColors: ThemeColors = {
  background: '#0f172a',
  card: '#1e293b',
  cardBorder: '#334155',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#0d9488',
  primaryText: '#ffffff',
};

export const lightColors: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  primary: '#0f766e',
  primaryText: '#ffffff',
};

const THEME_STORAGE_KEY = 'ancora_theme';

export interface ThemeContextData {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  colors: ThemeColors;
}

const defaultContext: ThemeContextData = {
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  colors: darkColors,
};

const ThemeContext = createContext<ThemeContextData>(defaultContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    async function restoreTheme() {
      try {
        const storedTheme = await storage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
        }
      } catch {
        // Fallback para 'dark' em caso de erro no storage
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
