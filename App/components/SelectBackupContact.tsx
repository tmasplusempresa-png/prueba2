import React from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet } from "react-native";

const SelectBackupContact = ({ contacts, onSelect, visible, onClose }) => {
  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => onSelect(item)}>
      <Text style={styles.contactName}>{item.name}</Text>
      <Text style={styles.contactPhone}>{item.mobile}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Selecciona un Contacto de Respaldo</Text>
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.mobile}
        />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  contactItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  contactName: {
    fontSize: 18,
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#00f4f5",
    alignItems: "center",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default SelectBackupContact;
