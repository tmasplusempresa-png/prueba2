import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Linking, Platform, Dimensions, Modal, TextInput, Easing,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import MapView, { Marker, MarkerAnimated, AnimatedRegion, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '@/common/store';
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';
import supabase from '@/config/SupabaseConfig';
import { activeTripBookings } from '@/hooks/useDriverCancellationWatcher';
import { GOOGLE_MAPS_DARK_STYLE } from '@/config/googleMapsDarkStyle';
import { API_KEY, getMapboxAccessToken } from '@/config/AppConfig';
import { DRIVER_LOCATION_PUCK_IMAGE } from '@/components/DriverMapLocationMarker';
import { updateDriverNotification, showDriverActiveNotification } from '@/hooks/DriverNotificationService';
import DriverOtpVerificationModal from '@/components/DriverOtpVerificationModal';
import { useDriverTracking } from '@/hooks/useDriverTracking';
import { OtpService } from '@/common/services/OtpService';
import { useOtpTimer } from '@/hooks/useOtpTimer';
// import AgoraCallModal from '@/components/AgoraCallModal'; // COMENTADO PARA EXPO GO
// import { useAgoraCall } from '@/hooks/useAgoraCall'; // COMENTADO PARA EXPO GO
import { notifyIncomingCall } from '@/common/services/NotificationService';
import { shareTrip } from '@/common/utils/tripShare';
import { addActualsToBooking } from '@/common/other/sharedFunctions';
import { formatBookingFareRange } from '@/constants/fare';
import { submitTripRating } from '@/common/utils/userRating';
import { preferredConductorId } from '@/common/utils/driverIds';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';
import FloatingChatModal from '@/components/FloatingChatModal';
import ProfilePhotoPreview from '@/components/ProfilePhotoPreview';
import StarRating from 'react-native-star-rating-widget';
import {
  normalizePaymentMode,
  getPaymentModeLabel,
  getPaymentModeLogoUri,
  getPaymentModeIonicon,
} from '@/common/utils/paymentMode';

const ROUTE_LINE_BLUE = '#00E5FF';
const TIP_BASE_ZOOM = 17;
/** Cámara modo Navegar (tipo Waze): 3D, zoom fijo de calle. */
const NAV_PITCH = 60;
const NAV_ZOOM = 19;
/** Cámara 2D al reubicar / salir de Navegar. */
const OVERVIEW_ZOOM = 17;

/** Desde esta velocidad (~9 km/h) el rumbo GPS es confiable; por debajo manda la brújula. */
const MOVING_SPEED_MPS = 2.5;
/** Con posición ya fijada, se ignoran fixes peores (WiFi/celda bajo techo). */
const MAX_FIX_ACCURACY_M = 50;
/** El primer fix suele ser la ubicación en caché del SO (minutos atrás). */
const MAX_FIX_AGE_MS = 30_000;
/** Suavizado de brújula (0–1): más bajo = giro más suave. */
const COMPASS_SMOOTHING = 0.2;
/** Fracción del giro restante que avanza el puntero por frame (easing). */
const PUCK_ROTATION_EASING = 0.15;
/** Igual al intervalo GPS: puntero y cámara se deslizan sin saltos entre fixes. */
const GPS_INTERVAL_MS = 1000;
const MARKER_GLIDE_MS = GPS_INTERVAL_MS;
/**
 * En marcha se proyecta la posición hacia adelante (velocidad × LEAD) para
 * compensar la latencia del fix + el deslizamiento; sin esto el puntero va ~2 s atrás.
 */
const POSITION_LEAD_S = 1.2;

type LatLng = { latitude: number; longitude: number };

const angleDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;
const normalizeDeg = (d: number) => ((d % 360) + 360) % 360;
const projectMeters = (p: LatLng, bearing: number, meters: number): LatLng => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const δ = meters / 6371000;
  const θ = toRad(bearing);
  const φ1 = toRad(p.latitude);
  const λ1 = toRad(p.longitude);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { latitude: (φ2 * 180) / Math.PI, longitude: (λ2 * 180) / Math.PI };
};

const NAV_GLOW_RING_IMAGE = require('@/assets/images/icon-map-vector/nav-glow-ring.png');
const ROUTE_TURN_ARROW_IMAGE = require('@/assets/images/icon-map-vector/route-turn-arrow.png');
/** Periodo del parpadeo del borde del puntero. */
const GLOW_PERIOD_MS = 1600;
const GLOW_TICK_MS = 80;

type DriverPuckHandle = {
  setHeading: (deg: number) => void;
  /** Rumbo de la cámara en Navegar (puntero de frente a pantalla); null = 2D plano. */
  setMapBearing: (deg: number | null) => void;
};

/**
 * Puntero del conductor. Gira con easing propio (requestAnimationFrame) y solo
 * re-renderiza este marcador, no toda la pantalla.
 *
 * En 3D un marcador `flat` se acuesta sobre el mapa y se ve más pequeño por la
 * perspectiva; en Navegar se dibuja de frente y se compensa el rumbo de la cámara.
 */
const DriverPuck = React.memo(
  React.forwardRef<DriverPuckHandle, { coordinate: AnimatedRegion }>(({ coordinate }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [mapBearing, setMapBearingState] = useState<number | null>(null);
    const [glow, setGlow] = useState(1);
    const shownRef = useRef(0);
    const targetRef = useRef(0);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
      const start = Date.now();
      const id = setInterval(() => {
        const t = ((Date.now() - start) % GLOW_PERIOD_MS) / GLOW_PERIOD_MS;
        setGlow(0.35 + 0.65 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2)));
      }, GLOW_TICK_MS);
      return () => clearInterval(id);
    }, []);

    const step = useCallback(() => {
      const d = angleDelta(shownRef.current, targetRef.current);
      if (Math.abs(d) < 0.3) {
        shownRef.current = targetRef.current;
        setRotation(targetRef.current);
        frameRef.current = null;
        return;
      }
      shownRef.current = normalizeDeg(shownRef.current + d * PUCK_ROTATION_EASING);
      setRotation(shownRef.current);
      frameRef.current = requestAnimationFrame(step);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setHeading: (deg: number) => {
          targetRef.current = normalizeDeg(deg);
          if (frameRef.current == null) frameRef.current = requestAnimationFrame(step);
        },
        setMapBearing: (deg: number | null) => {
          setMapBearingState(deg == null ? null : Math.round(normalizeDeg(deg)));
        },
      }),
      [step],
    );

    useEffect(
      () => () => {
        if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      },
      [],
    );

    const flat = mapBearing == null;
    const shownRotation = flat ? rotation : normalizeDeg(rotation - mapBearing);

    return (
      <>
        <MarkerAnimated
          coordinate={coordinate as any}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={flat}
          opacity={glow}
          tracksViewChanges={false}
          zIndex={9}
          image={NAV_GLOW_RING_IMAGE}
        />
        <MarkerAnimated
          coordinate={coordinate as any}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={flat}
          rotation={shownRotation}
          tracksViewChanges={false}
          zIndex={10}
          image={DRIVER_LOCATION_PUCK_IMAGE}
        />
      </>
    );
  }),
);
const bearingDeg = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(a.latitude);
  const φ2 = toRad(b.latitude);
  const Δλ = toRad(b.longitude - a.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeDeg((Math.atan2(y, x) * 180) / Math.PI);
};

/** Puntas inicio/fin: escala con zoom, tope bajo para no tapar calles. */
const tipRadiusForZoom = (zoom: number) => {
  const levelsOut = Math.max(0, TIP_BASE_ZOOM - zoom);
  const levelsIn = Math.max(0, zoom - TIP_BASE_ZOOM);
  const scaled = 7 * Math.pow(1.28, levelsOut) / Math.pow(1.55, levelsIn);
  return Math.min(Math.max(scaled, 5), 14);
};

const TIP_START_FILL = '#FFFFFF';
const TIP_END_FILL = 'rgba(244, 143, 177, 0.55)'; // rojo pastel suave
const TIP_END_STROKE = 'rgba(233, 30, 99, 0.75)';
const TIP_STROKE = '#00E5FF';

const { width, height } = Dimensions.get('window');
const BG_IMAGE = require('../../assets/images/bg.png');
const MAPBOX_TOKEN = getMapboxAccessToken();

const sendPushNotification = async (token: string, title: string, body: string) => {
  if (!token) return;
  try {
    await fetch('https://us-central1-treasupdate.cloudfunctions.net/sendNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body }),
    });
  } catch (e) {
    console.error('Push notification error:', e);
  }
};

// Phase: NAVIGATING_TO_PICKUP → ARRIVED_AT_PICKUP → TRIP_STARTED → TRIP_COMPLETE
type TripPhase = 'NAVIGATING_TO_PICKUP' | 'ARRIVED_AT_PICKUP' | 'TRIP_STARTED' | 'TRIP_COMPLETE';

const formatTime = (ts: string) => {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
};

const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** precision: 5 = Google / Mapbox `polyline`, 6 = Mapbox `polyline6` (más detalle en curvas). */
const decodePolyline = (encoded: string, precision = 5): { latitude: number; longitude: number }[] => {
  const factor = Math.pow(10, precision);
  const coords: { latitude: number; longitude: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push({ latitude: lat / factor, longitude: lng / factor });
  }
  return coords;
};

/** Radio (m) con que se redondea cada esquina de la ruta: suaviza sin salirse de la calle. */
const ROUTE_CORNER_RADIUS_M = 7;
const ROUTE_CORNER_STEPS = 5;

/**
 * Redondea las esquinas de la polilínea con una curva cuadrática corta en cada
 * vértice (en vez de Chaikin, que en cuadras largas recorta decenas de metros).
 */
