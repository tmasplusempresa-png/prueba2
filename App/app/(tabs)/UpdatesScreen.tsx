import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Modal,
  LinearGradient,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/scripts/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const UpdatesScreen = () => {
  const navigation = useNavigation();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const { currentlyRunning, isUpdateAvailable, isUpdatePending } =
    Updates.useUpdates();
  const [loading, setLoading] = useState(false);
  
  // Animaciones
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const slideAnim = new Animated.Value(50);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
    
    // Animación de entrada: fade + scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso infinito para el logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isUpdatePending]);

  const checkForUpdates = async () => {
    setLoading(true);
    const update = await Updates.checkForUpdateAsync();
    setLoading(false);

    if (!update.isAvailable) {
      // Mostrar el modal de éxito con animación
      setSuccessModalVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setSuccessModalVisible(false));
      }, 2000);
      setTimeout(() => navigation.goBack(), 2500);
    }
  };

  const showDownloadButton = isUpdateAvailable;
  const runTypeMessage = currentlyRunning.isEmbeddedLaunch
    ? "Esta aplicación se está ejecutando desde el código integrado."
    : "Esta aplicación está ejecutando una actualización descargada.";

  const updateMessage = showDownloadButton
    ? "¡Nueva actualización disponible! Descárgala ahora."
    : "No hay actualizaciones disponibles.";

  return (
    <ExpoLinearGradient
      colors={["#06113C", "#0079FF", "#00E5FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.mainView}
    >
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        {/* Contenedor principal con tarjeta */}
        <View style={styles.container}>
          {/* Logo con pulso */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <ExpoLinearGradient
              colors={["#00E5FF", "#0079FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Image
                style={styles.logo}
                source={require("../../assets/images/logo1024x1024.png")}
              />
            </ExpoLinearGradient>
          </Animated.View>

          {/* Header */}
          <Text style={styles.headerText}>Actualización de la App</Text>
          <Text style={styles.version}>Versión actual: V1</Text>

          {/* Info y status */}
          <View style={styles.statusContainer}>
            <View style={styles.statusIndicator}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.PROMO_TEXT_COLOR}
              />
              <Text style={styles.statusText}>{runTypeMessage}</Text>
            </View>
          </View>

          {/* Update Banner */}
          {showDownloadButton && (
            <ExpoLinearGradient
              colors={["#FE805D", "#FF6B6B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.updateBanner}
            >
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color={colors.WHITE}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.updateBannerText}>{updateMessage}</Text>
            </ExpoLinearGradient>
          )}

          {/* Botón principal: Buscar actualizaciones */}
          <TouchableOpacity
            onPress={checkForUpdates}
            activeOpacity={0.8}
            style={styles.checkUpdatesButton}
          >
            <ExpoLinearGradient
              colors={["#00E5FF", "#00B4CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.WHITE} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="refresh"
                    size={18}
                    color={colors.WHITE}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.checkUpdatesButtonText}>
                    Buscar actualizaciones
                  </Text>
                </>
              )}
            </ExpoLinearGradient>
          </TouchableOpacity>

          {/* Botón de descarga o sin actualizaciones */}
          {showDownloadButton && !loading ? (
            <View style={styles.updateContainer}>
              <View style={styles.divider} />
              <Text style={styles.updateText}>Actualización disponible</Text>

              <TouchableOpacity
                onPress={() => Updates.fetchUpdateAsync()}
                activeOpacity={0.8}
                style={styles.downloadButton}
              >
                <ExpoLinearGradient
                  colors={["#FE805D", "#FF6B6B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <MaterialCommunityIcons
                    name="download"
                    size={18}
                    color={colors.WHITE}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.downloadButtonText}>
                    Descargar actualización
                  </Text>
                </ExpoLinearGradient>
              </TouchableOpacity>
            </View>
          ) : !loading ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={styles.noUpdateButton}
            >
              <ExpoLinearGradient
                colors={["#06113C", "#0B1A2E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <MaterialCommunityIcons
                  name="check-all"
                  size={18}
                  color={colors.WHITE}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.noUpdateButtonText}>
                  No hay nuevas actualizaciones. Regresar
                </Text>
              </ExpoLinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      {/* Modal de éxito */}
      <Modal
        transparent={true}
        visible={successModalVisible}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successModalContainer}>
          <Animated.View
            style={[
              styles.successModalView,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <ExpoLinearGradient
              colors={["#00E5FF", "#0079FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successModalGradient}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={56}
                color={colors.WHITE}
              />
              <Text style={styles.successModalText}>
                Aplicación actualizada
              </Text>
              <Text style={styles.successModalSubtext}>
                No hay nuevas actualizaciones disponibles
              </Text>
            </ExpoLinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </ExpoLinearGradient>
  );
};

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentWrapper: {
    width: "100%",
    alignItems: "center",
  },
  container: {
    backgroundColor: "rgba(6, 17, 60, 0.9)",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    width: "95%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.3)",
  },
  logoContainer: {
    marginBottom: 25,
  },
  logoGradient: {
    padding: 12,
    borderRadius: 20,
  },
  logo: {
    width: width / 3.5,
    height: width / 3.5,
    borderRadius: 16,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#00E5FF",
    marginBottom: 8,
    textAlign: "center",
  },
  version: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00E5FF",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  statusContainer: {
    width: "100%",
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 121, 255, 0.15)",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#00E5FF",
  },
  statusText: {
    fontSize: 13,
    color: "#E0E0E0",
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  updateBanner: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  updateBannerText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.WHITE,
    flex: 1,
  },
  checkUpdatesButton: {
    width: "100%",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  checkUpdatesButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.WHITE,
    textAlign: "center",
  },
  downloadButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 14,
  },
  downloadButtonText: {
    color: colors.WHITE,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  updateContainer: {
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  updateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00E5FF",
    marginBottom: 14,
    marginTop: 10,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: "#00E5FF",
    borderRadius: 2,
    marginBottom: 14,
  },
  noUpdateButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  noUpdateButtonText: {
    color: colors.WHITE,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  successModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(6, 17, 60, 0.7)",
  },
  successModalView: {
    width: 280,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  successModalGradient: {
    padding: 30,
    alignItems: "center",
  },
  successModalText: {
    color: colors.WHITE,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  successModalSubtext: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default UpdatesScreen;

