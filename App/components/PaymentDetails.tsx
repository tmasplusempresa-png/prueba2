import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Opciones de pago fijas — si en el futuro se crea tabla payment_modes en Supabase,
// se puede agregar un fetch aquí.
const DEFAULT_PAYMENT_OPTIONS = [
  { value: "cash",      name: "Efectivo",   icon: "cash-outline" },
  { value: "nequi",     name: "Nequi",      icon: "phone-portrait-outline" },
  { value: "daviplata", name: "Daviplata",  icon: "card-outline" },
  { value: "transfer",  name: "Transferencia", icon: "swap-horizontal-outline" },
];

const PaymentDetails = ({ isPayment, onSelectPayment }: any) => {
  const [selectedPayment, setSelectedPayment] = useState(DEFAULT_PAYMENT_OPTIONS[0].value);

  const handlePaymentOptionPress = (option: any) => {
    setSelectedPayment(option.value);
    onSelectPayment(option);
  };

  return (
    <Modal visible={isPayment} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.container}>
          {DEFAULT_PAYMENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.PaymentOption,
                selectedPayment === option.value && styles.selectedPaymentOption,
              ]}
              onPress={() => handlePaymentOptionPress(option)}
            >
              <Ionicons name={option.icon as any} size={26} color={selectedPayment === option.value ? "#00d4d7" : "#fff"} style={{ marginRight: 14 }} />
              <Text style={[styles.PaymentType, selectedPayment === option.value && { color: "#00d4d7" }]}>
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  container: { backgroundColor: "#1a1a2e", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  PaymentOption: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 10, backgroundColor: "#2a2a3e" },
  selectedPaymentOption: { borderWidth: 1.5, borderColor: "#00d4d7" },
  PaymentType: { fontSize: 16, color: "#fff", fontWeight: "600" },
});

export default PaymentDetails;
