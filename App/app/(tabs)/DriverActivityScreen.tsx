import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Platform, Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '@/common/store';
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

const BG_IMAGE = require('../../assets/images/bg.png');

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
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
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

type TabKey = 'activas' | 'completas' | 'canceladas';
type TypeFilter = 'todos' | 'inmediatos' | 'reservas';

const formatDate = (ts: string) => {
  const d = new Date(ts);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTime = (ts: string) => {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
};

const FloatingEmptyIcon = ({ name }: { name: React.ComponentProps<typeof Ionicons>['name'] }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [translateY]);
  return (
    <Animated.View style={[st.emptyIconWrap, { transform: [{ translateY }] }]}>
      <Ionicons name={name} size={44} color="#00E5FF" />
    </Animated.View>
  );
};

const DriverActivityScreen = () => {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;

  const [tab, setTab] = useState<TabKey>('activas');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [activas, setActivas] = useState<Reservation[]>([]);
  const [completas, setCompletas] = useState<Reservation[]>([]);
  const [canceladas, setCanceladas] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const driverId = user?.auth_id || user?.id;

  const fetchReservations = useCallback(async () => {
    try {
      const headers = await getSupabaseAuthHeaders();

      // Fetch ACCEPTED bookings (activas) - both immediate and reservation
      const activasUrl = `${SUPABASE_URL}/rest/v1/bookings?status=in.(ACCEPTED,STARTED,ARRIVED)&driver_id=eq.${driverId}&order=created_at.desc`;
      const activasRes = await fetch(activasUrl, { headers });
      if (activasRes.ok) setActivas(await activasRes.json() || []);

      // Fetch COMPLETE bookings - both types
      const completasUrl = `${SUPABASE_URL}/rest/v1/bookings?status=eq.COMPLETE&driver_id=eq.${driverId}&order=created_at.desc&limit=30`;
      const completasRes = await fetch(completasUrl, { headers });
      if (completasRes.ok) setCompletas(await completasRes.json() || []);

      // Fetch CANCELLED bookings - both types
      const canceladasUrl = `${SUPABASE_URL}/rest/v1/bookings?status=eq.CANCELLED&driver_id=eq.${driverId}&order=created_at.desc&limit=30`;
      const canceladasRes = await fetch(canceladasUrl, { headers });
      if (canceladasRes.ok) setCanceladas(await canceladasRes.json() || []);
    } catch (e) {
      console.error('DriverActivity fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driverId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReservations();
    }, [fetchReservations])
  );

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchReservations, 30000);
    return () => clearInterval(interval);
  }, [fetchReservations]);

  const rawData = tab === 'activas' ? activas : tab === 'completas' ? completas : canceladas;
  const currentData = typeFilter === 'todos' ? rawData
    : typeFilter === 'inmediatos' ? rawData.filter(b => b.booking_type === 'immediate')
    : rawData.filter(b => b.booking_type === 'reservation');

  const handleStartReservation = (reservation: Reservation) => {
    if (reservation.booking_type === 'immediate') {
      nav.navigate('Booking', { booking: reservation });
    } else {
      nav.navigate('ReservationTrip', { reservation });
    }
  };

  const handleViewDetail = (reservation: Reservation) => {
    nav.navigate('ReservationDetail', { reservation });
  };

  const renderActivaItem = ({ item, index }: { item: Reservation; index: number }) => {
    const isToday = item.booking_date ? new Date(item.booking_date).toDateString() === new Date().toDateString() : true;
    const bookingTime = item.booking_date ? new Date(item.booking_date).getTime() : 0;
    const now = Date.now();
    const canStart = item.booking_type === 'immediate' || (bookingTime - now) < 60 * 60 * 1000; // Immediate always, reservations within 1 hour

    return (
      <Animatable.View animation="fadeInUp" duration={400} delay={index * 50} useNativeDriver>
        <View style={st.card}>
          <View style={st.cardGlow} />

          {/* Header */}
          <View style={st.cardHeader}>
            <View style={st.refBadge}>
              <Text style={st.refTxt}>{item.reference}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={[st.statusBadge, { backgroundColor: item.booking_type === 'immediate' ? 'rgba(255,179,0,0.15)' : 'rgba(0,229,255,0.15)' }]}>
                <Text style={[st.statusTxt, { color: item.booking_type === 'immediate' ? '#FFB300' : '#00E5FF' }]}>
                  {item.booking_type === 'immediate' ? 'INMEDIATO' : 'RESERVA'}
                </Text>
              </View>
              <View style={[st.statusBadge, item.status === 'STARTED' ? st.statusStarted : st.statusAccepted]}>
                <Text style={st.statusTxt}>
                  {item.status === 'STARTED' ? 'EN CURSO' : item.status === 'ARRIVED' ? 'LLEGASTE' : 'ACEPTADA'}
                </Text>
              </View>
            </View>
          </View>

          {/* Client */}
          <View style={st.clientRow}>
            <Ionicons name="person" size={16} color="#00E5FF" />
            <Text style={st.clientName}>{item.customer_name}</Text>
            {isToday && <View style={st.todayBadge}><Text style={st.todayTxt}>HOY</Text></View>}
          </View>

          {/* Date & Time */}
          <View style={st.dtRow}>
            <View style={st.dtItem}>
              <Ionicons name="calendar-outline" size={14} color="#00E5FF" />
              <Text style={st.dtTxt}>{formatDate(item.booking_date)}</Text>
            </View>
            <View style={st.dtItem}>
              <Ionicons name="time-outline" size={14} color="#00E5FF" />
              <Text style={st.dtTxt}>{formatTime(item.booking_date)}</Text>
            </View>
          </View>

          {/* Route */}
          <View style={st.routeBlock}>
            <View style={st.routeRow}>
              <View style={st.dotGreen} />
              <Text style={st.routeAddr} numberOfLines={1}>{item.pickup_address}</Text>
            </View>
            <View style={st.routeLine} />
            <View style={st.routeRow}>
              <View style={st.dotRed} />
              <Text style={st.routeAddr} numberOfLines={1}>{item.drop_address}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={st.statLabel}>Valor</Text>
              <Text style={st.statValue}>$ {(item.estimate || item.price)?.toLocaleString('es-CO')}</Text>
            </View>
            <View style={st.stat}>
              <Text style={st.statLabel}>Dist.</Text>
              <Text style={st.statValue}>{item.distance?.toFixed?.(1) ?? item.distance} km</Text>
            </View>
            <View style={st.stat}>
              <Text style={st.statLabel}>Tiempo</Text>
              <Text style={st.statValue}>{item.duration} min</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={st.actionsRow}>
            <TouchableOpacity
              style={st.detailBtn}
              onPress={() => handleViewDetail(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={16} color="#00E5FF" />
              <Text style={st.detailBtnTxt}>Detalles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[st.startBtn, !canStart && st.startBtnDisabled]}
              onPress={() => canStart && handleStartReservation(item)}
              disabled={!canStart}
              activeOpacity={0.82}
            >
              <Ionicons name="navigate" size={18} color={canStart ? '#051A26' : 'rgba(255,255,255,0.3)'} />
              <Text style={[st.startBtnTxt, !canStart && st.startBtnTxtDisabled]}>
                {item.status === 'STARTED' ? 'Continuar' : item.status === 'ARRIVED' ? 'Continuar' : item.booking_type === 'immediate' ? 'Ver Viaje' : 'Iniciar Reserva'}
              </Text>
            </TouchableOpacity>
          </View>

          {!canStart && (
            <Text style={st.notYetTxt}>Disponible 1 hora antes de la reserva</Text>
          )}
        </View>
      </Animatable.View>
    );
  };

  const renderCompletaItem = ({ item, index }: { item: Reservation; index: number }) => (
    <Animatable.View animation="fadeInUp" duration={400} delay={index * 50} useNativeDriver>
      <TouchableOpacity style={st.miniCard} onPress={() => handleViewDetail(item)} activeOpacity={0.8}>
        <View style={st.miniLeft}>
          <Ionicons name="checkmark-circle" size={20} color="#00E676" />
          <View style={st.miniInfo}>
            <Text style={st.miniRef}>{item.reference}</Text>
            <Text style={st.miniClient} numberOfLines={1}>{item.customer_name}</Text>
          </View>
        </View>
        <View style={st.miniRight}>
          <Text style={st.miniDate}>{formatDate(item.booking_date)}</Text>
          <Text style={st.miniPrice}>$ {(item.estimate || item.price)?.toLocaleString('es-CO')}</Text>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderCanceladaItem = ({ item, index }: { item: Reservation; index: number }) => (
    <Animatable.View animation="fadeInUp" duration={400} delay={index * 50} useNativeDriver>
      <TouchableOpacity style={st.miniCard} onPress={() => handleViewDetail(item)} activeOpacity={0.8}>
        <View style={st.miniLeft}>
          <Ionicons name="close-circle" size={20} color="#E91E63" />
          <View style={st.miniInfo}>
            <Text style={st.miniRef}>{item.reference}</Text>
            <Text style={st.miniClient} numberOfLines={1}>{item.customer_name}</Text>
          </View>
        </View>
        <View style={st.miniRight}>
          <Text style={st.miniDate}>{formatDate(item.booking_date)}</Text>
          <Text style={st.miniPrice}>$ {(item.estimate || item.price)?.toLocaleString('es-CO')}</Text>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
    <View style={st.emptyWrap}>
      <FloatingEmptyIcon name={icon as any} />
      <Text style={st.emptyText}>{text}</Text>
    </View>
  );

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'activas', label: 'Activas', count: activas.length },
    { key: 'completas', label: 'Completas', count: completas.length },
    { key: 'canceladas', label: 'Canceladas', count: canceladas.length },
  ];

  return (
    <View style={st.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image source={BG_IMAGE} style={st.bgImage} resizeMode="cover" />
        <View style={st.bgOverlay} />
      </View>

      {/* Header */}
      <View style={[st.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={st.backBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Mis Viajes</Text>
        <TouchableOpacity
          style={st.refreshHeaderBtn}
          onPress={() => { setRefreshing(true); fetchReservations(); }}
          activeOpacity={0.75}
        >
          <Ionicons name="refresh" size={20} color="#00E5FF" />
        </TouchableOpacity>
      </View>

      {/* Type filter - Inmediatos vs Reservas */}
      <View style={st.typeFilterBar}>
        {([
          { key: 'todos' as TypeFilter, label: 'Todos', icon: 'list-outline' as const },
          { key: 'inmediatos' as TypeFilter, label: 'Inmediatos', icon: 'flash-outline' as const },
          { key: 'reservas' as TypeFilter, label: 'Reservas', icon: 'calendar-outline' as const },
        ]).map(f => (
          <TouchableOpacity
            key={f.key}
            style={[st.typeFilterItem, typeFilter === f.key && st.typeFilterItemActive]}
            onPress={() => setTypeFilter(f.key)}
            activeOpacity={0.75}
          >
            <Ionicons name={f.icon} size={14} color={typeFilter === f.key ? '#051A26' : 'rgba(255,255,255,0.5)'} />
            <Text style={[st.typeFilterLabel, typeFilter === f.key && st.typeFilterLabelActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab bar */}
      <View style={st.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[st.tabItem, tab === t.key && st.tabItemActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.75}
          >
            <Text style={[st.tabLabel, tab === t.key && st.tabLabelActive]}>{t.label}</Text>
            {t.count > 0 && (
              <View style={[st.tabBadge, tab === t.key && st.tabBadgeActive]}>
                <Text style={st.tabBadgeTxt}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={st.loadingWrap}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={st.loadingTxt}>Cargando reservas...</Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={item => item.id}
          renderItem={
            tab === 'activas' ? renderActivaItem :
            tab === 'completas' ? renderCompletaItem :
            renderCanceladaItem
          }
          contentContainerStyle={[st.list, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'activas' ? 'car-outline' : tab === 'completas' ? 'checkmark-circle-outline' : 'close-circle-outline'}
              text={
                tab === 'activas' ? 'No tienes reservas activas.\nAcepta reservas desde "Reservas Disponibles".'
                : tab === 'completas' ? 'No hay reservas completadas aún.'
                : 'No hay reservas canceladas.'
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchReservations(); }}
              tintColor="#00E5FF"
              colors={['#00E5FF']}
            />
          }
        />
      )}
    </View>
  );
};

export default DriverActivityScreen;

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#051A26' },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.34 },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  refreshHeaderBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  /* Type filter */
  typeFilterBar: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8, gap: 8,
    backgroundColor: 'rgba(5,26,38,0.9)',
  },
  typeFilterItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, borderRadius: 10, gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  typeFilterItemActive: {
    backgroundColor: '#00E5FF', borderColor: '#00E5FF',
  },
  typeFilterLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  typeFilterLabelActive: { color: '#051A26', fontWeight: '700' },
  /* Tab bar */
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: 'rgba(5,26,38,0.9)',
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 12, marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabItemActive: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)',
  },
  tabLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  tabLabelActive: { color: '#00E5FF', fontWeight: '700' },
  tabBadge: {
    marginLeft: 6, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBadgeActive: { backgroundColor: '#00E5FF' },
  tabBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#051A26' },
  /* Loading */
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingTxt: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 },
  /* List */
  list: { paddingHorizontal: 20, paddingTop: 12 },
  /* Activa card */
  card: {
    overflow: 'hidden', borderRadius: 22, padding: 18, marginBottom: 16,
    backgroundColor: 'rgba(10,46,61,0.55)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.14)',
  },
  cardGlow: {
    position: 'absolute', top: -30, left: -30, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(0,229,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  refBadge: {
    backgroundColor: 'rgba(0,229,255,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },
  refTxt: { fontSize: 11, fontWeight: '700', color: '#00E5FF', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusAccepted: { backgroundColor: 'rgba(0,230,118,0.15)' },
  statusStarted: { backgroundColor: 'rgba(255,214,0,0.15)' },
  statusTxt: { fontSize: 10, fontWeight: '800', color: '#00E676', letterSpacing: 0.5 },
  clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#FFF', marginLeft: 8, flex: 1 },
  todayBadge: {
    backgroundColor: '#00E5FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  todayTxt: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  dtRow: { flexDirection: 'row', marginBottom: 10, gap: 16 },
  dtItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dtTxt: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  routeBlock: { marginBottom: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E676', marginRight: 10 },
  dotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E91E63', marginRight: 10 },
  routeLine: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 3.5, marginVertical: 2 },
  routeAddr: { fontSize: 13, color: 'rgba(255,255,255,0.8)', flex: 1, fontWeight: '500' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  stat: {
    flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, paddingVertical: 8, marginHorizontal: 3,
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.08)',
  },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 12, color: '#FFF', fontWeight: '700', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  detailBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14, gap: 6,
    backgroundColor: 'rgba(0,229,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  detailBtnTxt: { fontSize: 13, fontWeight: '700', color: '#00E5FF' },
  startBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14, gap: 6, backgroundColor: '#00E5FF',
  },
  startBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  startBtnTxt: { fontSize: 14, fontWeight: '800', color: '#051A26' },
  startBtnTxtDisabled: { color: 'rgba(255,255,255,0.3)' },
  notYetTxt: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 6 },
  /* Mini card */
  miniCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 16, marginBottom: 10,
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)',
  },
  miniLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  miniInfo: { marginLeft: 10, flex: 1 },
  miniRef: { fontSize: 12, fontWeight: '700', color: '#00E5FF' },
  miniClient: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  miniRight: { alignItems: 'flex-end' },
  miniDate: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  miniPrice: { fontSize: 13, fontWeight: '700', color: '#FFF', marginTop: 2 },
  /* Empty */
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,46,61,0.75)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.14)',
    shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.22,
    shadowRadius: 18, elevation: 6, marginBottom: 18,
  },
  emptyText: {
    fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.6)', textAlign: 'center',
    fontWeight: '500', paddingHorizontal: 30,
  },
});


