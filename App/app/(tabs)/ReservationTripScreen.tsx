import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Linking, Platform, Dimensions, Modal, Alert, TextInput,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '@/common/store';
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';
import supabase from '@/config/SupabaseConfig';
import { API_KEY, getMapboxAccessToken } from '@/config/AppConfig';
// Agora disabled for build - import { AGORA_APP_ID } from '@/config/AgoraConfig';
import { updateDriverNotification, showDriverActiveNotification } from '@/hooks/DriverNotificationService';
import DriverOtpVerificationModal from '@/components/DriverOtpVerificationModal';
import { OtpService } from '@/common/services/OtpService';
import { useOtpTimer } from '@/hooks/useOtpTimer';
// import AgoraCallModal from '@/components/AgoraCallModal'; // COMENTADO PARA EXPO GO
// import { useAgoraCall } from '@/hooks/useAgoraCall'; // COMENTADO PARA EXPO GO
import { notifyIncomingCall } from '@/common/services/NotificationService';

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

const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
  const coords: { latitude: number; longitude: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
};

const ReservationTripScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const user = useSelector((s: RootState) => s.auth.user) as any;

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
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [driverCountdown, setDriverCountdown] = useState<number | null>(null);
  const localTimerStart = useRef<number | null>(null); // Fallback local timestamp
  const voiceReminderSent = useRef(false);
  
  // ✅ OTP State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [waitingForOtpTimer, setWaitingForOtpTimer] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(''); // 🆕 Input del driver

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
  const paymentMode = reservation.payment_mode || 'cash';
  const driverPaymentNumber = user?.bankAccount || user?.mobile || '';

  const paymentLabel = paymentMode === 'nequi' ? 'Nequi'
    : paymentMode === 'daviplata' ? 'Daviplata' : 'Efectivo';

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
    const price = reservation.estimate || reservation.price || 0;
    const priceFormatted = price.toLocaleString('es-CO');

    let voiceMsg = `Estás llegando al punto de recogida de ${reservation.customer_name}. `;
    if (paymentMode === 'cash') {
      voiceMsg += `El pago es en efectivo por ${priceFormatted} pesos.`;
    } else {
      voiceMsg += `El pago es por ${paymentLabel} por ${priceFormatted} pesos. Recuerda confirmar la transferencia al finalizar el viaje.`;
    }

    Speech.stop().then(() => {
      Speech.speak(voiceMsg, { language: 'es-CO', pitch: 1, rate: 0.9 });
    }).catch(() => {
      Speech.speak(voiceMsg, { language: 'es-CO', pitch: 1, rate: 0.9 });
    });
  }, [distanceToPickup, phase, paymentMode]);

  // GPS tracking
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        loc => {
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setDriverLocation(pos);
          if (pickupLat && pickupLng) {
            setDistanceToPickup(getDistanceMeters(pos.latitude, pos.longitude, pickupLat, pickupLng));
          }
        },
      );
    })();
    return () => { sub?.remove(); };
  }, [pickupLat, pickupLng]);

  // Fetch route polyline
  const fetchRoute = useCallback(async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
    try {
      if (MAPBOX_TOKEN) {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=polyline&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]?.geometry) {
          setRouteCoords(decodePolyline(data.routes[0].geometry));
          return;
        }
      }
      // Fallback to Google
      if (API_KEY) {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]?.overview_polyline?.points) {
          setRouteCoords(decodePolyline(data.routes[0].overview_polyline.points));
        }
      }
    } catch {}
  }, []);

  // Update route based on phase
  useEffect(() => {
    if (!driverLocation) return;
    if (phase === 'NAVIGATING_TO_PICKUP' && pickupLat && pickupLng) {
      fetchRoute(driverLocation.latitude, driverLocation.longitude, pickupLat, pickupLng);
    } else if (phase === 'TRIP_STARTED' && pickupLat && pickupLng && dropLat && dropLng) {
      fetchRoute(pickupLat, pickupLng, dropLat, dropLng);
    }
  }, [phase, driverLocation?.latitude, driverLocation?.longitude, fetchRoute, pickupLat, pickupLng, dropLat, dropLng]);

  // Fit map to markers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      const markers: { latitude: number; longitude: number }[] = [];
      if (driverLocation) markers.push(driverLocation);
      if (pickupLat && pickupLng && phase !== 'TRIP_STARTED') markers.push({ latitude: pickupLat, longitude: pickupLng });
      if (phase === 'TRIP_STARTED' && dropLat && dropLng) {
        markers.push({ latitude: pickupLat, longitude: pickupLng });
        markers.push({ latitude: dropLat, longitude: dropLng });
      }
      if (markers.length >= 2) {
        mapRef.current.fitToCoordinates(markers, {
          edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
          animated: true,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [phase, driverLocation, pickupLat, pickupLng, dropLat, dropLng]);

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

  // Confirm arrival at pickup
  const handleConfirmArrival = async () => {
    if (distanceToPickup !== null && distanceToPickup > 500) {
      showAlert('warning', 'Aún estás lejos', 'Debes estar a menos de 500 metros del punto de recogida para confirmar tu llegada.');
      return;
    }
    setLoading(true);
    try {
      // 🔐 Generate OTP
      const otp = OtpService.generateOtp();
      setCurrentOtp(otp);
      
      await updateBookingStatus('ARRIVED', {
        driver_arrived_time: new Date().toISOString(),
      });
      
      // 💾 Save OTP to database
      await OtpService.saveOtp(reservation.id, otp);
      console.log('✅ OTP guardado en base de datos:', otp);
      
      setPhase('ARRIVED_AT_PICKUP');
      setWaitingForOtpTimer(true); // ⏱️ Mostrar estado de espera
      localTimerStart.current = Date.now(); // Iniciar countdown local inmediatamente
      
      updateDriverNotification(
        '📍 Has llegado al punto de recogida',
        `Esperando a ${reservation.customer_name} — Reserva ${reservation.reference}`,
      ).catch(() => {});

      // ⏱️ INICIAR TIMER DE 3 MINUTOS (No mostrar modal aún)
      otpTimer.startTimer().catch((err: any) => {
        console.error('⚠️ Error al iniciar timer en Supabase (countdown local continúa):', err);
      });
      console.log('✅ Timer OTP iniciado - 3 minutos de espera');

      // 📱 Notify customer with waiting message
      if (reservation.customer_token) {
        // Primera notificación: Conductor llegó, código en 3 minutos
        sendPushNotification(
          reservation.customer_token,
          `📍 Tu conductor ha llegado`,
          `El conductor está en el punto de recogida. El código de verificación se compartirá en 3 minutos. Reserva ${reservation.reference}`,
        );
        
        // Notificación de pago
        if (paymentMode === 'cash') {
          sendPushNotification(
            reservation.customer_token,
            `${reservation.customer_name}, tu conductor ha llegado!`,
            `Pago en efectivo por $${(reservation.estimate || reservation.price || 0).toLocaleString('es-CO')}. El viaje comenzará pronto.`,
          );
        } else {
          sendPushNotification(
            reservation.customer_token,
            `${reservation.customer_name}, pago por ${paymentLabel}`,
            `Prepárate para transferir $${(reservation.estimate || reservation.price || 0).toLocaleString('es-CO')} al: ${driverPaymentNumber}`,
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
              await updateBookingStatus('STARTED', {
                trip_start_time: new Date().toISOString(),
              });
              setPhase('TRIP_STARTED');
              updateDriverNotification(
                '🚗 Viaje en curso',
                `Llevando a ${reservation.customer_name} al destino — ${reservation.drop_address || 'Destino'}`,
              ).catch(() => {});
              if (reservation.customer_token) {
                sendPushNotification(
                  reservation.customer_token,
                  '¡Tu viaje ha comenzado! 🚗',
                  `Tu reserva ${reservation.reference} está en camino al destino.`,
                );
              }
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

  // � Verificar si ya existe OTP guardado (cuando re-entra como conductor)
  useEffect(() => {
    const loadExistingOtp = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('bookings')
          .select('otp, otp_verified, otp_timer_started_at, status')
          .eq('id', reservation?.id)
          .single();

        if (error || !data) return;

        // Si hay OTP guardado
        if (data.otp) {
          console.log('✅ [RELOAD] OTP encontrado:', data.otp);
          setCurrentOtp(data.otp);
          
          // Si ya fue verificado
          if (data.otp_verified) {
            setOtpVerified(true);
            console.log('✅ [RELOAD] OTP ya verificado');
          }
          
          // Si timer está activo, calcular si aún queda tiempo
          if (data.otp_timer_started_at) {
            const startTime = new Date(data.otp_timer_started_at).getTime();
            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, 180 - elapsed);
            console.log(`✅ [RELOAD] Timer activo, remaining: ${remaining.toFixed(1)}s`);
            
            if (!data.otp_verified && remaining > 0) {
              // Aún queda tiempo en el countdown
              setWaitingForOtpTimer(true);
            } else {
              // Timer ya expiró o ya verificado - mostrar botón de código
              setWaitingForOtpTimer(false);
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

  // ⏲️ Driver Countdown - Calcula localmente desde otp_timer_started_at de Supabase
  // Si Supabase aún no devuelve el timestamp, usa localTimerStart como fallback
  useEffect(() => {
    if (!waitingForOtpTimer) {
      setDriverCountdown(null);
      return;
    }

    const updateCountdown = () => {
      // Preferir timestamp de Supabase, fallback a timestamp local
      const startTime = otpTimer.timerStartedAt
        ? new Date(otpTimer.timerStartedAt).getTime()
        : localTimerStart.current;

      if (!startTime) {
        setDriverCountdown(180);
        return;
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, 180 - elapsed);
      setDriverCountdown(Math.ceil(remaining));

      if (remaining <= 0) {
        console.log('⏰ [DRIVER COUNTDOWN] Tiempo agotado - mostrando botón de código');
        setWaitingForOtpTimer(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);

    return () => clearInterval(interval);
  }, [waitingForOtpTimer, otpTimer.timerStartedAt]);

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
            console.log('✅ Cargando OTP: ', data.otp);
            setCurrentOtp(data.otp);
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
      setEnteredOtp(''); // 🆕 Limpiar input
      
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

  // End the trip
  const handleEndTrip = async () => {
    // If payment is NOT cash, driver must confirm transfer first
    if (paymentMode !== 'cash') {
      showAlert('confirm',
        `Confirmar pago por ${paymentLabel}`,
        `¿Ya recibiste la transferencia de $${(reservation.estimate || reservation.price || 0).toLocaleString('es-CO')} por ${paymentLabel} del cliente ${reservation.customer_name}?`,
        [
          { text: 'Aún no', style: 'cancel', onPress: () => setAlertVisible(false) },
          {
            text: 'Sí, recibí el pago',
            onPress: () => {
              setAlertVisible(false);
              completeTrip();
            },
          },
        ],
      );
    } else {
      showAlert('confirm',
        'Finalizar Viaje',
        '¿Confirmas que ha finalizado el recorrido?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setAlertVisible(false) },
          {
            text: 'Finalizar',
            onPress: () => {
              setAlertVisible(false);
              completeTrip();
            },
          },
        ],
      );
    }
  };

  // Actually complete the trip (shared by both cash and transfer flows)
  const completeTrip = async () => {
    setLoading(true);
    try {
      const updated = await updateBookingStatus('COMPLETE', {
        trip_end_time: new Date().toISOString(),
        driver_status: 'COMPLETE',
        customer_status: 'COMPLETE',
      });
      setPhase('TRIP_COMPLETE');
      // Restore the default driver-online notification
      showDriverActiveNotification().catch(() => {});
      if (reservation.customer_token) {
        sendPushNotification(
          reservation.customer_token,
          'Viaje completado ✅',
          `Tu reserva ${reservation.reference} ha sido completada. ¡Gracias por viajar con T+Plus!`,
        );
      }
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
  const canConfirmArrival = distanceToPickup !== null && distanceToPickup <= 500;

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
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {/* Pickup marker */}
        {pickupLat && pickupLng && (
          <Marker
            coordinate={{ latitude: pickupLat, longitude: pickupLng }}
            title="Recoger"
            description={reservation.pickup_address}
          >
            <View style={s.markerWrap}>
              <View style={[s.markerDot, { backgroundColor: '#00E676' }]}>
                <Ionicons name="person" size={14} color="#FFF" />
              </View>
              {phase === 'NAVIGATING_TO_PICKUP' && <Text style={s.markerLabel}>Recoger aquí</Text>}
            </View>
          </Marker>
        )}

        {/* Drop marker */}
        {dropLat && dropLng && (phase === 'TRIP_STARTED' || phase === 'ARRIVED_AT_PICKUP') && (
          <Marker
            coordinate={{ latitude: dropLat, longitude: dropLng }}
            title="Destino"
            description={reservation.drop_address}
          >
            <View style={s.markerWrap}>
              <View style={[s.markerDot, { backgroundColor: '#E91E63' }]}>
                <Ionicons name="flag" size={14} color="#FFF" />
              </View>
              {phase === 'TRIP_STARTED' && <Text style={s.markerLabel}>Destino</Text>}
            </View>
          </Marker>
        )}

        {/* Route polyline */}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor={phase === 'TRIP_STARTED' ? '#00E676' : '#00E5FF'}
          />
        )}
      </MapView>

      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: Math.max(insets.top, 20) + 6 }]}>
        <TouchableOpacity style={s.topBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={s.topInfo}>
          <View style={[s.phaseDot, { backgroundColor: currentConfig.color }]} />
          <Text style={s.topTitle} numberOfLines={1}>{currentConfig.title}</Text>
        </View>

        <TouchableOpacity style={s.topBtn} onPress={() => {
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

      {/* Bottom panel */}
      <View style={[s.bottomPanel, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
        {/* Reservation info summary */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Ionicons name="person" size={16} color="#00E5FF" />
            <Text style={s.infoName}>{reservation.customer_name}</Text>
            <TouchableOpacity style={s.callBtn} onPress={callCustomer} activeOpacity={0.75}>
              <Ionicons name="call" size={16} color="#00E676" />
            </TouchableOpacity>
          </View>

          <View style={s.routeInfo}>
            <View style={s.routeRowItem}>
              <View style={[s.routeDot, { backgroundColor: '#00E676' }]} />
              <Text style={s.routeText} numberOfLines={1}>{reservation.pickup_address}</Text>
            </View>
            <View style={s.routeDash} />
            <View style={s.routeRowItem}>
              <View style={[s.routeDot, { backgroundColor: '#E91E63' }]} />
              <Text style={s.routeText} numberOfLines={1}>{reservation.drop_address}</Text>
            </View>
          </View>

          <View style={s.metaRow}>
            <Text style={s.metaItem}>$ {(reservation.estimate || reservation.price)?.toLocaleString('es-CO')}</Text>
            <Text style={s.metaDivider}>•</Text>
            <Text style={s.metaItem}>{reservation.distance?.toFixed?.(1) ?? reservation.distance} km</Text>
            <Text style={s.metaDivider}>•</Text>
            <Text style={s.metaItem}>{formatTime(reservation.booking_date)}</Text>
            <Text style={s.metaDivider}>•</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name={paymentMode === 'cash' ? 'cash-outline' : paymentMode === 'nequi' ? 'phone-portrait-outline' : 'wallet-outline'}
                size={13}
                color={paymentMode === 'cash' ? '#00E676' : '#00E5FF'}
              />
              <Text style={[s.metaItem, { color: paymentMode === 'cash' ? '#00E676' : '#00E5FF' }]}>{paymentLabel}</Text>
            </View>
          </View>
        </View>

        {/* Navigation buttons */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={openNavigation} activeOpacity={0.8}>
            <Ionicons name="navigate" size={18} color="#FFF" />
            <Text style={s.navBtnTxt}>Google Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.navBtn, s.navBtnWaze]} onPress={openWaze} activeOpacity={0.8}>
            <Ionicons name="compass" size={18} color="#FFF" />
            <Text style={s.navBtnTxt}>Waze</Text>
          </TouchableOpacity>
        </View>

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
                <View style={[s.actionBtn, { backgroundColor: 'rgba(0, 244, 245, 0.08)', borderWidth: 2, borderColor: '#00F4F5', padding: 0, overflow: 'hidden' }]}>
                  <View style={{ width: '100%' }}>
                    <Text style={{ fontSize: 13, color: '#00F4F5', fontWeight: '600', marginBottom: 12, paddingHorizontal: 16, paddingTop: 16 }}>
                      💬 ¿El cliente ya te pasó el código?
                    </Text>
                    <View style={{ 
                      flexDirection: 'row', 
                      paddingHorizontal: 16,
                      paddingBottom: 16,
                      gap: 8,
                    }}>
                      <TextInput
                        placeholder="Digita el código OTP"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={enteredOtp}
                        onChangeText={setEnteredOtp}
                        maxLength={6}
                        keyboardType="numeric"
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          color: '#FFF',
                          fontSize: 16,
                          fontWeight: '600',
                          letterSpacing: 4,
                        }}
                      />
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#00F4F5',
                          paddingHorizontal: 14,
                          borderRadius: 8,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPress={() => handleOTPMatch(enteredOtp.trim() === currentOtp?.trim())}
                        disabled={loading || enteredOtp.length === 0}
                      >
                        <Ionicons name="checkmark" size={20} color="#00204a" />
                      </TouchableOpacity>
                    </View>
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
                <MaterialCommunityIcons name="clock-outline" size={32} color="#00E5FF" />
                <Text style={s.timerCountdown}>
                  {Math.floor(driverCountdown / 60)}:{(driverCountdown % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={s.timerSubtext}>Código en...</Text>
              </Animatable.View>
            )}

            {/* 🔐 OTP Code Display + Input - Mostrar cuando timer expire */}
            {!waitingForOtpTimer && currentOtp && !otpVerified && (
              <Animatable.View animation="fadeInUp" duration={400} useNativeDriver>
                <View style={[s.actionBtn, { backgroundColor: 'rgba(0, 230, 118, 0.08)', borderWidth: 2, borderColor: '#00E676' }]}>
                  <View style={{ alignItems: 'center', width: '100%' }}>
                    <MaterialCommunityIcons name="lock-check" size={28} color="#00E676" />
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>CÓDIGO DE VERIFICACIÓN</Text>
                    <Text style={{ fontSize: 44, fontWeight: '800', color: '#00E676', letterSpacing: 8, fontFamily: 'monospace', marginTop: 8 }}>
                      {currentOtp}
                    </Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, textAlign: 'center' }}>
                      Digita este código para habilitar el inicio del viaje
                    </Text>
                  </View>
                </View>
              </Animatable.View>
            )}

            {/* ✅ OTP Verified indicator */}
            {otpVerified && (
              <Animatable.View animation="fadeInUp" duration={400} useNativeDriver>
                <View style={[s.actionBtn, { backgroundColor: 'rgba(0, 230, 118, 0.08)', borderWidth: 2, borderColor: '#00E676' }]}>
                  <View style={{ alignItems: 'center', width: '100%' }}>
                    <MaterialCommunityIcons name="lock-check" size={28} color="#00E676" />
                    <Text style={{ fontSize: 14, color: '#00E676', marginTop: 8, fontWeight: '700' }}>✓ CÓDIGO VERIFICADO</Text>
                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' }}>
                      Ya puedes iniciar el viaje
                    </Text>
                  </View>
                </View>
              </Animatable.View>
            )}

            {/* 🔐 OTP Verification Button - Mostrar después de timer y antes de verificar */}
            {!waitingForOtpTimer && !otpVerified && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: '#00E5FF' }]}
                onPress={() => setOtpModalVisible(true)}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#051A26" size="small" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={22} color="#051A26" />
                    <Text style={s.actionBtnTxt}>🔐 Ingresar Código</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Start Trip Button - Only enabled after OTP verified */}
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: otpVerified ? '#00E5FF' : 'rgba(255,255,255,0.15)', marginTop: 12 }]}
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
                    size={22} 
                    color={otpVerified ? '#051A26' : 'rgba(255,255,255,0.3)'} 
                  />
                  <Text style={[s.actionBtnTxt, !otpVerified && { opacity: 0.5 }]}>
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

export default ReservationTripScreen;

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#051A26' },
  /* Top bar */
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(5,26,38,0.85)',
  },
  topBtn: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  topInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  phaseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  topTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
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
  callBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,230,118,0.12)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)',
  },
  routeInfo: { marginBottom: 10 },
  routeRowItem: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  routeText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1, fontWeight: '500' },
  routeDash: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 3.5, marginVertical: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { fontSize: 12, color: '#00E5FF', fontWeight: '600' },
  metaDivider: { fontSize: 12, color: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  /* Nav buttons */
  navRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 14, gap: 6,
    backgroundColor: 'rgba(0,229,255,0.15)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)',
  },
  navBtnWaze: { backgroundColor: 'rgba(51,153,255,0.15)', borderColor: 'rgba(51,153,255,0.3)' },
  navBtnTxt: { fontSize: 13, fontWeight: '700', color: '#FFF' },
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
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, marginBottom: 16,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1.5, borderColor: '#00E5FF',
    borderRadius: 16,
    gap: 8,
  },
  timerCountdown: {
    fontSize: 52, fontWeight: '900', color: '#00E5FF',
    letterSpacing: 2, fontFamily: 'monospace',
  },
  timerSubtext: {
    fontSize: 14, fontWeight: '600', color: '#AAA',
    marginTop: 4,
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
});


