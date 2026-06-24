import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ImageBackground,
  Image,
  ActivityIndicator,
  Modal,
  Linking,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RootState, AppDispatch } from "@/common/store";
import {
  fetchMemberships,
  selectMembershipLoading,
} from "@/common/reducers/membershipSlice";
import Icon from "react-native-vector-icons/Ionicons";
import { useColorScheme } from "react-native";
import { AntDesign } from '@expo/vector-icons';
const NoMembershipScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const { mode } = route.params; // Obtener el modo de los parámetros de la ruta
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector(selectMembershipLoading);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedKm, setSelectedKm] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const styles = colorScheme === "dark" ? darkStyles : lightStyles;
  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchMemberships(user.uid));
    }
  }, [dispatch, user?.uid]);

  const handleSelectPlan = (plan: string, kilometers: string) => {
    setSelectedPlan(plan);
    setSelectedKm(kilometers); // También guardamos los kilómetros seleccionados
  };

  const handleCreateMembership = () => {
    if (!selectedPlan || !selectedKm) {
      alert(
        "Por favor selecciona un plan y una cantidad de kilómetros antes de continuar."
      );
      return;
    }

    const payData = {
      order_id: `${mode}-${user.uid}-${generateReference()}`,
      email: user?.email,
      amount: selectedPlan,
      currency: "COP",
      description: `${
        mode === "membership" ? "Membresía" : "KM"
      } ${selectedPlan}`,
      kilometers: selectedKm, // Añadimos los kilómetros seleccionados al envío de datos
    };

    navigation.navigate("WebViewLayout", { payData });
  };

  const handleAddKilometers = () => {
    if (!selectedPlan || !selectedKm) {
      alert(
        "Por favor selecciona un plan y una cantidad de kilómetros antes de continuar."
      );
      return;
    }

    const payData = {
      order_id: `${mode}-${user.uid}-${generateReference()}`,
      email: user?.email,
      amount: selectedPlan,
      currency: "COP",
      description: `KM ${selectedPlan}`,
      kilometers: selectedKm,
    };

    navigation.navigate("WebViewLayout", { payData });
  };

  const generateReference = () => {
    const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return [...Array(4)].map((_) => c[~~(Math.random() * c.length)]).join("");
  };

  const handlePaymentOption = (option: string) => {
    setModalVisible(false);
    if (option === "PayU") {
      if (mode === "membership") {
        handleCreateMembership();
      } else {
        handleAddKilometers();
      }
    } else if (option === "Daviplata") {
      navigation.navigate("DaviplataPayment", { amount: selectedPlan, mode: mode === "membership" ? "membership" : "kms", kilometers: selectedKm });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00f4f5" />
      </View>
    );
  }

  const terminosWallet = () => {
   
    Linking.openURL(`https://treasapp.com/condiciones-recargas`);
  }

  return (
    <SafeAreaView style={styles.container}>
       <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AntDesign name="arrow-left" size={24} color={colorScheme === "dark" ? "#fff" : "#000"} />
    </TouchableOpacity>
      <ImageBackground
        source={{ uri: "background-image-url" }}
        style={styles.backgroundImage}
      >
        {mode === "membership" ? (
          <Image
            source={require("@/assets/images/iconos3d/8.png")}
            style={{ alignSelf: "center", width: "50%", height: "20%" }}
          />
        ) : (
          <Image
            source={require("@/assets/images/iconos3d/11.png")}
            style={{ alignSelf: "center", width: "50%", height: "20%" }}
          />
        )}
        <Text style={styles.headerText}>
          {mode === "membership" ? "Elige tu Membresía" : "KILOMETROS"}
        </Text>

        {/* New Text and TouchableOpacity for Terms and Conditions */}
        <Text style={styles.termsText}>
          Al hacer la recarga, aceptas los términos y condiciones de la recarga.
        </Text>
        <TouchableOpacity
          onPress={terminosWallet}
        >
          <Text style={styles.linkText}>Ver términos y condiciones</Text>
        </TouchableOpacity>

        <View style={styles.planContainer}>
          {/* Para Membresías: Muestra 96.000 para TREAS-X, TREAS-E, TREAS-Van */}
          {mode === "membership" &&
            (user?.cartype === "TREAS-X" ||
              user?.cartype === "TREAS-E" ||
              user?.cartype === "TREAS-Van") && (
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === "96000" ? styles.selectedPlan : null,
                ]}
                onPress={() => handleSelectPlan("96000", "500")}
              >
                <View style={styles.planDetails}>
                  <Icon
                    name="rocket-outline"
                    size={30}
                    color={colorScheme === "dark" ? "#fff" : "#555"}
                    style={styles.planIcon}
                  />
                  <Text style={styles.planTitle}>Membresía Premium</Text>
                  <Text style={styles.planPrice}>$96.000</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedPlan === "96000" ? styles.radioSelected : null,
                  ]}
                >
                  {selectedPlan === "96000" && (
                    <Icon name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            )}

          {/* Nuevo: Para Membresías con cartype TREAS-T */}
          {mode === "membership" && user?.cartype === "TREAS-T" && (
            <TouchableOpacity
              style={[
                styles.planOption,
                selectedPlan === "36000" ? styles.selectedPlan : null,
              ]}
              onPress={() => handleSelectPlan("36000", "200")}
            >
              <View style={styles.planDetails}>
                <Icon
                  name="star-outline"
                  size={30}
                  color="#555"
                  style={styles.planIcon}
                />
                <Text style={styles.planTitle}>Membresía Básica</Text>
                <Text style={styles.planPrice}>$36.000</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  selectedPlan === "36000" ? styles.radioSelected : null,
                ]}
              >
                {selectedPlan === "36000" && (
                  <Icon name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Para Kilómetros: Muestra planes para TREAS-X */}
          {mode === "kms" && user?.cartype === "TREAS-X" && (
            <>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === "15000" ? styles.selectedPlan : null,
                ]}
                onPress={() => handleSelectPlan("15000", "50")}
              >
                <View style={styles.planDetails}>
                  <Icon
                    name="car-sport-outline"
                    size={30}
                    color="#555"
                    style={styles.planIcon}
                  />
                  <Text style={styles.planTitle}>Paquete 50 KM</Text>
                  <Text style={styles.planPrice}>$15.000</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedPlan === "15000" ? styles.radioSelected : null,
                  ]}
                >
                  {selectedPlan === "15000" && (
                    <Icon name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === "48000" ? styles.selectedPlan : null,
                ]}
                onPress={() => handleSelectPlan("48000", "200")}
              >
                <View style={styles.planDetails}>
                  <Icon
                    name="car-outline"
                    size={30}
                    color="#555"
                    style={styles.planIcon}
                  />
                  <Text style={styles.planTitle}>Paquete 200 KM</Text>
                  <Text style={styles.planPrice}>$48.000</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedPlan === "48000" ? styles.radioSelected : null,
                  ]}
                >
                  {selectedPlan === "48000" && (
                    <Icon name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === "96000" ? styles.selectedPlan : null,
                ]}
                onPress={() => handleSelectPlan("96000", "500")}
              >
                <View style={styles.planDetails}>
                  <Icon
                    name="rocket-outline"
                    size={30}
                    color="#555"
                    style={styles.planIcon}
                  />
                  <Text style={styles.planTitle}>Paquete 500 KM</Text>
                  <Text style={styles.planPrice}>$96.000</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedPlan === "96000" ? styles.radioSelected : null,
                  ]}
                >
                  {selectedPlan === "96000" && (
                    <Icon name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.trialButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.trialButtonText}>
            {mode === "membership"
              ? "Obtener Membresía"
              : "PAQUETE KILOMETROS"}
          </Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Selecciona una opción de pago</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handlePaymentOption("Daviplata")}
              >
                <Text style={styles.modalButtonText}>Daviplata</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handlePaymentOption("PayU")}
              >
                <Text style={styles.modalButtonText}>PayU</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  planContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    
    
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
},
  planOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginVertical: 10,
    elevation: 3,
    backgroundColor: "#fff"
  },
  planDetails: {
    flex: 1,
    marginLeft: 10,
  },
  saveBadge: {
    color: "#00f4f5",
    fontWeight: "bold",
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
    color: "#333",
  },
  planPrice: {
    fontSize: 16,
    color: "#666",
  },
  planIcon: {
    marginBottom: 5,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedPlan: {
    borderColor: "#00f4f5",
    backgroundColor: "#E0F7FA",
    shadowColor: "#00f4f5",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  radioSelected: {
    backgroundColor: "#00f4f5",
    borderColor: "#00f4f5",
  },
  trialButton: {
    backgroundColor: "#00f4f5",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignSelf: "center",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  trialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#00f4f5",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  termsText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginVertical: 10,
  },
  linkText: {
    fontSize: 14,
    textAlign: "center",
    color: "#00f4f5",
    textDecorationLine: "underline",
  },
});
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#474747"
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#FFF",
  },
  planContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    
  },
  planOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: "#000",
    elevation: 3,
  },
  planDetails: {
    flex: 1,
    marginLeft: 10,
    
  },
  saveBadge: {
    color: "#00f4f5",
    fontWeight: "bold",
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
    color: "#fff",
  },
  planPrice: {
    fontSize: 16,
    color: "#cacaca",
  },
  planIcon: {
    marginBottom: 5,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedPlan: {
    borderColor: "#00f4f5",
    backgroundColor: "#E0F7FA",
    shadowColor: "#00f4f5",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  radioSelected: {
    backgroundColor: "#00f4f5",
    borderColor: "#00f4f5",
  },
  trialButton: {
    backgroundColor: "#00f4f5",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignSelf: "center",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  trialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#00f4f5",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  termsText: {
    fontSize: 14,
    textAlign: "center",
    color: "#cacaca",
    marginVertical: 10,
  },
  linkText: {
    fontSize: 14,
    textAlign: "center",
    color: "#00f4f5",
    textDecorationLine: "underline",
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    color: "#fff"
},
});

export default NoMembershipScreen;
