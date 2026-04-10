import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
const VehicleCard = ({ car, onPress, onDelete }) => {
  const colorScheme = useColorScheme();
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: car.car_image }} style={styles.image} />
      <View style={styles.details}>
        <View style={styles.header}>
          <Text style={styles.title}>{car.vehicleMake} {car.vehicleModel}</Text>
          <TouchableOpacity onPress={onDelete}>
            <FontAwesome name="trash" size={24} color="#00f4f5" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="car" size={18} color="#777" />
          <Text style={styles.infoText}>Tipo: {car.carType}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="paint-brush" size={18} color="#777" />
          <Text style={styles.infoText}>Color: {car.vehicleColor}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="tachometer" size={18} color="#777" />
          <Text style={styles.infoText}>Cilindrada: {car.vehicleCylinders}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="user" size={18} color="#777" />
          <Text style={styles.infoText}>Pasajeros: {car.vehiclePassengers}</Text>
        </View>
        <View style={styles.ownerSection}>
          <Image source={{ uri: car.ownerImage }} style={styles.ownerImage} />
        </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', right: 60, width: '130%',}} >
      <View style={styles.infoRow}>
          <FontAwesome name="check-circle" size={18} color={car.active ? "#00f4f5" : "#494949"} />
          <Text style={[styles.infoText, { color: car.active ? "#00f4f5" : "#494949" }]}>
            Activo: {car.active ? "Sí" : "No"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="thumbs-up" size={18} color={car.approved ? "#00f4f5" : "#494949"} />
          <Text style={[styles.infoText, { color: car.approved ? "#00f4f5" : "#494949" }]}>
            Aprobado: {car.approved ? "Sí" : "No"}
          </Text>
        </View>
      </View>
      </View>
    </TouchableOpacity>
  );
};

const lightStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  image: {
    width: 170,
    height: 120,
    borderRadius: 10,
  },
  details: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    marginLeft: 5,
    color: '#777',
    fontSize: 14,
  },
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

const darkStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 10,
    marginVertical: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  image: {
    width: 170,
    height: 120,
    borderRadius: 10,
  },
  details: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff ',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    marginLeft: 5,
    color: '#777',
    fontSize: 14,
  },
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
export default VehicleCard;
