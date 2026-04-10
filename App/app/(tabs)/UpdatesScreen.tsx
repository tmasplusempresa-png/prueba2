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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/scripts/theme";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const UpdatesScreen = () => {
  const navigation = useNavigation();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const { currentlyRunning, isUpdateAvailable, isUpdatePending } =
    Updates.useUpdates();
  const [loading, setLoading] = useState(false);
  const fadeAnim = new Animated.Value(0); // para animar la opacidad

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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
      navigation.goBack();
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
    <Animated.View style={[styles.mainView, { opacity: fadeAnim }]}>
      <View style={styles.container}>
        <Image
          style={styles.logo}
          source={require("../../assets/images/logo1024x1024.png")}
        />

        <Text style={styles.headerText}>Actualización de la App</Text>
        <Text style={styles.version}>Versión actual: V1</Text>
        <Text style={styles.infoText}>{runTypeMessage}</Text>

        {showDownloadButton && (
          <View style={styles.updateBanner}>
            <Text style={styles.updateBannerText}>{updateMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={checkForUpdates}
          style={styles.checkUpdatesButton}
        >
          <Text style={styles.checkUpdatesButtonText}>
            Buscar actualizaciones
          </Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        ) : showDownloadButton ? (
          <View style={styles.updateContainer}>
            <Text style={styles.updateText}>Actualización disponible</Text>

            <TouchableOpacity
              onPress={() => Updates.fetchUpdateAsync()}
              style={styles.downloadButton}
            >
              <Text style={styles.downloadButtonText}>
                Descargar actualización
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.noUpdateText, { borderRadius: 14 }]}
          >
            <Text style={{ margin: 10, color: "#fff" }}>
              No hay nuevas actualizaciones. Regresar
            </Text>
          </TouchableOpacity>

         
        )}
      </View>
      <Modal
        transparent={true}
        visible={successModalVisible}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successModalContainer}>
          <Animated.View
            style={[styles.successModalView, { opacity: fadeAnim }]}
          >
            <Ionicons name="information-circle" size={48} color="#fff" />
            <Text style={styles.successModalText}>No hay Actualizaciones disponibles</Text>
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
    backgroundColor:
      "linear-gradient(0deg, rgba(166,158,158,0.6461178221288515) 0%, rgba(255,113,113,0.7077424719887955) 47%, rgba(255,255,255,1) 70%)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    width: "90%",
  },
  logo: {
    width: width / 3,
    height: width / 3,
    borderRadius: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00f4f5",
    marginBottom: 10,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: colors.DRIVER_RATING_TEXT,
    textAlign: "center",
    marginBottom: 20,
  },
  updateContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  updateText: {
    fontSize: 18,
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  noUpdateText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
    backgroundColor: "#333",
  },
  updateBanner: {
    backgroundColor: "#E0F7FA",
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    width: "100%",
  },
  updateBannerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.WHITE,
    textAlign: "center",
  },
  checkUpdatesButton: {
    backgroundColor: "#00f4f5",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginVertical: 10,
  },
  checkUpdatesButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.WHITE,
    textAlign: "center",
  },
  downloadButton: {
    backgroundColor: "#00f4f5",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: "center",
  },
  downloadButtonText: {
    color: colors.WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },
  version: {
    fontSize: 14,
    fontWeight: "bold",
    margin: 5,
  },
  successModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  successModalView: {
    width: 250,
    padding: 20,
    backgroundColor: "#00f4f5",
    borderRadius: 10,
    alignItems: "center",
    elevation: 10,
  },
  successModalText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
});

export default UpdatesScreen;

