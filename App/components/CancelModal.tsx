
import React, { useState } from 'react';
import { View, Modal, Text, Button, Animated } from 'react-native';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import RadioForm from 'react-native-simple-radio-button';
import { useDispatch } from 'react-redux';
import { cancelBooking } from '@/common/store/bookingsSlice.ts';  // Asegúrate de importar la acción correcta
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";

const CancelModal = ({ isVisible, onClose, currentBooking, user }) => {
  const dispatch = useDispatch();
  const [cancelReason, setCancelReason] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0)); // Animación de fade

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('error');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info' | 'confirm', title: string, message: string, buttons?: AlertButton[]) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  const cancelReasons = [
    { label: 'Incapaz de contactar con el conductor', value: 'Incapaz de contactar con el conductor' },
    { label: 'El vehículo no se mueve en mi dirección.', value: 'El vehículo no se mueve en mi dirección.' },
    { label: 'Mi motivo no aparece en la lista.', value: 'Mi motivo no aparece en la lista.' },
    { label: 'Conductor se ha negado a prestar el servicio', value: 'Conductor se ha negado a prestar el servicio' },
    { label: 'El conductor está tomando mucho tiempo', value: 'El conductor está tomando mucho tiempo' },
    { label: 'Error al Programar en Fecha y Hora.', value: 'Error al Programar en Fecha y Hora.' },
    { label: 'Ya no requiero el servicio.', value: 'Ya no requiero el servicio' },
  ];

  const handleCancelBooking = () => {
    try {
      console.log("currentBooking:", currentBooking);  // Asegúrate de que este objeto sea correcto
      dispatch(
        cancelBooking({
          booking: currentBooking,
          reason: cancelReason,
          cancelledBy: user.usertype,
        })
      ).unwrap();
     

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
      onClose();  // Cierra el modal
    } catch (error) {
      showAlert('error', 'Error', `No se pudo cancelar la reserva: ${error}`);
    }
  };

  const handleReasonSelect = (value) => {
    setCancelReason(value);
    setIsButtonDisabled(false); // Habilitar el botón cuando se selecciona una razón
  };

  return (
    <>
    <Modal visible={isVisible} transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecciona el motivo de cancelación</Text>
          <RadioForm
            radio_props={cancelReasons}
            initial={null}
            onPress={handleReasonSelect}
            buttonColor={'#00f4f5'}
            selectedButtonColor={'#00f4f5'}
            labelStyle={{ fontSize: 16, color: '#000' }}
            radioStyle={{ marginBottom: 15 }}
          />
          <View style={styles.buttonContainer}>
            <Button color={'#00f4f5'}
              title="Cerrar" onPress={onClose} />
            <Button
              title="Cancelar Viaje"
              onPress={handleCancelBooking}
              disabled={isButtonDisabled}  // Deshabilitar si no se selecciona motivo
              color={isButtonDisabled ? '#ccc' : '#00f4f5'}
            />
          </View>
        </View>
      </View>
      <Modal
        transparent={true}
        visible={successModalVisible}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successModalContainer}>
          <Animated.View style={[styles.successModalView, { opacity: fadeAnim }]}>
            <Ionicons name="checkmark-circle" size={48} color="#fff" />
            <Text style={styles.successModalText}>Actualizado con éxito</Text>
          </Animated.View>
        </View>
      </Modal>
    </Modal>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />
    </>
  );
};

const styles = {
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
};

export default CancelModal;
