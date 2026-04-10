import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Platform, Dimensions,
} from 'react-native';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '@/common/store';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';
import { updateDriverNotification } from '@/hooks/DriverNotificationService';

const BG_IMAGE = require('../../assets/images/bg.png');

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

type Reservation = {
  id: string;
  reference: string;
  booking_type: string;
  trip_type: string;
  customer_name: string;
  customer_contact: string;
  customer_token: string;
  pickup_address: string;
  drop_address: string;
  booking_date: string;
  driver_share: number;
  estimate: number;
  price: number;
  distance: number;
  duration: number;
  status: string;
  payment_mode: string;
  observations: string | null;
  customer: string;
  customer_id: string;
  car_type: string;
};

const formatDate = (ts: string) => {
  try {
    const d = new Date(ts.replace(' ', 'T'));
    if (isNaN(d.getTime())) return ts;
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch { return ts || ''; }
};

const formatTime = (ts: string) => {
  try {
    const d = new Date(ts.replace(' ', 'T'));
    if (isNaN(d.getTime())) return ts;
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'p. m.' : 'a. m.';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m}:00 ${ampm}`;
  } catch { return ts || ''; }
};

const DriverReservationsScreen = () => {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const profile = useSelector((s: RootState) => s.auth.profile) as any;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  /* ── Tab selector: Reservas vs Inmediatos ── */
  const [activeTab, setActiveTab] = useState<'reservations' | 'immediate'>('immediate');
  const [immediateServices, setImmediateServices] = useState<Reservation[]>([]);
  const [searchingImmediate, setSearchingImmediate] = useState(false);
  const [rangeKm, setRangeKm] = useState(3);  // Inicia en 3km

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

  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;

  const driverName = [
    profile?.first_name || user?.first_name || user?.firstName || '',
    profile?.last_name || user?.last_name || user?.lastName || '',
  ].filter(Boolean).join(' ') || 'Conductor';

  const fetchReservations = useCallback(async () => {
    try {
      const headers = await getSupabaseAuthHeaders();
      // Filtro explícito: SOLO reservas programadas
      const url = `${SUPABASE_URL}/rest/v1/bookings?booking_type=eq.reservation&status=eq.PENDING&order=booking_date.asc`;
      console.log('[RESERVAS] Trayendo reservas con filtro:', url);
      const res = await fetch(url, { headers });
      console.log(`📡 [RESERVAS] Response status: ${res.status}`);
      if (!res.ok) {
        const errText = await res.text();
        console.warn('❌ [RESERVAS] Fetch status:', res.status, errText);
        setReservations([]);
        return;
      }
      const data = await res.json();
      console.log(`✅ [RESERVAS] Encontradas ${data?.length || 0} reservas (booking_type=reservation) [tipo: ${Array.isArray(data) ? 'array' : typeof data}]`);
      if (data && data.length > 0) {
        console.log('  Ejemplos:', data.slice(0, 2).map((r: any) => ({ ref: r.reference, type: r.booking_type, status: r.status, driver: r.driver })));
      }
      setReservations(data || []);
    } catch (e) {
      console.error('❌ Fetch reservations error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* ── Buscar servicios inmediatos disponibles ── */
  const searchImmediateServices = useCallback(async () => {
    try {
      setSearchingImmediate(true);
      const headers = await getSupabaseAuthHeaders();
      
      // Estrategia: Traer TODO immediate sin driver, luego filtrar en código
      // Con limit=1000 para evitar límite por defecto de PostgREST
      const urlImmediates = `${SUPABASE_URL}/rest/v1/bookings?booking_type=eq.immediate&driver_id=is.null&limit=1000&select=*&order=created_at.desc`;
      
      console.log('🟢 [INMEDIATOS] Query:', urlImmediates);
      
      const res = await fetch(urlImmediates, { headers });
      console.log(`📡 [INMEDIATOS] Response status: ${res.status}`);
      
      const allData = res.ok ? await res.json() : [];
      console.log(`📊 [INMEDIATOS] RAW data count: ${Array.isArray(allData) ? allData.length : 'NOT ARRAY'}`);
      
      // Log EXACTAMENTE qué status tienen los primeros 15 items
      if (Array.isArray(allData) && allData.length > 0) {
        console.log('🔍 [INMEDIATOS] Primeros 15 items:', allData.slice(0, 15).map((x: any) => ({ ref: x.reference, status: x.status, id: x.id })));
      }
      
      if (!Array.isArray(allData)) {
        console.log('⚠️ ERROR: allData no es array:', typeof allData);
        setImmediateServices([]);
        return;
      }
      
      // Filtrar en código: NEW y PENDING
      const filtered = allData.filter((item: any) => 
        item.status === 'NEW' || item.status === 'PENDING'
      );
      
      const newCount = filtered.filter((item: any) => item.status === 'NEW').length;
      const pendingCount = filtered.filter((item: any) => item.status === 'PENDING').length;
      
      console.log(`✅ [INMEDIATOS] Tras filtrar: NEW: ${newCount}, PENDING: ${pendingCount}, Total: ${filtered.length}`);
      
      setImmediateServices(filtered);
    } catch (e) {
      console.error('❌ Search immediate services error:', e);
      setImmediateServices([]);
    } finally {
      setSearchingImmediate(false);
    }
  }, []);

  /* ── Incrementar rango cada 5 minutos (timer) ── */
  useEffect(() => {
    if (activeTab === 'immediate' && searchingImmediate === false) {
      const interval = setInterval(() => {
        setRangeKm(prev => prev + 3);
        console.log(`[RANGE UPDATE] Nuevo rango: ${(rangeKm + 3)}km`);
      }, 5 * 60 * 1000);  // 5 minutos
      return () => clearInterval(interval);
    }
  }, [activeTab, searchingImmediate, rangeKm]);

  useEffect(() => {
    fetchReservations();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReservations, 30000);
    return () => clearInterval(interval);
  }, [fetchReservations]);

  /* ── Auto-refresh inmediatos cada 10 segundos ── */
  useEffect(() => {
    if (activeTab === 'immediate') {
      searchImmediateServices();
      const interval = setInterval(searchImmediateServices, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, searchImmediateServices]);

  const handleAccept = async (reservation: Reservation) => {
    const isImmmediate = reservation.booking_type === 'immediate';
    showAlert('confirm',
      isImmmediate ? 'Aceptar Servicio' : 'Aceptar Reserva',
      `¿Deseas aceptar ${isImmmediate ? 'el servicio' : 'la reserva'} de ${reservation.customer_name}?\n\nOrigen: ${reservation.pickup_address}\nDestino: ${reservation.drop_address}${!isImmmediate ? `\nFecha: ${formatDate(reservation.booking_date)}\nHora: ${formatTime(reservation.booking_date)}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setAlertVisible(false) },
        {
          text: 'Aceptar',
          onPress: () => { setAlertVisible(false); confirmAccept(reservation); },
        },
      ],
    );
  };

  const confirmAccept = async (reservation: Reservation) => {
    setAccepting(reservation.id);
    try {
      const headers = await getSupabaseAuthHeaders(true);
      const isImmediate = reservation.booking_type === 'immediate';

      // First check it's still available (get without status filter, then check in code)
      const checkUrl = `${SUPABASE_URL}/rest/v1/bookings?id=eq.${reservation.id}&booking_type=eq.${reservation.booking_type}&select=id,status`;
      const checkRes = await fetch(checkUrl, { headers });
      const checkData = await checkRes.json();

      // Validar que aún está disponible (para immediate: NEW o PENDING; para reservation: PENDING)
      const isValidStatus = isImmediate 
        ? checkData?.[0]?.status === 'NEW' || checkData?.[0]?.status === 'PENDING'
        : checkData?.[0]?.status === 'PENDING';

      if (!checkData || checkData.length === 0 || !isValidStatus) {
        showAlert('warning', 'No disponible', isImmediate 
          ? 'Este servicio ya fue aceptado por otro conductor.' 
          : 'Esta reserva ya fue aceptada por otro conductor.');
        if (isImmediate) {
          searchImmediateServices();
        } else {
          fetchReservations();
        }
        return;
      }

      // Get driver vehicle data
      const driverId = user?.auth_id || user?.id;
      const carUrl = `${SUPABASE_URL}/rest/v1/cars?driver_id=eq.${driverId}&select=plate,make,model,color,vehicle_number,vehicle_make,vehicle_model,vehicle_color&limit=1`;
      const carRes = await fetch(carUrl, { headers });
      const cars = await carRes.json();
      const car = cars?.[0] || {};

      // Update booking to ACCEPTED with driver info
      const updateBody = {
        status: 'ACCEPTED',
        driver: driverId,
        driver_id: driverId,
        driver_name: driverName,
        driver_contact: user?.mobile || '',
        driver_token: user?.pushToken || user?.push_token || '',
        plate_number: car.plate || car.vehicle_number || null,
        vehicle_number: car.plate || car.vehicle_number || null,
        vehicle_make: car.make || car.vehicle_make || null,
        vehicle_model: car.model || car.vehicle_model || null,
        vehicle_color: car.color || car.vehicle_color || null,
        car_model: car.model || car.vehicle_model || null,
        driver_arrived_time: new Date().toISOString(),
      };

      const updateUrl = `${SUPABASE_URL}/rest/v1/bookings?id=eq.${reservation.id}`; // Sin filtro de status en URL
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(updateBody),
      });

      if (!updateRes.ok) {
        const err = await updateRes.text();
        throw new Error(err);
      }

      const updateData = await updateRes.json();
      const [updated] = Array.isArray(updateData) ? updateData : [updateData];
      
      // Asegurar que tenemos todos los datos necesarios (preservando datos originales)
      const completeReservation = {
        ...reservation,
        ...updated,
        status: 'ACCEPTED',
        driver: driverId,
        // Asegurar que estos campos críticos se preservan
        pickup_lat: updated?.pickup_lat || reservation.pickup_lat,
        pickup_lng: updated?.pickup_lng || reservation.pickup_lng,
        drop_lat: updated?.drop_lat || reservation.drop_lat,
        drop_lng: updated?.drop_lng || reservation.drop_lng,
        pickup_address: updated?.pickup_address || reservation.pickup_address,
        drop_address: updated?.drop_address || reservation.drop_address,
        customer_name: updated?.customer_name || reservation.customer_name,
        id: reservation.id, // Asegurar que usamos el ID original
      };
      
      console.log('✅ [CompleteReservation] Datos listos:', {
        id: completeReservation.id,
        pickup: `${completeReservation.pickup_lat}, ${completeReservation.pickup_lng}`,
        drop: `${completeReservation.drop_lat}, ${completeReservation.drop_lng}`,
      });

      // Send notifications
      if (reservation.customer_token) {
        sendPushNotification(
          reservation.customer_token,
          isImmediate ? '¡Conductor en camino! 🚗' : '¡Reserva Aceptada! ✅',
          isImmediate
            ? `Tu servicio ${reservation.reference} ha sido aceptado por ${driverName}.`
            : `Tu reserva ${reservation.reference} ha sido aceptada por ${driverName}. Revisa los detalles del conductor en la app.`,
        );
      }

      // To driver (self): confirmation
      const driverToken = user?.pushToken || user?.push_token;
      if (driverToken) {
        sendPushNotification(
          driverToken,
          isImmediate ? 'Has aceptado un servicio inmediato 🚗' : 'Has aceptado una reserva 📅',
          isImmediate
            ? `Servicio ${reservation.reference} de ${reservation.customer_name}.`
            : `Reserva ${reservation.reference} de ${reservation.customer_name}. Fecha: ${formatDate(reservation.booking_date)} a las ${formatTime(reservation.booking_date)}.`,
        );
      }

      // Remove from local list
      if (isImmediate) {
        setImmediateServices(prev => prev.filter(r => r.id !== reservation.id));
      } else {
        setReservations(prev => prev.filter(r => r.id !== reservation.id));
      }

      // Update persistent notification
      updateDriverNotification(
        isImmediate ? '⚡ Servicio inmediato' : '📅 Reserva aceptada',
        isImmediate 
          ? `${reservation.customer_name} — Recogida: ${reservation.pickup_address}`
          : `${reservation.customer_name} — ${formatDate(reservation.booking_date)} a las ${formatTime(reservation.booking_date)}`,
      ).catch(() => {});

      showAlert('success',
        isImmediate ? '¡Servicio Aceptado!' : '¡Reserva Aceptada!',
        isImmediate
          ? `Has aceptado el servicio de ${reservation.customer_name}`
          : `Has aceptado la reserva de ${reservation.customer_name}`,
        [{
          text: 'Ir al viaje',
          onPress: () => { 
            setAlertVisible(false); 
            // Navegar a ReservationTripScreen con todos los datos necesarios
            console.log('✅ [NAVIGATE] Ir al viaje con:', {
              id: completeReservation.id,
              customer: completeReservation.customer_name,
              pickup: `${completeReservation.pickup_lat}, ${completeReservation.pickup_lng}`,
              drop: `${completeReservation.drop_lat}, ${completeReservation.drop_lng}`,
            });
            nav.navigate('ReservationTrip', { reservation: completeReservation }); 
          },
        }],
      );
    } catch (e: any) {
      console.error('Accept booking error:', e);
      showAlert('error', 'Error', 'No se pudo aceptar. Intenta de nuevo.');
    } finally {
      setAccepting(null);
    }
  };

  const fmtMoney = (v: any) => {
    const n = Number(v) || 0;
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    try {
    console.log(`🎨 [RENDER] item #${index}: ref=${item?.reference}, status=${item?.status}, keys=${Object.keys(item || {}).length}`);
    return (
    <Animatable.View animation="fadeInUp" duration={450} delay={index * 60} useNativeDriver>
      <View style={s.card}>
        <View style={s.cardGlow} />

        {/* Reference & Booking Type Badge */}
        <View style={s.cardHeader}>
          <View style={s.refBadge}>
            <Text style={s.refTxt}>{item.reference}</Text>
          </View>
          <View style={[s.typeBadge, item.booking_type === 'immediate' && s.typeBadgeImmediate]}>
            <Ionicons name={item.booking_type === 'immediate' ? 'flash' : 'calendar'} size={14} color="#051A26" />
            <Text style={s.typeTxt}>{item.booking_type === 'immediate' ? 'Inmediato' : 'Reserva'}</Text>
          </View>
          {item.trip_type ? (
          <View style={[s.typeBadge, item.trip_type === 'Ida y Vuelta' && s.typeBadgeRound]}>
            <Ionicons name={item.trip_type === 'Ida' ? 'arrow-forward-circle' : 'repeat'} size={14} color="#051A26" />
            <Text style={s.typeTxt}>{item.trip_type}</Text>
          </View>
          ) : null}
        </View>

        {/* Client info */}
        <View style={s.clientRow}>
          <Ionicons name="person" size={16} color="#00E5FF" />
          <Text style={s.clientName}>{item.customer_name || 'Cliente'}</Text>
        </View>

        {/* Route */}
        <View style={s.routeBlock}>
          <View style={s.routeRow}>
            <View style={s.dotGreen} />
            <Text style={s.routeAddr} numberOfLines={1}>{item.pickup_address || 'Origen'}</Text>
          </View>
          <View style={s.routeLine} />
          <View style={s.routeRow}>
            <View style={s.dotRed} />
            <Text style={s.routeAddr} numberOfLines={1}>{item.drop_address || 'Destino'}</Text>
          </View>
        </View>

        {/* Date & Time */}
        {item.booking_date ? (
        <View style={s.dateTimeRow}>
          <View style={s.dtItem}>
            <Ionicons name="calendar-outline" size={14} color="#00E5FF" />
            <Text style={s.dtTxt}>{formatDate(item.booking_date)}</Text>
          </View>
          <View style={s.dtItem}>
            <Ionicons name="time-outline" size={14} color="#00E5FF" />
            <Text style={s.dtTxt}>{formatTime(item.booking_date)}</Text>
          </View>
        </View>
        ) : null}

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statLabel}>Valor</Text>
            <Text style={s.statValue}>$ {fmtMoney(item.driver_share)} - $ {fmtMoney(item.estimate || item.price)}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Dist.</Text>
            <Text style={s.statValue}>{parseFloat(String(item.distance || 0)).toFixed(2)} km</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Tiempo</Text>
            <Text style={s.statValue}>{item.duration || 0} min</Text>
          </View>
        </View>

        {/* Accept button */}
        <TouchableOpacity
          style={[s.acceptBtn, accepting === item.id && { opacity: 0.6 }]}
          onPress={() => handleAccept(item)}
          disabled={accepting === item.id}
          activeOpacity={0.85}
        >
          {accepting === item.id ? (
            <ActivityIndicator color="#051A26" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#051A26" />
              <Text style={s.acceptTxt}>{item.booking_type === 'immediate' ? 'Aceptar Servicio' : 'Aceptar Reserva'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animatable.View>
    );
    } catch (e: any) {
      console.error(`❌ [RENDER ERROR] item #${index}:`, e?.message, JSON.stringify(item).substring(0, 200));
      return (
        <View style={{ padding: 16, margin: 8, backgroundColor: 'rgba(255,0,0,0.2)', borderRadius: 10 }}>
          <Text style={{ color: '#FF4444', fontSize: 14 }}>Error al mostrar: {item?.reference || 'desconocido'}</Text>
          <Text style={{ color: '#FF8888', fontSize: 11 }}>{e?.message}</Text>
        </View>
      );
    }
  };

  const EmptyState = () => (
    <View style={s.emptyWrap}>
      <Ionicons name="calendar-outline" size={60} color="rgba(0,229,255,0.3)" />
      <Text style={s.emptyTitle}>No hay reservas disponibles</Text>
      <Text style={s.emptySub}>Las nuevas reservas de clientes aparecerán aquí</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image source={BG_IMAGE} style={s.bgImage} resizeMode="cover" />
        <View style={s.bgOverlay} />
      </View>

      <View style={[s.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {activeTab === 'reservations' ? 'Reservas Disponibles' : 'Servicios Inmediatos'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {activeTab === 'immediate' && (
            <TouchableOpacity 
              style={[s.refreshBtn, searchingImmediate && { opacity: 0.6 }]}
              onPress={searchImmediateServices}
              disabled={searchingImmediate}
              activeOpacity={0.75}
            >
              {searchingImmediate ? (
                <ActivityIndicator color="#00E5FF" size="small" />
              ) : (
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#00E5FF' }}>GO</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={s.refreshBtn} 
            onPress={() => {
              setRefreshing(true);
              if (activeTab === 'reservations') {
                fetchReservations();
              } else {
                searchImmediateServices();
              }
            }} 
            activeOpacity={0.75}
          >
            <Ionicons name="refresh" size={20} color="#00E5FF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab selector */}
      <View style={s.tabContainer}>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'reservations' && s.tabActive]}
          onPress={() => {
            setActiveTab('reservations');
            setRefreshing(false);
          }}
        >
          <Ionicons name="calendar-outline" size={16} color={activeTab === 'reservations' ? '#00E5FF' : 'rgba(255,255,255,0.5)'} />
          <Text style={[s.tabTxt, activeTab === 'reservations' && s.tabTxtActive]}>Reservas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[s.tab, activeTab === 'immediate' && s.tabActive]}
          onPress={() => {
            setActiveTab('immediate');
            setRangeKm(3);  // Reset rango a 3km
            searchImmediateServices();
          }}
        >
          <Ionicons name="flash-outline" size={16} color={activeTab === 'immediate' ? '#00E5FF' : 'rgba(255,255,255,0.5)'} />
          <Text style={[s.tabTxt, activeTab === 'immediate' && s.tabTxtActive]}>
            Inmediatos ({rangeKm}km)
          </Text>
        </TouchableOpacity>
      </View>

      {loading && activeTab === 'reservations' ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={s.loadingTxt}>Cargando reservas...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'reservations' ? reservations : immediateServices}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            activeTab === 'reservations' ? EmptyState : (
              <View style={s.emptyWrap}>
                <Ionicons name="flash-outline" size={60} color="rgba(0,229,255,0.3)" />
                <Text style={s.emptyTitle}>No hay servicios inmediatos</Text>
                <Text style={s.emptySub}>Presiona GO para buscar en tu área (rango: {rangeKm}km)</Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                if (activeTab === 'reservations') {
                  fetchReservations();
                } else {
                  searchImmediateServices();
                }
              }}
              tintColor="#00E5FF"
              colors={['#00E5FF']}
            />
          }
        />
      )}

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

export default DriverReservationsScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#051A26' },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,26,38,0.78)' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: 'rgba(5,26,38,0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  list: { paddingHorizontal: 18, paddingTop: 14 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 40 },
  card: {
    overflow: 'hidden', borderRadius: 20, padding: 18, marginBottom: 16,
    backgroundColor: 'rgba(10,46,61,0.55)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.14)',
  },
  cardGlow: {
    position: 'absolute', top: -40, right: -40, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(0,229,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  refBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(0,229,255,0.12)',
  },
  refTxt: { fontSize: 12, fontWeight: '700', color: '#00E5FF', letterSpacing: 0.5 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: '#00E5FF',
  },
  typeBadgeRound: { backgroundColor: '#FFD600' },
  typeBadgeImmediate: { backgroundColor: '#FF9500' },
  typeTxt: { fontSize: 11, fontWeight: '700', color: '#051A26' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  routeBlock: { marginBottom: 12, paddingLeft: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00E676' },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5252' },
  routeLine: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 4.5 },
  routeAddr: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  dateTimeRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dtItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dtTxt: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stat: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(5,26,38,0.6)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.08)',
  },
  statLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16, backgroundColor: '#00E5FF',
  },
  acceptTxt: { fontSize: 15, fontWeight: '700', color: '#051A26' },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(5,26,38,0.6)',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderColor: 'rgba(0,229,255,0.3)',
  },
  tabTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  tabTxtActive: { color: '#00E5FF', fontWeight: '700' },
});
