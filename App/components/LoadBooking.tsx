import React from "react";
import { StyleSheet, View, Text, Modal, Image, ScrollView } from "react-native";
//import StarRating from 'react-native-star-rating-widget';
import moment from "moment"; // Asegúrate de tener este paquete instalado
import "moment/locale/es"; // Si deseas usar localización en español

const LoadBooking = ({ visibleLoad, bookingData }) => {
  return (
    <Modal visible={visibleLoad} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Estamos procesando tu reserva ...</Text>
          <Text style={styles.subtitle}>Tu viaje comenzará pronto</Text>

          <View style={{ height: 100, margin: 10 }}>
           
          </View>
          <View style={styles.loader}>
            <Image
              source={require("./../assets/images/load.gif")}
              resizeMode={"contain"}
              style={{ width: "100%", height: 320, alignSelf: "center" }}
            />
          </View>
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
  container: {
    position: "absolute",
    alignItems: "center",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
  },
  mapContainer: {
    width: "100%",
    height: 200,
    marginBottom: 20,
  },
  loader: {
    width: 280,
    height: 150,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    marginTop: 30,
  },
  vew: {
    height: 100,
    marginBottom: 20,
    borderColor: "black",
    borderRadius: 10,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  accpt: {
    backgroundColor: "#00f4f5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
});

export default LoadBooking;