/**
 * `<Marker image>` dibuja el bitmap sin redimensionar: el tamaño en pantalla sale de las
 * variantes de densidad (base 32px, @2x 64px, @3x 96px → 32dp). Mantener las tres al editar.
 */
/** PNG marcador origen cliente — generado desde location-user-start.svg */
export const CLIENT_ORIGIN_MARKER_IMAGE = require('@/assets/images/icon-map-vector/location-user-start.png');
/** PNG marcador destino (bandera) — anclado nativo, no se despega al pan */
export const CLIENT_DEST_MARKER_IMAGE = require('@/assets/images/icon-map-vector/location-place-destination.png');
/** Tamaño en pantalla: punta del pin abajo, anclada al centro del mapa. */
export const CLIENT_ORIGIN_PIN_SIZE = 48;
