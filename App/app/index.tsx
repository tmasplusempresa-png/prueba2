import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';

export default function RootRedirect() {
  const router = useRouter();
  // Intentar la navegación de forma segura: reintentos cortos hasta que el router acepte la navegación
  useEffect(() => {
    let cancelled = false;
    const tryReplace = async () => {
      for (let i = 0; i < 10 && !cancelled; i++) {
        try {
          router.replace('/HomeScreen');
          return;
        } catch (e) {
          // esperar un poco y reintentar
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 50));
        }
      }
    };
    tryReplace();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirigiendo a pantalla de prueba...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16 },
});
