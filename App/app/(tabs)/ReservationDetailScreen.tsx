import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '@/common/store';
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

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

type StatusMeta = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  softBg: string;
  border: string;
};

const getStatusMeta = (status?: string): StatusMeta => {
  const key = String(status || '').toUpperCase();
  if (['COMPLETE', 'PAID'].includes(key)) {
    return {
      title: 'Reserva Completada',
      icon: 'checkmark-done-circle',
      color: '#00B0FF',
      softBg: 'rgba(0,176,255,0.12)',
      border: 'rgba(0,176,255,0.35)',
    };
  }
  if (['ACCEPTED', 'STARTED', 'ARRIVED'].includes(key)) {
    return {
      title: 'Reserva Confirmada',
      icon: 'checkmark-circle',
      color: '#00E676',
      softBg: 'rgba(0,230,118,0.12)',
      border: 'rgba(0,230,118,0.35)',
    };
  }
  if (key === 'CANCELLED') {
    return {
      title: 'Reserva Cancelada',
      icon: 'close-circle',
      color: '#E91E63',
      softBg: 'rgba(233,30,99,0.12)',
      border: 'rgba(233,30,99,0.35)',
    };
  }
  return {
    title: 'Reserva Pendiente',
    icon: 'time',
    color: '#00E5FF',
    softBg: 'rgba(0,229,255,0.12)',
    border: 'rgba(0,229,255,0.35)',
  };
};

const ReservationDetailScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const profile = useSelector((s: RootState) => s.auth.profile) as any;

  const reservation = (route.params as any)?.reservation;
  const [driverInfo, setDriverInfo] = useState<{
    name: string | null;
    plate: string | null;
    make: string | null;
    model: string | null;
    color: string | null;
  } | null>(null);

  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;

  const userId = user?.auth_id || user?.id;
  const isDriverOnTrip = !!(
    reservation &&
    (reservation.driver === userId || reservation.driver_id === userId)
  );

  const accountType = String(
    user?.usertype ||
      user?.user_type ||
      user?.userType ||
      profile?.user_type ||
      user?.user_metadata?.usertype ||
      ''
  )
    .trim()
    .toLowerCase();
  const isDriverAccount = accountType === 'driver' || isDriverOnTrip;

  const statusMeta = getStatusMeta(reservation?.status);

  const driverId = reservation?.driver || reservation?.driver_id || null;

  const resolvedDriver = useMemo(() => {
    if (!reservation) {
      return {
        name: 'N/A',
        plate: 'N/A',
        make: 'N/A',
        model: 'N/A',
        color: 'N/A',
        category: 'N/A',
      };
    }
    const name =
      reservation.driver_name ||
      reservation.driverName ||
      driverInfo?.name ||
      null;
    const plate =
      reservation.plate_number ||
      reservation.vehicle_number ||
      reservation.plate ||
      driverInfo?.plate ||
      null;
    const make =
      reservation.vehicle_make ||
      reservation.car_make ||
      driverInfo?.make ||
      null;
    const model =
      reservation.vehicle_model ||
      reservation.car_model ||
      driverInfo?.model ||
      null;
    const color =
      reservation.vehicle_color ||
      reservation.car_color ||
      driverInfo?.color ||
      null;
    const category = reservation.car_type || reservation.carType || 'N/A';

    return {
      name: name || 'N/A',
      plate: plate || 'N/A',
      make: make || 'N/A',
      model: model || 'N/A',
      color: color || 'N/A',
      category,
    };
  }, [reservation, driverInfo]);

  useEffect(() => {
    let cancelled = false;
    if (!reservation || isDriverAccount || !driverId) return;

    const needsEnrichment =
      !reservation.driver_name ||
      !(reservation.plate_number || reservation.vehicle_number) ||
      !(reservation.vehicle_make || reservation.car_make) ||
      !(reservation.vehicle_model || reservation.car_model) ||
      !(reservation.vehicle_color || reservation.car_color);

    if (!needsEnrichment) return;

    const enrich = async () => {
      try {
        const headers = await getSupabaseAuthHeaders();

        let name: string | null = reservation.driver_name || null;
        if (!name) {
          const userUrl =
            `${SUPABASE_URL}/rest/v1/users` +
            `?or=(auth_id.eq.${encodeURIComponent(driverId)},id.eq.${encodeURIComponent(driverId)})` +
            `&select=first_name,last_name&limit=1`;
          const userRes = await fetch(userUrl, { headers });
          if (userRes.ok) {
            const rows = await userRes.json();
            const u = Array.isArray(rows) ? rows[0] : null;
            if (u) {
              name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || null;
            }
          }
        }

        let plate: string | null =
          reservation.plate_number || reservation.vehicle_number || null;
        let make: string | null = reservation.vehicle_make || null;
        let model: string | null =
          reservation.vehicle_model || reservation.car_model || null;
        let color: string | null =
          reservation.vehicle_color || reservation.car_color || null;

        if (!plate || !make || !model || !color) {
          const carUrl =
            `${SUPABASE_URL}/rest/v1/cars` +
            `?driver_id=eq.${encodeURIComponent(driverId)}` +
            `&select=plate,make,model,color,vehicle_number,vehicle_make,vehicle_model,vehicle_color` +
            `&order=is_active.desc,created_at.desc&limit=1`;
          const carRes = await fetch(carUrl, { headers });
          if (carRes.ok) {
            const cars = await carRes.json();
            const car = Array.isArray(cars) ? cars[0] : null;
            if (car) {
              plate = plate || car.plate || car.vehicle_number || null;
              make = make || car.make || car.vehicle_make || null;
              model = model || car.model || car.vehicle_model || null;
              color = color || car.color || car.vehicle_color || null;
            }
          }
        }

        if (!cancelled) {
          setDriverInfo({ name, plate, make, model, color });
        }
      } catch (e) {
        console.warn('[ReservationDetail] enrich driver info failed:', e);
      }
    };

    enrich();
    return () => {
      cancelled = true;
    };
  }, [driverId, isDriverAccount, reservation]);

  if (!reservation) {
    return (
      <View style={s.root}>
        <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 100 }}>No hay datos de la reserva</Text>
      </View>
    );
  }

  const accountName = (() => {
    const first =
      profile?.first_name ||
      profile?.firstName ||
      user?.first_name ||
      user?.firstName ||
      user?.user_metadata?.first_name ||
      '';
    const last =
      profile?.last_name ||
      profile?.lastName ||
      user?.last_name ||
      user?.lastName ||
      user?.user_metadata?.last_name ||
      '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (isDriverAccount) {
      return reservation.driver_name || 'Conductor';
    }
    return reservation.customer_name || 'Cliente';
  })();

  const handleShare = async () => {
    const text = buildConfirmationText();
    try {
      await Share.share({ message: text });
    } catch {}
  };

  const buildConfirmationText = () => {
    return `Hola, ${accountName}

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

  const getPaymentMethodLabel = (mode: string) => {
    switch (mode) {
      case 'cash':
        return 'Efectivo';
      case 'nequi':
        return 'Nequi';
      case 'daviplata':
        return 'Daviplata';
      default:
        return 'Efectivo';
    }
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

  const TableCell = ({
    icon,
    label,
    value,
  }: {
    icon: string;
    label: string;
    value: string;
  }) => (
    <View style={s.tableCell}>
      <View style={s.tableCellHeader}>
        <Ionicons name={icon as any} size={14} color="#00E5FF" />
        <Text style={s.tableLabel}>{label}</Text>
      </View>
      <Text style={s.tableValue}>{value}</Text>
    </View>
  );

  const tripStatus = String(reservation.status || '').toUpperCase();
  const isImmediate = reservation.booking_type === 'immediate';
  const showCounterpart =
    ['ACCEPTED', 'STARTED', 'ARRIVED', 'COMPLETE', 'PAID'].includes(tripStatus);

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
        <Animatable.View animation="fadeInDown" duration={450} useNativeDriver>
          <View
            style={[
              s.statusCard,
              {
                backgroundColor: statusMeta.softBg,
                borderColor: statusMeta.border,
              },
            ]}
          >
            <View style={[s.statusGlow, { backgroundColor: statusMeta.softBg }]} />
            <Ionicons name={statusMeta.icon} size={36} color={statusMeta.color} />
            <Text style={s.statusTitle}>{statusMeta.title}</Text>
            <Text style={[s.statusRef, { color: statusMeta.color }]}>
              Ref: {reservation.reference}
            </Text>
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={450} delay={60} useNativeDriver>
          <View style={s.greetingCard}>
            <Text style={s.greetingTxt}>
              Hola, <Text style={s.greetingName}>{accountName}</Text>
            </Text>
            <Text style={s.greetingSub}>Te confirmo, estos son los datos de tu servicio:</Text>
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={450} delay={120} useNativeDriver>
          <View style={s.detailCard}>
            <Text style={s.cardSectionTitle}>Datos del Servicio</Text>

            <View
              style={[
                s.bookingTypeBadge,
                isImmediate ? s.bookingTypeImmediate : s.bookingTypeScheduled,
              ]}
            >
              <Ionicons
                name={isImmediate ? 'flash' : 'calendar'}
                size={16}
                color="#00E5FF"
              />
              <Text style={s.bookingTypeText}>
                {isImmediate ? 'Servicio Inmediato (ASAP)' : 'Reserva Programada'}
              </Text>
            </View>

            <View style={s.dateTimeRow}>
              <View style={[s.dateTimeCard, s.dateTimeCardLeft]}>
                <View style={s.dateTimeHeader}>
                  <Ionicons name="calendar" size={16} color="#00E5FF" />
                  <Text style={s.dateTimeLabel}>Fecha</Text>
                </View>
                <Text style={s.dateTimeValue}>{formatDate(reservation.booking_date)}</Text>
              </View>
              <View style={s.dateTimeCard}>
                <View style={s.dateTimeHeader}>
                  <Ionicons name="time" size={16} color="#00E5FF" />
                  <Text style={s.dateTimeLabel}>Hora</Text>
                </View>
                <Text style={s.dateTimeValue}>{formatTime(reservation.booking_date)}</Text>
              </View>
            </View>

            <View style={s.divider} />

            <InfoRow icon="location" label="Origen" value={reservation.pickup_address} />
            <InfoRow icon="flag" label="Destino" value={reservation.drop_address} />

            <View style={s.divider} />

            <View style={s.tableGrid}>
              <TableCell icon="person" label="Cliente" value={reservation.customer_name || 'N/A'} />
              <TableCell icon="grid" label="Categoria" value={reservation.car_type || 'N/A'} />
              <TableCell
                icon="cash"
                label="Valor estimado"
                value={`$ ${reservation.driver_share?.toLocaleString('es-CO')} - $ ${(reservation.estimate || reservation.price)?.toLocaleString('es-CO')}`}
              />
              <TableCell
                icon="speedometer"
                label="Distancia estimada"
                value={`${reservation.distance?.toFixed?.(2) ?? reservation.distance} km`}
              />
              <TableCell
                icon="hourglass"
                label="Tiempo estimado"
                value={`${reservation.duration} min`}
              />
              <TableCell
                icon={reservation.trip_type === 'Ida' ? 'arrow-forward-circle' : 'repeat'}
                label="Recorrido"
                value={reservation.trip_type || 'N/A'}
              />
            </View>

            <View style={s.divider} />

            <View style={s.paymentMethodHighlight}>
              <View style={s.paymentMethodIcon}>
                {reservation.payment_mode === 'cash' ? (
                  <Ionicons name="cash" size={24} color="#00E5FF" />
                ) : reservation.payment_mode === 'nequi' ? (
                  <MaterialIcons name="phone" size={24} color="#00E5FF" />
                ) : reservation.payment_mode === 'daviplata' ? (
                  <MaterialIcons name="account-balance-wallet" size={24} color="#00E5FF" />
                ) : (
                  <Ionicons name="cash" size={24} color="#00E5FF" />
                )}
              </View>
              <View style={s.paymentMethodContent}>
                <Text style={s.infoLabel}>Metodo de Pago</Text>
                <Text style={s.paymentMethodValue}>
                  {getPaymentMethodLabel(reservation.payment_mode || 'cash')}
                </Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        {showCounterpart && !isDriverAccount && (
          <Animatable.View animation="fadeInUp" duration={450} delay={180} useNativeDriver>
            <View style={s.detailCard}>
              <Text style={s.cardSectionTitle}>Datos del Conductor</Text>
              <View style={s.tableGrid}>
                <TableCell icon="person-circle" label="Conductor" value={resolvedDriver.name} />
                <TableCell icon="layers" label="Categoria" value={resolvedDriver.category} />
                <TableCell icon="document-text" label="Placa" value={resolvedDriver.plate} />
                <TableCell icon="car" label="Marca" value={resolvedDriver.make} />
                <TableCell icon="construct" label="Modelo" value={resolvedDriver.model} />
                <TableCell icon="color-palette" label="Color" value={resolvedDriver.color} />
              </View>
            </View>
          </Animatable.View>
        )}

        {showCounterpart && isDriverAccount && (
          <Animatable.View animation="fadeInUp" duration={450} delay={180} useNativeDriver>
            <View style={s.detailCard}>
              <Text style={s.cardSectionTitle}>Datos del Cliente</Text>
              <InfoRow icon="person" label="Cliente" value={reservation.customer_name} />
              <InfoRow icon="call" label="Celular" value={reservation.customer_contact || 'N/A'} />
              <InfoRow icon="mail" label="Email" value={reservation.customer_email || 'N/A'} />
            </View>
          </Animatable.View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: 'rgba(5,26,38,0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 14 },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  statusTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginTop: 10 },
  statusRef: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  greetingCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(10,46,61,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.12)',
  },
  greetingTxt: { fontSize: 15, color: '#FFF', lineHeight: 22 },
  greetingName: { fontWeight: '700', color: '#00E5FF' },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  detailCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(10,46,61,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.12)',
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E5FF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  bookingTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  bookingTypeImmediate: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderColor: '#00E5FF',
  },
  bookingTypeScheduled: {
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderColor: 'rgba(0,229,255,0.45)',
  },
  bookingTypeText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#00E5FF',
    flex: 1,
    flexWrap: 'wrap',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 4,
  },
  dateTimeCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.22)',
  },
  dateTimeCardLeft: {
    marginRight: 8,
  },
  dateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateTimeLabel: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  dateTimeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoIcon: { marginTop: 2, marginRight: 12 },
  infoContent: { flex: 1, minWidth: 0 },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#FFF', lineHeight: 20 },
  divider: { height: 1, backgroundColor: 'rgba(0,229,255,0.08)', marginVertical: 12 },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tableCell: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  tableCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tableLabel: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 18,
    backgroundColor: 'rgba(0,229,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.16)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  paymentMethodHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodContent: { flex: 1, minWidth: 0 },
  paymentMethodValue: { fontSize: 14, fontWeight: '600', color: '#00E5FF', marginTop: 2 },
});
