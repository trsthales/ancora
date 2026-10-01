import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, ActivityIndicator } from 'react-native';
import { registerRootComponent } from 'expo';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SOSProvider, useSOS } from './src/contexts/SOSContext';
import { SOSFloatingButton } from './src/components/SOSFloatingButton';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { IdentityRevealScreen } from './src/screens/IdentityRevealScreen';
import { HomeScreen } from './src/screens/HomeScreen';

type UnauthenticatedScreen = 'welcome' | 'login' | 'register';

function MainNavigator() {
  const { isLoading, isAuthenticated, justRegistered } = useAuth();
  const { openSOS } = useSOS();
  const [currentScreen, setCurrentScreen] = useState<UnauthenticatedScreen>('welcome');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.loadingCard}>
          <Text style={styles.loadingIcon}>⚓</Text>
          <Text style={styles.loadingTitle}>Âncora</Text>
          <Text style={styles.loadingSlogan}>Firmeza para atravessar a tempestade.</Text>
          <ActivityIndicator size="small" color="#0d9488" style={styles.spinner} />
        </View>
      </View>
    );
  }

  if (isAuthenticated) {
    if (justRegistered) {
      return (
        <View style={styles.appContainer}>
          <IdentityRevealScreen />
          <SOSFloatingButton onPress={openSOS} />
        </View>
      );
    }
    return <HomeScreen />;
  }

  let content = null;
  if (currentScreen === 'login') {
    content = (
      <LoginScreen
        onNavigateToRegister={() => setCurrentScreen('register')}
        onNavigateToWelcome={() => setCurrentScreen('welcome')}
      />
    );
  } else if (currentScreen === 'register') {
    content = (
      <RegisterScreen
        onNavigateToLogin={() => setCurrentScreen('login')}
        onNavigateToWelcome={() => setCurrentScreen('welcome')}
      />
    );
  } else {
    content = (
      <WelcomeScreen
        onNavigateToLogin={() => setCurrentScreen('login')}
        onNavigateToRegister={() => setCurrentScreen('register')}
      />
    );
  }

  return (
    <View style={styles.appContainer}>
      {content}
      <SOSFloatingButton onPress={openSOS} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SOSProvider>
        <MainNavigator />
      </SOSProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 400,
    width: '100%',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  loadingSlogan: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  spinner: {
    marginTop: 8,
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});

registerRootComponent(App);
