import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  StatusBar,
} from "react-native";
import Mapbox, { MapboxStyles } from "@/config/MapboxConfig";
import axios from "axios";
import carIcon from "@/assets/images/track_Car.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';

type Props = NativeStackScreenProps<any>;

type SharedLocation = {
  lat: number;
  lng: number;
};

const ReceiveLocationScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [reference, setReference] = useState("");
  const [location, setLocation] = useState<SharedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const glow1 = useRef(new Animated.Value(0)).current;
  const glow2 = useRef(new Animated.Value(0)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow1, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, {
          toValue: 1,
          duration: 4700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow2, {
          toValue: 0,
          duration: 4700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 23000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glow1, glow2, orbRotate, pulse]);

  const getSharedLocation = async () => {
    if (!reference) {
      showAlert('error', 'Error', 'Por favor ingresa una referencia de reserva');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://us-central1-treasupdate.cloudfunctions.net/shareDriverLocation",
        {
          bookingId: reference.trim(),
        }
      );

      const { location: foundLocation } = response.data;

      if (foundLocation) {
        setLocation(foundLocation);
      } else {
        showAlert('error', 'Error', 'No se encontró la ubicación');
      }
    } catch (error) {
      const anyError = error as any;

      if (anyError.response) {
        console.error("Error de respuesta:", anyError.response.data);
        showAlert('error', 'Error', anyError.response.data.error || 'No se pudo obtener la ubicación');
      } else if (anyError.request) {
        console.error("Error de solicitud:", anyError.request);
        showAlert('error', 'Error', 'No se recibió respuesta del servidor');
      } else {
        console.error("Error:", anyError.message);
        showAlert('error', 'Error', 'Error al configurar la solicitud');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const orbSpin = orbRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glow1Scale = glow1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const glow2Scale = glow2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom + 12, 20),
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      <View pointerEvents="none" style={styles.bgLayer}>
        <Animated.View style={[styles.bgGlowOne, { transform: [{ scale: glow1Scale }] }]} />
        <Animated.View style={[styles.bgGlowTwo, { transform: [{ scale: glow2Scale }] }]} />
        <Animated.View style={[styles.bgOrb, { transform: [{ rotate: orbSpin }] }]}>
          <View style={styles.bgOrbInner} />
        </Animated.View>
        <View style={styles.bgGrid} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <AntDesign name="arrow-left" size={22} color="#EAFBFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerBadgeIcon}>
            <Ionicons name="navigate-outline" size={14} color="#00E5FF" />
          </View>
          <Text style={styles.headerText}>Recibir ubicacion compartida</Text>
        </View>

        <View style={styles.iconBtnPlaceholder} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Buscar por referencia</Text>
        <Text style={styles.subtitle}>
          Ingresa el codigo de reserva para obtener la ubicacion compartida del conductor en tiempo real.
        </Text>

        <View style={styles.inputWrap}>
          <Ionicons name="key-outline" size={17} color="rgba(234,251,255,0.72)" />
          <TextInput
            style={styles.input}
            value={reference}
            onChangeText={setReference}
            placeholder="Introduce la referencia de la reserva"
            placeholderTextColor="rgba(223,244,255,0.35)"
          />
        </View>

        <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={getSharedLocation}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color="#03141A" />
            ) : (
              <>
                <Ionicons name="locate-outline" size={18} color="#03141A" />
                <Text style={styles.buttonText}>Obtener ubicacion</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {isLoading && (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#00F4F5" style={styles.loader} />
          <Text style={styles.loaderText}>Consultando ubicacion...</Text>
        </View>
      )}

      {location && (
        <View style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <Text style={styles.mapTitle}>Ubicacion actual</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <Mapbox.MapView
            style={styles.map}
            styleURL={MapboxStyles.DARK}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <Mapbox.Camera
              zoomLevel={15}
              centerCoordinate={[location.lng, location.lat]}
              animationDuration={1000}
            />

            <Mapbox.PointAnnotation id="shared-location" coordinate={[location.lng, location.lat]}>
              <View>
                <Image source={carIcon} style={styles.carIcon} />
              </View>
            </Mapbox.PointAnnotation>
          </Mapbox.MapView>
        </View>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgGlowOne: {
    position: "absolute",
    top: -130,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(0,229,255,0.22)",
  },
  bgGlowTwo: {
    position: "absolute",
    bottom: -140,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(14,165,233,0.18)",
  },
  bgOrb: {
    position: "absolute",
    top: "24%",
    left: "42%",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  bgOrbInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(0,229,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bgGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.16)",
  },
  iconBtnPlaceholder: {
    width: 42,
    height: 42,
  },
  headerText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#EAFBFF",
    letterSpacing: 0.2,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(8,15,29,0.78)",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#00E5FF",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sectionTitle: {
    color: "#EAFBFF",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(223,244,255,0.82)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  inputWrap: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(5,13,24,0.7)",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#EAFBFF",
  },
  button: {
    backgroundColor: "#00F4F5",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#03141A",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  loaderWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,15,29,0.72)",
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  loader: {
    marginBottom: 8,
  },
  loaderText: {
    fontSize: 13,
    color: "rgba(223,244,255,0.82)",
    fontWeight: "700",
  },
  mapCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(8,15,29,0.78)",
    padding: 12,
    minHeight: 260,
  },
  mapHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mapTitle: {
    color: "#EAFBFF",
    fontSize: 15,
    fontWeight: "800",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.2)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.45)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  liveText: {
    color: "#B8FFE2",
    fontSize: 12,
    fontWeight: "700",
  },
  map: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  carIcon: {
    width: 40,
    height: 40,
  },
});

export default ReceiveLocationScreen;
