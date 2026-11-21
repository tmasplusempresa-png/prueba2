import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { countOpenRequests, fetchMyRequests } from '@/common/services/recommendationsService';

const REFRESH_MS = 30000;

/**
 * Barra superior del GO: viajes que el conductor pidió para sus clientes y siguen en curso, y los completados
 * cuyo pago entre conductores aún no está confirmado. Sin nada pendiente no se muestra.
 */
export function RecommendationGoChip({ navigation }: { navigation: any }) {
  const [counts, setCounts] = useState({ active: 0, unpaid: 0 });

  const load = useCallback(async () => {
    try {
      setCounts(countOpenRequests(await fetchMyRequests(100)));
    } catch {
      setCounts({ active: 0, unpaid: 0 });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (counts.active === 0 && counts.unpaid === 0) return null;

  return (
    <TouchableOpacity
      style={s.chip}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('HomeScreen', {
          screen: 'Historial',
          params: { initialTab: 'requested', openedAt: Date.now() },
        })
      }
      accessibilityLabel="Ver viajes que pediste para tus clientes"
    >
      <Ionicons name="people" size={13} color="#00E5FF" />
      {counts.active > 0 && (
        <View style={s.segment}>
          <View style={[s.dot, { backgroundColor: '#00E5FF' }]} />
          <Text style={s.txt} numberOfLines={1}>
            <Text style={s.num}>{counts.active}</Text> en curso
          </Text>
        </View>
      )}
      {counts.active > 0 && counts.unpaid > 0 && <View style={s.divider} />}
      {counts.unpaid > 0 && (
        <View style={s.segment}>
          <View style={[s.dot, { backgroundColor: '#FFB300' }]} />
          <Text style={s.txt} numberOfLines={1}>
            <Text style={s.num}>{counts.unpaid}</Text> por pagar
          </Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chip: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: 'rgba(5,26,38,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.35)',
  },
  segment: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  txt: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  num: { fontSize: 12, color: '#FFF', fontWeight: '800' },
  divider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.18)' },
});

export default RecommendationGoChip;
