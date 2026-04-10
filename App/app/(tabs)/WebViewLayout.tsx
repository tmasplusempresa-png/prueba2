import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { createMembership } from '@/common/reducers/membershipSlice';
import CustomAlert, { AlertButton } from '@/components/CustomAlert'; // Import the createMembership action

export default function WebViewLayout({ route }) {
  const webViewRef = useRef(null);
  const { payData } = route.params;
  const [payUUrl, setPayUUrl] = useState(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('error');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info' | 'confirm', title: string, message: string, buttons?: AlertButton[]) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  useEffect(() => {
    const generatePayUUrl = async () => {
      try {
        const response = await fetch('https://us-central1-treasupdate.cloudfunctions.net/payulatam-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payData),
        });
        const data = await response.text();
        setPayUUrl(`data:text/html,${encodeURIComponent(data)}`);
      } catch (error) {
        showAlert('error', 'Error', 'No se pudo generar la URL de PayU.');
      }
    };

    generatePayUUrl();
  }, [payData]);

  const onLoadStart = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    const { url } = nativeEvent;

    if (url.includes('success')) {
      webViewRef.current.stopLoading();
      showAlert('success', 'Pago exitoso', 'Tu pago se ha realizado con éxito.', [
        { text: 'OK', onPress: () => { setAlertVisible(false); handleSuccess(); } }
      ]);
    }

    if (url.includes('cancel')) {
      webViewRef.current.stopLoading();
      showAlert('warning', 'Pago cancelado', 'Tu pago ha sido cancelado.', [
        { text: 'OK', onPress: () => { setAlertVisible(false); navigation.goBack(); } }
      ]);
    }
  };

  const handleSuccess = () => {
    // Dispatch the action to create the membership in the database
    dispatch(createMembership({ uid: payData.uid, costo: payData.amount }))
      .then(() => {
        navigation.navigate('Memberships');
      })
      .catch((error) => {
        console.error("Error creating membership:", error);
        showAlert('error', 'Error', 'No se pudo crear la membresía. Inténtalo de nuevo.');
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Procesando Pago con PayU</Text>
      {payUUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: payUUrl }}
          onLoadStart={onLoadStart}
          style={styles.webview}
        />
      ) : (
        <ActivityIndicator size="large" color="#00f4f5" />
      )}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
});

