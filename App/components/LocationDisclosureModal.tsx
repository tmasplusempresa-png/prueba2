import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Prominent Disclosure exigida por Google Play antes de pedir el permiso de
 * ubicación en segundo plano (ACCESS_BACKGROUND_LOCATION).
 *
 * Cumple las 4 reglas: (1) indica que recoge ubicación, (2) que es en segundo
 * plano, (3) el propósito, y (4) ofrece consentimiento explícito (Aceptar /
 * Ahora no). Debe mostrarse ANTES del cuadro de permiso del sistema.
 */
const LocationDisclosureModal = ({ visible, onAccept, onDecline }: Props) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={48}
            color="#15e5e9"
            style={styles.icon}
          />
          <Text style={styles.title}>Uso de tu ubicación en segundo plano</Text>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.body}>
              T+Plus recopila datos de tu ubicación,{' '}
              <Text style={styles.bold}>
                también en segundo plano (incluso cuando la app está cerrada o no la
                estás usando)
              </Text>
              , para:
            </Text>

            <Text style={styles.bullet}>
              • Compartir tu ubicación en tiempo real con el pasajero mientras un viaje
              está activo.
            </Text>
            <Text style={styles.bullet}>
              • Mostrar tu recorrido y el tiempo estimado de llegada.
            </Text>
            <Text style={styles.bullet}>
              • La seguridad tuya y del pasajero durante el servicio.
            </Text>

            <Text style={styles.body}>
              Solo se utiliza cuando estás disponible o en un viaje como conductor.
              Puedes revocar este permiso en cualquier momento desde los ajustes de tu
              teléfono.
            </Text>

            <View style={styles.tip}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={20}
                color="#15e5e9"
                style={styles.tipIcon}
              />
              <Text style={styles.tipText}>
                Sugerencia: en el siguiente paso selecciona{' '}
                <Text style={styles.bold}>"Permitir todo el tiempo"</Text> para que la
                app funcione de forma óptima y tu ubicación se comparta correctamente
                durante los viajes.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAccept}
            activeOpacity={0.85}
          >
            <Text style={styles.acceptText}>Aceptar y continuar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineBtn}
            onPress={onDecline}
            activeOpacity={0.7}
          >
            <Text style={styles.declineText}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 3, 5, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#04273a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(21, 229, 233, 0.25)',
    padding: 22,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  scroll: {
    maxHeight: 280,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  body: {
    color: '#cfe3ee',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  bold: {
    color: '#ffffff',
    fontWeight: '700',
  },
  bullet: {
    color: '#cfe3ee',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 4,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(21, 229, 233, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(21, 229, 233, 0.30)',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    color: '#e8f7fa',
    fontSize: 14,
    lineHeight: 20,
  },
  acceptBtn: {
    backgroundColor: '#15e5e9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  acceptText: {
    color: '#01060a',
    fontSize: 16,
    fontWeight: '700',
  },
  declineBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  declineText: {
    color: '#8aa1b1',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default LocationDisclosureModal;
