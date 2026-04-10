
import React, { useEffect, useState, useRef } from 'react';
import Mapbox, { MAPBOX_STYLES, IS_MAPBOX_NATIVE_AVAILABLE } from '@/config/MapboxConfig';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { getMapboxAccessToken, API_KEY } from '@/config/AppConfig';


// Tipado de las props (puedes migrar a .tsx y usar interfaces si usas TypeScript)
type LatLng = { latitude: number; longitude: number };
type MapContainerProps = {
  origin: LatLng | null;
  destination: LatLng | null;
  colorScheme?: string;
  useFallbackMap: boolean;
  setUseFallbackMap: (val: boolean) => void;
  cameraRef?: React.RefObject<any>;
};

const MapContainer = ({ origin, destination, colorScheme = 'light', useFallbackMap, setUseFallbackMap, cameraRef }: MapContainerProps) => {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const mapViewRef = useRef<MapView>(null);

  // Fetch real route when origin/destination change
  useEffect(() => {
    if (!origin || !destination) return;
    setRouteCoords([]);

    const fetchRoute = async () => {
      const shouldUseFallback = useFallbackMap || !IS_MAPBOX_NATIVE_AVAILABLE;

      if (shouldUseFallback) {
        // Google Maps Directions API
        try {
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${API_KEY}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes?.length > 0) {
            const points = decodePolyline(data.routes[0].overview_polyline.points);
            setRouteCoords(points);
          } else {
            // Fallback to straight line
            setRouteCoords([
              [origin.longitude, origin.latitude],
              [destination.longitude, destination.latitude],
            ]);
          }
        } catch (e) {
          console.warn('Error fetching Google route:', e);
          setRouteCoords([
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ]);
        }
      } else {
        // Mapbox Directions API
        try {
          const token = getMapboxAccessToken();
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&overview=full&access_token=${token}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes?.length > 0) {
            const coords = data.routes[0].geometry.coordinates as [number, number][];
            setRouteCoords(coords);
          } else {
            setRouteCoords([
              [origin.longitude, origin.latitude],
              [destination.longitude, destination.latitude],
            ]);
          }
        } catch (e) {
          console.warn('Error fetching Mapbox route:', e);
          setRouteCoords([
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ]);
        }
      }
    };

    fetchRoute();
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude, useFallbackMap]);

  // Auto-fit map to show both markers (fallback / react-native-maps)
  useEffect(() => {
    if (!origin || !destination || !mapViewRef.current) return;
    const timer = setTimeout(() => {
      mapViewRef.current?.fitToCoordinates(
        [origin, destination],
        { edgePadding: { top: 120, right: 60, bottom: 300, left: 60 }, animated: true }
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [origin, destination, routeCoords]);

  if (!origin || !destination) return null;

  const corporateColors = {
    white: '#ffffff',
    cyan: '#00f4f5',
    navy: '#00204a',
    cyanBright: '#00E5FF',
  };
  const markerShadow = {
    shadowColor: corporateColors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  };
  const glassStyle = {
    backgroundColor: 'rgba(0,244,245,0.18)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,244,245,0.22)',
    padding: 6,
    ...markerShadow,
  };

  const shouldUseFallback = useFallbackMap || !IS_MAPBOX_NATIVE_AVAILABLE;

  // Convert [lng, lat] to { latitude, longitude } for react-native-maps
  const fallbackRouteCoords = routeCoords.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));

  if (shouldUseFallback) {
    return (
      <MapView
        ref={mapViewRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
          latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 1.8 + 0.02,
          longitudeDelta: Math.abs(origin.longitude - destination.longitude) * 1.8 + 0.02,
        }}
        onMapReady={() => {
          setTimeout(() => {
            mapViewRef.current?.fitToCoordinates(
              [origin, destination],
              { edgePadding: { top: 120, right: 60, bottom: 300, left: 60 }, animated: true }
            );
          }, 300);
        }}
        onError={() => setUseFallbackMap(false)}
      >
        <Marker coordinate={origin} title="Origen">
          <Animatable.View animation="bounceIn" duration={900} style={glassStyle}>
            <Ionicons name="location" size={38} color={corporateColors.cyan} />
          </Animatable.View>
        </Marker>
        <Marker coordinate={destination} title="Destino">
          <Animatable.View animation="bounceIn" delay={200} duration={900} style={{...glassStyle, backgroundColor: 'rgba(0,32,74,0.18)'}}>
            <Ionicons name="location" size={38} color={corporateColors.white} />
          </Animatable.View>
        </Marker>
        {fallbackRouteCoords.length >= 2 && (
          <Polyline
            coordinates={fallbackRouteCoords}
            strokeColor={corporateColors.cyanBright}
            strokeWidth={5}
          />
        )}
      </MapView>
    );
  }

  // Calculate bounding box for Mapbox camera
  const allLngs = routeCoords.length >= 2
    ? routeCoords.map(c => c[0])
    : [origin.longitude, destination.longitude];
  const allLats = routeCoords.length >= 2
    ? routeCoords.map(c => c[1])
    : [origin.latitude, destination.latitude];
  const sw: [number, number] = [Math.min(...allLngs), Math.min(...allLats)];
  const ne: [number, number] = [Math.max(...allLngs), Math.max(...allLats)];

  // Mapbox visual mejorado
  return (
    <Mapbox.MapView
      style={StyleSheet.absoluteFillObject}
      styleURL={colorScheme === "dark" ? MAPBOX_STYLES.DARK : MAPBOX_STYLES.STREET}
      compassEnabled={true}
      compassViewPosition={3}
      logoEnabled={false}
      attributionEnabled={false}
      onDidFailLoadingMap={() => setUseFallbackMap(true)}
    >
      <Mapbox.Camera
        ref={cameraRef}
        bounds={{ sw, ne, paddingTop: 120, paddingBottom: 300, paddingLeft: 60, paddingRight: 60 }}
        animationDuration={1000}
      />
      <Mapbox.PointAnnotation
        id="origin"
        coordinate={[origin.longitude, origin.latitude]}
      >
        <Animatable.View animation="bounceIn" duration={900} style={glassStyle}>
          <Ionicons name="location" size={38} color={corporateColors.cyan} />
        </Animatable.View>
      </Mapbox.PointAnnotation>
      <Mapbox.PointAnnotation
        id="destination"
        coordinate={[destination.longitude, destination.latitude]}
      >
        <Animatable.View animation="bounceIn" delay={200} duration={900} style={{...glassStyle, backgroundColor: 'rgba(0,32,74,0.18)'}}>
          <Ionicons name="location" size={38} color={corporateColors.white} />
        </Animatable.View>
      </Mapbox.PointAnnotation>
      {routeCoords.length >= 2 && (
        <Mapbox.ShapeSource
          id="booking-route"
          shape={{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: routeCoords,
            },
            properties: {},
          }}
        >
          <Mapbox.LineLayer
            id="booking-route-line"
            style={{
              lineColor: corporateColors.cyanBright,
              lineWidth: 5,
              lineOpacity: 0.95,
              lineCap: 'round' as any,
              lineJoin: 'round' as any,
            }}
          />
        </Mapbox.ShapeSource>
      )}
    </Mapbox.MapView>
  );
};

/**
 * Decode Google Maps encoded polyline string into [lng, lat] pairs
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lng / 1e5, lat / 1e5]); // [longitude, latitude]
  }
  return points;
}

export default MapContainer;
