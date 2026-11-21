import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Linking, Modal, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert, { AlertButton, AlertType } from '@/components/CustomAlert';
import { ClientRouteMarker } from '@/components/ClientOriginMapMarker';
import { GOOGLE_MAPS_DARK_STYLE } from '@/config/googleMapsDarkStyle';
import { API_KEY } from '@/config/AppConfig';
import {
  RECOMMENDATION_EVENT_LABELS,
  fetchRecommendedTripDetail,
  reportRecommendationSupport,
  reportSettlement,
  settlementColor,
  settlementLabel,
  type RecommendedTripDetail,
  type SettlementAction,
} from '@/common/services/recommendationsService';
import { DAVIPLATA_LOGO_URI, NEQUI_LOGO_URI } from '@/common/utils/paymentMode';

const BG_IMAGE = require('../../assets/images/bg.png');
const REFRESH_ACTIVE_MS = 15000;

type LatLng = { latitude: number; longitude: number };

const STATUS_META: Record<string, { title: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  NEW: { title: 'Buscando conductor', icon: 'search', color: '#FFB300' },
  PENDING: { title: 'Buscando conductor', icon: 'search', color: '#FFB300' },
  ACCEPTED: { title: 'Conductor en camino', icon: 'car-sport', color: '#00E5FF' },
  ARRIVED: { title: 'Conductor en el punto de recogida', icon: 'location', color: '#00E5FF' },
  STARTED: { title: 'Viaje en curso', icon: 'navigate', color: '#00E5FF' },
  REACHED: { title: 'Llegando al destino', icon: 'flag', color: '#00E5FF' },
  COMPLETE: { title: 'Viaje completado', icon: 'checkmark-circle', color: '#00E676' },
  PAID: { title: 'Viaje completado', icon: 'checkmark-circle', color: '#00E676' },
  CANCELLED: { title: 'Viaje cancelado', icon: 'close-circle', color: '#FF5252' },
};

