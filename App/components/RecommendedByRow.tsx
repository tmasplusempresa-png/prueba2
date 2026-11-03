import React from 'react';
import { Linking, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecommendationInfo } from '@/common/services/recommendationsService';

/** "Solicitado por <conductor>" en viajes recomendados (pasajero y conductor que hace el viaje). */
export function RecommendedByRow({
  info,
  style,
}: {
  info: RecommendationInfo;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.iconBox}>
        <Ionicons name="people" size={18} color="#00E5FF" />
      </View>
      <View style={styles.texts}>
        <Text style={styles.label}>Solicitado por</Text>
        <Text style={styles.name} numberOfLines={1}>{info.requesterName}</Text>
      </View>
      {info.requesterPhone ? (
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL(`tel:${info.requesterPhone}`)}
          accessibilityLabel={`Llamar a ${info.requesterName}`}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={16} color="#00E5FF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  name: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 1 },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
