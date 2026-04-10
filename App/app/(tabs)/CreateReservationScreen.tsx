import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Platform, ActivityIndicator, Dimensions, Keyboard, KeyboardAvoidingView,
  TouchableWithoutFeedback, Animated, Modal,
} from 'react-native';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { RootState } from '@/common/store';
import { API_KEY, getMapboxAccessToken } from '@/config/AppConfig';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

const { width: SW, height: SH } = Dimensions.get('window');

const GOOGLE_MAPS_KEY = API_KEY;

const VEHICLE_TYPES = [
  { key: 'T+Plus Especial', label: 'Especial', icon: 'car-sport' as const },
  { key: 'Particular', label: 'Particular', icon: 'car' as const },
  { key: 'Van', label: 'Van', icon: 'bus' as const },
  { key: 'Taxi', label: 'Taxi', icon: 'car-outline' as const },
];

// ⭐ Configuración de tarifas dinámicas por tipo de vehículo (basado en TripPreviewScreen)
const VEHICLE_TARIFF_CONFIG: Record<string, { base: number; perKm: number; perMin: number; minFare: number }> = {
  'T+Plus Especial': { base: 12000, perKm: 3000, perMin: 350, minFare: 15000 },
  'Particular': { base: 8000, perKm: 2500, perMin: 280, minFare: 12000 },
  'Van': { base: 15000, perKm: 3500, perMin: 400, minFare: 18000 },
  'Taxi': { base: 6500, perKm: 1700, perMin: 260, minFare: 10000 },
};

const COLOMBIA_CENTER = { latitude: 4.6097, longitude: -74.0817, latitudeDelta: 0.08, longitudeDelta: 0.06 };

const roundPrice = (n: number) => Math.round(n / 100) * 100;

const generateUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

const generateReference = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < 6; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
  return ref;
};

// ⭐ FUNCIÓN PARA OBTENER PRECIO FIJO DE PROGRAMADO
const SCHEDULED_PRICE_FIELD = (carTypeData: any) => {
  if (carTypeData?.min_fare && carTypeData.min_fare > 0) {
    return parseFloat(carTypeData.min_fare);
  }
  if (carTypeData?.base_price_inter && carTypeData.base_price_inter > 0) {
    return parseFloat(carTypeData.base_price_inter);
  }
  return parseFloat(carTypeData?.base_price) || 15000;
};

// ⭐ FUNCIÓN PARA INICIALIZAR HORA: AHORA +5 MIN
const getInitialScheduledDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 5);
  return d;
};

