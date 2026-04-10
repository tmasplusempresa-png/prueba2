import React, { useEffect, useState, useRef, ReactNode } from "react";
import {
  View,
  Dimensions,
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

const screen = Dimensions.get("window");
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

const MapSensor: React.FC<MapSensorProps> = ({ children, currentPosition = null }) => {
  const mapRef = useRef<MapView>(null);
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

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('warning', 'Permiso denegado', 'No se puede acceder a la ubicación.');
        setLocationReady(true);
        return;
      }

      try {
        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude, heading: h } = first.coords;
        setRegion(prev => ({ ...prev, latitude, longitude }));
        setHeading(h || 0);
        setLocationReady(true);
        mapRef.current?.animateCamera(
          { center: { latitude, longitude }, heading: h || 0, pitch: 68, zoom: 19 },
          { duration: 400 }
        );
      } catch {
        setLocationReady(true);
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, distanceInterval: 2, timeInterval: 1500 },
        (loc) => {
          const { latitude, longitude, heading: h } = loc.coords;
          const newHeading = (h !== null && !isNaN(h)) ? h : heading;
          setRegion(prev => ({ ...prev, latitude, longitude }));
          setHeading(newHeading);
          mapRef.current?.animateCamera(
            { center: { latitude, longitude }, heading: newHeading, pitch: 68, zoom: 19 },
            { duration: 800 }
          );
        }
      );
    };

    startTracking();
    return () => { subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (currentPosition) {
      const [longitude, latitude] = currentPosition;
      setRegion(prev => ({ ...prev, latitude, longitude }));
      mapRef.current?.animateCamera(
        { center: { latitude, longitude }, heading, pitch: 68, zoom: 19 },
        { duration: 400 }
      );
    }
  }, [currentPosition]);

  return (
    <View style={styles.container}>
      <MapView
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
          pitch: 68,
          heading,
          zoom: 19,
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
  container: { flex: 1 },
  map: { width: screen.width, height: screen.height },
  markerWrap: { alignItems: 'center', justifyContent: 'center' },
  markerImg: { width: 52, height: 52, resizeMode: 'contain' },
});

export default React.memo(MapSensor);

