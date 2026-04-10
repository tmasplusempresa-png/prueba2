import { RootState } from '@/common/store';
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

const CountdownModal = ({ visible, countdown, otp, onClose }) => {
    const user = useSelector((state: RootState) => state.auth.user);
  // Formatear el tiempo en MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
    >
      <View style={styles.centeredView}>

        {user.usertype === 'driver' ?
          <View style={styles.modalView}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>Tiempo restante de espera: {formatTime(countdown)}</Text>
          ) : (
            <Text style={styles.otpText}>OTP: {otp}</Text>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        
        : 
        <View style={styles.modalView}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }} >
                Tu conductor te esta esperando...
            </Text>
            <Text style={{ textAlign: 'justify', margin: 8,  fontSize: 14 }} >
             Si el contador llega a 0 se le enviara el Cod de Seg al conductor y podra inicar el viaje 
            </Text>
            <Text style={styles.countdownText}>Tiempo restante: {formatTime(countdown)}</Text>

            <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        }

      
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 300,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  countdownText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: "center"
  },
  otpText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'red',
    textAlign: "center"
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#00f4f5",
    borderRadius: 5,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default CountdownModal;
