import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView,
  ActivityIndicator, RefreshControl, Linking, Clipboard, Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '@/common/store';
import supabase from '@/config/SupabaseConfig';
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';
import OtpCountdownNotification from '@/components/OtpCountdownNotification';

const BG_IMAGE = require('../../assets/images/bg.png');

const formatDate = (ts: string) => {
  const d = new Date(ts);
  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

const formatTime = (ts: string) => {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
};

// 🆕 Map color names to hex codes
const getColorCode = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    'blanco': '#FFFFFF',
    'blanc': '#FFFFFF',
    'white': '#FFFFFF',
    'negro': '#1A1A1A',
    'noir': '#1A1A1A',
    'black': '#1A1A1A',
    'gris': '#808080',
    'grey': '#808080',
    'gray': '#808080',
    'rojo': '#E91E63',
    'rouge': '#E91E63',
    'red': '#E91E63',
    'azul': '#2196F3',
    'bleu': '#2196F3',
    'blue': '#2196F3',
    'verde': '#4CAF50',
    'vert': '#4CAF50',
    'green': '#4CAF50',
    'amarillo': '#FFEB3B',
    'jaune': '#FFEB3B',
    'yellow': '#FFEB3B',
    'naranja': '#FF9800',
    'orange': '#FF9800',
    'plata': '#C0C0C0',
    'argent': '#C0C0C0',
    'silver': '#C0C0C0',
    'marron': '#795548',
    'brun': '#795548',
    'brown': '#795548',
    'beige': '#F5F5DC',
    'dorado': '#FFD700',
    'or': '#FFD700',
    'gold': '#FFD700',
  };
  
  const normalizedColor = colorName?.toLowerCase().trim() || '';
  return colorMap[normalizedColor] || '#999999';
};

const CustomerActiveTripScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const user = useSelector((s: RootState) => s.auth.user) as any;
  
  const { bookingId, booking: initialBooking } = (route.params as any) || {};

  const [booking, setBooking] = useState<any>(initialBooking);
  const [loading, setLoading] = useState(!initialBooking);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null); // 🆕 Información completa del conductor

  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;

  // 🗺️ Abrir Google Maps hacia el conductor
  const openGoogleMaps = useCallback(() => {
    if (!booking?.driver_lat || !booking?.driver_lng) return;
    
    const latitude = booking.driver_lat;
    const longitude = booking.driver_lng;
    const label = booking.driver_name || 'Tu conductor';
    
    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${latitude},${longitude}&q=${label}`,
      android: `https://maps.google.com/maps?daddr=${latitude},${longitude}&q=${label}`,
    });
    
    if (url) Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/maps?daddr=${latitude},${longitude}`);
    });
  }, [booking?.driver_lat, booking?.driver_lng, booking?.driver_name]);

  // 🗺️ Abrir Waze hacia el conductor
  const openWaze = useCallback(() => {
    if (!booking?.driver_lat || !booking?.driver_lng) return;
    
    const latitude = booking.driver_lat;
    const longitude = booking.driver_lng;
    const label = booking.driver_name || 'Tu conductor';
    
    const url = `waze://?ll=${latitude},${longitude}&navigate=yes&q=${label}`;
    
    Linking.openURL(url).catch(() => {
      Linking.openURL('https://www.waze.com/');
    });
  }, [booking?.driver_lat, booking?.driver_lng, booking?.driver_name]);

  // Fetch booking details
  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const headers = await getSupabaseAuthHeaders();
      // Usar select=* para obtener todos los campos disponibles - evita errores de campos inexistentes
      const url = `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&select=*`;
      console.log('🔍 [FETCH BOOKING] URL:', url);
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.error('🔍 [FETCH BOOKING] Response not ok:', res.status);
        const errorText = await res.text();
        console.error('🔍 [FETCH BOOKING] Error:', errorText);
        return;
      }
      const data = await res.json();
      if (data?.length > 0) {
        const newBooking = data[0];
        
        // DETAILED TIMER STATE LOG
        console.log('🔍 [BOOKING RESPONSE] otp_timer_started_at field:', {
          value: newBooking.otp_timer_started_at,
          type: typeof newBooking.otp_timer_started_at,
          isNull: newBooking.otp_timer_started_at === null,
          isUndefined: newBooking.otp_timer_started_at === undefined,
        });
        
        console.log('📥 [BOOKING UPDATE] Full timer info:', {
          otp_timer_started_at: newBooking.otp_timer_started_at,
          otp: newBooking.otp,
          otp_verified: newBooking.otp_verified,
          status: newBooking.status,
        });
        
        // Log de cambios importantes
        if (booking?.status !== newBooking.status) {
          console.log(`🔄 [STATUS CAMBIÓ] ${booking?.status} → ${newBooking.status}`);
        }
        if (booking?.driver_name !== newBooking.driver_name) {
          console.log(`👤 [CONDUCTOR ASIGNADO] ${newBooking.driver_name} - ${newBooking.plate_number}`);
        }
        if (booking?.otp_timer_started_at !== newBooking.otp_timer_started_at) {
          console.log(`⏱️ [TIMER VALUE CHANGED]`, {
            from: booking?.otp_timer_started_at,
            to: newBooking.otp_timer_started_at,
          });
        }
        setBooking(newBooking);
      }
    } catch (e) {
      console.error('Error fetching booking:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId, booking?.status, booking?.driver_name, booking?.otp_timer_started_at]);

  useFocusEffect(
    useCallback(() => {
      if (bookingId) {
        fetchBooking();
      }
    }, [bookingId, fetchBooking])
  );

  // 🆕 Fetch driver info including mobile number from users table
  const fetchDriverInfo = useCallback(async () => {
    if (!booking?.driver_id) return;
    try {
      const headers = await getSupabaseAuthHeaders();
      const url = `${SUPABASE_URL}/rest/v1/users?id=eq.${booking.driver_id}&select=*`;
      const res = await fetch(url, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.length > 0) {
        const driver = data[0];
        setDriverInfo(driver);
        console.log('👤 [DRIVER INFO]', { mobile: driver.mobile, vehicle_number: driver.vehicle_number, vehicle_make: driver.vehicle_make });
        
        // 🆕 Fetch vehicle color from cars table if vehicle_id exists
        if (driver.vehicle_id) {
          try {
            const carsUrl = `${SUPABASE_URL}/rest/v1/cars?id=eq.${driver.vehicle_id}&select=color`;
            const carsRes = await fetch(carsUrl, { headers });
            if (carsRes.ok) {
              const carsData = await carsRes.json();
              if (carsData?.length > 0) {
                setDriverInfo((prev: any) => ({ ...prev, vehicle_color: carsData[0].color }));
                console.log('🚗 [VEHICLE COLOR]', carsData[0].color);
              }
            }
          } catch (e) {
            console.error('Error fetching vehicle color:', e);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching driver info:', e);
    }
  }, [booking?.driver_id]);

  // Fetch driver info cuando cambia el driver_id
  useEffect(() => {
    if (booking?.driver_id) {
      fetchDriverInfo();
    }
  }, [booking?.driver_id, fetchDriverInfo]);

  // Polling para actualizaciones (cada 1 segundo para feedback visual rápido)
  useEffect(() => {
    if (!bookingId) return;

    console.log('📡 [CustomerActiveTrip] Iniciando polling cada 1 segundo');
    const pollInterval = setInterval(() => {
      console.log('🔄 [CustomerActiveTrip] Polling...');
      fetchBooking();
    }, 1000);

    return () => {
      console.log('🛑 [CustomerActiveTrip] Deteniendo polling');
      clearInterval(pollInterval);
    };
  }, [bookingId, fetchBooking]);

  // ⏲️ Contador de OTP - Calcular localmente cada segundo
  useEffect(() => {
    if (!booking?.otp_timer_started_at) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const startTime = new Date(booking.otp_timer_started_at).getTime();
      const now = new Date().getTime();
      const elapsed = (now - startTime) / 1000;
      const remaining = Math.max(0, 180 - elapsed);
      
      console.log(`⏰ [COUNTDOWN] elapsed: ${elapsed.toFixed(1)}s, remaining: ${remaining.toFixed(1)}s`);
      setCountdown(Math.ceil(remaining));
    };

    // Update inicial
    updateCountdown();

    // Update cada 100ms para suavidad
    const interval = setInterval(updateCountdown, 100);

    return () => clearInterval(interval);
  }, [booking?.otp_timer_started_at]);

  if (loading) {
    return (
      <View style={s.root}>
        <Image source={BG_IMAGE} style={s.bgImage} />
        <View style={s.bgOverlay} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00E5FF" />
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={s.root}>
        <View style={[s.header, { paddingTop: topPad }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Mi Viaje</Text>
          <View style={s.headerSpacer} />
        </View>
        <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 100 }}>No se encontraron datos del viaje</Text>
      </View>
    );
  }

  // Determinar si estamos en fase de espera de 3 minutos (conductor llegó, esperando código)
  const isWaitingForCode = booking.otp_timer_started_at && !booking.otp_verified;
  console.log('⏰ [STATUS] isWaitingForCode:', isWaitingForCode, '| timer_started_at:', booking.otp_timer_started_at, '| verified:', booking.otp_verified);

  const statusText = () => {
    if (booking.status === 'PENDING' || booking.status === 'NEW') return 'Buscando conductor...';
    if (booking.status === 'ACCEPTED' && !booking.otp_timer_started_at) return '¡Tu viaje ha sido aceptado!';
    if (booking.status === 'ACCEPTED' && booking.otp_timer_started_at) return 'Conductor ha llegado';
    if (booking.status === 'ARRIVED') return 'Conductor ha llegado';
    if (booking.status === 'IN_PROGRESS' || booking.status === 'STARTED' || booking.status === 'TRIP_STARTED') return 'Viaje en progreso';
    if (booking.status === 'COMPLETE') return '¡Viaje completado!';
    return 'Estado del viaje';
  };

  const statusIcon = () => {
    if (booking.status === 'PENDING') return 'hourglass-outline';
    if (booking.status === 'ACCEPTED') return 'car-outline';
    if (booking.status === 'COMPLETE') return 'checkmark-circle';
    return 'time-outline';
  };

  const statusColor = () => {
    if (booking.status === 'COMPLETE') return '#00E676';
    if (booking.status === 'ACCEPTED') return '#00E5FF';
    if (booking.status === 'PENDING') return '#FFB300';
    return '#00E5FF';
  };

  return (
    <View style={s.root}>
      <Image source={BG_IMAGE} style={s.bgImage} />
      <View style={s.bgOverlay} />

      <View style={[s.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mi Viaje Activo</Text>
        <TouchableOpacity style={s.infoBtn} onPress={() => nav.navigate('ReservationDetail', { reservation: booking })}>
          <Ionicons name="information-circle-outline" size={22} color="#00E5FF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={s.scroll} 
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBooking(); }}
            tintColor="#00E5FF"
            colors={['#00E5FF']}
          />
        }
      >
        {/* Status Card - Se re-anima cuando cambia el status */}
        <Animatable.View 
          animation="pulse" 
          easing="ease-out" 
          duration={800} 
          iterationCount="infinite"
          key={booking.status} // ← Force re-mount cuando cambia
          useNativeDriver
        >
          <View style={[s.statusCard, { borderColor: statusColor(), borderWidth: 2 }]}>
            <Ionicons name={statusIcon()} size={40} color={statusColor()} />
            <Text style={s.statusText}>{statusText()}</Text>
            <Text style={s.referenceText}>Ref: {booking.reference}</Text>
          </View>
        </Animatable.View>

        {/* Route Info */}
        <Animatable.View animation="fadeInUp" duration={450} delay={60} useNativeDriver>
          <View style={s.card}>
            <Text style={s.sectionTitle}>Detalles del Viaje</Text>
            
            <View style={s.routeBlock}>
              <View style={s.routeItem}>
                <View style={[s.dot, { backgroundColor: '#00E676' }]} />
                <Text style={s.address} numberOfLines={2}>{booking.pickup_address}</Text>
              </View>
              <View style={s.routeLine} />
              <View style={s.routeItem}>
                <View style={[s.dot, { backgroundColor: '#E91E63' }]} />
                <Text style={s.address} numberOfLines={2}>{booking.drop_address}</Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.metaRow}>
              <View style={s.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#00E5FF" />
                <Text style={s.metaText}>{formatDate(booking.booking_date)}</Text>
              </View>
              <View style={s.metaItem}>
                <Ionicons name="time-outline" size={16} color="#00E5FF" />
                <Text style={s.metaText}>{formatTime(booking.booking_date)}</Text>
              </View>
              <View style={s.metaItem}>
                <Ionicons name="speedometer-outline" size={16} color="#00E5FF" />
                <Text style={s.metaText}>{booking.distance?.toFixed(1)} km</Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Estado de Espera - Conductor ha llegado */}
        {isWaitingForCode && (
          <Animatable.View animation="fadeIn" duration={300} useNativeDriver>
            <View style={[s.card, s.waitingCard]}>
              <View style={s.waitingContent}>
                <MaterialCommunityIcons name="clock-alert" size={32} color="#FFB300" />
                <Text style={s.waitingTitle}>⏳ Conductor Esperando</Text>
                <Text style={s.waitingSubtext}>Tu conductor ha llegado al punto de recogida</Text>
                <Text style={s.waitingMessage}>Comparte tu código OTP con el conductor</Text>
              </View>
            </View>
          </Animatable.View>
        )}

        {/* Contador de OTP - Mostrar cuando hay timer activo y tiempo restante */}
        {countdown !== null && countdown > 0 && booking.otp_timer_started_at && (
          <Animatable.View animation="fadeInUp" duration={400} useNativeDriver>
            <View style={s.countdownCard}>
              <View style={s.countdownContent}>
                <Ionicons name="timer-outline" size={40} color="#00E5FF" />
                <Text style={s.countdownTime}>
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={s.countdownLabel}>Código en...</Text>
              </View>
            </View>
          </Animatable.View>
        )}

        {/* Código OTP - Mostrar SIEMPRE que exista el código */}
        {booking.otp && (
          <Animatable.View animation="fadeInUp" duration={400} useNativeDriver>
            <View style={[s.card, s.otpCodeCard]}>
              <View style={s.otpCodeContent}>
                <MaterialCommunityIcons name="lock-check" size={36} color="#00E676" />
                <Text style={s.otpCodeTitle}>Tu Código de Seguridad</Text>
                <Text style={s.otpCodeSubtext}>Comparte este código con tu conductor</Text>
                <View style={s.otpCodeDisplay}>
                  <Text style={s.otpCodeValue}>{booking.otp}</Text>
                </View>
                {booking.otp_verified
                  ? <Text style={[s.otpCodeNote, { color: '#00E676' }]}>✅ Código verificado - Viaje iniciando</Text>
                  : <Text style={s.otpCodeNote}>Tu conductor te pedirá este código</Text>
                }
              </View>
            </View>
          </Animatable.View>
        )}

        {/* Driver Info - Mostrar cuando ACCEPTED */}
        {booking.status === 'ACCEPTED' && booking.driver_name && (
          <Animatable.View animation="fadeInUp" duration={450} delay={120} useNativeDriver>
            <View style={s.card}>
              <Text style={s.sectionTitle}>👤 Tu Conductor</Text>
              
              {/* Conductor Info */}
              <View style={s.driverCard}>
                <View style={s.driverInfo}>
                  <Text style={s.driverName}>{booking.driver_name}</Text>
                  <Text style={s.driverPlate}>📞 {driverInfo?.mobile || booking.driver_contact || 'Contacto no disponible'}</Text>
                </View>
                <TouchableOpacity 
                  style={s.callBtn}
                  onPress={() => driverInfo?.mobile && Linking.openURL(`tel:${driverInfo.mobile}`)}
                >
                  <Ionicons name="call" size={20} color="#00E5FF" />
                </TouchableOpacity>
              </View>

              {/* 🆕 Vehicle Info Card */}
              {(driverInfo?.vehicle_number || driverInfo?.vehicle_make || driverInfo?.vehicle_color) && (
                <View style={{ backgroundColor: 'rgba(0,244,245,0.08)', borderRadius: 8, padding: 12, marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#00E5FF' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 10 }}>🚗 Información del Vehículo</Text>
                  
                  {/* Placa */}
                  {driverInfo?.vehicle_number && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, minWidth: 80 }}>Placa:</Text>
                      <Text style={{ color: '#00F4F5', fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>
                        {driverInfo.vehicle_number}
                      </Text>
                    </View>
                  )}
                  
                  {/* Marca */}
                  {driverInfo?.vehicle_make && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, minWidth: 80 }}>Marca:</Text>
                      <Text style={{ color: '#FFF', fontSize: 13 }}>
                        {driverInfo.vehicle_make}
                      </Text>
                    </View>
                  )}
                  
                  {/* Color */}
                  {driverInfo?.vehicle_color && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, minWidth: 80 }}>Color:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View 
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: getColorCode(driverInfo.vehicle_color),
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.3)',
                          }}
                        />
                        <Text style={{ color: '#FFF', fontSize: 13 }}>
                          {driverInfo.vehicle_color}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Botones de Navegación */}
              <View style={s.navigationBtns}>
                <TouchableOpacity 
                  style={s.navBtn}
                  onPress={openGoogleMaps}
                  disabled={!booking?.driver_lat || !booking?.driver_lng}
                >
                  <Ionicons name="map" size={18} color="#FFF" />
                  <Text style={s.navBtnText}>Google Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={s.navBtn}
                  onPress={openWaze}
                  disabled={!booking?.driver_lat || !booking?.driver_lng}
                >
                  <Ionicons name="navigate-circle" size={18} color="#FFF" />
                  <Text style={s.navBtnText}>Waze</Text>
                </TouchableOpacity>
              </View>

              {/* 🆕 Información de Contacto y Pago */}
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,244,245,0.2)' }}>
                {/* Teléfono del Conductor */}
                {driverInfo?.mobile && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="call-outline" size={16} color="#00E5FF" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#FFF', fontSize: 13, flex: 1 }}>☎️ {driverInfo.mobile}</Text>
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(`tel:${driverInfo.mobile}`)}
                      style={{ paddingHorizontal: 8 }}
                    >
                      <Ionicons name="call" size={18} color="#00E676" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Método de Pago */}
                {booking.payment_mode && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons 
                        name={booking.payment_mode === 'cash' ? 'cash-outline' : booking.payment_mode === 'nequi' ? 'phone-portrait-outline' : 'wallet-outline'} 
                        size={16} 
                        color="#00E5FF" 
                        style={{ marginRight: 10 }} 
                      />
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Método de Pago</Text>
                    </View>
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600', marginLeft: 26 }}>
                      {booking.payment_mode === 'cash' ? '💵 Efectivo' : booking.payment_mode === 'nequi' ? '📱 Nequi' : '💳 Daviplata'}
                    </Text>
                  </View>
                )}

                {/* Número para Transferencia (Nequi/Daviplata) */}
                {(booking.payment_mode === 'nequi' || booking.payment_mode === 'daviplata') && (driverInfo?.mobile || booking.driver_payment_number || driverInfo?.bankAccount) && (
                  <View style={{ backgroundColor: 'rgba(0,244,245,0.08)', borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: '#00E5FF' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
                      💰 Transferir a:
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#00F4F5', fontSize: 16, fontWeight: '700', letterSpacing: 2 }}>
                        {driverInfo?.mobile || booking.driver_payment_number || driverInfo?.bankAccount || 'N/A'}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          const number = driverInfo?.mobile || booking.driver_payment_number || driverInfo?.bankAccount;
                          if (number) {
                            Clipboard.setString(number);
                            Alert.alert('✅ Copiado', `Número copiado: ${number}`);
                          }
                        }}
                        style={{ paddingHorizontal: 8 }}
                      >
                        <Ionicons name="copy-outline" size={18} color="#00E5FF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Animatable.View>
        )}

        {/* OTP Countdown - Mostrar cuando timer está activo */}
        {booking.otp_timer_started_at && (
          <Animatable.View animation="fadeInUp" duration={450} delay={180} useNativeDriver>
            <OtpCountdownNotification 
              bookingId={bookingId}
              customerId={booking.customer_id || user?.id}
              visible={true}
            />
          </Animatable.View>
        )}

        {/* Verification Status */}
        {booking.otp_verified && (
          <Animatable.View animation="fadeInUp" duration={450} useNativeDriver>
            <View style={[s.card, s.verifiedCard]}>
              <Ionicons name="checkmark-circle" size={32} color="#00E676" />
              <Text style={s.verifiedText}>✅ Viaje Verificado</Text>
              <Text style={s.verifiedSub}>Tu viaje será iniciado próximamente</Text>
            </View>
          </Animatable.View>
        )}

        {/* 🆕 Información de Viaje - Durante TRIP_STARTED */}
        {(booking.status === 'IN_PROGRESS' || booking.status === 'STARTED' || booking.status === 'TRIP_STARTED') ? (
          <Animatable.View animation="fadeInUp" duration={450} useNativeDriver>
            <View style={s.card}>
              <Text style={s.sectionTitle}>📋 Información de tu Viaje</Text>

              {/* Teléfono del Conductor */}
              {driverInfo?.mobile && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <Ionicons name="call-outline" size={16} color="#00E5FF" style={{ marginRight: 10 }} />
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, flex: 1 }}>☎️ Conductor: {driverInfo.mobile}</Text>
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(`tel:${driverInfo.mobile}`)}
                    style={{ paddingHorizontal: 8 }}
                  >
                    <Ionicons name="call" size={18} color="#00E676" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: 'rgba(0,244,245,0.2)', marginBottom: 14 }} />

              {/* Método de Pago */}
              {booking.payment_mode && (
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name={booking.payment_mode === 'cash' ? 'cash-outline' : booking.payment_mode === 'nequi' ? 'phone-portrait-outline' : 'wallet-outline'} 
                      size={16} 
                      color="#00E5FF" 
                      style={{ marginRight: 10 }} 
                    />
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>
                      {booking.payment_mode === 'cash' ? '💵 Pago en Efectivo' : booking.payment_mode === 'nequi' ? '📱 Pago por Nequi' : '💳 Pago por Daviplata'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Número para Transferencia (Nequi/Daviplata) */}
              {(booking.payment_mode === 'nequi' || booking.payment_mode === 'daviplata') && (driverInfo?.mobile || booking.driver_payment_number || driverInfo?.bankAccount) && (
                <View style={{ backgroundColor: 'rgba(0,244,245,0.08)', borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: '#00E5FF' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8 }}>
                    💰 Transferir a este número:
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#00F4F5', fontSize: 16, fontWeight: '700', letterSpacing: 2 }}>
                      {driverInfo?.mobile || booking.driver_payment_number || driverInfo?.bankAccount}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => {
                        const number = driverInfo?.mobile || booking.driver_payment_number || driverInfo?.bankAccount;
                        if (number) {
                          Clipboard.setString(number);
                          Alert.alert('✅ Copiado', `Número copiado: ${number}`);
                        }
                      }}
                      style={{ paddingHorizontal: 8 }}
                    >
                      <Ionicons name="copy-outline" size={18} color="#00E5FF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </Animatable.View>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default CustomerActiveTripScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#051A26' },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,26,38,0.78)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: 'rgba(5,26,38,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,229,255,0.1)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', flex: 1, textAlign: 'center' },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 14 },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(10,46,61,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  statusText: { fontSize: 18, fontWeight: '700', color: '#FFF', marginTop: 12 },
  referenceText: { fontSize: 12, color: '#00E5FF', marginTop: 6 },
  card: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(10,46,61,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.12)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#00E5FF', textTransform: 'uppercase', marginBottom: 12 },
  routeBlock: { marginBottom: 10 },
  routeItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  address: { fontSize: 14, color: '#FFF', flex: 1 },
  routeLine: { height: 20, width: 2, backgroundColor: 'rgba(0,229,255,0.3)', marginLeft: 4, marginVertical: 2 },
  divider: { height: 1, backgroundColor: 'rgba(0,229,255,0.1)', marginVertical: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#00E5FF' },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  driverPlate: { fontSize: 13, color: '#00E5FF', marginTop: 2 },
  driverContact: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.3)',
  },
  navigationBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,229,255,0.1)',
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    gap: 6,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  verifiedCard: { alignItems: 'center', paddingVertical: 20 },
  verifiedText: { fontSize: 16, fontWeight: '700', color: '#00E676', marginTop: 12 },
  verifiedSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  waitingCard: {
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderColor: 'rgba(255, 179, 0, 0.3)',
    borderWidth: 2,
  },
  waitingContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFB300',
    marginTop: 12,
    marginBottom: 6,
  },
  waitingSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },
  waitingMessage: {
    fontSize: 12,
    color: 'rgba(255, 179, 0, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  countdownCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    alignItems: 'center',
  },
  countdownContent: {
    alignItems: 'center',
    gap: 8,
  },
  countdownTime: {
    fontSize: 56,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  countdownLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  otpCodeCard: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  otpCodeContent: {
    alignItems: 'center',
    gap: 12,
  },
  otpCodeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00E676',
    marginTop: 4,
  },
  otpCodeSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  otpCodeDisplay: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 230, 118, 0.4)',
    marginVertical: 8,
  },
  otpCodeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 8,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  otpCodeNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    textAlign: 'center',
  },
});
