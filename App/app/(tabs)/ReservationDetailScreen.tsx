import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, Share, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '@/common/store';

const BG_IMAGE = require('../../assets/images/bg.png');

const formatDate = (ts: string) => {
  const d = new Date(ts);
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatTime = (ts: string) => {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'p. m.' : 'a. m.';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m}:00 ${ampm}`;
};

const ReservationDetailScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const profile = useSelector((s: RootState) => s.auth.profile) as any;

  const reservation = (route.params as any)?.reservation;

  if (!reservation) {
    return (
      <View style={s.root}>
        <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 100 }}>No hay datos de la reserva</Text>
      </View>
    );
  }

  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;

  // Determine if current user is the driver or customer
  const userId = user?.auth_id || user?.id;
  const isDriver = (reservation.driver === userId) || (reservation.driver_id === userId);
  const isAccepted = reservation.status === 'ACCEPTED';

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  };

  const recipientName = isDriver
    ? reservation.customer_name
    : (reservation.driver_name || 'Conductor por asignar');

  const handleShare = async () => {
    const text = buildConfirmationText();
    try {
      await Share.share({ message: text });
    } catch {}
  };

  const buildConfirmationText = () => {
    return `${greeting()}, Sr(a). ${recipientName}

Te confirmo, estos son los datos de tu servicio:

*Fecha:* ${formatDate(reservation.booking_date)}
*Hora:* ${formatTime(reservation.booking_date)}

*Datos del servicio:*
*Origen:* ${reservation.pickup_address}
*Destino:* ${reservation.drop_address}
*Cliente:* ${reservation.customer_name}
*Categoría:* ${reservation.car_type || 'N/A'}
*Valor estimado:* $ ${reservation.driver_share?.toLocaleString('es-CO')} - $ ${(reservation.estimate || reservation.price)?.toLocaleString('es-CO')}
*Distancia estimada:* ${reservation.distance?.toFixed?.(2) ?? reservation.distance} km
*Tiempo Estimado:* ${reservation.duration} min
*Recorrido:* ${reservation.trip_type}
`;
  };

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={s.infoRow}>
      <Ionicons name={icon as any} size={18} color="#00E5FF" style={s.infoIcon} />
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const getPaymentMethodLabel = (mode: string) => {
    switch (mode) {
      case 'cash':
        return '💵 Efectivo';
      case 'nequi':
        return '📱 Nequi';
      case 'daviplata':
        return '💰 Daviplata';
      default:
        return 'Efectivo';
    }
  };

  return (
    <View style={s.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image source={BG_IMAGE} style={s.bgImage} resizeMode="cover" />
        <View style={s.bgOverlay} />
      </View>

      {/* Header */}
      <View style={[s.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detalle de Reserva</Text>
        <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.75}>
          <Ionicons name="share-outline" size={20} color="#00E5FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge */}
        <Animatable.View animation="fadeInDown" duration={450} useNativeDriver>
          <View style={s.statusCard}>
            <View style={s.statusGlow} />
            <Ionicons
              name={isAccepted ? 'checkmark-circle' : 'time'}
              size={36}
              color={isAccepted ? '#00E5FF' : '#00E5FF'}
            />
            <Text style={s.statusTitle}>
              {isAccepted ? '¡Reserva Confirmada!' : 'Reserva Pendiente'}
            </Text>
            <Text style={s.statusRef}>Ref: {reservation.reference}</Text>
          </View>
        </Animatable.View>

        {/* Greeting */}
        <Animatable.View animation="fadeInUp" duration={450} delay={60} useNativeDriver>
          <View style={s.greetingCard}>
            <Text style={s.greetingTxt}>
              {greeting()}, Sr(a). <Text style={s.greetingName}>{recipientName}</Text>
            </Text>
            <Text style={s.greetingSub}>Te confirmo, estos son los datos de tu servicio:</Text>
          </View>
        </Animatable.View>

        {/* Service details */}
        <Animatable.View animation="fadeInUp" duration={450} delay={120} useNativeDriver>
          <View style={s.detailCard}>
            <Text style={s.cardSectionTitle}>Datos del Servicio</Text>

            {/* Booking type indicator */}
            <View style={[s.bookingTypeBadge, reservation.booking_type === 'immediate' && s.bookingTypeImmediate]}>
              <Ionicons 
                name={reservation.booking_type === 'immediate' ? 'flash' : 'calendar'} 
                size={16} 
                color={reservation.booking_type === 'immediate' ? '#00E5FF' : '#00E5FF'} 
              />
              <Text style={[s.bookingTypeText, reservation.booking_type === 'immediate' && { color: '#00E5FF' }]}>
                {reservation.booking_type === 'immediate' ? '⚡ Servicio Inmediato (ASAP)' : '📅 Reserva Programada'}
              </Text>
            </View>

            <InfoRow icon="calendar" label="Fecha" value={formatDate(reservation.booking_date)} />
            <InfoRow icon="time" label="Hora" value={formatTime(reservation.booking_date)} />

            <View style={s.divider} />

            <InfoRow icon="location" label="Origen" value={reservation.pickup_address} />
            <InfoRow icon="flag" label="Destino" value={reservation.drop_address} />

            <View style={s.divider} />

            <InfoRow icon="person" label="Cliente" value={reservation.customer_name} />
            <InfoRow icon="grid" label="Categoría" value={reservation.car_type || 'N/A'} />
            <InfoRow
              icon="cash"
              label="Valor estimado"
              value={`$ ${reservation.driver_share?.toLocaleString('es-CO')} - $ ${(reservation.estimate || reservation.price)?.toLocaleString('es-CO')}`}
            />
            <InfoRow icon="speedometer" label="Distancia estimada" value={`${reservation.distance?.toFixed?.(2) ?? reservation.distance} km`} />
            <InfoRow icon="hourglass" label="Tiempo Estimado" value={`${reservation.duration} min`} />
            <InfoRow icon={reservation.trip_type === 'Ida' ? 'arrow-forward-circle' : 'repeat'} label="Recorrido" value={reservation.trip_type} />

            <View style={s.divider} />

            <View style={s.paymentMethodHighlight}>
              <View style={s.paymentMethodIcon}>
                {reservation.payment_mode === "cash" ? (
                  <Ionicons name="cash" size={24} color="#00E5FF" />
                ) : reservation.payment_mode === "nequi" ? (
                  <MaterialIcons name="phone" size={24} color="#00E5FF" />
                ) : reservation.payment_mode === "daviplata" ? (
                  <MaterialIcons name="account-balance-wallet" size={24} color="#00E5FF" />
                ) : null}
              </View>
              <View style={s.paymentMethodContent}>
                <Text style={s.infoLabel}>Método de Pago</Text>
                <Text style={s.paymentMethodValue}>
                  {getPaymentMethodLabel(reservation.payment_mode || 'cash')}
                </Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Driver info (shown to client) */}
        {isAccepted && !isDriver && (
          <Animatable.View animation="fadeInUp" duration={450} delay={180} useNativeDriver>
            <View style={s.detailCard}>
              <Text style={s.cardSectionTitle}>Datos del Conductor</Text>
              <InfoRow icon="person-circle" label="Conductor" value={reservation.driver_name || 'N/A'} />
              <InfoRow icon="call" label="Celular" value={reservation.driver_contact || 'N/A'} />
              <InfoRow icon="layers" label="Categoría" value={reservation.car_type || 'N/A'} />
              <InfoRow icon="document-text" label="Placa" value={reservation.plate_number || reservation.vehicle_number || 'N/A'} />
              <InfoRow icon="car" label="Marca" value={reservation.vehicle_make || 'N/A'} />
              <InfoRow icon="construct" label="Modelo" value={reservation.vehicle_model || 'N/A'} />
              <InfoRow icon="color-palette" label="Color" value={reservation.vehicle_color || 'N/A'} />
              <InfoRow icon="list" label="Línea" value={reservation.car_model || 'N/A'} />
            </View>
          </Animatable.View>
        )}

        {/* Customer info (shown to driver) */}
        {isAccepted && isDriver && (
          <Animatable.View animation="fadeInUp" duration={450} delay={180} useNativeDriver>
            <View style={s.detailCard}>
              <Text style={s.cardSectionTitle}>Datos del Cliente</Text>
              <InfoRow icon="person" label="Cliente" value={reservation.customer_name} />
              <InfoRow icon="call" label="Celular" value={reservation.customer_contact || 'N/A'} />
              <InfoRow icon="mail" label="Email" value={reservation.customer_email || 'N/A'} />
            </View>
          </Animatable.View>
        )}

        {/* Payment note */}
        <Animatable.View animation="fadeInUp" duration={450} delay={240} useNativeDriver>
        </Animatable.View>
      </ScrollView>
    </View>
  );
};

export default ReservationDetailScreen;

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
  shareBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 14 },
  statusCard: {
    alignItems: 'center', paddingVertical: 24, borderRadius: 20, marginBottom: 16,
    backgroundColor: 'rgba(10,46,61,0.55)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.14)',
    overflow: 'hidden',
  },
  statusGlow: {
    position: 'absolute', top: -30, left: -30, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(0,229,255,0.06)',
  },
  statusTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginTop: 10 },
  statusRef: { fontSize: 13, fontWeight: '600', color: '#00E5FF', marginTop: 4 },
  greetingCard: {
    padding: 18, borderRadius: 18, marginBottom: 14,
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
  },
  greetingTxt: { fontSize: 15, color: '#FFF', lineHeight: 22 },
  greetingName: { fontWeight: '700', color: '#00E5FF' },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  detailCard: {
    padding: 18, borderRadius: 18, marginBottom: 14,
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
  },
  cardSectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#00E5FF', letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoIcon: { marginTop: 2, marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#FFF', lineHeight: 20 },
  divider: { height: 1, backgroundColor: 'rgba(0,229,255,0.08)', marginVertical: 10 },
  paymentCard: {
    flexDirection: 'row', gap: 12, padding: 16, borderRadius: 18, marginBottom: 14,
    backgroundColor: 'rgba(10,46,61,0.48)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
  },
  paymentLabel: { fontSize: 11, fontWeight: '700', color: '#00E5FF', textTransform: 'uppercase', marginBottom: 4 },
  paymentTxt: { fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 16 },
  paymentMethodHighlight: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: 12, padding: 12, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  paymentMethodIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  paymentMethodContent: { flex: 1 },
  paymentMethodValue: { fontSize: 14, fontWeight: '600', color: '#00E5FF', marginTop: 2 },
  
  /* Booking Type Indicator */
  bookingTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14,
    borderRadius: 12, backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)',
  },
  bookingTypeImmediate: {
    backgroundColor: 'rgba(255,149,0,0.1)',
    borderColor: 'rgba(255,149,0,0.3)',
  },
  bookingTypeText: { fontSize: 13, fontWeight: '600', color: '#00E5FF', flex: 1 },
});