const smoothRoute = (pts: { latitude: number; longitude: number }[]) => {
  if (pts.length < 3) return pts;
  const lerp = (a: LatLng, b: LatLng, t: number): LatLng => ({
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  });
  const out: LatLng[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const v = pts[i];
    const b = pts[i + 1];
    const lenA = getDistanceMeters(a.latitude, a.longitude, v.latitude, v.longitude);
    const lenB = getDistanceMeters(v.latitude, v.longitude, b.latitude, b.longitude);
    const d = Math.min(ROUTE_CORNER_RADIUS_M, lenA / 2, lenB / 2);
    if (d < 0.5) {
      out.push(v);
      continue;
    }
    const p0 = lerp(v, a, d / lenA);
    const p2 = lerp(v, b, d / lenB);
    for (let s = 0; s <= ROUTE_CORNER_STEPS; s++) {
      const t = s / ROUTE_CORNER_STEPS;
      const u = 1 - t;
      out.push({
        latitude: u * u * p0.latitude + 2 * u * t * v.latitude + t * t * p2.latitude,
        longitude: u * u * p0.longitude + 2 * u * t * v.longitude + t * t * p2.longitude,
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

type RouteTurn = { coord: LatLng; bearing: number };
/** La flecha va sobre el tramo de salida del giro, un poco después de la esquina. */
const TURN_ARROW_OFFSET_M = 9;

// Formatea una duración en segundos a "Xh Ym" / "Xm Ys" para el resumen de viaje.
const formatTripDuration = (totalSeconds: number | null | undefined): string => {
  const secs = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const ReservationTripScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const profile = useSelector((s: RootState) => s.auth.profile) as any;

  const reservation = (route.params as any)?.reservation;
  
  // Debug logging
  console.log('🗺️ [ReservationTripScreen] Route params:', {
    hasReservation: !!reservation,
    reservationId: reservation?.id,
    pickupLat: reservation?.pickup_lat,
    pickupLng: reservation?.pickup_lng,
    dropLat: reservation?.drop_lat,
    dropLng: reservation?.drop_lng,
    pickupAddress: reservation?.pickup_address,
    dropAddress: reservation?.drop_address,
  });

  if (!reservation) {
    return (
      <View style={s.root}>
        <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 100 }}>❌ Sin datos de reserva</Text>
        <Text style={{ color: '#999', textAlign: 'center', marginTop: 20, fontSize: 12 }}>
          Debug: No se recibieron parámetros
        </Text>
      </View>
    );
  }

  const pickupLat = reservation.pickup_lat || (reservation.pickup?.lat);
  const pickupLng = reservation.pickup_lng || (reservation.pickup?.lng);
  const dropLat = reservation.drop_lat || (reservation.drop?.lat);
  const dropLng = reservation.drop_lng || (reservation.drop?.lng);

  if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
    return (
      <View style={s.root}>
        <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 100 }}>❌ Coordenadas incompletas</Text>
        <Text style={{ color: '#999', textAlign: 'center', marginTop: 20, fontSize: 12 }}>
          Pickup: {pickupLat}, {pickupLng} | Drop: {dropLat}, {dropLng}
        </Text>
      </View>
    );
  }

  const [phase, setPhase] = useState<TripPhase>(() => {
    if (reservation.status === 'STARTED') return 'TRIP_STARTED';
    if (reservation.status === 'ARRIVED') return 'ARRIVED_AT_PICKUP';
    return 'NAVIGATING_TO_PICKUP';
  });
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  /** Último fix GPS real aceptado. */
  const driverLocationRef = useRef<LatLng | null>(null);
  /** Posición mostrada (con proyección en marcha): destino del puntero y de la cámara. */
  const shownLocationRef = useRef<LatLng | null>(null);
  const puckRef = useRef<DriverPuckHandle>(null);
  /** Último rumbo enviado al puntero (GPS o brújula). */
  const lastHeadingRef = useRef(0);
  /** Rumbo del mapa en Navegar: solo el curso GPS en marcha (como Waze, la brújula no gira el mapa). */
  const navCourseRef = useRef(0);
  const compassSmoothedRef = useRef<number | null>(null);
  const speedMpsRef = useRef(0);
  const driverAnim = useRef(
    new AnimatedRegion({ latitude: 0, longitude: 0, latitudeDelta: 0, longitudeDelta: 0 }),
  ).current;
  const [inAppNav, setInAppNav] = useState(false);
  const navModeRef = useRef(false);
  const navZoomRef = useRef(NAV_ZOOM);
  const setNavMode = useCallback((on: boolean) => {
    navModeRef.current = on;
    setInAppNav(on);
    puckRef.current?.setMapBearing(on ? navCourseRef.current : null);
  }, []);
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const unreadChatCount = useChatUnreadCount(reservation?.id, 'driver', !!reservation?.id);
  const [chatVisible, setChatVisible] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [mapZoom, setMapZoom] = useState(17);
  const mapZoomRef = useRef(17);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeTurns, setRouteTurns] = useState<RouteTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [driverCountdown, setDriverCountdown] = useState<number | null>(null);
  const localTimerStart = useRef<number | null>(null); // Fallback local timestamp
  const voiceReminderSent = useRef(false);
  // Timestamp (ms epoch) de inicio real del viaje — insumo de `addActualsToBooking`
  // para calcular `total_trip_time`. Se fija en handleStartTrip.
  const tripStartTimestamp = useRef<number>(0);
  
  // ✅ OTP State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [waitingForOtpTimer, setWaitingForOtpTimer] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(''); // 🆕 Input del driver

  // 💵 Precio total del servicio — primer modal al finalizar, antes de calificar.
  // Mismo valor que ve el cliente (ver `addActualsToBooking`: price === trip_cost, sin margen al cierre).
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  // 📏 Distancia (km) y ⏱️ tiempo (segundos) reales recalculados al cierre —
  // se muestran junto al precio en el modal de fin de viaje.
  const [finalDistanceKm, setFinalDistanceKm] = useState<number | null>(null);
  const [finalTripSeconds, setFinalTripSeconds] = useState<number | null>(null);
  const completedBookingRef = useRef<any>(null);

  // ⭐ Customer rating (conductor → cliente) requerido antes de finalizar
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [customerRating, setCustomerRating] = useState(0);
  const [customerReview, setCustomerReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // ⏱️ OTP Timer Hook - Persistent 3-minute countdown
  const otpTimer = useOtpTimer({
    bookingId: reservation?.id,
    initialTimeRemaining: 180, // 3 minutos
    autoStart: false,
    onTimerExpired: () => {
      console.log('⏰ [OTP TIMER] Timer ha expirado - habilitar ingreso de código');
      setWaitingForOtpTimer(false);
      // Notificar al cliente que el código ya está disponible y el servicio será iniciado
      if (reservation.customer_token) {
        sendPushNotification(
          reservation.customer_token,
          '🔐 Código de verificación listo',
          `Tu código de seguridad está disponible. Compártelo con tu conductor para iniciar el viaje.`,
        );
      }
    },
  });

  // Escribe la posición del conductor en booking_tracking para que el cliente la vea en tiempo real
  useDriverTracking(
    reservation?.id ?? null,
    user?.id ?? user?.uid ?? null,
    phase !== 'TRIP_COMPLETE'
  );

  // Agora calls - COMENTADO PARA EXPO GO
  // const callManager = useAgoraCall({
  //   appId: AGORA_APP_ID || 'e7f6e9aeecf14b2ba10e3f40be9f56e7',
  //   userId: user?.id || user?.auth_id || 'user_unknown',
  //   userName: user?.first_name || user?.name || 'Conductor',
  //   userPhone: user?.mobile || 'N/A',
  //   userImage: user?.profile_image,
  // });
  // Mock callManager para desarrollo sin Agora
  const callManager = {
    callActive: false,
    channelName: '',
    remoteUser: null,
    token: null,
    isLoadingToken: false,
    makeCall: () => console.log('📞 Mock call'),
    acceptCall: () => console.log('📞 Mock accept'),
    endCall: () => console.log('📞 Mock end'),
  };

  // Payment info from the reservation
  const paymentMode = normalizePaymentMode(reservation.payment_mode);
  const driverPaymentNumber = user?.bankAccount || user?.mobile || '';

  const paymentLabel = getPaymentModeLabel(reservation.payment_mode);

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

  // Voice reminder when driver gets close to pickup (< 800m)
  useEffect(() => {
    if (voiceReminderSent.current) return;
    if (phase !== 'NAVIGATING_TO_PICKUP') return;
    if (distanceToPickup === null || distanceToPickup > 800) return;

    voiceReminderSent.current = true;
    // Anunciar el mínimo del rango (trip_cost / driver_share).
    const price =
      Number(reservation.trip_cost) ||
      Number(reservation.driver_share) ||
      Number(reservation.price) ||
      Number(reservation.estimate) ||
      0;
    const priceFormatted = price.toLocaleString('es-CO');

    let voiceMsg = `Estás llegando al punto de recogida de ${reservation.customer_name}. `;
    if (paymentMode === 'cash') {
      voiceMsg += `El pago estimado mínimo es en efectivo por ${priceFormatted} pesos.`;
    } else {
      voiceMsg += `El pago estimado mínimo es por ${paymentLabel} por ${priceFormatted} pesos. Recuerda confirmar la transferencia al finalizar el viaje.`;
    }

    Speech.stop().then(() => {
      Speech.speak(voiceMsg, { language: 'es-CO', pitch: 1, rate: 0.9 });
    }).catch(() => {
      Speech.speak(voiceMsg, { language: 'es-CO', pitch: 1, rate: 0.9 });
    });
  }, [distanceToPickup, phase, paymentMode]);

  const applyHeading = useCallback((target: number) => {
    lastHeadingRef.current = normalizeDeg(target);
    puckRef.current?.setHeading(lastHeadingRef.current);
  }, []);

  // Cámara Navegar: imperativa (sin estado) para no re-renderizar ni pelear con otros efectos.
  const followNavCamera = useCallback((center: LatLng, duration: number) => {
    if (!navModeRef.current || !mapRef.current) return;
    mapRef.current.animateCamera(
      { center, heading: navCourseRef.current, pitch: NAV_PITCH, zoom: navZoomRef.current },
      { duration },
    );
  }, []);

  // GPS (en Android usa el Fused Location Provider de Google Play Services).
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      if (Platform.OS === 'android') {
        // Pide activar "Precisión de ubicación de Google" si está apagada.
        await Location.enableNetworkProviderAsync().catch(() => {});
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: GPS_INTERVAL_MS, distanceInterval: 0 },
        (loc) => {
          if (Date.now() - loc.timestamp > MAX_FIX_AGE_MS) return;
          const { latitude, longitude, accuracy, speed, heading } = loc.coords;
          const acc = typeof accuracy === 'number' && accuracy > 0 ? accuracy : 999;
          const prev = driverLocationRef.current;
          if (prev && acc > MAX_FIX_ACCURACY_M) return;

          const spd = typeof speed === 'number' && speed > 0 ? speed : 0;
          speedMpsRef.current = spd;
          const next = { latitude, longitude };
          let shown: LatLng = next;

          if (prev) {
            const moved = getDistanceMeters(prev.latitude, prev.longitude, latitude, longitude);
            // Quieto, el GPS "camina" unos metros: no mover el puntero por ruido.
            if (spd < 1 && moved < Math.max(8, acc)) return;
            if (spd >= MOVING_SPEED_MPS) {
              const course =
                typeof heading === 'number' && heading >= 0
                  ? heading
                  : moved >= 5
                    ? bearingDeg(prev, next)
                    : null;
              if (course != null) {
                applyHeading(course);
                navCourseRef.current = course;
                if (navModeRef.current) puckRef.current?.setMapBearing(course);
                shown = projectMeters(next, course, spd * POSITION_LEAD_S);
              }
            }
            (driverAnim.timing as any)({
              latitude: shown.latitude,
              longitude: shown.longitude,
              latitudeDelta: 0,
              longitudeDelta: 0,
              duration: MARKER_GLIDE_MS,
              easing: Easing.linear,
              useNativeDriver: false,
            }).start();
            followNavCamera(shown, MARKER_GLIDE_MS);
          } else {
            driverAnim.setValue({ latitude, longitude, latitudeDelta: 0, longitudeDelta: 0 } as any);
          }

          shownLocationRef.current = shown;
          driverLocationRef.current = next;
          setDriverLocation(next);
          if (pickupLat && pickupLng) {
            setDistanceToPickup(getDistanceMeters(latitude, longitude, pickupLat, pickupLng));
          }
        },
      );
      if (cancelled) sub.remove();
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [pickupLat, pickupLng, applyHeading, followNavCamera, driverAnim]);

  // Brújula: con el carro quieto o lento, el puntero sigue el giro del celular.
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      try {
        sub = await Location.watchHeadingAsync((h) => {
          if (cancelled) return;
          if (speedMpsRef.current >= MOVING_SPEED_MPS) {
            compassSmoothedRef.current = null;
            return;
          }
          const raw =
            typeof h.trueHeading === 'number' && h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (typeof raw !== 'number' || raw < 0) return;
          const prev = compassSmoothedRef.current;
          const smoothed =
            prev == null ? raw : normalizeDeg(prev + angleDelta(prev, raw) * COMPASS_SMOOTHING);
          compassSmoothedRef.current = smoothed;
          applyHeading(smoothed);
        });
        if (cancelled) sub.remove();
      } catch (e) {
        console.warn('[ReservationTrip] watchHeadingAsync failed', e);
      }
    })();
    return () => {
      cancelled = true;
      try {
        sub?.remove();
      } catch {
        // ignore
      }
    };
  }, [applyHeading]);

  // Foto del cliente
  useEffect(() => {
    let cancelled = false;
    const pickPhoto = (...candidates: Array<string | null | undefined>) => {
      for (const c of candidates) {
        const u = String(c || '').trim();
        if (u.startsWith('http') || u.startsWith('file:') || u.startsWith('content:')) return u;
      }
      return null;
    };
    const load = async () => {
      const fallback = pickPhoto(reservation?.customer_image, reservation?.profile_image);
      if (!cancelled && fallback) setCustomerPhoto(fallback);
      const targetId = String(reservation?.customer_id || reservation?.customer || '').trim();
      if (!targetId) return;
      try {
        const headers = await getSupabaseAuthHeaders();
        const url =
          `${SUPABASE_URL}/rest/v1/users` +
          `?or=(id.eq.${encodeURIComponent(targetId)},auth_id.eq.${encodeURIComponent(targetId)})` +
          `&select=profile_image&limit=1`;
        const res = await fetch(url, { headers });
        if (!res.ok) return;
        const rows = await res.json();
        const u = Array.isArray(rows) ? rows[0] : null;
        const photo = pickPhoto(u?.profile_image, fallback);
        if (!cancelled && photo) setCustomerPhoto(photo);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [reservation?.customer_id, reservation?.customer, reservation?.customer_image]);

  // Mientras esta pantalla esté montada, "posee" su booking: el watcher global
  // (useDriverCancellationWatcher) ignora este id para no duplicar el modal.
  // Aquí mostramos el aviso y navegamos de vuelta; fuera de aquí lo hace el global.
  useEffect(() => {
    if (!reservation?.id) return;
    const id = String(reservation.id);
    activeTripBookings.add(id);
    return () => { activeTripBookings.delete(id); };
  }, [reservation?.id]);

  // 🚫 Detectar cancelación (cliente o admin desde web) — poll + realtime
  useEffect(() => {
    if (!reservation?.id) return;
    if (phase === 'TRIP_COMPLETE') return;
    let cancelHandled = false;

    const handleCancellation = (reason?: string | null, cancelledBy?: string | null) => {
      if (cancelHandled) return;
      cancelHandled = true;
      const actor =
        cancelledBy === 'admin'
          ? 'El administrador'
          : reservation.customer_name || 'El cliente';
      const msg = `${actor} canceló el servicio.${reason ? `\nMotivo: ${reason}` : ''}`;
      const goBack = () => {
        setAlertVisible(false);
        nav.goBack();
      };
      showAlert('warning', 'Servicio cancelado', msg, [
        { text: 'Entendido', style: 'default', onPress: goBack },
      ]);
      // Failsafe: si el modal se cierra por dismiss o no se interactúa,
      // navegar de vuelta de todos modos tras un breve margen.
      setTimeout(goBack, 6000);
    };

    const checkCancellation = async () => {
      if (cancelHandled) return;
      try {
        const { data, error } = await (supabase as any)
          .from('bookings')
          .select('status, cancelled_by, reason')
          .eq('id', reservation.id)
          .single();
        if (error || !data) return;
        if (data.status === 'CANCELLED') {
          handleCancellation(data.reason, data.cancelled_by);
        }
      } catch (e) {
        console.warn('checkCancellation error:', e);
      }
    };

    checkCancellation();
    const interval = setInterval(checkCancellation, 3000);

    // Realtime: detecta cancelación al instante sin esperar el siguiente poll
    const channel = (supabase as any)
      .channel(`booking-cancel-${reservation.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reserva', filter: `id=eq.${reservation.id}` },
        (payload: any) => {
          // reserva (nuevo): estado / motivo_cancelacion / cancelado_por
          const estado = payload?.new?.status ?? payload?.new?.estado;
          if (estado === 'CANCELLED') {
            handleCancellation(
              payload.new.reason ?? payload.new.motivo_cancelacion,
              payload.new.cancelled_by ?? payload.new.cancelado_por,
            );
          }
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      (supabase as any).removeChannel?.(channel);
    };
  }, [reservation?.id, reservation?.customer_name, phase, nav]);

  // Fetch route polyline
  // overview=full + polyline6: geometría completa (la simplificada dibuja curvas "cuadradas").
  const fetchRoute = useCallback(async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
    try {
      if (MAPBOX_TOKEN) {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}` +
          `?geometries=polyline6&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        const route = data.routes?.[0];
        if (route?.geometry) {
          const turns: RouteTurn[] = [];
          for (const leg of route.legs || []) {
            for (const step of leg.steps || []) {
              const m = step.maneuver;
              if (!m?.location || typeof m.bearing_after !== 'number') continue;
              if (m.type === 'depart' || m.type === 'arrive') continue;
              if (!/left|right|uturn/.test(String(m.modifier || ''))) continue;
              const at = { latitude: m.location[1], longitude: m.location[0] };
              turns.push({
                coord: projectMeters(at, m.bearing_after, TURN_ARROW_OFFSET_M),
                bearing: m.bearing_after,
              });
            }
          }
          setRouteCoords(smoothRoute(decodePolyline(route.geometry, 6)));
          setRouteTurns(turns);
          return;
        }
      }
      // Fallback a Google: la polilínea de cada paso trae el detalle completo.
      if (API_KEY) {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const steps: any[] = data.routes?.[0]?.legs?.[0]?.steps || [];
        const full: LatLng[] = [];
        const turns: RouteTurn[] = [];
        for (const step of steps) {
          const pts = step?.polyline?.points ? decodePolyline(step.polyline.points) : [];
          if (/left|right|uturn/.test(String(step?.maneuver || '')) && pts.length >= 2) {
            const out = pts.find(
              (p) => getDistanceMeters(pts[0].latitude, pts[0].longitude, p.latitude, p.longitude) > 3,
            );
            if (out) {
              const bearing = bearingDeg(pts[0], out);
              turns.push({ coord: projectMeters(pts[0], bearing, TURN_ARROW_OFFSET_M), bearing });
            }
          }
          full.push(...(full.length ? pts.slice(1) : pts));
        }
        if (full.length > 1) {
          setRouteCoords(smoothRoute(full));
          setRouteTurns(turns);
        } else if (data.routes?.[0]?.overview_polyline?.points) {
          setRouteCoords(decodePolyline(data.routes[0].overview_polyline.points));
          setRouteTurns([]);
        }
      }
    } catch {}
  }, []);

  // Ruta según fase. Hacia la recogida se recalcula solo si el conductor se alejó
  // del último origen; pickup→drop es fija por fase.
  const routeOriginRef = useRef<{ phase: TripPhase; at: LatLng } | null>(null);
  useEffect(() => {
    if (!driverLocation) return;
    const last = routeOriginRef.current;
    if (phase === 'NAVIGATING_TO_PICKUP' && pickupLat && pickupLng) {
      if (
        last?.phase === phase &&
        getDistanceMeters(last.at.latitude, last.at.longitude, driverLocation.latitude, driverLocation.longitude) < 60
      ) {
        return;
      }
      routeOriginRef.current = { phase, at: driverLocation };
      fetchRoute(driverLocation.latitude, driverLocation.longitude, pickupLat, pickupLng);
    } else if (phase === 'TRIP_STARTED' && pickupLat && pickupLng && dropLat && dropLng) {
      if (last?.phase === phase) return;
      routeOriginRef.current = { phase, at: driverLocation };
      fetchRoute(pickupLat, pickupLng, dropLat, dropLng);
    }
  }, [phase, driverLocation, fetchRoute, pickupLat, pickupLng, dropLat, dropLng]);

  // Reemplaza la ruta sugerida (Mapbox/Google, fija desde TRIP_STARTED) por el
  // recorrido real registrado en `booking_tracking` — el trazo debe pasar por
  // todos los puntos GPS del conductor, no solo pickup→drop. Se llama de forma
  // eager desde `handleEndTrip` (no reactiva a `phase`) para que la ruta ya
  // esté lista antes de que aparezca el modal de precio/calificación/éxito —
  // si se esperaba al cambio de fase, un `fitToCoordinates` de otro efecto
  // (o la latencia de red) podía ganarle la carrera y dejar la cámara
  // encuadrada solo en 2 puntos aunque el trazo ya tuviera todo el recorrido.
  const loadActualRoute = async () => {
    if (!reservation?.id) return;
    try {
      const { data, error } = await supabase
        .from('booking_tracking')
        .select('lat, lng, created_at')
        .eq('booking_id', reservation.id)
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('[ReservationTripScreen] error leyendo booking_tracking para ruta final:', error);
        return;
      }
      const points = (data || []).map((row: any) => ({
        latitude: row.lat,
        longitude: row.lng,
      }));
      if (points.length > 1) {
        setRouteCoords(points);
        setRouteTurns([]);
        setNavMode(false);
        mapRef.current?.fitToCoordinates(points, {
          edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
          animated: true,
        });
      }
    } catch (e) {
      console.warn('[ReservationTripScreen] excepción cargando ruta real del viaje:', e);
    }
  };

  // Fit map to markers — en TRIP_COMPLETE la cámara la controla el efecto de
  // ruta real (arriba), que encuadra los puntos GPS completos; si este efecto
  // también corriera ahí, su fitToCoordinates(driverLocation+pickup) podía
  // ganar la carrera y recortar la vista a solo 2 puntos, tapando el resto
  // del trazo aunque routeCoords ya tuviera todo el recorrido.
  // Encuadre automático: UNA vez por fase, y nunca en Navegar. Antes dependía de
  // driverLocation y se re-ejecutaba con cada fix, peleando con la cámara.
  const fittedPhaseRef = useRef<TripPhase | null>(null);
  const hasDriverLocation = !!driverLocation;
  useEffect(() => {
    if (phase === 'TRIP_COMPLETE') return;
    if (fittedPhaseRef.current === phase || !hasDriverLocation) return;
    const timer = setTimeout(() => {
      if (!mapRef.current || navModeRef.current) return;
      const markers: LatLng[] = [];
      const driverLoc = shownLocationRef.current;
      if (driverLoc) markers.push(driverLoc);
      if (pickupLat && pickupLng && phase !== 'TRIP_STARTED') markers.push({ latitude: pickupLat, longitude: pickupLng });
      if (phase === 'TRIP_STARTED' && dropLat && dropLng) {
        markers.push({ latitude: pickupLat, longitude: pickupLng });
        markers.push({ latitude: dropLat, longitude: dropLng });
      }
      if (markers.length >= 2) {
        fittedPhaseRef.current = phase;
        mapRef.current.fitToCoordinates(markers, {
          edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
          animated: true,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [phase, hasDriverLocation, pickupLat, pickupLng, dropLat, dropLng]);

  // Update booking status in Supabase
  const updateBookingStatus = async (status: string, extraFields?: Record<string, any>) => {
    try {
      const headers = await getSupabaseAuthHeaders(true);
      const body: any = { status, ...extraFields };
      const url = `${SUPABASE_URL}/rest/v1/bookings?id=eq.${reservation.id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json())[0];
    } catch (e: any) {
      console.error('updateBookingStatus error:', e);
      throw e;
    }
  };

  // Confirm arrival at pickup — máximo 200 m
  const handleConfirmArrival = async () => {
    if (distanceToPickup !== null && distanceToPickup > 200) {
      showAlert('warning', 'Aún estás lejos', 'Debes estar a menos de 200 metros del punto de recogida para confirmar tu llegada.');
      return;
    }
    setLoading(true);
    try {
      // 🔐 OTP de recogida: se genera al CREAR el booking (trigger DB
      // `trg_generate_booking_otp`) para que el admin lo vea en la web y se lo
      // pueda dar al cliente. Aquí solo lo LEEMOS, no lo regeneramos.
      let otp = currentOtp;
      if (!otp) {
        const existing = await OtpService.getOtp(reservation.id);
        otp = existing?.otp ? String(existing.otp).trim() : null;
      }
      // Fallback: reservas creadas ANTES de existir el trigger no tienen otp.
      // En ese caso lo generamos y persistimos como antes (retrocompatibilidad).
      if (!otp) {
        otp = OtpService.generateOtp();
        await OtpService.saveOtp(reservation.id, otp);
        console.log('✅ OTP legacy generado y guardado:', otp);
      }
      setCurrentOtp(otp);

      await updateBookingStatus('ARRIVED', {
        driver_arrived_time: new Date().toISOString(),
      });
      console.log('✅ OTP de recogida en uso:', otp);
      
      setPhase('ARRIVED_AT_PICKUP');
      setWaitingForOtpTimer(true); // ⏱️ Mostrar estado de espera
      const startedAtMs = Date.now();
      localTimerStart.current = startedAtMs; // Mismo instante que se escribe en Supabase
      
      updateDriverNotification(
        '📍 Has llegado al punto de recogida',
        `Esperando a ${reservation.customer_name} — Reserva ${reservation.reference}`,
      ).catch(() => {});

      // ⏱️ INICIAR TIMER DE 3 MINUTOS (No mostrar modal aún)
      otpTimer.startTimer(startedAtMs).catch((err: any) => {
        console.error('⚠️ Error al iniciar timer en Supabase (countdown local continúa):', err);
      });
      console.log('✅ Timer OTP iniciado - 3 minutos de espera');

      // 📱 Notify customer with waiting message
      if (reservation.customer_token) {
        // ⛔ "Conductor ha llegado": la envía SOLO el servidor. El Database
        // Webhook `bookingWebhookDispatcher` despacha el push de ARRIVED al
        // cliente. Duplicarla aquí generaba doble notificación. Se conservan las
        // notificaciones de PAGO abajo porque llevan info que el dispatcher no da.

        // Notificación de pago — anunciar MÍNIMO del rango (mismo valor ambos lados)
        const quoteMin =
          Number(reservation.trip_cost) ||
          Number(reservation.driver_share) ||
          Number(reservation.price) ||
          Number(reservation.estimate) ||
          0;
        const quoteMinTxt = quoteMin.toLocaleString('es-CO');
        if (paymentMode === 'cash') {
          sendPushNotification(
            reservation.customer_token,
            `${reservation.customer_name}, pago en efectivo`,
            `Pago estimado desde $${quoteMinTxt}. El viaje comenzará pronto.`,
          );
        } else {
          sendPushNotification(
            reservation.customer_token,
            `${reservation.customer_name}, pago por ${paymentLabel}`,
            `Prepárate para transferir desde $${quoteMinTxt} al: ${driverPaymentNumber}`,
          );
        }
      }
      
      // ❌ NO mostrar OTP modal inmediatamente - esperar 3 minutos
      // setOtpModalVisible(true); // COMENTADO: Será mostrado automáticamente después de 3 min
    } catch (error) {
      console.error('❌ Error en handleConfirmArrival:', error);
      showAlert('error', 'Error', 'No se pudo confirmar la llegada. Intenta de nuevo.');
      setWaitingForOtpTimer(false);
    } finally {
      setLoading(false);
    }
  };

  // Start the trip
  const handleStartTrip = async () => {
    // ✅ Check if OTP has been verified
    if (!otpVerified) {
      showAlert('warning', 'OTP no verificado', 'Debes verificar el código OTP antes de iniciar el viaje. Abre el modal para ingresar el código.');
      return;
    }
    
    showAlert('confirm',
      'Iniciar Viaje',
      `¿Confirmas que el pasajero ${reservation.customer_name} está a bordo?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setAlertVisible(false) },
        {
          text: 'Iniciar',
          onPress: async () => {
            setAlertVisible(false);
            setLoading(true);
            try {
              tripStartTimestamp.current = Date.now();
              await updateBookingStatus('STARTED', {
                trip_start_time: new Date().toISOString(),
              });
              setPhase('TRIP_STARTED');
              updateDriverNotification(
                '🚗 Viaje en curso',
                `Llevando a ${reservation.customer_name} al destino — ${reservation.drop_address || 'Destino'}`,
              ).catch(() => {});
              // ⛔ Push de "viaje iniciado" al cliente: se quita el envío legacy
              // (treasupdate) desde aquí. STARTED lo notifica la alerta local del
              // cliente (`notifyTripStateChange`), fuente única para este estado.
              // (Opcional futuro: mover STARTED al dispatcher del servidor y
              //  excluirlo también del local — ver plan de notificaciones.)
            } catch {
              showAlert('error', 'Error', 'No se pudo iniciar el viaje.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Restaurar OTP + countdown al reentrar (usa driver_arrived_time, no otp_timer_started_at)
  useEffect(() => {
    const loadExistingOtp = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('bookings')
          .select('otp, otp_verified, driver_arrived_time, status')
          .eq('id', reservation?.id)
          .single();

        if (error || !data) {
          // Fallback: OTP en params de navegación
          if ((reservation as any)?.otp && !currentOtp) {
            setCurrentOtp(String((reservation as any).otp).trim());
            if ((reservation as any).otp_verified) setOtpVerified(true);
          }
          return;
        }

        if (data.otp && !currentOtp) {
          setCurrentOtp(String(data.otp).trim());
        }
        if (data.otp_verified) {
          setOtpVerified(true);
          setWaitingForOtpTimer(false);
          return;
        }

        // Countdown persistente: 3 min desde driver_arrived_time
        const arrivedAt = data.driver_arrived_time || (reservation as any)?.driver_arrived_time;
        if (arrivedAt && String(data.status || '').toUpperCase() === 'ARRIVED') {
          const startMs = new Date(arrivedAt).getTime();
          if (Number.isFinite(startMs)) {
            localTimerStart.current = startMs;
            const elapsed = (Date.now() - startMs) / 1000;
            const remaining = Math.min(180, Math.max(0, 180 - elapsed));
            setDriverCountdown(Math.ceil(remaining));
            if (remaining > 0) {
              setWaitingForOtpTimer(true);
              otpTimer.startTimer(startMs).catch(() => {});
              console.log(`[RELOAD] Countdown OTP restante: ${remaining.toFixed(0)}s`);
            } else {
              setWaitingForOtpTimer(false);
              console.log('[RELOAD] Countdown OTP ya expiró — se puede revelar código');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading existing OTP:', error);
      }
    };

    if (reservation?.id && phase === 'ARRIVED_AT_PICKUP') {
      loadExistingOtp();
    }
  }, [reservation?.id, phase]);

  // Countdown local anclado a driver_arrived_time / localTimerStart
  useEffect(() => {
    if (!waitingForOtpTimer) {
      setDriverCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const startTime =
        localTimerStart.current ??
        (otpTimer.timerStartedAt ? new Date(otpTimer.timerStartedAt).getTime() : null) ??
        (reservation?.driver_arrived_time
          ? new Date(reservation.driver_arrived_time).getTime()
          : null);

      if (!startTime || !Number.isFinite(startTime)) {
        // Sin marca de llegada no revelar OTP (fail-closed)
        setDriverCountdown(180);
        return;
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.min(180, Math.max(0, 180 - elapsed));
      setDriverCountdown(Math.ceil(remaining));

      if (remaining <= 0) {
        console.log('⏰ [DRIVER COUNTDOWN] Tiempo agotado - revelar código');
        setWaitingForOtpTimer(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 250);

    return () => clearInterval(interval);
  }, [waitingForOtpTimer, otpTimer.timerStartedAt, reservation?.driver_arrived_time]);

  // 🆕 Limpiar entrada OTP cuando se sale de ARRIVED_AT_PICKUP
  useEffect(() => {
    if (phase !== 'ARRIVED_AT_PICKUP') {
      setEnteredOtp('');
    }
  }, [phase]);

  // 🔓 Auto-transicionar cuando timer expira (y fetch OTP si no lo tiene)
  useEffect(() => {
    if (otpTimer.isExpired && otpTimer.hasStarted && !otpVerified) {
      console.log('⏰ [AUTO-TRANSITION] Timer expirado, habilitando ingreso de código...');
      setWaitingForOtpTimer(false);

      // Fetch el OTP de la BD (por si acaso no lo tiene - ej: app fue cerrada y reabierta)
      const fetchOtp = async () => {
        try {
          const { data, error } = await (supabase as any)
            .from('bookings')
            .select('otp')
            .eq('id', reservation?.id)
            .single();

          if (error || !data?.otp) return;

          if (!currentOtp) {
            const otpString = String(data.otp).trim();
            console.log('✅ Cargando OTP: ', otpString);
            setCurrentOtp(otpString);
          }
        } catch (e) {
          console.error('Error fetching OTP:', e);
        }
      };

      fetchOtp();
    }
  }, [otpTimer.isExpired, otpTimer.hasStarted, otpVerified, currentOtp, reservation?.id]);

  // 🔐 NUEVO: Handle OTP validation from modal
  const handleOTPMatch = async (isMatch: boolean) => {
    if (isMatch) {
      console.log('✅ [OTP] OTP válido ingresado por conductor');
      setOtpVerified(true);
      setWaitingForOtpTimer(false);
      setEnteredOtp('');
      setOtpModalVisible(false);
      
      try {
        // Mark as verified in database
        await OtpService.markOtpAsVerified(reservation.id);
        
        // Reset timer now that OTP is verified
        await otpTimer.resetTimer();
        
        // 📱 NUEVO: Notificaciones en tiempo real al cliente
        if (reservation.customer_token) {
          // Notificación 1: Código verificado
          sendPushNotification(
            reservation.customer_token,
            '✅ Código verificado',
            `Tu conductor ha compartido el código. ¡El viaje está a punto de comenzar!`,
          );
          
          // Notificación 2 (después de 1s): Servicio iniciará
          setTimeout(() => {
            sendPushNotification(
              reservation.customer_token,
              '🚗 Servicio iniciando',
              `Tu conductor está listo. Prepárate para el viaje - Reserva ${reservation.reference}`,
            );
          }, 1000);
        }
        
        showAlert('success', 'Código verificado', 'El código OTP ha sido verificado. Ahora puedes iniciar el viaje.');
      } catch (error) {
        console.error('❌ Error verifying OTP:', error);
        showAlert('error', 'Error', 'No se pudo verificar el código. Intenta de nuevo.');
      }
    } else {
      console.log('❌ [OTP] OTP incorrecto');
      showAlert('error', 'Código incorrecto', 'El código que ingresaste no es correcto. Intenta de nuevo.');
    }
  };

  // Confirmación previa — evita finalizar el viaje por un toque accidental
  // en el botón. Solo al confirmar corre la lógica real (cálculo de precio,
  // ruta, modales).
  const handleEndTrip = () => {
    showAlert('confirm',
      '¿Finalizar viaje?',
      'Vas a marcar este viaje como finalizado. ¿Confirmas que el recorrido terminó?',
      [
        { text: 'No', style: 'cancel', onPress: () => setAlertVisible(false) },
        {
          text: 'Sí, finalizar',
          onPress: () => {
            setAlertVisible(false);
            confirmedEndTrip();
          },
        },
      ],
    );
  };

  // End the trip — primero se calcula y persiste el precio real (mismo valor
  // que verá el cliente), se muestra al conductor, y solo después se pide la
  // calificación del cliente.
  const confirmedEndTrip = async () => {
    setLoading(true);
    try {
      const bookingForActuals = {
        ...reservation,
        id: reservation.id,
        startTime: tripStartTimestamp.current || Date.now(),
        carType: reservation.car_type,
        booking_type: reservation.booking_type,
        status: 'COMPLETE',
      };
      // Solo programadas llevan isScheduled (delta programado). Inmediato = false.
      const isScheduled =
        String(reservation.booking_type || '').toLowerCase() === 'scheduled' ||
        String(reservation.booking_type || '').toLowerCase() === 'reservation';
      const updated = await addActualsToBooking(bookingForActuals, { isScheduled });
      completedBookingRef.current = updated;
      setFinalPrice(Number(updated?.price ?? updated?.trip_cost ?? 0));
      setFinalDistanceKm(Number(updated?.distance ?? 0));
      setFinalTripSeconds(Number(updated?.total_trip_time ?? 0));
      await loadActualRoute();
      setPriceModalVisible(true);
    } catch (e) {
      console.error('Error calculando el precio final del viaje:', e);
      showAlert('error', 'Error', 'No se pudo calcular el precio final del viaje.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar calificación del cliente en `calificacion` (no bookings.customer_rating)
  const submitCustomerRating = async () => {
    if (customerRating < 1) {
      showAlert('warning', 'Calificación requerida', 'Califica al cliente con 1 a 5 estrellas antes de finalizar el viaje.');
      return;
    }
    setSubmittingRating(true);
    try {
      const customerId = reservation.customer_id || reservation.customer;
      const raterId =
        preferredConductorId(user, profile) ||
        profile?.id ||
        user?.id ||
        reservation.driver ||
        reservation.driver_id;
      if (!customerId || !raterId) {
        showAlert('error', 'Error', 'No se pudo identificar cliente o conductor para calificar.');
        return;
      }

      const result = await submitTripRating({
        reservaId: String(reservation.id),
        ratedPersonaId: String(customerId),
        raterPersonaId: String(raterId),
        puntaje: Math.round(customerRating),
        comentario: customerReview?.trim() || null,
        ratedRole: 'customer',
      });
      if (!result.ok) throw new Error(result.error || 'Error al guardar');

      setRatingModalVisible(false);
      finalizeTrip();
    } catch (e: any) {
      console.error('Error guardando calificación del cliente:', e);
      showAlert(
        'error',
        'Error',
        e?.message ? `No se pudo guardar la calificación: ${e.message}` : 'No se pudo guardar la calificación. Intenta de nuevo.',
      );
    } finally {
      setSubmittingRating(false);
    }
  };

  // Cierra el viaje (compartido por flujo efectivo y transferencia). El precio
  // real ya fue calculado y persistido en `handleEndTrip` vía `addActualsToBooking`
  // — ver [[21-calculo-tarifa]] — acá solo se marca la fase y se notifica.
  const finalizeTrip = async () => {
    setLoading(true);
    try {
      // Asegurar COMPLETE en BD (addActuals ya lo intenta; refuerzo si falló parcial)
      try {
        await updateBookingStatus('COMPLETE', {
          trip_end_time: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[finalizeTrip] status COMPLETE refuerzo:', e);
      }
      setPhase('TRIP_COMPLETE');
      showDriverActiveNotification().catch(() => {});
      showAlert('success',
        '¡Viaje Completado!',
        `La reserva ${reservation.reference} ha sido completada exitosamente.`,
        [{
          text: 'Volver',
          onPress: () => { setAlertVisible(false); nav.goBack(); },
        }],
      );
    } catch {
      showAlert('error', 'Error', 'No se pudo finalizar el viaje.');
    } finally {
      setLoading(false);
    }
  };

  // Open Google Maps navigation
  const openNavigation = () => {
    setNavMode(false);
    let destLat: number, destLng: number;
    if (phase === 'NAVIGATING_TO_PICKUP' || phase === 'ARRIVED_AT_PICKUP') {
      destLat = pickupLat;
      destLng = pickupLng;
    } else {
      destLat = dropLat;
      destLng = dropLng;
    }
    const url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${destLat},${destLng}`;
    Linking.openURL(url);
  };

  // Open Waze navigation
  const openWaze = () => {
    setNavMode(false);
    let destLat: number, destLng: number;
    if (phase === 'NAVIGATING_TO_PICKUP' || phase === 'ARRIVED_AT_PICKUP') {
      destLat = pickupLat;
      destLng = pickupLng;
    } else {
      destLat = dropLat;
      destLng = dropLng;
    }
    const url = `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
    Linking.openURL(url);
  };

  // Navegar (tipo Waze): 3D, zoom de calle, centrado en el puntero; el mapa
  // gira con el curso GPS y la cámara sigue cada fix (followNavCamera).
  const startInAppNav = () => {
    navZoomRef.current = NAV_ZOOM;
    navCourseRef.current = lastHeadingRef.current;
    setNavMode(true);
    const center = shownLocationRef.current;
    if (!center || !mapRef.current) return;
    mapRef.current.animateCamera(
      { center, heading: navCourseRef.current, pitch: NAV_PITCH, zoom: NAV_ZOOM },
      { duration: 700 },
    );
  };

  // Reubicar: manual, sale de Navegar y recentra en 2D (norte arriba).
  const locateOnMap = () => {
    setNavMode(false);
    const center = shownLocationRef.current;
    if (!center || !mapRef.current) return;
    mapRef.current.animateCamera(
      { center, heading: 0, pitch: 0, zoom: OVERVIEW_ZOOM },
      { duration: 500 },
    );
  };

  const toggleInAppNav = () => (navModeRef.current ? locateOnMap() : startInAppNav());

  const zoomBy = (delta: number) => {
    if (!mapRef.current) return;
    if (navModeRef.current) {
      navZoomRef.current = Math.min(21, Math.max(15, navZoomRef.current + delta));
      const center = shownLocationRef.current;
      if (center) followNavCamera(center, 250);
      return;
    }
    const next = Math.min(21, Math.max(12, mapZoomRef.current + delta));
    mapZoomRef.current = next;
    setMapZoom(next);
    mapRef.current.animateCamera({ zoom: next }, { duration: 250 });
  };

  const syncMapZoom = (cameraZoom?: number, latitudeDelta?: number) => {
    let z = cameraZoom;
    if (typeof z !== 'number' || !Number.isFinite(z)) {
      const d = Number(latitudeDelta);
      if (Number.isFinite(d) && d > 0) z = Math.log2(360 / d);
    }
    if (typeof z === 'number' && Number.isFinite(z)) {
      const clamped = Math.min(21, Math.max(12, z));
      if (Math.abs(clamped - mapZoomRef.current) > 0.05) {
        mapZoomRef.current = clamped;
        setMapZoom(clamped);
      }
    }
  };

  const tipRadius = tipRadiusForZoom(mapZoom);
  const showRouteStartTip = phase === 'TRIP_STARTED';
  // En espera en recogida el puck ya marca el punto; no pintar punta enorme encima.
  const showRouteEndTip = routeCoords.length > 1 && phase !== 'ARRIVED_AT_PICKUP';

  const renderPaymentIcon = (size = 14) => {
    const logoUri = getPaymentModeLogoUri(paymentMode);
    if (logoUri) {
      return <Image source={{ uri: logoUri }} style={{ width: size, height: size, borderRadius: 3 }} />;
    }
    return (
      <Ionicons
        name={getPaymentModeIonicon(paymentMode) as any}
        size={size}
        color={paymentMode === 'cash' ? '#00E676' : '#00E5FF'}
      />
    );
  };

  // Call customer - Usando Agora UIKit
  const callCustomer = async () => {
    if (!reservation.customer_contact) {
      showAlert('error', 'Error', 'No hay número de contacto disponible');
      return;
    }

    try {
      console.log('📞 [CALL] Iniciando llamada P2P a cliente...');
      
      const customerData = {
        userId: reservation.customer_id || reservation.customer,
        name: reservation.customer_name || 'Cliente',
        phone: reservation.customer_contact,
        image: undefined,
      };

      // Generar canal de llamada
      const driverId = user?.id || user?.auth_id || '0';
      const customerId = reservation.customer_id || reservation.customer;
      const parts = [driverId, customerId].sort().join('_');
      const channelName = `call_${parts}`;

      // Notificar al cliente sobre la llamada entrante
      await notifyIncomingCall({
        customerId,
        driverId,
        driverName: user?.first_name || user?.name || 'Conductor',
        channelName,
      });

      // callManager.makeCall(customerData); // COMENTADO - EXPO GO
      showAlert('success', '✅ Llamada iniciada', 'Notificación enviada al cliente');
    } catch (error) {
      console.error('❌ Agora call error:', error);
      // Fallback a llamada nativa
      const prefix = Platform.OS === 'android' ? 'tel:' : 'telprompt:';
      Linking.openURL(prefix + reservation.customer_contact);
    }
  };

  const openChat = () => {
    setChatVisible(true);
  };

  const phaseConfig = {
    NAVIGATING_TO_PICKUP: {
      title: 'Ir al punto de recogida',
      subtitle: reservation.pickup_address,
      color: '#00E5FF',
      icon: 'navigate' as const,
    },
    ARRIVED_AT_PICKUP: {
      title: 'Esperando al pasajero',
      subtitle: `${reservation.customer_name} — ${reservation.pickup_address}`,
      color: '#00E5FF',
      icon: 'time' as const,
    },
    TRIP_STARTED: {
      title: 'Viaje en curso',
      subtitle: reservation.drop_address,
      color: '#00E676',
      icon: 'car' as const,
    },
    TRIP_COMPLETE: {
      title: 'Viaje completado',
      subtitle: 'La reserva ha finalizado',
      color: '#00E676',
      icon: 'checkmark-circle' as const,
    },
  };

  const currentConfig = phaseConfig[phase];
  const canConfirmArrival = distanceToPickup !== null && distanceToPickup <= 200;

  return (
    <View style={s.root}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: pickupLat || 4.6367,
          longitude: pickupLng || -74.0829,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        customMapStyle={GOOGLE_MAPS_DARK_STYLE}
        rotateEnabled
        pitchEnabled
        onPanDrag={() => {
          // Si el conductor arrastra el mapa, deja de seguirlo (como Waze).
          if (navModeRef.current) setNavMode(false);
        }}
        onRegionChangeComplete={(region) => {
          Promise.resolve(mapRef.current?.getCamera?.())
            .then((cam: any) => {
              if (typeof cam?.zoom === 'number') syncMapZoom(cam.zoom);
              else syncMapZoom(undefined, region.latitudeDelta);
            })
            .catch(() => syncMapZoom(undefined, region.latitudeDelta));
        }}
      >
        {driverLocation && <DriverPuck ref={puckRef} coordinate={driverAnim} />}

        {/* Route polyline + puntas dinámicas (misma escala que halo navegar) */}
        {routeCoords.length > 1 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeWidth={11}
              strokeColor={ROUTE_LINE_BLUE}
              lineJoin="round"
              lineCap="round"
              zIndex={2}
            />
            <Polyline
              coordinates={routeCoords}
              strokeWidth={7}
              strokeColor="#00E676"
              lineJoin="round"
              lineCap="round"
              zIndex={3}
            />
            {(inAppNav || mapZoom >= 15) &&
              routeTurns.map((t, i) => (
                <Marker
                  key={`turn-${i}-${t.coord.latitude}-${t.coord.longitude}`}
                  coordinate={t.coord}
                  anchor={{ x: 0.5, y: 0.5 }}
                  flat
                  rotation={t.bearing}
                  tracksViewChanges={false}
                  zIndex={4}
                  image={ROUTE_TURN_ARROW_IMAGE}
                />
              ))}
            {showRouteStartTip && (
              <Circle
                center={routeCoords[0]}
                radius={tipRadius}
                fillColor={TIP_START_FILL}
                strokeColor={TIP_STROKE}
                strokeWidth={2}
                zIndex={5}
              />
            )}
            {showRouteEndTip && (
              <Circle
                center={routeCoords[routeCoords.length - 1]}
                radius={tipRadius}
                fillColor={TIP_END_FILL}
                strokeColor={TIP_END_STROKE}
                strokeWidth={2}
                zIndex={5}
              />
            )}
          </>
        )}
      </MapView>

      {/* Controles: siempre encima del panel; ocultos en llegada/OTP */}
      {phase !== 'ARRIVED_AT_PICKUP' && panelHeight < height * 0.65 && (
        <>
          <View style={[s.mapZoomControls, { bottom: panelHeight + 14 }]} pointerEvents="box-none">
            <TouchableOpacity style={s.mapCtrlBtn} onPress={() => zoomBy(1)} activeOpacity={0.85}>
              <Ionicons name="add" size={22} color="#00E5FF" />
            </TouchableOpacity>
            <TouchableOpacity style={s.mapCtrlBtn} onPress={() => zoomBy(-1)} activeOpacity={0.85}>
              <Ionicons name="remove" size={22} color="#00E5FF" />
            </TouchableOpacity>
          </View>
          <View style={[s.mapSideControls, { bottom: panelHeight + 14 }]} pointerEvents="box-none">
            <TouchableOpacity
              style={[s.mapCtrlBtn, inAppNav && s.mapCtrlBtnOn]}
              onPress={toggleInAppNav}
              activeOpacity={0.85}
            >
              <Image source={DRIVER_LOCATION_PUCK_IMAGE} style={s.mapCtrlPuck} />
            </TouchableOpacity>
            <TouchableOpacity style={s.mapCtrlBtn} onPress={locateOnMap} activeOpacity={0.85}>
              <Ionicons name="locate" size={20} color="#00E5FF" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: Math.max(insets.top, 20) + 6 }]}>
        <View style={s.topBarRow}>
          <TouchableOpacity style={s.topBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={s.topInfo}>
            <View style={[s.phaseDot, { backgroundColor: currentConfig.color }]} />
            <Text style={s.topTitle} numberOfLines={1}>{currentConfig.title}</Text>
          </View>

          <TouchableOpacity
            style={s.topBtn}
            onPress={async () => {
              const estimatedDistance =
                distanceToPickup !== null
                  ? distanceToPickup < 1000
                    ? `${Math.round(distanceToPickup)} m`
                    : `${(distanceToPickup / 1000).toFixed(1)} km`
                  : null;
              await shareTrip('driver', reservation, user, { estimatedDistance });
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="share-social" size={20} color="#00E5FF" />
          </TouchableOpacity>

          <TouchableOpacity style={s.topBtn} onPress={() => {
            setNavMode(false);
            mapRef.current?.fitToCoordinates(
              [
                ...(driverLocation ? [driverLocation] : []),
                ...(pickupLat ? [{ latitude: pickupLat, longitude: pickupLng }] : []),
                ...(dropLat && phase === 'TRIP_STARTED' ? [{ latitude: dropLat, longitude: dropLng }] : []),
              ],
              { edgePadding: { top: 120, right: 60, bottom: 280, left: 60 }, animated: true }
            );
          }} activeOpacity={0.75}>
            <Ionicons name="scan" size={20} color="#00E5FF" />
          </TouchableOpacity>
        </View>

        {!!reservation.reference && (
          <View style={s.tripCodePill}>
            <Ionicons name="barcode-outline" size={14} color="#00E5FF" />
            <Text style={s.tripCodeLabel}>CÓDIGO DEL VIAJE</Text>
            <Text style={s.tripCodeValue}>{reservation.reference}</Text>
          </View>
        )}
      </View>

      {/* Bottom panel */}
      <View
        style={[s.bottomPanel, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - panelHeight) > 2) setPanelHeight(h);
        }}
      >
        {/* Reservation info summary */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <ProfilePhotoPreview
              uri={customerPhoto}
              size={32}
              fallbackIconSize={14}
              accessibilityLabel="Ver foto del cliente"
            />
            <Text style={s.infoName}>{reservation.customer_name}</Text>
            <View style={s.actionBtnsRow}>
              <TouchableOpacity style={s.chatBtn} onPress={openChat} activeOpacity={0.75}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#00E5FF" />
                {unreadChatCount > 0 && (
                  <View style={s.chatBadge}>
                    <Text style={s.chatBadgeText}>
                      {unreadChatCount > 99 ? '99+' : String(unreadChatCount)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.callBtn} onPress={callCustomer} activeOpacity={0.75}>
                <Ionicons name="call" size={16} color="#00E676" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.routeInfo}>
            <View style={s.routeRowItem}>
              <View style={s.routeDotStart} />
              <Text style={s.routeText} numberOfLines={1}>{reservation.pickup_address}</Text>
            </View>
            <View style={s.routeDash} />
            <View style={s.routeRowItem}>
              <View style={s.routeDotEnd} />
              <Text style={s.routeText} numberOfLines={1}>{reservation.drop_address}</Text>
            </View>
          </View>

          <View style={s.metaRow}>
            {/* 🆕 Precio más prominente - Dinámico según estado */}
            <View style={s.priceHighlight}>
              <Ionicons name="cash-outline" size={14} color="#00E5FF" />
              <Text style={s.priceHighlightText}>
                {formatBookingFareRange(reservation)}
              </Text>
            </View>
            <Text style={s.metaDivider}>•</Text>
            <Text style={s.metaItem}>{reservation.distance?.toFixed?.(1) ?? reservation.distance} km</Text>
            <Text style={s.metaDivider}>•</Text>
            <Text style={s.metaItem}>{formatTime(reservation.booking_date)}</Text>
            <Text style={s.metaDivider}>•</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={s.payIconBox}>
                {renderPaymentIcon(12)}
              </View>
              <Text style={[s.metaItem, { color: paymentMode === 'cash' ? '#00E676' : '#00E5FF' }]}>{paymentLabel}</Text>
            </View>
          </View>
        </View>

        {/* Navigation buttons */}
        <View style={s.navRow}>
          <TouchableOpacity
            style={[s.navBtn, inAppNav && s.navBtnActive]}
            onPress={toggleInAppNav}
            activeOpacity={0.8}
          >
            <Image source={DRIVER_LOCATION_PUCK_IMAGE} style={s.navPuckIcon} />
            <Text style={s.navBtnTxt}>{inAppNav ? 'Navegando' : 'Navegar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={openNavigation} activeOpacity={0.8}>
            <Ionicons name="navigate" size={16} color="#FFF" />
            <Text style={s.navBtnTxt}>Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.navBtn, s.navBtnWaze]} onPress={openWaze} activeOpacity={0.8}>
            <Ionicons name="compass" size={16} color="#FFF" />
            <Text style={s.navBtnTxt}>Waze</Text>
          </TouchableOpacity>
        </View>

        {/* 🆕 Tarjeta de Precio Prominente en Punto de Recogida */}
        {phase === 'ARRIVED_AT_PICKUP' && (
          <Animatable.View animation="fadeInUp" duration={400} useNativeDriver>
            <View style={s.priceCard}>
              <Text style={s.priceCardTitle}>
                {reservation.status === 'COMPLETE' ? 'Valor final liquidado' : 'Valor estimado'}
              </Text>
              <Text style={s.priceCardAmount}>
                {formatBookingFareRange(reservation)}
              </Text>
              <View style={s.priceCardPayment}>
                <View style={s.payIconBoxLg}>
                  {renderPaymentIcon(14)}
                </View>
                <Text style={s.priceCardPaymentText}>
                  {paymentMode === 'cash' ? 'Pago en Efectivo' : `Pago por ${paymentLabel}`}
                </Text>
              </View>
              {paymentMode !== 'cash' && (
                <Text style={s.priceCardNote}>
                  Recuerda confirmar la recepción del pago al finalizar el viaje
                </Text>
              )}
            </View>
          </Animatable.View>
        )}

        {/* Phase action buttons */}
        {phase === 'NAVIGATING_TO_PICKUP' && (
          <TouchableOpacity
            style={[s.actionBtn, !canConfirmArrival && s.actionBtnDisabled]}
            onPress={handleConfirmArrival}
            disabled={loading || !canConfirmArrival}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#051A26" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={canConfirmArrival ? '#051A26' : 'rgba(255,255,255,0.3)'} />
                <Text style={[s.actionBtnTxt, !canConfirmArrival && s.actionBtnTxtDisabled]}>Confirmar Llegada</Text>
              </>
            )}
            {distanceToPickup !== null && (
              <Text style={s.distanceTxt}>
                {distanceToPickup < 1000
                  ? `${Math.round(distanceToPickup)} m`
                  : `${(distanceToPickup / 1000).toFixed(1)} km`}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {phase === 'ARRIVED_AT_PICKUP' && (
          <>
            {/* 🔐 OTP Input - SIEMPRE disponible durante ARRIVED_AT_PICKUP */}
            {!otpVerified && (
              <Animatable.View animation="fadeInUp" duration={400} useNativeDriver>
                <View style={s.otpCard}>
                  <Text style={s.otpCardPrompt}>
                    ¿El cliente ya te pasó el código?
                  </Text>
                  <View style={s.otpCardRow}>
                    <TextInput
                      placeholder="Digita el código OTP"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={enteredOtp}
                      onChangeText={setEnteredOtp}
                      maxLength={6}
                      keyboardType="numeric"
                      style={s.otpCardInput}
                    />
                    <TouchableOpacity
                      style={s.otpCardSubmit}
                      onPress={() => handleOTPMatch(String(enteredOtp).trim() === String(currentOtp).trim())}
                      disabled={loading || enteredOtp.length === 0}
                    >
                      <Ionicons name="checkmark" size={18} color="#00204a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animatable.View>
            )}

            {/* ⏱️ OTP Timer Countdown - Mostrar mientras espera */}
            {waitingForOtpTimer && driverCountdown !== null && driverCountdown > 0 && !otpVerified && (
              <Animatable.View
                animation="pulse"
                easing="ease-in-out-cubic"
                iterationCount="infinite"
                duration={1500}
                style={s.timerContainer}
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color="#00E5FF" />
                <Text style={s.timerCountdown}>
                  {Math.floor(driverCountdown / 60)}:{(driverCountdown % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={s.timerSubtext}>Código en...</Text>
              </Animatable.View>
            )}

            {/* 🔐 OTP Code Display - cuando el timer expira */}
            {!waitingForOtpTimer && currentOtp && !otpVerified && (
              <Animatable.View animation="fadeInUp" duration={400} useNativeDriver>
                <View style={s.otpRevealCard}>
                  <MaterialCommunityIcons name="lock-check" size={16} color="#00E676" />
                  <View style={s.otpRevealMeta}>
                    <Text style={s.otpRevealLabel}>Código de verificación</Text>
                    <Text style={s.otpRevealCode}>{currentOtp}</Text>
                  </View>
                </View>
              </Animatable.View>
            )}

            {/* ✅ OTP Verified indicator */}
            {otpVerified && (
              <Animatable.View animation="fadeInUp" duration={400} useNativeDriver>
                <View style={s.otpRevealCard}>
                  <MaterialCommunityIcons name="lock-check" size={16} color="#00E676" />
                  <View style={s.otpRevealMeta}>
                    <Text style={[s.otpRevealLabel, { color: '#00E676' }]}>Código verificado</Text>
                    <Text style={s.otpRevealHint}>Ya puedes iniciar el viaje</Text>
                  </View>
                </View>
              </Animatable.View>
            )}

            {/* 🔐 OTP Verification Button - Mostrar después de timer y antes de verificar */}
            {!waitingForOtpTimer && !otpVerified && (
              <TouchableOpacity
                style={[s.actionBtn, s.actionBtnCompact, { backgroundColor: '#00E5FF' }]}
                onPress={() => setOtpModalVisible(true)}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#051A26" size="small" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={18} color="#051A26" />
                    <Text style={[s.actionBtnTxt, s.actionBtnTxtCompact]}>Ingresar código</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Start Trip Button - Only enabled after OTP verified */}
            <TouchableOpacity
              style={[
                s.actionBtn,
                s.actionBtnCompact,
                { backgroundColor: otpVerified ? '#00E5FF' : 'rgba(255,255,255,0.15)', marginTop: 6 },
              ]}
              onPress={handleStartTrip}
              disabled={loading || !otpVerified}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#051A26" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="car"
                    size={18}
                    color={otpVerified ? '#051A26' : 'rgba(255,255,255,0.3)'}
                  />
                  <Text style={[s.actionBtnTxt, s.actionBtnTxtCompact, !otpVerified && { opacity: 0.5 }]}>
                    Iniciar Viaje
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {phase === 'TRIP_STARTED' && (
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#00E5FF' }]}
            onPress={handleEndTrip}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#051A26" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#051A26" />
                <Text style={s.actionBtnTxt}>Finalizar Viaje</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 🔐 OTP Verification Modal */}
      {currentOtp && (
        <DriverOtpVerificationModal
          visible={otpModalVisible}
          correctOtp={currentOtp}
          customerName={reservation?.customer_name || 'Cliente'}
          onOtpVerified={() => handleOTPMatch(true)}
          onCancel={() => setOtpModalVisible(false)}
        />
      )}

      {/* Modal de Agora para llamadas - COMENTADO PARA EXPO GO */}
      {/* <AgoraCallModal
        visible={callManager.callActive}
        appId={AGORA_APP_ID || '8a0861d85c5d45e9813ee0b967e12d6c'}
        channel={callManager.channelName}
        token={callManager.token}
        uid={parseInt((user?.id || user?.auth_id || '0').replace(/\D/g, '')) || 0}
        userName={user?.first_name || user?.name || 'User'}
        onClose={() => {
          callManager.endCall();
        }}
      /> */}

      {/* 💵 Modal de precio total del servicio — primero al finalizar, antes de calificar */}
      <Modal
        transparent
        visible={priceModalVisible}
        animationType="fade"
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <View style={s.ratingBackdrop}>
          <View style={s.ratingModalCard}>
            <View style={s.ratingHeader}>
              <Ionicons name="cash" size={28} color="#00E676" />
              <Text style={s.ratingTitle}>Viaje completado</Text>
            </View>
            <Text style={s.ratingSubtitle}>
              Precio total del servicio
            </Text>
            <Text style={{ color: '#00E676', fontSize: 40, fontWeight: '800', textAlign: 'center', marginVertical: 16 }}>
              ${(finalPrice ?? 0).toLocaleString('es-CO')}
            </Text>

            {/* 📊 Distancia y tiempo reales recalculados al cierre del viaje */}
            <View style={s.tripSummaryRow}>
              <View style={s.tripSummaryItem}>
                <Ionicons name="navigate" size={20} color="#4FC3F7" />
                <Text style={s.tripSummaryValue}>
                  {(finalDistanceKm ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })} km
                </Text>
                <Text style={s.tripSummaryLabel}>Distancia</Text>
              </View>
              <View style={s.tripSummaryDivider} />
              <View style={s.tripSummaryItem}>
                <Ionicons name="time" size={20} color="#FFD54F" />
                <Text style={s.tripSummaryValue}>{formatTripDuration(finalTripSeconds)}</Text>
                <Text style={s.tripSummaryLabel}>Tiempo</Text>
              </View>
            </View>

            <Text style={s.ratingHint}>
              Este es el valor que le fue cobrado al pasajero — el mismo que verás reflejado en tu balance.
            </Text>

            <TouchableOpacity
              style={s.ratingSubmitBtn}
              onPress={() => { setPriceModalVisible(false); setRatingModalVisible(true); }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#051A26" />
              <Text style={s.ratingSubmitText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ⭐ Modal de calificación al cliente (obligatorio antes de finalizar) */}
      <Modal
        transparent
        visible={ratingModalVisible}
        animationType="fade"
        onRequestClose={() => { if (!submittingRating) setRatingModalVisible(false); }}
      >
        <View style={s.ratingBackdrop}>
          <View style={s.ratingModalCard}>
            <View style={s.ratingHeader}>
              <Ionicons name="star" size={28} color="#FFD700" />
              <Text style={s.ratingTitle}>Califica al cliente</Text>
            </View>
            <Text style={s.ratingSubtitle}>
              {reservation.customer_name || 'Cliente'}
            </Text>
            <Text style={s.ratingHint}>
              1 estrella = poco satisfecho · 5 estrellas = muy satisfecho
            </Text>

            <View style={s.ratingStarsWrap}>
              <StarRating
                maxStars={5}
                starSize={40}
                color="#FFD700"
                emptyColor="rgba(255,255,255,0.25)"
                rating={customerRating}
                onChange={(r: number) => setCustomerRating(Math.round(r))}
              />
              <Text style={s.ratingValue}>
                {customerRating > 0 ? `${customerRating} / 5` : 'Selecciona una calificación'}
              </Text>
            </View>

            <TextInput
              style={s.ratingInput}
              placeholder="Observaciones (opcional)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              multiline
              value={customerReview}
              onChangeText={setCustomerReview}
              editable={!submittingRating}
            />

            <TouchableOpacity
              style={[
                s.ratingSubmitBtn,
                (customerRating < 1 || submittingRating) && s.ratingSubmitBtnDisabled,
              ]}
              onPress={submitCustomerRating}
              disabled={customerRating < 1 || submittingRating}
              activeOpacity={0.85}
            >
              {submittingRating ? (
                <ActivityIndicator color="#051A26" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#051A26" />
                  <Text style={s.ratingSubmitText}>
                    {customerRating < 1 ? 'Selecciona una calificación' : 'Continuar y finalizar viaje'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.ratingCancelBtn}
              onPress={() => setRatingModalVisible(false)}
              disabled={submittingRating}
            >
              <Text style={s.ratingCancelText}>Cancelar</Text>
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

      <FloatingChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        bookingId={reservation.id}
        myRole="driver"
        myName={
          [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
          user?.first_name ||
          user?.name ||
          'Conductor'
        }
        senderId={user?.id || user?.auth_id || user?.uid}
        otherName={reservation.customer_name || 'Cliente'}
        otherPhoto={customerPhoto}
      />
    </View>
  );
};

export default ReservationTripScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#051A26' },
  /* Top bar */
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(5,26,38,0.85)',
  },
  topBarRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  topBtn: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  topInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  phaseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  topTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  tripCodePill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.35)',
    gap: 6,
  },
  tripCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  tripCodeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 2,
  },
  /* Bottom panel */
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(5,26,38,0.95)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 18,
    borderTopWidth: 1, borderTopColor: 'rgba(0,229,255,0.15)',
  },
  infoCard: { marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoName: { fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1, marginLeft: 8 },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,229,255,0.12)',
  },
  customerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.3)',
  },
  callBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,230,118,0.12)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)',
  },
  actionBtnsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.35)',
    position: 'relative',
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#051A26',
  },
  chatBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  routeInfo: { marginBottom: 10 },
  routeRowItem: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  routeDotStart: {
    width: 8, height: 8, borderRadius: 4, marginRight: 10,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#00E5FF',
  },
  routeDotEnd: {
    width: 8, height: 8, borderRadius: 4, marginRight: 10,
    backgroundColor: '#E91E63', borderWidth: 1.5, borderColor: '#00E5FF',
  },
  routeText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1, fontWeight: '500' },
  routeDash: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 3.5, marginVertical: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { fontSize: 12, color: '#00E5FF', fontWeight: '600' },
  metaDivider: { fontSize: 12, color: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  payIconBox: {
    width: 18, height: 18, borderRadius: 5, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  payIconBoxLg: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  priceHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,229,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.3)',
    gap: 4,
  },
  priceHighlightText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00E5FF',
  },
  /* Nav buttons */
  navRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 14, gap: 5,
    backgroundColor: 'rgba(0,229,255,0.15)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)',
  },
  navBtnActive: {
    backgroundColor: 'rgba(0,229,255,0.28)',
    borderColor: '#00E5FF',
  },
  navBtnWaze: { backgroundColor: 'rgba(51,153,255,0.15)', borderColor: 'rgba(51,153,255,0.3)' },
  navBtnTxt: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  navPuckIcon: { width: 18, height: 18 },
  mapZoomControls: {
    position: 'absolute',
    right: 14,
    zIndex: 30,
    gap: 10,
  },
  mapSideControls: {
    position: 'absolute',
    left: 14,
    zIndex: 30,
    gap: 10,
  },
  mapCtrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10,46,61,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCtrlBtnOn: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0,229,255,0.22)',
  },
  mapCtrlPuck: { width: 26, height: 26 },
  /* Action buttons */
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 8,
    backgroundColor: '#00E5FF',
  },
  actionBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  actionBtnTxt: { fontSize: 16, fontWeight: '800', color: '#051A26' },
  actionBtnTxtDisabled: { color: 'rgba(255,255,255,0.3)' },
  distanceTxt: {
    position: 'absolute', right: 16, fontSize: 11, fontWeight: '600',
    color: 'rgba(5,26,38,0.6)',
  },
  /* ⏱️ OTP Timer Container */
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,229,255,0.35)',
    borderRadius: 12,
    gap: 8,
  },
  timerCountdown: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  timerSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  otpCard: {
    width: '100%',
    backgroundColor: 'rgba(0, 244, 245, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,244,245,0.45)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  otpCardPrompt: {
    fontSize: 12,
    color: '#00F4F5',
    fontWeight: '600',
    marginBottom: 8,
  },
  otpCardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpCardInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 3,
  },
  otpCardSubmit: {
    backgroundColor: '#00F4F5',
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpRevealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,230,118,0.45)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  otpRevealMeta: {
    flex: 1,
    minWidth: 0,
  },
  otpRevealLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 2,
  },
  otpRevealCode: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  otpRevealHint: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  actionBtnCompact: {
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnTxtCompact: {
    fontSize: 14,
  },
  /* Markers */
  markerWrap: { alignItems: 'center' },
  markerDot: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    elevation: 5,
  },
  markerLabel: {
    fontSize: 10, fontWeight: '700', color: '#FFF', marginTop: 2,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  routeEndpointStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#00E5FF',
  },
  routeEndpointEnd: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E91E63',
    borderWidth: 2.5,
    borderColor: '#00E5FF',
  },
  tipHitbox: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipDotStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  tipDotEnd: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E91E63',
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  /* Price Card */
  priceCard: {
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,229,255,0.28)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  priceCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E5FF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  priceCardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00E5FF',
    marginBottom: 6,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  priceCardPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priceCardPaymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  priceCardNote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 6,
  },
  /* ⭐ Rating modal */
  ratingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ratingModalCard: {
    width: '100%',
    backgroundColor: '#0B2230',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  ratingSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00E5FF',
    marginBottom: 4,
  },
  ratingHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  tripSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  tripSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  tripSummaryDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tripSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },
  tripSummaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  ratingStarsWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  ratingValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    fontWeight: '600',
  },
  ratingInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    minHeight: 70,
    padding: 12,
    color: '#FFF',
    textAlignVertical: 'top',
    marginTop: 12,
    marginBottom: 14,
    fontSize: 14,
  },
  ratingSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E5FF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  ratingSubmitBtnDisabled: {
    backgroundColor: 'rgba(0,229,255,0.35)',
  },
  ratingSubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#051A26',
  },
  ratingCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  ratingCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
});


