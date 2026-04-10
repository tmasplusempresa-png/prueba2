import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { database } from "@/config/SupabaseConfig";
import { ref, get } from "firebase/database";
import { FareCalculator } from "@/common/actions/FareCalculator";

const roundPrice = (price) => {
  const remainder = price % 100;
  if (remainder > 0 && remainder <= 50) {
    return price - remainder + 50;
  } else if (remainder > 50) {
    return price - remainder + 100;
  }
  return price;
};

const CarDetails = ({ visible, onSelectVehicle, distance, duration, tolls, isScheduled }) => {
  const [taxiOptions, setTaxiOptions] = useState([]);
  const [selectedTaxi, setSelectedTaxi] = useState("Large Taxi");
  
  useEffect(() => {
    if (visible) {
      fetchTaxiOptionsFromFirebase();
    }
  }, [visible]);

  const fetchTaxiOptionsFromFirebase = async () => {
    try {
      const cartypesRef = ref(database, "cartypes");
      const snapshot = await get(cartypesRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
    const options = await Promise.all(Object.keys(data).map(async (key) => {
  const vehicle = {
    value: key,
    name: data[key].name,
    capacity: data[key].typeService,
    service: data[key].extra_info,
    carImage: data[key].image || "",
    base_fare: data[key].base_fare || 0,
    rate_per_unit_distance: data[key].rate_per_unit_distance || 0,
    rate_per_hour: data[key].rate_per_hour || 0,
    min_fare: data[key].min_fare || 0,
    convenience_fees: data[key].convenience_fees || 0,
    convenience_fee_type: data[key].convenience_fee_type || "flat",
  };

  const response = await fetch('https://us-central1-treasupdate.cloudfunctions.net/calculatePrice2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bookingData: {
        roundedDistance: parseFloat(distance)/1000,
        durationMinutes: parseFloat(duration)/60,
        carType: vehicle,
      },
      tolls: [],
      isScheduled,
      settings: {
        decimal: 2,
        distanceIntermunicipal: 50,
      },
      addressOrigin: "Origen",
      addressDestination: "Destino",
      selectedPaymentMethod: "cash",
      selectedUser: null,
      authState: null,
      filteredUsers: [],
    }),
  });

  const fareDetails = await response.json();
  console.log(distance,"jansjkasnjdsanjasbn")
  return {
    ...vehicle,
    estimatedPrice: fareDetails ? fareDetails.estimateFare : 0,
  };
}));


        setTaxiOptions(options);
        console.log(options,"options")
        if (options.length > 0) {
          setSelectedTaxi(options[0].value);
        }
      }
    } catch (error) {
      console.error("Error obteniendo datos:", error);
    }
  };

  const getPrice = (bookingData, tolls, isScheduled) => {
    const { roundedDistance, durationMinutes, carType } = bookingData;

    if (!carType) {
      console.error("carType is undefined");
      return null;
    }

    let { totalCost, grandTotal, convenience_fees } = FareCalculator(
      roundedDistance,
      durationMinutes * 60,
      carType,
      {},
      2
    );

    if (isNaN(totalCost) || isNaN(grandTotal) || isNaN(convenience_fees)) {
      console.error("Calculation resulted in NaN values:", {
        totalCost,
        grandTotal,
        convenience_fees,
      });
      return null;
    }

    const tollsCost = tolls.reduce((acc, toll) => acc + toll.PriceToll, 0);
    grandTotal += tollsCost * 2;

    if (isScheduled) {
      grandTotal += 4000;
    }

    return {
      totalCost: totalCost,
      estimateFare: grandTotal,
      estimateTime: durationMinutes,
      convenienceFees: convenience_fees,
      driverShare: grandTotal - convenience_fees,
      tollsCost: tollsCost,
    };
  };

  const handleTaxiOptionPress = (vehicle) => {
    onSelectVehicle(vehicle); // Pass back the selected vehicle
    setSelectedTaxi(vehicle.value);
  };

  const renderTaxiOptions = () => {
    
    return taxiOptions.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.taxiOption,
          selectedTaxi === option.value && styles.selectedTaxiOption,
        ]}
        onPress={() => handleTaxiOptionPress(option)}
      >
        <Image
          source={
            option.carImage
              ? { uri: option.carImage }
              : require("./../assets/images/microBlackCar.png")
          }
          style={styles.taxiIcon}
        />
        <View style={styles.optionDetails}>
          <Text style={styles.taxiType}>{option.name}</Text>
          <Text style={[styles.taxiInfo, { color: "#E91E63" }]}>
            Servicio {option.capacity}
          </Text>
          <Text style={styles.taxiPrice}>
            Valor estimado: ${option.estimatedPrice} - $
            {option.estimatedPrice + 7000}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderTaxiOptions()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    maxHeight: "50%",
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  selectedTaxiOption: {
    borderColor: "#00f4f5",
    borderWidth: 2,
    shadowColor: "#00f4f5",
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  taxiIcon: {
    height: 88,
    width: 88,
    resizeMode: "contain",
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  taxiOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
    height: 100,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  taxiPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  taxiInfo: {
    fontSize: 14,
    color: "#777",
    fontWeight: "bold",
    marginVertical: 5,
  },
  taxiType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  optionDetails: {
    flex: 1,
    justifyContent: "center",
  },
});

export default CarDetails;

