import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Share,
  Linking
} from "react-native";
import axios from "axios";
import { useSelector } from "react-redux";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';

const SecurityScreen = ({ route }) => {
  const { booking } = route.params; // Recibir booking de la navegación
  const [reference, setReference] = useState(""); // Estado para la referencia de la reserva
  const [isLoading, setIsLoading] = useState(false); // Estado para manejar la carga
  const user = useSelector((state) => state.auth.user);
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
  // Función para compartir la ubicación del conductor
  const shareLocation = async () => {
    try {
      const response = await axios.post(
        "https://us-central1-treasupdate.cloudfunctions.net/shareDriverLocation",
        { bookingId: booking.id }
      );

      const { location } = response.data;
      if (location) {
        const dynamicLink = `https://treasapp.page.link/app?screen=ReceiveLocation`; // Link actualizado con bookingId
        const shareMessage = `Ubicación de ${booking.driver_name}: ${dynamicLink}. Con este ID podrás ver mi ubicación en viaje compartido: ${booking.id}`;
        console.log(dynamicLink);

        // Compartir a WhatsApp
        user.backupContacts.forEach(contact => {
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${contact.mobile}&text=${encodeURIComponent(shareMessage)}`;
          Linking.openURL(whatsappUrl); // Abrir WhatsApp con el mensaje
        });

        // Mostrar contactos de respaldo
        user.backupContacts.forEach(contact => {
          const contactMessage = `${contact.firstName} (${contact.mobile}) te ha compartido la ubicación.`;
          showAlert('info', 'Contacto Compartido', contactMessage);
        });
      } else {
        showAlert('error', 'Error', 'No se encontró la ubicación del conductor');
      }
    } catch (error) {
      showAlert('error', 'Error', 'No se pudo compartir la ubicación');
      console.error("Error al compartir la ubicación:", error);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seguridad - Compartir/Recibir Ubicación</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={shareLocation}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Cargando..." : "Compartir Ubicación"}
        </Text>
      </TouchableOpacity>      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />    </View>
  );
};

// Estilos mejorados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#00f4f5",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SecurityScreen;
