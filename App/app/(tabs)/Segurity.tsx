import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Linking,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import { useSelector } from "react-redux";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';

const SUPPORT_EMAIL = "soporte@tmasplus.online";

const formatKms = (booking: any, estimatedDistance?: string | null) => {
  if (estimatedDistance) return estimatedDistance;
  const raw = booking?.distance ?? booking?.trip_distance;
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  if (typeof n === "number" && !isNaN(n) && n > 0) return `${n.toFixed(1)} km`;
  return "-";
};

const formatTime = (estimatedTime?: string | null) => estimatedTime || "-";

const getCategory = (booking: any) =>
  booking?.car_type || booking?.tripType || booking?.category || booking?.vehicle_type || "-";

const getBrand = (booking: any) =>
  booking?.vehicleMake || booking?.vehicle_make || booking?.car_model || booking?.vehicle_model || "-";

const getPlate = (booking: any) =>
  booking?.plate_number || booking?.vehicle_number || "-";

const getOrigin = (booking: any) =>
  booking?.pickup?.add || booking?.pickup_address || booking?.pickupAddress || "-";

const getDestination = (booking: any) =>
  booking?.drop?.add || booking?.drop_address || booking?.dropAddress || "-";

const buildCustomerTripMessage = (
  booking: any,
  locationUrl: string,
  estimatedTime?: string | null,
  estimatedDistance?: string | null,
) => {
  return (
    `Hola! Todo esta bien en este momento, Aun asi quiero compartir contigo los datos de el conductor que me esta atendiendo en este momento por el app T+Plus:\n\n` +
    `Conductor: ${booking?.driver_name || "-"}\n` +
    `Marca del vehiculo: ${getBrand(booking)}\n` +
    `Placa: ${getPlate(booking)}\n` +
    `Categoria: ${getCategory(booking)}\n` +
    `Origen: ${getOrigin(booking)}\n` +
    `Destino: ${getDestination(booking)}\n` +
    `Kms: ${formatKms(booking, estimatedDistance)}\n` +
    `Tiempo: ${formatTime(estimatedTime)}\n\n` +
    `Mi ubicacion actual: ${locationUrl}\n\n` +
    `Este es el tiempo estimado de llegada aunque puede variar por trafico, para que lo tengas en cuenta y asi puedas estar pendiente de mi!\n\n` +
    `Gracias por siempre estar cuando te necesito. Cualquier cosa el correo de soporte de T+Plus es ${SUPPORT_EMAIL} .`
  );
};

const buildDriverTripMessage = (
  booking: any,
  locationUrl: string,
  estimatedTime?: string | null,
  estimatedDistance?: string | null,
) => {
  return (
    `Hola estoy conduciendo con T+Plus en un viaje y esta es mi actual ubicacion: ${locationUrl}\n\n` +
    `Estos son los datos de mi servicio por si no me comunico contigo prontamente: Todo esta bien en este momento, Aun asi quiero compartir contigo los datos del servicio que estoy atendiendo en este momento por el app T+Plus:\n\n` +
    `Categoria: ${getCategory(booking)}\n` +
    `Origen: ${getOrigin(booking)}\n` +
    `Destino: ${getDestination(booking)}\n` +
    `Kms: ${formatKms(booking, estimatedDistance)}\n` +
    `Tiempo: ${formatTime(estimatedTime)}\n\n` +
    `Este es el tiempo estimado de llegada aunque puede variar por trafico, para que lo tengas en cuenta y asi puedas estar pendiente de mi!\n\n` +
    `Gracias por siempre estar cuando te necesito. Cualquier cosa el correo de soporte de T+Plus es ${SUPPORT_EMAIL}.`
  );
};

const SecurityScreen = ({ route }) => {
  const { booking, estimatedTime, estimatedDistance } = route.params; // booking + ETA opcionales
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const user = useSelector((state: any) => state.auth.user);
  const isDriver = user?.usertype === "driver";

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('error');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm',
    title: string,
    message: string,
    buttons?: AlertButton[],
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  const getCurrentLocationUrl = async (): Promise<string | null> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      showAlert("warning", "Permiso requerido", "Necesitamos permiso de ubicacion para compartir tu ubicacion actual.");
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude } = pos.coords;
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  // Mantiene el flujo previo: comparte solo ubicacion via WhatsApp a los backup contacts (solo pasajero)
  const shareLocation = async () => {
    try {
      setIsLoadingLoc(true);
      const response = await axios.post(
        "https://us-central1-treasupdate.cloudfunctions.net/shareDriverLocation",
        { bookingId: booking.id }
      );

      const { location } = response.data;
      if (location) {
        const dynamicLink = `https://treasapp.page.link/app?screen=ReceiveLocation`;
        const shareMessage = `Ubicacion de ${booking.driver_name}: ${dynamicLink}. Con este ID podras ver mi ubicacion en viaje compartido: ${booking.id}`;

        (user?.backupContacts || []).forEach((contact: any) => {
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${contact.mobile}&text=${encodeURIComponent(shareMessage)}`;
          Linking.openURL(whatsappUrl);
        });
      } else {
        showAlert('error', 'Error', 'No se encontro la ubicacion del conductor');
      }
    } catch (error) {
      showAlert('error', 'Error', 'No se pudo compartir la ubicacion');
      console.error("Error al compartir la ubicacion:", error);
    } finally {
      setIsLoadingLoc(false);
    }
  };

  // Nuevo flujo: comparte datos del viaje + ubicacion actual
  const shareTrip = async () => {
    try {
      setIsLoadingTrip(true);
      const locationUrl = await getCurrentLocationUrl();
      if (!locationUrl) return;

      const message = isDriver
        ? buildDriverTripMessage(booking, locationUrl, estimatedTime, estimatedDistance)
        : buildCustomerTripMessage(booking, locationUrl, estimatedTime, estimatedDistance);

      if (isDriver) {
        // El conductor elige el destinatario a traves del share sheet del sistema
        await Share.share({ message });
      } else {
        // El pasajero usa la lista de contactos de respaldo para enviar por WhatsApp
        const contacts = user?.backupContacts || [];
        if (contacts.length === 0) {
          await Share.share({ message });
        } else {
          contacts.forEach((contact: any) => {
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${contact.mobile}&text=${encodeURIComponent(message)}`;
            Linking.openURL(whatsappUrl);
          });
        }
      }
    } catch (error) {
      console.error("Error al compartir el viaje:", error);
      showAlert('error', 'Error', 'No se pudo compartir el viaje');
    } finally {
      setIsLoadingTrip(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seguridad</Text>
      <Text style={styles.subtitle}>
        {isDriver
          ? "Comparte los datos del servicio y tu ubicacion actual con alguien de confianza."
          : "Comparte los datos del viaje y tu ubicacion actual con tus contactos de confianza."}
      </Text>

      <TouchableOpacity
        style={[styles.button, isLoadingTrip && styles.buttonDisabled]}
        onPress={shareTrip}
        disabled={isLoadingTrip}
      >
        {isLoadingTrip ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Compartir Datos del Viaje</Text>
        )}
      </TouchableOpacity>

      {!isDriver && (
        <TouchableOpacity
          style={[styles.buttonSecondary, isLoadingLoc && styles.buttonDisabled]}
          onPress={shareLocation}
          disabled={isLoadingLoc}
        >
          {isLoadingLoc ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Compartir Ubicacion (contactos)</Text>
          )}
        </TouchableOpacity>
      )}

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#00f4f5",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: "#0095a8",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SecurityScreen;
