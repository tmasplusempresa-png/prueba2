import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OTPSystemDebugProps {
  selectedVehicle: any;
  origin: any;
  destination: any;
  distance: number | string;
  duration: number | string;
  otp: string;
  showOtpModal: boolean;
  taxiOptions: any[];
  user: any;
  selectedPaymentType: string;
}

export const OTPSystemDebug: React.FC<OTPSystemDebugProps> = ({
  selectedVehicle,
  origin,
  destination,
  distance,
  duration,
  otp,
  showOtpModal,
  taxiOptions,
  user,
  selectedPaymentType,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const STATUS_CHECKS = [
    { 
      label: 'User', 
      status: user?.id ? 'OK' : 'ERROR', 
      value: user?.first_name || 'N/A',
      icon: user?.id ? '✅' : '❌'
    },
    { 
      label: 'Vehículos', 
      status: taxiOptions.length > 0 ? 'OK' : 'LOADING', 
      value: `${taxiOptions.length} vehículos`,
      icon: taxiOptions.length > 0 ? '✅' : '⏳'
    },
    { 
      label: 'Seleccionado', 
      status: selectedVehicle ? 'OK' : 'PENDING', 
      value: selectedVehicle?.name || 'None',
      icon: selectedVehicle ? '✅' : '⏳'
    },
    { 
      label: 'Origen', 
      status: origin?.title ? 'OK' : 'PENDING', 
      value: origin?.title?.slice(0, 20) || 'N/A',
      icon: origin?.title ? '✅' : '⏳'
    },
    { 
      label: 'Destino', 
      status: destination?.title ? 'OK' : 'PENDING', 
      value: destination?.title?.slice(0, 20) || 'N/A',
      icon: destination?.title ? '✅' : '⏳'
    },
    { 
      label: 'Distancia', 
      status: distance ? 'OK' : 'PENDING', 
      value: `${distance} km`,
      icon: distance ? '✅' : '⏳'
    },
    { 
      label: 'Pago', 
      status: selectedPaymentType ? 'OK' : 'PENDING', 
      value: selectedPaymentType || 'N/A',
      icon: selectedPaymentType ? '✅' : '⏳'
    },
    { 
      label: 'OTP Modal', 
      status: showOtpModal ? 'SHOWING' : 'HIDDEN', 
      value: showOtpModal ? `Código: ${otp}` : 'N/A',
      icon: showOtpModal ? '📲' : '-'
    },
  ];

  const canBook = selectedVehicle && origin?.title && destination?.title && distance && selectedPaymentType && user?.id;

  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsExpanded(true)}
      >
        <Ionicons name="bug-outline" size={20} color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.debugPanel}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>🔐 OTP System Debug</Text>
        <TouchableOpacity onPress={() => setIsExpanded(false)}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.debugContent} showsVerticalScrollIndicator={false}>
        {STATUS_CHECKS.map((check, idx) => (
          <View key={idx} style={styles.statusRow}>
            <View style={styles.statusLabel}>
              <Text style={styles.statusIcon}>{check.icon}</Text>
              <Text style={styles.labelText}>{check.label}</Text>
            </View>
            <View style={styles.statusValue}>
              <Text style={[
                styles.statusText,
                { color: check.status === 'OK' || check.status === 'SHOWING' ? '#00E676' : '#00E5FF' }
              ]}>
                {check.value}
              </Text>
            </View>
          </View>
        ))}

        {/* Overall Status */}
        <View style={[styles.statusRow, styles.overallRow]}>
          <Text style={styles.overallLabel}>
            {canBook ? '✅ LISTO PARA RESERVAR' : '⏳ Completando...'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <Text style={styles.quickActionsTitle}>📋 Checklist</Text>
          <View style={styles.checklistItem}>
            <Text style={{ color: '#fff', fontSize: 11 }}>
              ✓ Usuario logeado
            </Text>
            <Text style={{ color: '#fff', fontSize: 11 }}>
              ✓ Vehículos cargados ({taxiOptions.length})
            </Text>
            <Text style={{ color: '#fff', fontSize: 11 }}>
              ✓ Vehículo seleccionado: {selectedVehicle?.name || 'No'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 11 }}>
              ✓ Ruta calculada: {distance && duration ? 'Sí' : 'No'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 11 }}>
              ✓ Pago elegido: {selectedPaymentType || 'No'}
            </Text>
          </View>
        </View>

        {/* Current OTP */}
        {otp && (
          <View style={styles.otpDisplayBox}>
            <Text style={styles.otpLabel}>Último OTP Generado:</Text>
            <Text style={styles.otpCode}>{otp}</Text>
            <Text style={styles.otpStatus}>
              {showOtpModal ? '📲 Modal Visible' : '✅ Generado (Modal Cerrado)'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#051A26',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00E5FF',
    zIndex: 999,
  },
  debugPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(5, 26, 38, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderTopColor: '#00E5FF',
    zIndex: 999,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00E5FF',
  },
  debugTitle: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '700',
  },
  debugContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  statusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.4,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  labelText: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
  },
  statusValue: {
    flex: 0.6,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  overallRow: {
    marginVertical: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
  },
  overallLabel: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionsRow: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  quickActionsTitle: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  checklistItem: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderRadius: 6,
  },
  otpDisplayBox: {
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00E5FF',
  },
  otpLabel: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '600',
  },
  otpCode: {
    color: '#00E5FF',
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 6,
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 4,
  },
  otpStatus: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

