/**
 * IncomingCallModal - Modal para recibir llamadas
 * =============================================
 * 
 * Muestra una interfaz de llamada entrante con opciones
 * de aceptar o rechazar.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Vibration from 'expo-haptics';

const { width } = Dimensions.get('window');

export interface IncomingCallData {
  callerId: string;
  callerName: string;
  callerPhone: string;
  callerImage?: string;
}

interface IncomingCallModalProps {
  visible: boolean;
  caller: IncomingCallData | null;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  caller,
  onAccept,
  onReject,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible && caller) {
      // Animación de entrada
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulso continuo
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(pulse).start();

      // Vibración
      Vibration.notification();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, caller]);

  const handleAccept = () => {
    Vibration.selection();
    onAccept();
  };

  const handleReject = () => {
    Vibration.notification();
    onReject();
  };

  if (!caller) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      hardwareAccelerated
    >
      <View style={s.container}>
        {/* Fondo oscuro */}
        <View style={s.backdrop} />

        {/* Contenido de llamada */}
        <Animated.View
          style={[
            s.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Avatar */}
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
            }}
          >
            {caller.callerImage ? (
              <Image
                source={{ uri: caller.callerImage }}
                style={s.avatar}
              />
            ) : (
              <View style={[s.avatar, s.avatarDefault]}>
                <Ionicons name="person" size={60} color="#00E5FF" />
              </View>
            )}
          </Animated.View>

          {/* Info del usuario */}
          <Text style={s.callerName}>{caller.callerName}</Text>
          <Text style={s.callerPhone}>{caller.callerPhone}</Text>

          <Text style={s.statusText}>Llamada entrante...</Text>

          {/* Botones */}
          <View style={s.buttonsContainer}>
            {/* Botón Rechazar */}
            <TouchableOpacity
              style={[s.button, s.rejectBtn]}
              onPress={handleReject}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Botón Aceptar */}
            <TouchableOpacity
              style={[s.button, s.acceptBtn]}
              onPress={handleAccept}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    width: width * 0.85,
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00E5FF',
    zIndex: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#00E5FF',
  },
  avatarDefault: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerPhone: {
    fontSize: 14,
    color: '#00E5FF',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#E91E63',
  },
  acceptBtn: {
    backgroundColor: '#00E676',
  },
});

export default IncomingCallModal;

