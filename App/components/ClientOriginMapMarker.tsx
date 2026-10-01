import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import { Marker, LatLng } from 'react-native-maps';

/** PNG marcador origen cliente — generado desde location-user-start.svg */
export const CLIENT_ORIGIN_MARKER_IMAGE = require('@/assets/images/icon-map-vector/location-user-start.png');
/** PNG marcador destino (bandera) */
export const CLIENT_DEST_MARKER_IMAGE = require('@/assets/images/icon-map-vector/location-place-destination.png');
/** Tamaño del pin en dp. */
export const CLIENT_PIN_SIZE = 36;

type Props = {
  coordinate: LatLng;
  variant: 'origin' | 'destination';
  zIndex?: number;
};

/**
 * Pin de origen/destino del cliente con tamaño fijo en dp.
 * No usa `<Marker image>`: en Android ese bitmap se dibuja a su tamaño nativo, que varía según
 * venga del recurso embebido en el build (escalado por densidad) o de un asset de EAS Update.
 * Google Maps rasteriza la vista hija una vez; `tracksViewChanges` se apaga tras cargar la imagen.
 */
export function ClientRouteMarker({ coordinate, variant, zIndex }: Props) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLoadEnd = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTracksViewChanges(false), 250);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={zIndex}
    >
      <Image
        source={variant === 'origin' ? CLIENT_ORIGIN_MARKER_IMAGE : CLIENT_DEST_MARKER_IMAGE}
        style={{ width: CLIENT_PIN_SIZE, height: CLIENT_PIN_SIZE }}
        resizeMode="contain"
        fadeDuration={0}
        onLoadEnd={handleLoadEnd}
      />
    </Marker>
  );
}
