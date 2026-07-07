import React, { useEffect, useState, useRef, ReactNode } from "react";
import {
  View,
  Platform,
  StyleSheet,
  Text,
  Image,
} from "react-native";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import markerIcon from "@/assets/images/NavegApp.png";
import { getDistance } from "geolib";

const DEFAULT_REGION = {
  latitude: 4.7110,
  longitude: -74.0721,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

// Define estilos para el modo claro
const mapStyleLight = [
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#523735" }],
  },
  // Agrega más estilos según sea necesario
];

// Define estilos para el modo oscuro
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#181818",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#1b1b1b",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#2c2c2c",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#8a8a8a",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#373737",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#3c3c3c",
      },
    ],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [
      {
        color: "#4e4e4e",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#000000",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#3d3d3d",
      },
    ],
  },
];

interface MapSensorProps {
  children?: ReactNode;
  currentPosition?: [number, number] | null;
}

type CameraSnapshot = {
  latitude: number;
  longitude: number;
  heading: number;
};

const MapSensor: React.FC<MapSensorProps> = ({ children, currentPosition = null }) => {
  console.log('[GO-DEBUG][MapSensor] render/mount, currentPosition:', currentPosition);
  const mapRef = useRef<MapView>(null);
  const headingRef = useRef(0);
  const lastCameraRef = useRef<CameraSnapshot | null>(null);
  const hasMountedCameraRef = useRef(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('error');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info' | 'confirm', title: string, message: string, buttons?: AlertButton[]) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };
  const [region, setRegion] = useState({
    latitude: currentPosition ? currentPosition[1] : DEFAULT_REGION.latitude,
    longitude: currentPosition ? currentPosition[0] : DEFAULT_REGION.longitude,
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
  });
  const [heading, setHeading] = useState(0);
  const [locationReady, setLocationReady] = useState(false);

  const syncCamera = (
    latitude: number,
    longitude: number,
    nextHeading: number,
    duration: number,
    force = false,
  ) => {
    const lastCamera = lastCameraRef.current;
    const headingDelta = lastCamera ? Math.abs(lastCamera.heading - nextHeading) : Number.POSITIVE_INFINITY;
    const movedMeters = lastCamera
      ? getDistance(
          { latitude: lastCamera.latitude, longitude: lastCamera.longitude },
          { latitude, longitude },
        )
      : Number.POSITIVE_INFINITY;

    if (!force && lastCamera && movedMeters < 4 && headingDelta < 8) {
      return;
    }

    lastCameraRef.current = { latitude, longitude, heading: nextHeading };
    console.log('[GO-DEBUG][MapSensor] syncCamera -> animateCamera', { latitude, longitude, nextHeading, duration, force, hasMapRef: !!mapRef.current });
    mapRef.current?.animateCamera(
      {
        center: { latitude, longitude },
        heading: nextHeading,
        pitch: 68,
        zoom: 19,
      },
      { duration }
    );
  };

  useEffect(() => {
    console.log('[GO-DEBUG][MapSensor] useEffect startTracking MONTADO');
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      console.log('[GO-DEBUG][MapSensor] pidiendo permiso foreground location...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[GO-DEBUG][MapSensor] permiso status:', status);
      if (status !== 'granted') {
        showAlert('warning', 'Permiso denegado', 'No se puede acceder a la ubicación.');
        setLocationReady(true);
        return;
      }

      try {
        console.log('[GO-DEBUG][MapSensor] pidiendo getCurrentPositionAsync...');
        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log('[GO-DEBUG][MapSensor] primera posicion recibida:', first.coords);
        const { latitude, longitude, heading: h } = first.coords;
        const resolvedHeading = h || 0;
        setRegion(prev => ({ ...prev, latitude, longitude }));
        setHeading(resolvedHeading);
        headingRef.current = resolvedHeading;
        setLocationReady(true);
        syncCamera(latitude, longitude, resolvedHeading, 400, true);
        hasMountedCameraRef.current = true;
      } catch (e) {
        console.log('[GO-DEBUG][MapSensor] ERROR getCurrentPositionAsync:', e);
        setLocationReady(true);
      }

      console.log('[GO-DEBUG][MapSensor] iniciando watchPositionAsync...');
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, distanceInterval: 2, timeInterval: 1500 },
        (loc) => {
          console.log('[GO-DEBUG][MapSensor] watchPositionAsync update:', loc.coords);
          const { latitude, longitude, heading: h } = loc.coords;
          const newHeading = (h !== null && !isNaN(h)) ? h : headingRef.current;
          setRegion(prev => ({ ...prev, latitude, longitude }));
          setHeading(newHeading);
          headingRef.current = newHeading;
          syncCamera(latitude, longitude, newHeading, hasMountedCameraRef.current ? 800 : 400, !hasMountedCameraRef.current);
          hasMountedCameraRef.current = true;
        }
      );
      console.log('[GO-DEBUG][MapSensor] watchPositionAsync suscrito OK');
    };

    startTracking().catch((e) => console.log('[GO-DEBUG][MapSensor] ERROR startTracking:', e));
    return () => { subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (currentPosition) {
      console.log('[GO-DEBUG][MapSensor] useEffect currentPosition prop cambio:', currentPosition);
      const [longitude, latitude] = currentPosition;
      setRegion(prev => ({ ...prev, latitude, longitude }));
      syncCamera(latitude, longitude, headingRef.current, 400, true);
      hasMountedCameraRef.current = true;
    }
  }, [currentPosition]);

  return (
    <View style={styles.container}>
      {console.log('[GO-DEBUG][MapSensor] rendering MapView, locationReady:', locationReady, 'region:', region)}
      <MapView
        onMapReady={() => console.log('[GO-DEBUG][MapSensor] onMapReady disparado — la superficie nativa confirmo estar lista')}
        onLayout={() => console.log('[GO-DEBUG][MapSensor] onLayout disparado')}
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        initialCamera={{
          center: { latitude: region.latitude, longitude: region.longitude },
          pitch: 0,
          heading,
          zoom: 15,
          altitude: 200,
        }}
      >
        {locationReady && (
          <Marker
            coordinate={{ latitude: region.latitude, longitude: region.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={heading}
          >
            <View style={styles.markerWrap}>
              <Image source={markerIcon} style={styles.markerImg} />
            </View>
          </Marker>
        )}
        {children}
      </MapView>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },
  markerWrap: { alignItems: 'center', justifyContent: 'center' },
  markerImg: { width: 52, height: 52, resizeMode: 'contain' },
});

export default React.memo(MapSensor);

