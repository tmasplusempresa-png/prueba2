import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  /** Rumbo del mapa en grados — la aguja rota en sentido contrario. */
  heading?: number;
};

/** Aguja norte roja / sur blanca — estilo brújula de mapas. */
export default function MapCompassIcon({ heading = 0 }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.needle, { transform: [{ rotate: `${-heading}deg` }] }]}>
        <View style={styles.north} />
        <View style={styles.south} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  north: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#E53935',
  },
  south: {
    width: 0,
    height: 0,
    marginTop: -3,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
});
