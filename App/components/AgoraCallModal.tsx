/**
 * AgoraCallModal - Modal de llamada con UI completa de Agora
 * =========================================================
 * 
 * Usa agora-rn-uikit para UI pre-construida
 */

import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import AgoraUIKit from 'agora-rn-uikit'; // COMENTADO PARA EXPO GO

interface AgoraCallModalProps {
  visible: boolean;
  appId: string;
  channel: string;
  token?: string;
  uid?: number;
  userName: string;
  onClose: () => void;
}

const AgoraCallModal: React.FC<AgoraCallModalProps> = ({
  visible,
  appId,
  channel,
  token,
  uid,
  userName,
  onClose,
}) => {
  const [callActive, setCallActive] = useState(visible);

  const connectionData = {
    appId: appId,
    channel: channel,
    token: token || null,
    uid: uid || 0,
  };

  const rtcProps = {
    callActive,
    setCallActive,
    appId: appId,
    channel: channel,
    token: token || null,
    uid: uid || 0,
  };

  React.useEffect(() => {
    setCallActive(visible);
  }, [visible]);

  const handleEndCall = () => {
    setCallActive(false);
    onClose();
  };

  return (
    <Modal
      visible={visible && callActive}
      transparent={false}
      animationType="slide"
      hardwareAccelerated
    >
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Llamada en curso</Text>
          <TouchableOpacity 
            style={s.closeBtn} 
            onPress={handleEndCall}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Agora UI Kit */}
        <View style={s.content}>
          {/* <AgoraUIKit connectionData={connectionData} rtcProps={rtcProps} /> */}
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{color: '#888', fontSize: 14}}>📞 Video disponible en compilación nativa</Text>
          </View>
        </View>

        {/* End Call Button */}
        <View style={s.footer}>
          <TouchableOpacity
            style={s.endCallBtn}
            onPress={handleEndCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={24} color="#FFF" />
            <Text style={s.endCallBtnText}>Terminar llamada</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 229, 255, 0.2)',
  },
  endCallBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  endCallBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AgoraCallModal;

