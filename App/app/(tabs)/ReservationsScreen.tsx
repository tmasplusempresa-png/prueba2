import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '@/common/store';
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

const BG_IMAGE = require('../../assets/images/bg.png');

const formatDate = (ts: string) => {
  const d = new Date(ts);
  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
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

type Reservation = any;

const STATUS_CONFIG = {
  PENDING: { color: '#00E5FF', icon: 'time' as const, label: 'Pendiente' },
  ACCEPTED: { color: '#00E676', icon: 'checkmark-circle' as const, label: 'Aceptada' },
  COMPLETE: { color: '#00B0FF', icon: 'checkmark-done-circle' as const, label: 'Completada' },
  CANCELLED: { color: '#E91E63', icon: 'close-circle' as const, label: 'Cancelada' },
};

const ReservationCard = ({ item, onPress, index }: { item: Reservation; onPress: () => void; index: number }) => {
  const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  return (
    <Animatable.View animation="fadeInUp" duration={420} delay={index * 60} useNativeDriver>
      <TouchableOpacity style={styles.resCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.resCardGlow} />
        <View style={styles.resCardHeader}>
          <View style={styles.refBadge}>
            <Text style={styles.refTxt}>{item.reference}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
            <Ionicons name={cfg.icon} size={12} color="#051A26" />
            <Text style={styles.statusTxt}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.resRouteBlock}>
          <View style={styles.resRouteRow}>
            <View style={[styles.resDot, { backgroundColor: '#00E676' }]} />
            <Text style={styles.resAddr} numberOfLines={1}>{item.pickup_address}</Text>
          </View>
          <View style={styles.resRouteLine} />
          <View style={styles.resRouteRow}>
            <View style={[styles.resDot, { backgroundColor: '#E91E63' }]} />
            <Text style={styles.resAddr} numberOfLines={1}>{item.drop_address}</Text>
          </View>
        </View>

        <View style={styles.resMetaRow}>
          <View style={styles.resMeta}>
            <Ionicons name="calendar-outline" size={13} color="#00E5FF" />
            <Text style={styles.resMetaTxt}>{formatDate(item.booking_date)}</Text>
          </View>
          <View style={styles.resMeta}>
            <Ionicons name="time-outline" size={13} color="#00E5FF" />
            <Text style={styles.resMetaTxt}>{formatTime(item.booking_date)}</Text>
          </View>
          <View style={styles.resMeta}>
            <Ionicons name={item.trip_type === 'Ida' ? 'arrow-forward' : 'repeat'} size={13} color="#00E5FF" />
            <Text style={styles.resMetaTxt}>{item.trip_type}</Text>
          </View>
        </View>

        {item.status === 'ACCEPTED' && item.driver_name && (
          <View style={styles.resDriverRow}>
            <Ionicons name="car" size={14} color="#00E676" />
            <Text style={styles.resDriverTxt}>{item.driver_name}{item.plate_number ? ` • ${item.plate_number}` : ''}</Text>
          </View>
        )}

        <View style={styles.resFooter}>
          <Text style={styles.resPriceTxt}>
            $ {item.driver_share?.toLocaleString('es-CO')} - $ {(item.estimate || item.price)?.toLocaleString('es-CO')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
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
    <Animated.View style={[styles.emptyIconWrap, { transform: [{ translateY }] }]}>
      <Ionicons name={name} size={44} color="#00E5FF" />
    </Animated.View>
  );
};

const ReservationsScreen = () => {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;
  const bottomPad = insets.bottom + 120;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'COMPLETE' | 'CANCELLED'>('PENDING');
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const userId = user?.auth_id || user?.id;

  const fetchReservations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const headers = await getSupabaseAuthHeaders();
      // Fetch both reservation AND immediate bookings for this user (as customer or driver)
      const url = `${SUPABASE_URL}/rest/v1/bookings?booking_type=in.("reservation","immediate")&or=(customer.eq.${userId},driver.eq.${userId})&order=created_at.desc`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errText = await res.text();
        console.warn('Reservations fetch status:', res.status, errText);
        // If booking_type column doesn't exist yet, show empty
        setReservations([]);
        return;
      }
      const data = await res.json();
      setReservations(data || []);
    } catch (e) {
      console.error('Fetch reservations error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReservations();
    }, [fetchReservations])
  );

  const filtered = reservations.filter(r => r.status === activeTab);

  const TABS = [
    { key: 'PENDING' as const, label: 'Pendientes', icon: 'time-outline' as const },
    { key: 'ACCEPTED' as const, label: 'Aceptadas', icon: 'checkmark-circle-outline' as const },
    { key: 'COMPLETE' as const, label: 'Completas', icon: 'checkmark-done-circle-outline' as const },
    { key: 'CANCELLED' as const, label: 'Canceladas', icon: 'close-circle-outline' as const },
  ];

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
        <View style={styles.bgOverlay} />
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottomLeft} />
      </View>

      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tus Reservas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? '#051A26' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.tabTxt, activeTab === tab.key && styles.tabTxtActive]}>{tab.label}</Text>
            {reservations.filter(r => r.status === tab.key).length > 0 && (
              <View style={[styles.tabCount, activeTab === tab.key && styles.tabCountActive]}>
                <Text style={[styles.tabCountTxt, activeTab === tab.key && styles.tabCountTxtActive]}>
                  {reservations.filter(r => r.status === tab.key).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#00E5FF" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchReservations(); }}
              tintColor="#00E5FF"
              colors={['#00E5FF']}
            />
          }
        >
          {filtered.length > 0 ? (
            filtered.map((item, index) => (
              <ReservationCard
                key={item.id}
                item={item}
                index={index}
                onPress={() => nav.navigate('ReservationDetail', { reservation: item })}
              />
            ))
          ) : (
            <Animatable.View animation="fadeInUp" duration={480} useNativeDriver style={styles.sectionBlock}>
              <View style={styles.emptyCard}>
                <View style={styles.cardGlow} />
                <FloatingEmptyIcon name={TABS.find(t => t.key === activeTab)?.icon || 'time-outline'} />
                <Text style={styles.emptyText}>
                  {activeTab === 'PENDING' && 'No tienes reservas pendientes.'}
                  {activeTab === 'ACCEPTED' && 'No tienes reservas aceptadas.'}
                  {activeTab === 'COMPLETE' && 'No tienes reservas completadas.'}
                  {activeTab === 'CANCELLED' && 'No tienes reservas canceladas.'}
                </Text>
                {activeTab === 'PENDING' && (
                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    activeOpacity={0.8}
                    onPress={() => nav.navigate('CreateReservation')}
                  >
                    <Text style={styles.viewAllText}>Crear nueva reserva</Text>
                    <Ionicons name="arrow-forward" size={15} color="#00E5FF" />
                  </TouchableOpacity>
                )}
              </View>
            </Animatable.View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default ReservationsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#051A26',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.34,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,26,38,0.78)',
  },
  glowTopRight: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0,188,212,0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(5,26,38,0.82)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionTitleBar: {
    paddingVertical: 10,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,229,255,0.1)',
    backgroundColor: 'rgba(5,26,38,0.95)',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#00E5FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyCard: {
    overflow: 'hidden',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(10,46,61,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.14)',
    alignItems: 'center',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,229,255,0.06)',
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(10,46,61,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 18,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '500',
  },
  viewAllBtn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E5FF',
    marginRight: 8,
    letterSpacing: 0.2,
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabsScroll: { flexGrow: 0 },
  tabsContent: { paddingHorizontal: 18, paddingVertical: 12, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(10,46,61,0.5)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
  },
  tabActive: { backgroundColor: '#00E5FF', borderColor: '#00E5FF' },
  tabTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  tabTxtActive: { color: '#051A26' },
  tabCount: {
    minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.2)', paddingHorizontal: 4,
  },
  tabCountActive: { backgroundColor: 'rgba(5,26,38,0.25)' },
  tabCountTxt: { fontSize: 10, fontWeight: '700', color: '#00E5FF' },
  tabCountTxtActive: { color: '#051A26' },
  resCard: {
    overflow: 'hidden', borderRadius: 18, padding: 16, marginBottom: 14,
    backgroundColor: 'rgba(10,46,61,0.55)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.14)',
  },
  resCardGlow: {
    position: 'absolute', top: -30, right: -30, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(0,229,255,0.05)',
  },
  resCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  refBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(0,229,255,0.12)' },
  refTxt: { fontSize: 11, fontWeight: '700', color: '#00E5FF' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusTxt: { fontSize: 10, fontWeight: '700', color: '#051A26' },
  resRouteBlock: { marginBottom: 10, paddingLeft: 2 },
  resRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resDot: { width: 8, height: 8, borderRadius: 4 },
  resRouteLine: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.12)', marginLeft: 3.5 },
  resAddr: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  resMetaRow: { flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  resMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  resDriverRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: 'rgba(0,230,118,0.1)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.2)',
  },
  resDriverTxt: { fontSize: 12, fontWeight: '600', color: '#00E676' },
  resFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resPriceTxt: { fontSize: 13, fontWeight: '700', color: '#00E5FF' },
});


