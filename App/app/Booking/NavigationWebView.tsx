// app/Booking/NavigationWebView.tsx
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useRoute, useNavigation } from "@react-navigation/native";

const NavigationWebView = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { url } = route.params as { url: string };

  const handleWebViewNavigationStateChange = (navState) => {
    const { url: currentUrl } = navState;
    // Puedes manejar otras lógicas aquí si es necesario
    // Por ejemplo, cerrar el WebView si se llega a una URL específica
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator
            color="#00f4f5"
            size="large"
            style={styles.loading}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default NavigationWebView;

