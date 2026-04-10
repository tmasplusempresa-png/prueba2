import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import Mapbox, { MAPBOX_STYLES, GYROSCOPE_CONFIG } from "@/config/MapboxConfig";

import markeIconO from "@/assets/images/green_pin.png";
import changueMap from "@/assets/images/Figmap.png";
import * as Location from "expo-location";

const GoogleMaps = () => {
  const cameraRef = useRef<Mapbox.Camera | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    getCurrentPosition();
    animateCameraToInitialPosition();
  }, []);


  useEffect(() => {
    if (currentPosition && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: currentPosition,
        pitch: 70,
        heading: 0,
        zoomLevel: 17,
        animationDuration: 1000,
      });
    }
  }, [currentPosition]);

  // Función para animar la cámara a la posición inicial
  const animateCameraToInitialPosition = () => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [-122.4324, 37.77825],
        pitch: 70, // Ajusta este valor para obtener el efecto 3D deseado
        heading: 0,
        zoomLevel: 17, // Ajusta este valor para obtener el nivel de zoom deseado
        animationDuration: 1000,
      });
    }
  };

//modificado
  const getCurrentPosition = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
  
      if (status !== "granted") {
        console.error("Location permission denied");
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      if (location && location.coords) {
        setCurrentPosition([
          location.coords.longitude,
          location.coords.latitude,
        ]);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };
  

  return (
    <View style={styles.container}>
      {currentPosition ? (
      <Mapbox.MapView
        style={styles.map}
        styleURL={MAPBOX_STYLES.STREET}
        compassEnabled={true}
        compassViewPosition={3}
      >
        <Mapbox.Camera
          ref={cameraRef}
          followUserLocation={GYROSCOPE_CONFIG.trackUserCourse}
          followPitch={GYROSCOPE_CONFIG.followPitch}
          followZoomLevel={17}
        />
        
        <Mapbox.UserLocation
          visible={true}
          showsUserHeadingIndicator={GYROSCOPE_CONFIG.showsUserHeadingIndicator}
          androidRenderMode="compass"
        />
        
        <Mapbox.PointAnnotation
          id="currentLocation"
          coordinate={currentPosition}
        >
          <View style={styles.markerContainer}>
            <Image source={markeIconO} style={{ width: 50, height: 50 }} />
          </View>
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>
      ) : (
        <View style={styles.containerMap}>
          <Image source={changueMap} style={{ width: 400, height: 400 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold' }} >Cargando mapa...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
  },
  containerMap:{
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default GoogleMaps;

