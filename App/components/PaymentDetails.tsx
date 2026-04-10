import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
} from "react-native";
import { database } from "@/config/SupabaseConfig";
import { ref, get } from "firebase/database";

const PaymentDetails = ({ isPayment, onSelectPayment  }) => {
    const [paymentOptions, setPaymentOptions] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState("Large Payment");
  
    useEffect(() => {
      fetchpaymentOptionsFromFirebase();
    }, []);
  
    const fetchpaymentOptionsFromFirebase = async () => {
      try {
        const paymentModeRef = ref(database, "payment_mode");
        const snapshot = await get(paymentModeRef);
  
        if (snapshot.exists()) {
          const data = snapshot.val();
          const options = Object.keys(data).map((key) => ({
            value: key,
            name: data[key].payment,
            paymentImage: data[key].image || "",
          }));
          setPaymentOptions(options);
          if (options.length > 0) {
            setSelectedPayment(options[0].value);
          }
        } else {
          //console.log("No hay datos disponibles");
        }
      } catch (error) {
        console.error("Error obteniendo datos:", error);
      }
    };
  
    const handlePaymentOptionPress = (payment: never) => {
        onSelectPayment(payment);
    };
  
    const renderpaymentOptions = () => {
      return paymentOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.PaymentOption,
            selectedPayment === option.value && styles.selectedPaymentOption,
          ]}
          onPress={() => handlePaymentOptionPress(option)}
        >
          <Image
            source={
              option.carImage
                ? { uri: option.carImage }
                : require("./../assets/images/microBlackCar.png")
            }
            style={styles.PaymentIcon}
          />
          <View
            style={{
              alignItems: "flex-start",
              justifyContent: "flex-start",
              width: 250,
            }}
          >
            <Text style={styles.PaymentType}>{option.name}</Text>
            <Text style={styles.PaymentInfo}>{option.service}</Text>
            <Text style={styles.PaymentPrice}>
              Est: ${option.price} - {option.base_fare}
            </Text>
          </View>
        </TouchableOpacity>
      ));
    };
  
    return (
      <Modal visible={isPayment} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.container}>{renderpaymentOptions()}</View>
        </View>
      </Modal>
    );
  };

const styles = StyleSheet.create({})

export default PaymentDetails;
