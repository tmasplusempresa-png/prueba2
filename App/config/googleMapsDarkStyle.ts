import type { MapStyleElement } from 'react-native-maps';

/** Color gris de calles antes del ajuste — usado en nombres de locales/POI. */
export const MAP_POI_LABEL_COLOR = '#8a8a8a';

/** Azul marca (#0A2E3D) aclarado hacia gris — calles y vías. */
const ROAD_LOCAL = '#354F5C';
const ROAD_ARTERIAL = '#3E5A68';
const ROAD_HIGHWAY = '#4A6675';
const ROAD_HIGHWAY_MAJOR = '#556F7E';
const ROAD_STROKE = '#263840';
const ROAD_EDGE = '#6A8494';

const GREEN_LANDCOVER = '#286B48';
const GREEN_PARK = '#308A58';
const GREEN_NATURAL = '#1F4A38';
const WATER = '#1A6088';

/**
 * Estilo oscuro compartido — mapa conductor GO y viaje en curso.
 * Solo featureTypes oficiales de Google Maps. Tipos inválidos (p. ej.
 * road.highway.ramp) hacen que Android ignore TODO el JSON y deje el mapa light.
 */
export const GOOGLE_MAPS_DARK_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#1A2529' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#E8ECEF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1A2529' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#5A6A72' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#C8D0D5' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#F0F4F7' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#1E2A30' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: GREEN_NATURAL }] },
  { featureType: 'landscape.natural.landcover', elementType: 'geometry', stylers: [{ color: GREEN_LANDCOVER }] },
  { featureType: 'landscape.natural.terrain', elementType: 'geometry', stylers: [{ color: '#245A42' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: MAP_POI_LABEL_COLOR }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.business', elementType: 'labels.text.fill', stylers: [{ color: MAP_POI_LABEL_COLOR }] },
  { featureType: 'poi.business', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.medical', elementType: 'labels.text.fill', stylers: [{ color: MAP_POI_LABEL_COLOR }] },
  { featureType: 'poi.school', elementType: 'labels.text.fill', stylers: [{ color: MAP_POI_LABEL_COLOR }] },
  { featureType: 'poi.attraction', elementType: 'labels.text.fill', stylers: [{ color: MAP_POI_LABEL_COLOR }] },
  { featureType: 'poi.government', elementType: 'labels.text.fill', stylers: [{ color: MAP_POI_LABEL_COLOR }] },
  { featureType: 'poi.place_of_worship', elementType: 'labels.text.fill', stylers: [{ color: MAP_POI_LABEL_COLOR }] },
  { featureType: 'poi.sports_complex', elementType: 'labels.text.fill', stylers: [{ color: MAP_POI_LABEL_COLOR }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: GREEN_PARK }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: GREEN_PARK }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#7BC99A' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#142820' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: ROAD_LOCAL }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: ROAD_STROKE }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#F5F8FA' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: ROAD_ARTERIAL }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: ROAD_EDGE }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: ROAD_HIGHWAY }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: ROAD_EDGE }] },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: ROAD_HIGHWAY_MAJOR }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry.stroke',
    stylers: [{ color: ROAD_EDGE }],
  },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#E8ECEF' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#B0BEC5' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: WATER }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: WATER }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7EB8D9' }] },
];

export type GoogleMapTheme = 'dark' | 'light';

/** Array vacío = estilo claro por defecto de Google Maps (requiere remount del MapView). */
export const getGoogleMapStyle = (theme: GoogleMapTheme): MapStyleElement[] =>
  theme === 'dark' ? GOOGLE_MAPS_DARK_STYLE : [];
