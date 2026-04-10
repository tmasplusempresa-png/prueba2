/**
 * ActiveCallScreen - Pantalla de llamada en curso
 * ==============================================
 * 
 * Muestra interfaz completa durante una llamada activa
 * con controles de audio, duración, etc.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export interface ActiveCallData {
  remoteUserId: string;
  remoteUserName: string;
  remoteUserPhone: string;
  remoteUserImage?: string;
  isVideo?: boolean;
}

interface ActiveCallScreenProps {
  visible: boolean;
  callData: ActiveCallData | null;
  callDuration: number; // in seconds
  isMuted: boolean;
  isSpeakerEnabled: boolean;
  onMuteToggle: () => void;
  onSpeakerToggle: () => void;
  onEndCall: () => void;
}

const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({
  visible,
  callData,
  callDuration,
  isMuted,
  isSpeakerEnabled,
  onMuteToggle,
  onSpeakerToggle,
  onEndCall,
}) => {
  const formatDuration = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!callData) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      hardwareAccelerated
    >
      <SafeAreaView style={s.container}>
        {/* Encabezado */}
        <View style={s.header}>
          <Text style={s.connectionStatus}>Llamada en curso...</Text>
        </View>

        {/* Centro: Info del usuario remoto */}
        <View style={s.centerContent}>
          {callData.remoteUserImage ? (
            <Image
              source={{ uri: callData.remoteUserImage }}
              style={s.largeAvatar}
            />
          ) : (
            <View style={[s.largeAvatar, s.avatarDefault]}>
              <Ionicons name="person" size={80} color="#00E5FF" />
            </View>
          )}

          <Text style={s.remoteName}>{callData.remoteUserName}</Text>
          <Text style={s.remotePhone}>{callData.remoteUserPhone}</Text>

          {/* Duración */}
          <View style={s.durationContainer}>
            <Text style={s.duration}>{formatDuration(callDuration)}</Text>
          </View>
        </View>

        {/* Controles inferiores */}
        <View style={s.controls}>
          {/* Botón Mutear */}
          <TouchableOpacity
            style={[s.controlBtn, isMuted && s.controlBtnActive]}
            onPress={onMuteToggle}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color={isMuted ? '#E91E63' : '#FFF'}
            />
            <Text style={s.controlBtnText}>{isMuted ? 'Muteo' : 'Micrófono'}</Text>
          </TouchableOpacity>

          {/* Botón Altavoz */}
          <TouchableOpacity
            style={[s.controlBtn, isSpeakerEnabled && s.controlBtnActive]}
            onPress={onSpeakerToggle}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSpeakerEnabled ? 'volume-high' : 'volume-mute'}
              size={24}
              color={isSpeakerEnabled ? '#00E676' : '#FFF'}
            />
            <Text style={s.controlBtnText}>{isSpeakerEnabled ? 'Altavoz' : 'Auricular'}</Text>
          </TouchableOpacity>

          {/* Botón Colgar */}
          <TouchableOpacity
            style={[s.controlBtn, s.endCallBtn]}
            onPress={onEndCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={24} color="#FFF" />
            <Text style={s.controlBtnText}>Colgar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
    justifyContent: 'space-between',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  connectionStatus: {
    color: '#00E5FF',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  largeAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#00E5FF',
  },
  avatarDefault: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  remotePhone: {
    fontSize: 14,
    color: '#00E5FF',
    marginBottom: 24,
  },
  durationContainer: {
    marginTop: 20,
  },
  duration: {
    fontSize: 32,
    fontWeight: '600',
    color: '#00E676',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 229, 255, 0.2)',
  },
  controlBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 80,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlBtnText: {
    color: '#FFF',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  endCallBtn: {
    backgroundColor: '#E91E63',
  },
});

export default ActiveCallScreen;

