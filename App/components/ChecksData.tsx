import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "react-native-elements";
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth"; // Asegúrate de tener Firebase Auth configurado

const ChecksData = ({ visible, onClose, checks }) => {
  const navigation = useNavigation();
  // TEMPORALMENTE DESHABILITADO - Pendiente configurar Supabase email verification
  // const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true); // Bypass temporal
  console.log("checks adentro", checks);
  /* useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setIsEmailVerified(user.emailVerified);
    }
  }, []);

  useEffect(() => {
    if (!isEmailVerified && visible) {
      onClose(); // Cierra el modal si el email no está verificado
      navigation.navigate("EmailVerificationScreen"); // Navega a una pantalla de verificación de email si lo deseas
    }
  }, [isEmailVerified, visible]); */

  const handleResolveIssue = (issue) => {
    console.log("issue", issue);
    switch (issue) {
      case "carExists":
        navigation.navigate("CarsScreen");
        break;
      case "licenseImage":
        navigation.navigate("ImageGallery");
        break;
      case "verifyId":
        navigation.navigate("Docs");
        break;
      case "SOATImage":
        navigation.navigate("ImageGallery");
        break;
      default:
        break;
    }
    onClose(); // Cierra el modal al navegar a otra pantalla
  };

  const renderSequentialCheck = () => {
    //console.log("checks", checks);
    if (!checks.carExists) {
      return renderCheckItem("carExists", "Registra un coche.", "car-sport-outline");
    }
    if (!checks.licenseImage) {
      return renderCheckItem("licenseImage", "Cargar licencia de conducir.", "card-outline");
    }
    if (!checks.verifyId) {
      return renderCheckItem("verifyId", "Sube tu documento.", "id-card-outline");
    }
    if (!checks.SOATImage) {
      return renderCheckItem("SOATImage", "Sube tu SOAT.", "document-outline");
    }
    if (!checks.carApproved) {
      return renderCheckItem("carApproved", "Aprobación del vehículo.", "document-outline");
    }
    return null;
  };

  const renderCheckItem = (check, message, iconName) => (
    <View key={check} style={styles.checkItemContainer}>
      <Icon name={iconName} type="ionicon" color="#E91E63" size={24} />
      <Text style={styles.warningText}>{message}</Text>
      <TouchableOpacity
        style={styles.resolveButton}
        onPress={() => handleResolveIssue(check)}
      >
        <Text style={styles.resolveButtonText}>Resolver</Text>
      </TouchableOpacity>
    </View>
  );

  // TEMPORALMENTE DESHABILITADO
  /* if (!isEmailVerified) {
    return null; // No renderizar nada si el email no está verificado
  } */

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Completa los siguientes pasos:</Text>
          {renderSequentialCheck()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 340,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  checkItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
    justifyContent: "space-between",
  },
  warningText: {
    fontSize: 16,
    color: "#000",
    marginLeft: 10,
    flex: 1,
  },
  resolveButton: {
    backgroundColor: "#00f4f5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  resolveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ChecksData;

