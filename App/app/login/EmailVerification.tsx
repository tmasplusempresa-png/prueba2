import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  BackHandler,
  useColorScheme,
  Linking,
} from "react-native";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
/* import { getAuth, sendEmailVerification, reload } from "firebase/auth"; */
import { useDispatch } from "react-redux";
import { verifyEmail } from "@/common/store/authSlice";
import {updateProfile} from "@/common/actions/authactions"
import { useSelector } from "react-redux";
import { RootState } from "@/common/store/store";
const EmailVerification = ({ route, navigation }: NativeStackScreenProps<any>) => {

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [resendCodeTimer, setResendCodeTimer] = useState(60);
  const dispatch = useDispatch(); // Hook para despachar acciones
  const colorScheme = useColorScheme(); // Detecta el esquema de color actual
  const user = useSelector((state: RootState) => state.auth.user);

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
    const backAction = () => {
      // Interceptar la acción de volver atrás y prevenirla
      showAlert('warning', 'Verificación requerida', 'Debes verificar tu correo antes de continuar.');
      return true;
    };

    // Añadir el listener para la acción de back (retroceder)
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Limpiar el listener cuando el componente se desmonta
    return () => backHandler.remove();
  }, []);

  const handleResendCode = async () => {
    setIsCodeSent(true);
    setResendCodeTimer(60);
    const interval = setInterval(() => {
      setResendCodeTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCodeSent(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      await sendEmailVerification(user);
      showAlert('success', 'Código reenviado', 'Se ha reenviado el código de verificación a tu correo.');
    } catch (error) {
      showAlert('error', 'Error', 'No se pudo reenviar el código de verificación.');
    }
  };

  const handleVerifyCode = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      await reload(user); // Recarga la información del usuario para obtener el estado más reciente
      if (user.emailVerified) {
        // Si el email ha sido verificado, actualiza el estado en Redux y navega al inicio de sesión
        dispatch(verifyEmail());
        showAlert('success', 'Verificación exitosa', 'Tu correo ha sido verificado correctamente.');
        dispatch(updateProfile({ emailVerified: true }));

        navigation.navigate("HomeScreen");
      } else {
        showAlert('warning', 'Verificación pendiente', 'Aún no has verificado tu correo. Por favor, revisa tu email.');
      }
    } catch (error) {
      showAlert('error', 'Error', 'Hubo un problema al verificar tu correo. Por favor, intenta nuevamente.');
    }
  };

  // Define los estilos dinámicamente según el esquema de color
  const styles = getStyles(colorScheme);

  return (
    <View style={styles.container}>
      <Image source={require("./../../assets/images/logo1024x1024.png")} style={styles.logo} />
      <Text style={styles.title}>Verifica tu correo electrónico</Text>
      <Text style={styles.subtitle}>
        Revisa tu correo electrónico. Te hemos enviado el código de verificación.
      </Text>
      <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyCode}>
        <Text style={styles.verifyButtonText}>He verificado mi correo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.resendCodeLink}
        onPress={handleResendCode}
        disabled={isCodeSent}
      >
        <Text style={styles.resendCodeText}>
          {isCodeSent ? `Reenviar código en ${resendCodeTimer}s` : "¿No recibiste el código? Reenviar código"}
        </Text>
      </TouchableOpacity>
      {/* Botón para abrir Gmail en modo oscuro */}
      <TouchableOpacity style={styles.openGmailButton} onPress={() => Linking.openURL("mailto:")}>
        <Text style={styles.openGmailText}>Abrir Gmail</Text>
      </TouchableOpacity>

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
};

const getStyles = (colorScheme: string | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: colorScheme === "dark" ? "#121212" : "#FFFFFF",
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
      color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#CCCCCC" : "#666666",
      textAlign: "center",
      marginBottom: 20,
    },
    verifyButton: {
      backgroundColor: "#00f4f5",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginBottom: 20,
    },
    verifyButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    resendCodeLink: {
      marginTop: 10,
    },
    resendCodeText: {
      color: "#00f4f5",
      textDecorationLine: "underline",
    },
    openGmailButton: {
      backgroundColor: colorScheme === "dark" ? "#444444" : "#333333", // Ajusta el color según el modo
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginTop: 20,
    },
    openGmailText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default EmailVerification;