/* ─────────── SCREEN ─────────── */
const CreateReservationScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const profile = useSelector((s: RootState) => s.auth.profile) as any;

  const params = (route.params || {}) as any;
  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;

  /* ── Keyboard animated refs ── */
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardOffsetAnim = useRef(new Animated.Value(0)).current;
  const mapKeyboardOffsetAnim = useRef(new Animated.Value(0)).current;

  /* ── Map / Location refs ── */
  const mapRef = useRef<MapView>(null);
  const originAutoRef = useRef<any>(null);
  const destAutoRef = useRef<any>(null);
  const sessionTokenOrigin = useRef<string | null>(null);
  const sessionTokenDest = useRef<string | null>(null);
  const expandedMapRef = useRef<MapView>(null);

  const [myLat, setMyLat] = useState(COLOMBIA_CENTER.latitude);
  const [myLng, setMyLng] = useState(COLOMBIA_CENTER.longitude);
  const [origin, setOrigin] = useState<any>(params.origin || null);
  const [destination, setDestination] = useState<any>(params.destination || null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [showExpandedMap, setShowExpandedMap] = useState(false);

  /* ── Trip details ── */
  const [carType, setCarType] = useState(params.carType || 'T+Plus Especial');
  const [tripType, setTripType] = useState<'Ida' | 'Ida y Vuelta'>('Ida');
  const [bookingMode, setBookingMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date>(getInitialScheduledDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [observations, setObservations] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'nequi' | 'daviplata'>('cash');

  /* ── Calculated values ── */
  const [distance, setDistance] = useState(params.distance || 0);
  const [duration, setDuration] = useState(params.duration || 0);
  const [driverPrice, setDriverPrice] = useState(params.driverPrice || 0);
  const [clientPrice, setClientPrice] = useState(params.clientPrice || 0);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ── UI state ── */
  const [step, setStep] = useState<'map' | 'details'>(params.origin ? 'details' : 'map');

  const customerName = [
    profile?.first_name || user?.first_name || user?.user_metadata?.first_name || user?.user_metadata?.nombre || '',
    profile?.last_name || user?.last_name || user?.user_metadata?.last_name || user?.user_metadata?.apellido || '',
  ].filter(Boolean).join(' ') || profile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Cliente';

  /* ── Auto-detect current location ── */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setMyLat(loc.coords.latitude);
        setMyLng(loc.coords.longitude);
        if (!origin) {
          // Reverse geocode para obtener dirección real en lugar de "Mi ubicación actual"
          try {
            const resp = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.coords.latitude},${loc.coords.longitude}&key=${GOOGLE_MAPS_KEY}&language=es`,
            );
            const data = await resp.json();
            const addr = data.results?.[0]?.formatted_address || 'Mi ubicación actual';
            setOrigin({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              title: addr,
            });
            originAutoRef.current?.setAddressText(addr);
          } catch {
            setOrigin({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              title: 'Mi ubicación actual',
            });
            originAutoRef.current?.setAddressText('Mi ubicación actual');
          }
        }
        mapRef.current?.animateToRegion(
          { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
          800,
        );
      } catch {}
    })();
  }, []);

  /* ── Keyboard listener for smooth animation ── */
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowSub = Keyboard.addListener(showEvent, () => {
      // Step 2 animation
      Animated.timing(keyboardOffsetAnim, {
        toValue: -30,
        duration: 220,
        useNativeDriver: true,
      }).start();
      // Step 1 animation (search panel up)
      Animated.timing(mapKeyboardOffsetAnim, {
        toValue: -200,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });

    const keyboardHideSub = Keyboard.addListener(hideEvent, () => {
      // Step 2 animation
      Animated.timing(keyboardOffsetAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
      // Step 1 animation (search panel back down)
      Animated.timing(mapKeyboardOffsetAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardShowSub.remove();
      keyboardHideSub.remove();
    };
  }, [keyboardOffsetAnim, mapKeyboardOffsetAnim]);

  useEffect(() => {
    if (!origin?.latitude || !destination?.latitude) {
      setRouteCoords([]);
      return;
    }
    (async () => {
      try {
        const token = getMapboxAccessToken();
        if (token) {
          const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
          const res = await axios.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`, {
            params: { geometries: 'geojson', overview: 'full', access_token: token },
          });
          const geom = res?.data?.routes?.[0]?.geometry;
          if (geom?.coordinates?.length) {
            setRouteCoords(geom.coordinates.map((c: [number, number]) => ({ latitude: c[1], longitude: c[0] })));
          }
        }
      } catch {}
    })();
  }, [origin, destination]);

  /* ── Calculate price when route available ── */
  useEffect(() => {
    if (!origin?.latitude || !destination?.latitude) return;
    calculateRoute();
  }, [origin, destination, tripType]);

  /* ── Fit map to both markers ── */
  useEffect(() => {
    if (origin?.latitude && destination?.latitude && mapRef.current) {
      // Si tenemos la ruta completa, usar eso; si no, solo los 2 puntos
      const coordsToFit = routeCoords.length > 0 
        ? routeCoords 
        : [
            { latitude: origin.latitude, longitude: origin.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ];
      
      mapRef.current.fitToCoordinates(coordsToFit, {
        edgePadding: { top: 200, right: 50, bottom: 280, left: 50 },
        animated: true,
      });
    }
  }, [origin, destination, routeCoords]);

  const calculateRoute = async () => {
    if (!origin?.latitude || !destination?.latitude) return;
    setCalculating(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_KEY}&language=es`;
      const resp = await fetch(url);
      const data = await resp.json();
      
      if (data.routes?.length > 0) {
        const leg = data.routes[0].legs[0];
        const distKm = leg.distance.value / 1000;
        const durMin = leg.duration.value / 60;
        const mult = tripType === 'Ida y Vuelta' ? 2 : 1;
        
        setDistance(distKm);
        setDuration(durMin);

        // ⭐ DIFERENCIAR PRECIO SEGÚN MODO Y TIPO DE VEHÍCULO
        const vehicleConfig = VEHICLE_TARIFF_CONFIG[carType];
        
        if (bookingMode === 'immediate') {
          // ⚡ DINÁMICO: según distancia, tiempo y tipo de vehículo
          const distanceComponent = distKm * vehicleConfig.perKm;
          const timeComponent = durMin * vehicleConfig.perMin;
          const rawEstimate = vehicleConfig.base + distanceComponent + timeComponent;
          const safeEstimate = Math.max(rawEstimate, vehicleConfig.minFare);
          const base = roundPrice(safeEstimate * mult);
          
          setDriverPrice(base);
          setClientPrice(roundPrice(base + 5000));
          console.log(`⚡ INMEDIATO [${carType}] - Precio dinámico: ${base}`, { distanceComponent, timeComponent, rawEstimate });
        } else {
          // 📅 FIJO: combinación de Supabase + configuración de tarifas
          const carData = params.carTypeData;
          
          // Intenta obtener precio fijo de Supabase primero
          let fixedPrice = SCHEDULED_PRICE_FIELD(carData);
          
          // Si Supabase no tiene datos útiles, calcula basado en vehicleConfig
          if (!fixedPrice || fixedPrice < vehicleConfig.minFare) {
            // Para programado, usa tarifa base + componente mínima como precio fijo
            const scheduledBase = vehicleConfig.base + (vehicleConfig.minFare * 0.5);
            fixedPrice = roundPrice(scheduledBase);
          }
          
          const finalPrice = mult === 2 ? roundPrice(fixedPrice * 2) : roundPrice(fixedPrice);
          setDriverPrice(finalPrice);
          setClientPrice(roundPrice(finalPrice + 2000));
          console.log(`📅 PROGRAMADO [${carType}] - Precio fijo: ${finalPrice}`, { fromSupabase: SCHEDULED_PRICE_FIELD(carData), fromConfig: vehicleConfig.minFare });
        }
      }
    } catch (e) {
      console.error('Route calc error:', e);
    } finally {
      setCalculating(false);
    }
  };

  /* ── Update scheduledDate when bookingMode changes ── */
  useEffect(() => {
    if (bookingMode === 'immediate') {
      const d = new Date();
      d.setMinutes(d.getMinutes() + 5);
      setScheduledDate(d);
    } else {
      const d = new Date();
      d.setHours(d.getHours() + 1);
      d.setMinutes(0);
      setScheduledDate(d);
    }
  }, [bookingMode]);

  /* ── Recalcular cuando cambia modo, vehículo o ruta ── */
  useEffect(() => {
    if (origin?.latitude && destination?.latitude) {
      calculateRoute();
    }
  }, [bookingMode, carType, tripType, origin, destination]);

  /* ── Animar mapa cuando aparece la ruta ── */
  useEffect(() => {
    if (routeCoords.length > 2) {
      // Pequeño delay para que el polyline ya esté renderizado
      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(routeCoords, {
            edgePadding: { top: 200, right: 50, bottom: 280, left: 50 },
            animated: true,
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [routeCoords]);

  /* ── Place selection (same as CustomerMap) ── */
  const handleLocationSelect = (data: any, details: any, type: 'origin' | 'destination') => {
    if (!details?.geometry?.location) return;
    const { lat, lng } = details.geometry.location;
    const loc = { latitude: lat, longitude: lng, title: data.description };
    if (type === 'origin') {
      setOrigin(loc);
      originAutoRef.current?.setAddressText(data.description);
      sessionTokenOrigin.current = null;
    } else {
      setDestination(loc);
      destAutoRef.current?.setAddressText(data.description);
      sessionTokenDest.current = null;
    }
    Keyboard.dismiss();
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 600);
  };

  /* ── Marker drag end → reverse geocode ── */
  const handleMarkerDragEnd = async (e: any, type: 'origin' | 'destination') => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_KEY}&language=es`,
      );
      const data = await resp.json();
      const addr = data.results?.[0]?.formatted_address || 'Ubicación seleccionada';
      const loc = { latitude, longitude, title: addr };
      if (type === 'origin') {
        setOrigin(loc);
        originAutoRef.current?.setAddressText(addr);
      } else {
        setDestination(loc);
        destAutoRef.current?.setAddressText(addr);
      }
    } catch {
      const loc = { latitude, longitude, title: 'Ubicación seleccionada' };
      if (type === 'origin') setOrigin(loc);
      else setDestination(loc);
    }
  };

  /* ── Center on my location ── */
  const centerOnMe = () => {
    if (mapRef.current && myLat) {
      mapRef.current.animateToRegion({ latitude: myLat, longitude: myLng, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 600);
    }
  };

  /* ── Date / Time handlers ── */
  const handleDateConfirm = (date: Date) => {
    setScheduledDate(prev => {
      const d = new Date(date);
      d.setHours(prev.getHours(), prev.getMinutes());
      return d;
    });
    setShowDatePicker(false);
  };
  const handleTimeConfirm = (time: Date) => {
    setScheduledDate(prev => {
      const d = new Date(prev);
      d.setHours(time.getHours(), time.getMinutes(), 0, 0);
      return d;
    });
    setShowTimePicker(false);
  };
  const fmtDate = (d: Date) => {
    const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  const fmtTime = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  };

  const canContinue = !!origin && !!destination && distance > 0 && !calculating;
  const canSubmit = canContinue && !saving;

  /* ── Custom alert state ── */
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  const showAlert = (type: typeof alertType, title: string, message: string, buttons?: AlertButton[]) => {
    setAlertType(type); setAlertTitle(title); setAlertMessage(message);
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  /* ── Submit reservation ── */
  const handleSubmit = async () => {
    if (!origin || !destination) { showAlert('error', 'Error', 'Selecciona origen y destino.'); return; }
    if (scheduledDate <= new Date()) { showAlert('error', 'Error', 'La fecha y hora deben ser en el futuro.'); return; }
    if (distance <= 0) { showAlert('error', 'Error', 'No se pudo calcular la ruta.'); return; }
    setSaving(true);
    try {
      const headers = await getSupabaseAuthHeaders(true);
      const userId = user?.auth_id || user?.id;
      
      // Determinar tipo de reserva según booking mode
      const isImmediate = bookingMode === 'immediate';
      
      // DEBUG: Verificar qué modo se está guardando
      console.log('🔍 DEBUG SUBMIT:', { bookingMode, isImmediate, willSaveAs: isImmediate ? 'immediate' : 'reservation' });
      
      const body = {
        booking_type: isImmediate ? 'immediate' : 'reservation',
        // booking_mode: bookingMode,  // TODO: Agregar columna a DB y descomentar después de migración SQL
        status: 'PENDING', // Ambos tipos comienzan como PENDING para mostrar en "Pendientes"
        customer_status: isImmediate ? 'SEARCHING' : 'NEW',
        reference: generateReference(),
        booking_date: scheduledDate.toISOString(),
        customer: userId,
        customer_id: userId,
        customer_name: customerName,
        customer_email: user?.email || '',
        customer_contact: user?.mobile || '',
        customer_token: user?.pushToken || user?.push_token || '',
        pickup_address: origin?.title || 'Origen',
        pickup_lat: origin?.latitude,
        pickup_lng: origin?.longitude,
        pickup_location: JSON.stringify({ lat: origin?.latitude, lng: origin?.longitude, address: origin?.title }),
        drop_address: destination?.title || 'Destino',
        drop_lat: destination?.latitude,
        drop_lng: destination?.longitude,
        destination_location: JSON.stringify({ lat: destination?.latitude, lng: destination?.longitude, address: destination?.title }),
        drop_location: JSON.stringify({ lat: destination?.latitude, lng: destination?.longitude, address: destination?.title }),
        distance: parseFloat(distance.toFixed(2)),
        duration: Math.round(duration),
        trip_type: tripType,
        car_type: carType,
        estimate: clientPrice || 0,
        price: clientPrice || 0,
        driver_share: driverPrice || 0,
        payment_mode: paymentMode,
        prepaid: false,
        observations: observations || null,
      };
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const [created] = await resp.json();
      console.log('✅ SERVICIO CREADO EN BD:', { 
        reference: created?.reference, 
        booking_type: created?.booking_type, 
        status: created?.status,
        driver: created?.driver,
        id: created?.id 
      });
      showAlert('success', '¡Reserva Creada!',
        `Tu reserva ${created?.reference || ''} ha sido enviada.\nTe notificaremos cuando un conductor la acepte.`,
        [{ text: 'Ver estado del viaje', onPress: () => { 
          setAlertVisible(false); 
          nav.navigate('CustomerActiveTrip', { bookingId: created?.id, booking: created }); 
        } }],
      );
    } catch (e: any) {
      showAlert('error', 'Error', 'No se pudo crear la reserva. Intenta de nuevo.');
      console.error('CreateReservation error:', e);
    } finally {
      setSaving(false);
    }
  };

  /* ── Google Places styles ── */
  const gpStyles = {
    container: { flex: 0, zIndex: 1000 },
    textInputContainer: { backgroundColor: 'transparent' },
    textInput: {
      height: 50, fontSize: 15, fontWeight: '500' as const,
      color: '#FFF', backgroundColor: 'rgba(4,39,58,0.95)',
      borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(0,229,255,0.38)',
      paddingHorizontal: 44, paddingVertical: 10,
    },
    listView: {
      backgroundColor: 'rgba(4,39,58,0.98)', borderRadius: 14,
      borderWidth: 1, borderColor: 'rgba(0,229,255,0.35)',
      marginTop: 4, maxHeight: 250, marginHorizontal: 0,
      elevation: 8, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    row: { backgroundColor: 'rgba(10,46,61,0.6)', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,229,255,0.1)' },
    separator: { display: 'none' as const },
    description: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '500' as const },
    poweredContainer: { display: 'none' as const },
  };

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <View style={st.root}>
      {/* Header */}
      <View style={[st.header, { paddingTop: topPad }]}>
        <TouchableOpacity
          style={st.backBtn}
          onPress={() => (step === 'details' && !params.origin) ? setStep('map') : nav.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{step === 'map' ? 'Selecciona tu ruta' : 'Detalles de Reserva'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ════ STEP 1: MAP ════ */}
      {step === 'map' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={Platform.OS === 'ios'}
        >
          {/* Map */}
          <View style={st.mapContainer}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              showsUserLocation
              showsMyLocationButton={false}
              initialRegion={{ latitude: myLat, longitude: myLng, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
              zoomControlEnabled
              loadingEnabled
              loadingIndicatorColor="#00E5FF"
            >
              {origin && (
                <Marker
                  coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
                  title="Origen"
                  description={origin.title}
                  draggable
                  onDragEnd={e => handleMarkerDragEnd(e, 'origin')}
                  pinColor="#00E676"
                />
              )}
              {destination && (
                <Marker
                  coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
                  title="Destino"
                  description={destination.title}
                  draggable
                  onDragEnd={e => handleMarkerDragEnd(e, 'destination')}
                >
                  <Ionicons name="location" size={36} color="#00f4f5" />
                </Marker>
              )}
              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor="#00E5FF"
                  strokeWidth={4}
                  lineDashPattern={[]}
                  geodesic
                  lineJoin="round"
                  lineCap="round"
                />
              )}
            </MapView>

            {/* Center on my location */}
            <TouchableOpacity style={st.myLocBtn} onPress={centerOnMe} activeOpacity={0.8}>
              <Ionicons name="locate" size={22} color="#00E5FF" />
            </TouchableOpacity>
          </View>

          {/* Search panel - Animated */}
          <Animated.View
            style={[
              st.searchPanel,
              {
                transform: [
                  {
                    translateY: mapKeyboardOffsetAnim,
                  },
                ],
              },
            ]}
          >
            {/* Origin input */}
            <View style={{ zIndex: 20 }}>
              <View style={st.inputIconWrap}><View style={[st.inputDot, { backgroundColor: '#00E676' }]} /></View>
              <GooglePlacesAutocomplete
                ref={originAutoRef}
                placeholder="¿Dónde te recogemos?"
                fetchDetails
                minLength={2}
                debounce={150}
                enablePoweredByContainer={false}
                nearbyPlacesAPI="GooglePlacesSearch"
                onPress={(data, details) => handleLocationSelect(data, details, 'origin')}
                query={{ key: GOOGLE_MAPS_KEY, language: 'es', components: 'country:co', sessiontoken: sessionTokenOrigin.current }}
                styles={gpStyles}
                textInputProps={{
                  placeholderTextColor: 'rgba(255,255,255,0.4)',
                  onFocus: () => { if (!sessionTokenOrigin.current) sessionTokenOrigin.current = generateUID(); },
                  onBlur: () => { if (!origin) sessionTokenOrigin.current = null; },
                  editable: true,
                }}
              />
            </View>

            {/* Connecting dots */}
            <View style={st.connectLine}>
              <View style={st.connectDash} /><View style={st.connectDash} /><View style={st.connectDash} />
            </View>

            {/* Destination input */}
            <View style={{ zIndex: 15 }}>
              <View style={st.inputIconWrap}><View style={[st.inputDot, { backgroundColor: '#E91E63' }]} /></View>
              <GooglePlacesAutocomplete
                ref={destAutoRef}
                placeholder="¿A dónde vas?"
                fetchDetails
                minLength={2}
                debounce={150}
                enablePoweredByContainer={false}
                nearbyPlacesAPI="GooglePlacesSearch"
                onPress={(data, details) => handleLocationSelect(data, details, 'destination')}
                query={{ key: GOOGLE_MAPS_KEY, language: 'es', components: 'country:co', sessiontoken: sessionTokenDest.current }}
                styles={gpStyles}
                textInputProps={{
                  placeholderTextColor: 'rgba(255,255,255,0.4)',
                  onFocus: () => { if (!sessionTokenDest.current) sessionTokenDest.current = generateUID(); },
                  onBlur: () => { if (!destination) sessionTokenDest.current = null; },
                  editable: true,
                }}
              />
            </View>

            {/* Route summary chips */}
            {calculating && (
              <View style={st.routeSummary}>
                <ActivityIndicator size="small" color="#00E5FF" />
                <Text style={st.routeSummaryTxt}>Calculando ruta...</Text>
              </View>
            )}
            {!calculating && distance > 0 && (
              <View style={st.routeSummary}>
                <View style={st.routeChip}><Ionicons name="speedometer-outline" size={14} color="#00E5FF" /><Text style={st.routeChipTxt}>{distance.toFixed(1)} km</Text></View>
                <View style={st.routeChip}><Ionicons name="time-outline" size={14} color="#00E5FF" /><Text style={st.routeChipTxt}>{Math.round(duration)} min</Text></View>
                <View style={st.routeChip}><Ionicons name="cash-outline" size={14} color="#00E676" /><Text style={st.routeChipTxt}>$ {driverPrice.toLocaleString('es-CO')}</Text></View>
              </View>
            )}

            {/* Mini Map Preview */}
            {origin && destination && (
              <Animatable.View animation="fadeInUp" duration={400} delay={50} useNativeDriver>
                <View style={st.miniMapContainer}>
                  <View style={st.miniMapHeader}>
                    <Text style={st.miniMapTitle}>Visualiza tu ruta</Text>
                    <TouchableOpacity 
                      style={st.expandMapBtn}
                      onPress={() => setShowExpandedMap(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="expand-outline" size={18} color="#00E5FF" />
                    </TouchableOpacity>
                  </View>
                  <View style={st.miniMap}>
                    <MapView
                      style={{ width: '100%', height: 220 }}
                      provider={PROVIDER_GOOGLE}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      region={{
                        latitude: (origin.latitude + destination.latitude) / 2,
                        longitude: (origin.longitude + destination.longitude) / 2,
                        latitudeDelta: Math.max(Math.abs(origin.latitude - destination.latitude) * 1.6, 0.03),
                        longitudeDelta: Math.max(Math.abs(origin.longitude - destination.longitude) * 1.6, 0.03),
                      }}
                    >
                      <Marker
                        coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
                        pinColor="#00E676"
                        title="Origen"
                      />
                      <Marker
                        coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
                        pinColor="#E91E63"
                        title="Destino"
                      />
                      {routeCoords.length > 0 && (
                        <Polyline
                          coordinates={routeCoords}
                          strokeColor="#00E5FF"
                          strokeWidth={3}
                          lineDashPattern={[]}
                          geodesic
                          lineJoin="round"
                          lineCap="round"
                        />
                      )}
                    </MapView>
                  </View>
                </View>
              </Animatable.View>
            )}

            {/* Continue button */}
            <TouchableOpacity
              style={[st.continueBtn, !canContinue && { opacity: 0.45 }]}
              disabled={!canContinue}
              onPress={() => { Keyboard.dismiss(); setStep('details'); }}
              activeOpacity={0.85}
            >
              <Text style={st.continueTxt}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#051A26" />
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      )}

      {/* ════ STEP 2: DETAILS ════ */}
      {step === 'details' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          enabled={Platform.OS === 'ios'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={[st.detailsContent, { paddingBottom: insets.bottom + 200 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              bounces={false}
              overScrollMode="never"
              removeClippedSubviews={true}
              scrollEventThrottle={16}
              decelerationRate="fast"
              nestedScrollEnabled={false}
            >
          {/* Route summary card */}
          <Animatable.View animation="fadeInUp" duration={250} delay={0} useNativeDriver>
            <View style={st.routeCard}>
              <TouchableOpacity style={st.routeCardRow} onPress={() => !params.origin && setStep('map')} activeOpacity={!params.origin ? 0.7 : 1}>
                <View style={[st.routeCardDot, { backgroundColor: '#00E676' }]} />
                <Text style={st.routeCardAddr} numberOfLines={1}>{origin?.title}</Text>
                {!params.origin && <Ionicons name="create-outline" size={14} color="#00E5FF" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
              <View style={st.routeCardLine} />
              <TouchableOpacity style={st.routeCardRow} onPress={() => setStep('map')} activeOpacity={0.7}>
                <View style={[st.routeCardDot, { backgroundColor: '#E91E63' }]} />
                <Text style={st.routeCardAddr} numberOfLines={1}>{destination?.title}</Text>
                <Ionicons name="create-outline" size={14} color="#00E5FF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              <View style={st.routeCardMeta}>
                <Text style={st.routeCardMetaTxt}>{distance.toFixed(1)} km</Text>
                <Text style={st.routeCardMetaTxt}>•</Text>
                <Text style={st.routeCardMetaTxt}>{Math.round(duration)} min</Text>
              </View>
            </View>
          </Animatable.View>

          {/* ════ BOOKING MODE TOGGLE ════ */}
          <Animatable.View animation="fadeInUp" duration={250} delay={0} useNativeDriver>
            <Text style={st.label}>Tipo de Viaje</Text>
            <View style={st.bookingModeRow}>
              {[
                { mode: 'immediate' as const, label: '⚡ Inmediato', desc: 'Ahora +5 min' },
                { mode: 'scheduled' as const, label: '📅 Programado', desc: 'Elige la hora' },
              ].map((b) => (
                <TouchableOpacity
                  key={b.mode}
                  style={[st.bookingModeBtn, bookingMode === b.mode && st.bookingModeBtnActive]}
                  onPress={() => setBookingMode(b.mode)}
                  activeOpacity={0.8}
                >
                  <Text style={[st.bookingModeLabel, bookingMode === b.mode && st.bookingModeLabelActive]}>
                    {b.label}
                  </Text>
                  <Text style={[st.bookingModeDesc, bookingMode === b.mode && st.bookingModeDescActive]}>
                    {b.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>

          {/* Vehicle type */}
          <Animatable.View animation="fadeInUp" duration={250} delay={20} useNativeDriver>
            <Text style={st.label}>Tipo de Vehículo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.vehicleRow}>
              {VEHICLE_TYPES.map(v => (
                <TouchableOpacity
                  key={v.key}
                  style={[st.vehicleBtn, carType === v.key && st.vehicleBtnActive]}
                  onPress={() => setCarType(v.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={v.icon} size={24} color={carType === v.key ? '#051A26' : 'rgba(255,255,255,0.5)'} />
                  <Text style={[st.vehicleTxt, carType === v.key && st.vehicleTxtActive]}>{v.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animatable.View>

          {/* Trip type */}
          <Animatable.View animation="fadeInUp" duration={250} delay={40} useNativeDriver>
            <Text style={st.label}>Tipo de Recorrido</Text>
            <View style={st.tripRow}>
              {(['Ida', 'Ida y Vuelta'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[st.tripBtn, tripType === t && st.tripBtnActive]}
                  onPress={() => setTripType(t)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t === 'Ida' ? 'arrow-forward-circle' : 'repeat'} size={20} color={tripType === t ? '#051A26' : 'rgba(255,255,255,0.6)'} />
                  <Text style={[st.tripTxt, tripType === t && st.tripTxtActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>

          {/* Date - Solo si es PROGRAMADO */}
          {bookingMode === 'scheduled' && (
            <Animatable.View animation="fadeInUp" duration={250} delay={60} useNativeDriver>
              <Text style={st.label}>Fecha</Text>
              <TouchableOpacity style={st.infoCard} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={20} color="#00E5FF" />
                <Text style={st.infoVal}>{fmtDate(scheduledDate)}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </Animatable.View>
          )}

          {/* Time - Mostrar siempre, pero con comportamiento diferente */}
          <Animatable.View animation="fadeInUp" duration={250} delay={bookingMode === 'scheduled' ? 80 : 60} useNativeDriver>
            <Text style={st.label}>
              {bookingMode === 'immediate' ? 'Hora (Automática)' : 'Hora'}
            </Text>
            <TouchableOpacity 
              style={[st.infoCard, bookingMode === 'immediate' && { opacity: 0.6 }]} 
              onPress={() => bookingMode === 'scheduled' && setShowTimePicker(true)}
              disabled={bookingMode === 'immediate'}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={20} color="#00E5FF" />
              <Text style={st.infoVal}>
                {bookingMode === 'immediate' ? `${fmtTime(scheduledDate)} ⚡` : fmtTime(scheduledDate)}
              </Text>
              {bookingMode === 'scheduled' && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />}
            </TouchableOpacity>
          </Animatable.View>

          {/* Prices */}
          <Animatable.View animation="fadeInUp" duration={250} delay={100} useNativeDriver>
            <Text style={st.label}>
              Valor Estimado {bookingMode === 'immediate' ? '⚡ (Dinámico)' : '📅 (Fijo)'}
            </Text>
            <View style={st.priceRow}>
              <View style={st.priceCard}>
                <Text style={st.priceLbl}>Desde</Text>
                <Text style={st.priceAmt}>$ {(driverPrice || 0).toLocaleString('es-CO')}</Text>
              </View>
              <View style={st.priceCard}>
                <Text style={st.priceLbl}>Hasta</Text>
                <Text style={st.priceAmt}>$ {(clientPrice || 0).toLocaleString('es-CO')}</Text>
              </View>
            </View>
          </Animatable.View>

          {/* Observations */}
          <Animatable.View animation="fadeInUp" duration={250} delay={120} useNativeDriver>
            <Text style={st.label}>Observaciones (opcional)</Text>
            <TextInput
              style={st.obsInput}
              placeholder="Instrucciones adicionales..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={observations}
              onChangeText={setObservations}
              multiline
              maxLength={500}
            />
          </Animatable.View>

          {/* Payment method selector */}
          <Animatable.View animation="fadeInUp" duration={250} delay={140} useNativeDriver>
            <Text style={st.label}>Método de Pago</Text>
            <View style={st.payMethodRow}>
              {[
                { key: 'cash' as const, label: 'Efectivo', icon: 'cash-outline' as const },
                { key: 'nequi' as const, label: 'Nequi', icon: 'phone-portrait-outline' as const },
                { key: 'daviplata' as const, label: 'Daviplata', icon: 'wallet-outline' as const },
              ].map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    st.payMethodBtn,
                    paymentMode === m.key && st.payMethodBtnActive,
                  ]}
                  onPress={() => setPaymentMode(m.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={m.icon}
                    size={20}
                    color={paymentMode === m.key ? '#051A26' : '#00E5FF'}
                  />
                  <Text
                    style={[
                      st.payMethodTxt,
                      paymentMode === m.key && st.payMethodTxtActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>

          {/* Submit */}
          <Animatable.View animation="fadeInUp" duration={250} delay={160} useNativeDriver>
            <TouchableOpacity
              style={[st.submitBtn, !canSubmit && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#051A26" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#051A26" />
                  <Text style={st.submitTxt}>Crear Reserva</Text>
                </>
              )}
            </TouchableOpacity>
          </Animatable.View>

          <View style={st.userRow}>
            <Ionicons name="person-circle-outline" size={16} color="rgba(255,255,255,0.35)" />
            <Text style={st.userTxt}>Reservando como: {customerName}</Text>
          </View>
              </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}

      {/* Date/Time pickers */}
      <DateTimePickerModal isVisible={showDatePicker} mode="date" minimumDate={new Date()} onConfirm={handleDateConfirm} onCancel={() => setShowDatePicker(false)} confirmTextIOS="Confirmar" cancelTextIOS="Cancelar" />
      <DateTimePickerModal isVisible={showTimePicker} mode="time" onConfirm={handleTimeConfirm} onCancel={() => setShowTimePicker(false)} confirmTextIOS="Confirmar" cancelTextIOS="Cancelar" />

      {/* Expanded Map Modal */}
      <Modal visible={showExpandedMap} transparent={false} animationType="slide">
        <View style={st.expandedMapContainer}>
          <View style={st.expandedMapHeader}>
            <TouchableOpacity onPress={() => setShowExpandedMap(false)} activeOpacity={0.7}>
              <Ionicons name="chevron-down" size={28} color="#00E5FF" />
            </TouchableOpacity>
            <Text style={st.expandedMapTitle}>Ruta Completa</Text>
            <View style={{ width: 28 }} />
          </View>
          
          {origin && destination && (
            <MapView
              ref={expandedMapRef}
              style={st.expandedMap}
              provider={PROVIDER_GOOGLE}
              scrollEnabled
              zoomEnabled
              pitchEnabled
              rotateEnabled
              region={{
                latitude: (origin.latitude + destination.latitude) / 2,
                longitude: (origin.longitude + destination.longitude) / 2,
                latitudeDelta: Math.max(Math.abs(origin.latitude - destination.latitude) * 1.6, 0.03),
                longitudeDelta: Math.max(Math.abs(origin.longitude - destination.longitude) * 1.6, 0.03),
              }}
            >
              <Marker
                coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
                pinColor="#00E676"
                title="Origen"
                description={origin.title}
              />
              <Marker
                coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
                pinColor="#E91E63"
                title="Destino"
                description={destination.title}
              />
              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor="#00E5FF"
                  strokeWidth={4}
                  lineDashPattern={[]}
                  geodesic
                  lineJoin="round"
                  lineCap="round"
                />
              )}
            </MapView>
          )}

          <View style={st.expandedMapFooter}>
            <TouchableOpacity 
              style={st.expandedMapCloseBtn}
              onPress={() => setShowExpandedMap(false)}
              activeOpacity={0.8}
            >
              <Text style={st.expandedMapCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

export default CreateReservationScreen;

/* ────────────── STYLES ────────────── */
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#051A26' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10, zIndex: 30,
    backgroundColor: 'rgba(5,26,38,0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },

  mapContainer: { flex: 1 },
  myLocBtn: {
    position: 'absolute', bottom: 120, right: 16, width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(5,26,38,0.88)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  searchPanel: {
    backgroundColor: 'rgba(5,26,38,0.95)', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -60,
    borderTopWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
  },
  inputIconWrap: { position: 'absolute', left: 14, top: 15, zIndex: 20 },
  inputDot: { width: 10, height: 10, borderRadius: 5 },
  connectLine: { marginLeft: 18, height: 16, justifyContent: 'space-between' },
  connectDash: { width: 2, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
  routeSummary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(10,46,61,0.5)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)',
  },
  routeSummaryTxt: { fontSize: 13, color: '#00E5FF', fontWeight: '600' },
  routeChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeChipTxt: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 18, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 20, backgroundColor: '#00E5FF',
    marginBottom: 20,
  },
  continueTxt: { fontSize: 17, fontWeight: '700', color: '#051A26' },

  detailsContent: { paddingHorizontal: 20, paddingTop: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#00E5FF', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 18 },
  routeCard: {
    padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(10,46,61,0.55)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.14)',
  },
  routeCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeCardDot: { width: 10, height: 10, borderRadius: 5 },
  routeCardLine: { width: 2, height: 14, backgroundColor: 'rgba(255,255,255,0.12)', marginLeft: 4 },
  routeCardAddr: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  routeCardMeta: { flexDirection: 'row', gap: 6, marginTop: 12, justifyContent: 'center' },
  routeCardMetaTxt: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  editRouteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(0,229,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)',
  },
  editRouteTxt: { fontSize: 12, fontWeight: '600', color: '#00E5FF' },
  vehicleRow: { gap: 10, paddingVertical: 4 },
  vehicleBtn: {
    width: (SW - 70) / 4, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(10,46,61,0.5)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)',
  },
  vehicleBtnActive: { backgroundColor: '#00E5FF', borderColor: '#00E5FF' },
  vehicleTxt: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  vehicleTxtActive: { color: '#051A26' },
  tripRow: { flexDirection: 'row', gap: 12 },
  tripBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(10,46,61,0.5)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)',
  },
  tripBtnActive: { backgroundColor: '#00E5FF', borderColor: '#00E5FF' },
  tripTxt: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tripTxtActive: { color: '#051A26' },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
  },
  infoVal: { flex: 1, fontSize: 14, fontWeight: '500', color: '#FFF' },
  priceRow: { flexDirection: 'row', gap: 12 },
  priceCard: {
    flex: 1, paddingVertical: 16, paddingHorizontal: 14, borderRadius: 16, alignItems: 'center',
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
  },
  priceLbl: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 },
  priceAmt: { fontSize: 18, fontWeight: '700', color: '#00E5FF' },
  obsInput: {
    minHeight: 80, padding: 16, borderRadius: 16, fontSize: 14, color: '#FFF',
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
    textAlignVertical: 'top',
  },
  payMethodRow: {
    flexDirection: 'row', gap: 10, marginTop: 8,
  },
  payMethodBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1.5, borderColor: 'rgba(0,229,255,0.18)',
  },
  payMethodBtnActive: {
    backgroundColor: '#00E5FF', borderColor: '#00E5FF',
  },
  payMethodTxt: {
    fontSize: 12, fontWeight: '600', color: '#00E5FF',
  },
  payMethodTxtActive: {
    color: '#051A26',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 24, paddingVertical: 16, borderRadius: 20, backgroundColor: '#00E5FF',
  },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#051A26' },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 10 },
  userTxt: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  
  /* ═══ Toggle Booking Mode ═══ */
  bookingModeRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  bookingModeBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 16, borderRadius: 16,
    backgroundColor: 'rgba(10,46,61,0.5)', borderWidth: 1.5, borderColor: 'rgba(0,229,255,0.15)',
    shadowColor: 'rgba(0,229,255,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
  },
  bookingModeBtnActive: {
    backgroundColor: 'rgba(0,229,255,0.15)', borderColor: '#00E5FF',
    shadowColor: '#00E5FF', shadowOpacity: 0.3, elevation: 4,
  },
  bookingModeLabel: {
    fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.5)',
  },
  bookingModeLabelActive: {
    color: '#00E5FF', fontSize: 17,
  },
  bookingModeDesc: {
    fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.3)',
  },
  bookingModeDescActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  
  /* ═══ Mini Map Preview ═══ */
  miniMapContainer: {
    marginTop: 16, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18,
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
  },
  miniMapHeader: {
    marginBottom: 10,
  },
  miniMapTitle: {
    fontSize: 13, fontWeight: '700', color: '#00E5FF', letterSpacing: 0.5, textTransform: 'uppercase',
  },
  miniMap: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)',
    shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  expandMapBtn: {
    padding: 8, borderRadius: 10,
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  
  /* ═══ Expanded Map Modal ═══ */
  expandedMapContainer: {
    flex: 1, backgroundColor: '#051A26',
  },
  expandedMapHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    backgroundColor: 'rgba(5,26,38,0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  expandedMapTitle: {
    fontSize: 18, fontWeight: '700', color: '#FFF',
  },
  expandedMap: {
    flex: 1,
  },
  expandedMapFooter: {
    paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 20,
    backgroundColor: 'rgba(5,26,38,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(0,229,255,0.1)',
  },
  expandedMapCloseBtn: {
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center',
  },
  expandedMapCloseBtnText: {
    fontSize: 16, fontWeight: '700', color: '#FFF',
  },
});

