import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { registerRootComponent } from 'expo';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />
      <View style={styles.card}>
        <Text style={styles.icon}>⚓</Text>
        <Text style={styles.title}>Âncora</Text>
        <Text style={styles.slogan}>Firmeza para atravessar a tempestade.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  slogan: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
});

registerRootComponent(App);