const fmtMoney = (v: number | null | undefined) =>
  v == null ? '—' : `$ ${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
};

/** Decodifica overview_polyline de Google Directions. */
const decodePolyline = (encoded: string): LatLng[] => {
  const out: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let b = 0;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const delta = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
};

const callPhone = (phone: string | null) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  if (!digits) return;
  Linking.openURL(`${Platform.OS === 'android' ? 'tel:' : 'telprompt:'}${digits}`).catch(() => {});
};

/**
 * Detalle de un viaje recomendado para el conductor que lo pidió o el que lo hizo: progreso, ruta y trazado,
 * liquidación entre ambos (pagué / recibí / no recibí) y reportes a soporte.
 */
const RecommendedTripDetailScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const bookingId: string = route.params?.bookingId;
  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;

  const [trip, setTrip] = useState<RecommendedTripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggestedRoute, setSuggestedRoute] = useState<LatLng[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportNote, setSupportNote] = useState('');
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string; buttons?: AlertButton[] } | null>(null);
  const closeAlert = () => setAlert(null);
  const mapRef = useRef<MapView>(null);

  const load = useCallback(async () => {
    if (!bookingId) return;
    try {
      setTrip(await fetchRecommendedTripDetail(bookingId));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar el viaje.');
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const status = String(trip?.status || '').toUpperCase();
  const finished = ['COMPLETE', 'PAID', 'CANCELLED'].includes(status);
  useEffect(() => {
    if (!trip || finished) return;
    const timer = setInterval(() => void load(), REFRESH_ACTIVE_MS);
    return () => clearInterval(timer);
  }, [trip, finished, load]);

  // Ruta sugerida por calles (Google Directions) entre origen y destino.
  const pickupLat = trip?.pickup.lat;
  const pickupLng = trip?.pickup.lng;
  const dropLat = trip?.drop.lat;
  const dropLng = trip?.drop.lng;
  useEffect(() => {
    if (pickupLat == null || pickupLng == null || dropLat == null || dropLng == null) return;
    let cancelled = false;
    const straight = [
      { latitude: pickupLat, longitude: pickupLng },
      { latitude: dropLat, longitude: dropLng },
    ];
    (async () => {
      let points: LatLng[] = straight;
      if (API_KEY) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupLat},${pickupLng}` +
              `&destination=${dropLat},${dropLng}&mode=driving&key=${API_KEY}`,
          );
          const json = await res.json();
          const encoded = json?.routes?.[0]?.overview_polyline?.points;
          if (json?.status === 'OK' && encoded) {
            const decoded = decodePolyline(encoded);
            if (decoded.length > 1) points = decoded;
          }
        } catch {
          /* sin Directions: línea entre origen y destino */
        }
      }
      if (!cancelled) setSuggestedRoute(points);
    })();
    return () => {
      cancelled = true;
    };
  }, [pickupLat, pickupLng, dropLat, dropLng]);

  const mapPoints = useMemo(
    () => [...suggestedRoute, ...(trip?.route ?? [])],
    [suggestedRoute, trip?.route],
  );
  useEffect(() => {
    if (mapPoints.length < 2) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(mapPoints, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: false,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [mapPoints]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmSettlement = (action: SettlementAction, title: string, message: string) => {
    if (!trip) return;
    setAlert({
      type: 'confirm',
      title,
      message,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: closeAlert },
        {
          text: 'Confirmar',
          onPress: async () => {
            closeAlert();
            setBusy(true);
            try {
              await reportSettlement(trip.id, action);
              await load();
            } catch (e: any) {
              setAlert({ type: 'error', title: 'No se pudo actualizar', message: e?.message || 'Intenta de nuevo.' });
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    });
  };

  const sendSupport = async () => {
    if (!trip) return;
    const note = supportNote.trim();
    if (!note) return;
    setBusy(true);
    try {
      await reportRecommendationSupport(trip.id, note);
      setSupportOpen(false);
      setSupportNote('');
      await load();
      setAlert({
        type: 'success',
        title: supportClosed ? 'Chat reabierto' : 'Mensaje enviado',
        message: supportClosed
          ? 'Se reabrió el mismo chat de este viaje. Soporte verá toda la trazabilidad.'
          : 'El chat sigue abierto hasta que soporte lo cierre. Te avisamos por notificación.',
      });
    } catch (e: any) {
      setAlert({ type: 'error', title: 'No se pudo enviar', message: e?.message || 'Intenta de nuevo.' });
    } finally {
      setBusy(false);
    }
  };

  const meta = STATUS_META[status] ?? { title: status || 'Viaje', icon: 'car' as const, color: '#00E5FF' };
  const isRequester = trip?.role === 'solicitante';
  const counterpart = isRequester ? trip?.driverName || 'el conductor' : trip?.requesterName || 'el conductor';

  const steps = trip
    ? [
        { label: 'Solicitado', done: true, at: trip.createdAt },
        { label: 'Conductor asignado', done: !!trip.driverName || !['NEW', 'PENDING'].includes(status), at: null },
        { label: 'En el punto de recogida', done: !!trip.arrivedAt, at: trip.arrivedAt },
        { label: 'En viaje', done: !!trip.startedAt, at: trip.startedAt },
        { label: 'Completado', done: ['COMPLETE', 'PAID'].includes(status), at: trip.endedAt },
      ]
    : [];

  const settlement = trip?.settlement ?? null;
  const settlementClosed = settlement?.status === 'confirmado' || settlement?.status === 'resuelto';
  const supportClosed = !!trip?.support?.closedAt;
  const supportOpenThread = !!trip?.support && !supportClosed;
  const supportAwaitingReply = supportOpenThread && !trip?.support?.attendedAt;

  return (
    <View style={s.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image source={BG_IMAGE} style={s.bgImage} resizeMode="cover" />
        <View style={s.bgOverlay} />
      </View>

      <View style={[s.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Viaje recomendado</Text>
        <TouchableOpacity style={[s.iconBtn, s.iconBtnAccent]} onPress={onRefresh} activeOpacity={0.75}>
          <Ionicons name="refresh" size={18} color="#00E5FF" />
        </TouchableOpacity>
      </View>

      {!trip ? (
        <View style={s.center}>
          {error ? (
            <>
              <Ionicons name="alert-circle-outline" size={36} color="#FF8A80" />
              <Text style={s.errorTxt}>{error}</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={() => void load()}>
                <Text style={s.primaryBtnTxt}>Reintentar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ActivityIndicator color="#00E5FF" />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5FF" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Estado */}
          <View style={[s.statusBar, { borderColor: `${meta.color}55`, backgroundColor: `${meta.color}14` }]}>
            <View style={[s.statusIcon, { backgroundColor: `${meta.color}22` }]}>
              <Ionicons name={meta.icon} size={18} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.statusTitle}>{meta.title}</Text>
              <Text style={[s.statusRef, { color: meta.color }]}>
                Ref · {trip.reference || trip.id.slice(0, 8).toUpperCase()}
                {trip.carType ? ` · ${trip.carType}` : ''}
              </Text>
            </View>
            {!finished && <View style={[s.liveDot, { backgroundColor: meta.color }]} />}
          </View>

          {/* Mapa: ruta sugerida (cian) y recorrido GPS del conductor (verde) */}
          {mapPoints.length > 1 ? (
            <View style={s.mapCard} pointerEvents="none">
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_GOOGLE}
                customMapStyle={GOOGLE_MAPS_DARK_STYLE}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                toolbarEnabled={false}
                initialRegion={{
                  latitude: mapPoints[0].latitude,
                  longitude: mapPoints[0].longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                {suggestedRoute.length > 1 && (
                  <Polyline coordinates={suggestedRoute} strokeColor="#00E5FF" strokeWidth={3.5} lineJoin="round" lineCap="round" zIndex={1} />
                )}
                {trip.route.length > 1 && (
                  <Polyline coordinates={trip.route} strokeColor="#00E676" strokeWidth={3} lineJoin="round" lineCap="round" zIndex={2} />
                )}
                {suggestedRoute.length > 1 && (
                  <>
                    <ClientRouteMarker coordinate={suggestedRoute[0]} variant="origin" zIndex={4} />
                    <ClientRouteMarker coordinate={suggestedRoute[suggestedRoute.length - 1]} variant="destination" zIndex={5} />
                  </>
                )}
              </MapView>
              {trip.route.length > 1 && (
                <View style={s.mapLegend}>
                  <View style={[s.legendDot, { backgroundColor: '#00E676' }]} />
                  <Text style={s.legendTxt}>Recorrido del conductor</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Progreso */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Progreso</Text>
            {status === 'CANCELLED' ? (
              <Text style={s.cancelTxt}>El viaje fue cancelado.</Text>
            ) : (
              steps.map((step, i) => (
                <View key={step.label} style={s.stepRow}>
                  <View style={s.stepRail}>
                    <View style={[s.stepDot, step.done && s.stepDotDone]}>
                      {step.done && <Ionicons name="checkmark" size={10} color="#051A26" />}
                    </View>
                    {i < steps.length - 1 && <View style={[s.stepLine, steps[i + 1].done && s.stepLineDone]} />}
                  </View>
                  <View style={s.stepBody}>
                    <Text style={[s.stepLabel, step.done && s.stepLabelDone]}>{step.label}</Text>
                    {step.at ? <Text style={s.stepAt}>{fmtDateTime(step.at)}</Text> : null}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Ruta */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Ruta</Text>
            <View style={s.addrRow}>
              <View style={[s.addrDot, { backgroundColor: '#FFF', borderColor: '#00E5FF' }]} />
              <Text style={s.addrTxt}>{trip.pickup.address}</Text>
            </View>
            <View style={s.addrRow}>
              <View style={[s.addrDot, { backgroundColor: '#E91E63', borderColor: '#00E5FF' }]} />
              <Text style={s.addrTxt}>{trip.drop.address}</Text>
            </View>
            <Text style={s.mutedTxt}>
              {trip.distanceKm != null ? `${trip.distanceKm.toFixed(1)} km` : ''}
              {trip.durationMin != null ? ` · ${trip.durationMin} min` : ''}
              {trip.bookingDate ? ` · ${fmtDateTime(trip.bookingDate)}` : ''}
            </Text>
            {trip.observations ? <Text style={s.notesTxt}>Indicaciones: {trip.observations}</Text> : null}
          </View>

          {/* Personas */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Personas</Text>
            <PersonRow icon="person" label="Cliente" name={trip.customerName} phone={trip.customerPhone} />
            {isRequester ? (
              <PersonRow
                icon="car-sport"
                label="Conductor que hace el viaje"
                name={trip.driverName || 'Aún sin conductor'}
                detail={[trip.plate, trip.vehicle].filter(Boolean).join(' · ')}
                phone={trip.driverPhone}
              />
            ) : (
              <PersonRow icon="people" label="Lo solicitó" name={trip.requesterName} phone={trip.requesterPhone} />
            )}
          </View>

          {/* Tarifa */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Tarifa</Text>
            <InfoRow
              label={trip.fareSource === 'manual' ? 'Valor fijo definido' : 'Tarifa fija recomendada'}
              value={fmtMoney(trip.fareMin)}
            />
            {trip.finalPrice != null && <InfoRow label="Precio final" value={fmtMoney(trip.finalPrice)} strong />}
            {isRequester && trip.agreedValue != null && (
              <>
                <InfoRow label="Acordado con el cliente" value={fmtMoney(trip.agreedValue)} />
                <InfoRow
                  label="Tu ganancia"
                  value={fmtMoney(trip.agreedValue - (settlement?.amount ?? trip.finalPrice ?? trip.fareMin))}
                  color={trip.agreedValue - (settlement?.amount ?? trip.finalPrice ?? trip.fareMin) >= 0 ? '#00E676' : '#FF5252'}
                />
              </>
            )}
          </View>

          {/* Liquidación entre conductores */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Pago entre conductores</Text>
            {isRequester && trip.receiverPaymentMethods && trip.driverName ? (
              <View style={s.payMethodsBox}>
                <Text style={s.payMethodsTitle}>Cómo pagarle a {counterpart || 'quien hace el viaje'}</Text>
                {trip.receiverPaymentMethods.daviplata && trip.receiverPaymentMethods.daviplataNumero ? (
                  <View style={s.payMethodRow}>
                    <Image source={{ uri: DAVIPLATA_LOGO_URI }} style={s.payLogo} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={s.payMethodName}>DaviPlata</Text>
                      <Text style={s.payMethodValue}>{trip.receiverPaymentMethods.daviplataNumero}</Text>
                    </View>
                  </View>
                ) : null}
                {trip.receiverPaymentMethods.nequi && trip.receiverPaymentMethods.nequiNumero ? (
                  <View style={s.payMethodRow}>
                    <Image source={{ uri: NEQUI_LOGO_URI }} style={s.payLogo} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={s.payMethodName}>Nequi</Text>
                      <Text style={s.payMethodValue}>{trip.receiverPaymentMethods.nequiNumero}</Text>
                    </View>
                  </View>
                ) : null}
                {trip.receiverPaymentMethods.nequiBreb ? (
                  <View style={s.payMethodRow}>
                    <Ionicons name="key-outline" size={22} color="#00E5FF" />
                    <View style={{ flex: 1 }}>
                      <Text style={s.payMethodName}>Llave Bre-b</Text>
                      <Text style={s.payMethodValue}>{trip.receiverPaymentMethods.nequiBreb}</Text>
                    </View>
                  </View>
                ) : null}
                {!trip.receiverPaymentMethods.daviplata && !trip.receiverPaymentMethods.nequi && !trip.receiverPaymentMethods.nequiBreb ? (
                  <Text style={s.mutedTxt}>El conductor aún no configuró DaviPlata/Nequi/Bre-b.</Text>
                ) : null}
              </View>
            ) : null}

            {!settlement ? (
              <Text style={s.mutedTxt}>
                {status === 'CANCELLED'
                  ? 'El viaje se canceló: no hay pago entre conductores.'
                  : 'La liquidación se abre cuando el viaje se completa. Desde ese momento hay 24 h para pagar.'}
              </Text>
            ) : (
              <>
                <View style={s.settleHead}>
                  <View style={[s.settleDot, { backgroundColor: settlementColor(settlement) }]} />
                  <Text style={[s.settleStatus, { color: settlementColor(settlement) }]}>{settlementLabel(settlement)}</Text>
                  <Text style={s.settleAmount}>{fmtMoney(settlement.amount)}</Text>
                </View>
                <Text style={s.mutedTxt}>
                  {isRequester ? `Le pagas a ${counterpart}` : `Te paga ${counterpart}`}
                  {settlementClosed ? '' : ` · plazo ${fmtDateTime(settlement.dueAt)}`}
                </Text>
                <Text style={s.mutedTxt}>
                  Pago reportado: {settlement.paidReportedAt ? fmtDateTime(settlement.paidReportedAt) : 'no'} · Recibido:{' '}
                  {settlement.received === null ? 'sin respuesta' : settlement.received ? 'sí' : 'no'}
                </Text>
                {settlement.resolutionNote ? <Text style={s.notesTxt}>Soporte: {settlement.resolutionNote}</Text> : null}

                {settlementClosed ? (
                  <View style={s.lockedRow}>
                    <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.55)" />
                    <Text style={s.lockedTxt}>Pago cerrado: ya no se puede modificar.</Text>
                  </View>
                ) : isRequester ? (
                  !settlement.paidReportedAt && (
                    <TouchableOpacity
                      style={s.primaryBtn}
                      disabled={busy}
                      onPress={() => confirmSettlement('pague', 'Confirmar pago',
                        `Confirmas que ya le pagaste ${fmtMoney(settlement.amount)} a ${counterpart}. Él deberá confirmarlo.`)}
                    >
                      {busy ? <ActivityIndicator color="#051A26" size="small" /> : <Text style={s.primaryBtnTxt}>Ya le pagué</Text>}
                    </TouchableOpacity>
                  )
                ) : (
                  <View style={s.btnRow}>
                    <TouchableOpacity
                      style={[s.primaryBtn, { flex: 1 }]}
                      disabled={busy}
                      onPress={() => confirmSettlement('recibi', 'Confirmar que recibiste',
                        `Confirmas que ${counterpart} ya te pagó ${fmtMoney(settlement.amount)}.`)}
                    >
                      {busy ? <ActivityIndicator color="#051A26" size="small" /> : <Text style={s.primaryBtnTxt}>Recibí el pago</Text>}
                    </TouchableOpacity>
                    {settlement.received !== false && (
                      <TouchableOpacity
                        style={[s.ghostBtn, { flex: 1 }]}
                        disabled={busy}
                        onPress={() => confirmSettlement('no_recibi', 'Aún no recibes el pago',
                          settlement.paidReportedAt
                            ? `${counterpart} reportó que ya te pagó. Si no es así, soporte de T+Plus revisará el caso.`
                            : `Quedará registrado que aún no recibes el pago de ${counterpart}.`)}
                      >
                        <Text style={s.ghostBtnTxt}>Aún no lo recibo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Soporte: hilo abierto hasta que el admin lo cierre desde la web */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Soporte</Text>
            {trip.support ? (
              <View style={[
                s.supportBox,
                supportClosed ? s.supportClosed : supportAwaitingReply ? s.supportPending : s.supportDone,
              ]}>
                <Text style={s.supportTitle}>
                  {supportClosed
                    ? 'Soporte terminado'
                    : supportAwaitingReply
                      ? 'Chat abierto · en revisión'
                      : 'Chat abierto · soporte respondió'}
                </Text>
                <Text style={s.mutedTxt}>
                  {trip.support.mine ? 'Tú abriste el caso' : `Abrió ${trip.support.requestedBy || 'el otro conductor'}`}
                  {` · ${fmtDateTime(trip.support.requestedAt)}`}
                  {supportClosed && trip.support.closedAt ? ` · cerrado ${fmtDateTime(trip.support.closedAt)}` : ''}
                </Text>
                {(trip.support.messages?.length ? trip.support.messages : [
                  ...(trip.support.note
                    ? [{ id: 0, role: 'conductor' as const, body: trip.support.note, createdAt: trip.support.requestedAt, mine: trip.support.mine }]
                    : []),
                  ...(trip.support.response
                    ? [{ id: 1, role: 'admin' as const, body: trip.support.response, createdAt: trip.support.attendedAt || trip.support.requestedAt, mine: false }]
                    : []),
                ]).map((m) => (
                  <Text
                    key={`${m.id}-${m.createdAt}`}
                    style={m.role === 'admin' ? s.supportResponse : s.notesTxt}
                  >
                    {m.role === 'admin' ? 'Soporte: ' : 'Tú: '}{m.body}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={s.mutedTxt}>¿Pasó algo con el viaje o con el pago? Cuéntanos y lo revisamos.</Text>
            )}
            <TouchableOpacity style={s.ghostBtn} onPress={() => setSupportOpen(true)} disabled={busy}>
              <Ionicons name="chatbubbles-outline" size={15} color="#00E5FF" />
              <Text style={s.ghostBtnTxt}>
                {!trip.support
                  ? 'Reportar a soporte'
                  : supportClosed
                    ? 'Abrir otro (mismo chat)'
                    : 'Enviar mensaje'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bitácora */}
          {trip.events.length > 0 && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>Historial</Text>
              {trip.events.map((e, i) => (
                <View key={`${e.type}-${i}`} style={s.eventRow}>
                  <View style={s.eventDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.eventTitle}>{RECOMMENDATION_EVENT_LABELS[e.type] ?? e.type}</Text>
                    <Text style={s.stepAt}>
                      {fmtDateTime(e.createdAt)}
                      {e.note ? ` · ${e.note}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={supportOpen} transparent animationType="fade" onRequestClose={() => setSupportOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>
              {trip?.support ? (supportClosed ? 'Abrir otro mensaje' : 'Mensaje a soporte') : 'Reportar a soporte'}
            </Text>
            <Text style={s.mutedTxt}>
              {supportClosed
                ? 'Se reabre el mismo chat de este viaje para que el admin vea toda la trazabilidad.'
                : 'Describe qué pasó. El chat permanece abierto hasta que soporte lo cierre desde la web.'}
            </Text>
            <TextInput
              style={s.modalInput}
              placeholder="Ej.: el pago no ha llegado, problema con el pasajero…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={supportNote}
              onChangeText={setSupportNote}
              multiline
              maxLength={500}
            />
            <View style={s.btnRow}>
              <TouchableOpacity style={[s.ghostBtn, { flex: 1 }]} onPress={() => setSupportOpen(false)} disabled={busy}>
                <Text style={s.ghostBtnTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.primaryBtn, { flex: 1 }, !supportNote.trim() && { opacity: 0.5 }]}
                onPress={sendSupport}
                disabled={busy || !supportNote.trim()}
              >
                {busy ? <ActivityIndicator color="#051A26" size="small" /> : <Text style={s.primaryBtnTxt}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={!!alert}
        type={alert?.type}
        title={alert?.title || ''}
        message={alert?.message || ''}
        buttons={alert?.buttons || [{ text: 'OK', onPress: closeAlert }]}
        onDismiss={closeAlert}
      />
    </View>
  );
};

function PersonRow({
  icon,
  label,
  name,
  detail,
  phone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  name: string | null;
  detail?: string;
  phone: string | null;
}) {
  return (
    <View style={s.personRow}>
      <View style={s.personIcon}>
        <Ionicons name={icon} size={16} color="#00E5FF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.personLabel}>{label}</Text>
        <Text style={s.personName} numberOfLines={1}>{name || '—'}</Text>
        {detail ? <Text style={s.mutedTxt} numberOfLines={1}>{detail}</Text> : null}
      </View>
      {phone ? (
        <TouchableOpacity style={s.callBtn} onPress={() => callPhone(phone)} activeOpacity={0.75}>
          <Ionicons name="call" size={16} color="#00E676" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function InfoRow({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, strong && s.infoValueStrong, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#051A26' },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.22 },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,26,38,0.82)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconBtnAccent: { backgroundColor: 'rgba(0,229,255,0.1)' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorTxt: { color: '#FFF', textAlign: 'center', fontSize: 13 },
  content: { paddingHorizontal: 16, paddingTop: 12 },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  statusRef: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },

  mapCard: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  mapLegend: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(5,26,38,0.8)',
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 10, color: '#FFF', fontWeight: '600' },

  card: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(10,46,61,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.12)',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,229,255,0.85)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  mutedTxt: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },
  notesTxt: { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17, marginTop: 4 },
  cancelTxt: { fontSize: 13, color: '#FF8A80' },

  stepRow: { flexDirection: 'row', gap: 10 },
  stepRail: { alignItems: 'center', width: 18 },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#00E5FF', borderColor: '#00E5FF' },
  stepLine: { width: 2, flex: 1, minHeight: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
  stepLineDone: { backgroundColor: 'rgba(0,229,255,0.6)' },
  stepBody: { flex: 1, paddingBottom: 12 },
  stepLabel: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  stepLabelDone: { color: '#FFF' },
  stepAt: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addrDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  addrTxt: { flex: 1, fontSize: 13, color: '#FFF' },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  personIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.1)',
  },
  personLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  personName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,230,118,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.3)',
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  infoValue: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  infoValueStrong: { color: '#00E5FF', fontWeight: '800' },

  settleHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settleDot: { width: 8, height: 8, borderRadius: 4 },
  settleStatus: { flex: 1, fontSize: 13, fontWeight: '700' },
  settleAmount: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  payMethodsBox: {
    marginTop: 12, padding: 12, borderRadius: 12, gap: 8,
    backgroundColor: 'rgba(0,229,255,0.06)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.18)',
  },
  payMethodsTitle: { fontSize: 12, fontWeight: '800', color: '#00E5FF', textTransform: 'uppercase', letterSpacing: 0.4 },
  payMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payLogo: { width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' },
  payMethodName: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  payMethodValue: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  lockedTxt: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  primaryBtn: {
    marginTop: 8,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E5FF',
    paddingHorizontal: 14,
  },
  primaryBtnTxt: { color: '#051A26', fontWeight: '800', fontSize: 13 },
  ghostBtn: {
    marginTop: 8,
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.4)',
    paddingHorizontal: 14,
  },
  ghostBtnTxt: { color: '#00E5FF', fontWeight: '700', fontSize: 13 },

  supportBox: { padding: 10, borderRadius: 10, borderWidth: 1, gap: 4 },
  supportPending: { borderColor: 'rgba(255,179,0,0.45)', backgroundColor: 'rgba(255,179,0,0.08)' },
  supportDone: { borderColor: 'rgba(0,230,118,0.4)', backgroundColor: 'rgba(0,230,118,0.08)' },
  supportClosed: { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' },
  supportTitle: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  supportResponse: { fontSize: 12, color: '#00E676', marginTop: 4, lineHeight: 17 },

  eventRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  eventDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00E5FF', marginTop: 6 },
  eventTitle: { fontSize: 13, color: '#FFF', fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#0A2E3D',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    gap: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  modalInput: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    color: '#FFF',
    fontSize: 13,
    textAlignVertical: 'top',
  },
});

export default RecommendedTripDetailScreen;
