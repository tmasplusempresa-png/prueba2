import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import type { RootState } from '@/common/store/store';
import { useOnboardingSteps } from '@/hooks/useOnboardingSteps';
import {
  markOnboardingAutoOpenSettled,
  setOnboardingModalOpen,
  subscribeOnboardingRequests,
} from '@/common/services/onboardingGate';
import { ACTIVE_TRIP_STORAGE_KEY } from '@/common/services/AppStateRestoration';

// Conductor: apertura automática como máximo cada 10 min.
// Tope de escalado de la letra del sistema: con más, el modal se desarma.
const MAX_FONT_SCALE = 1.3;
const DRIVER_COOLDOWN_MS = 10 * 60 * 1000;
const LAST_OPEN_KEY_PREFIX = 'onboarding_modal_last_open_';

// Cliente: una vez por sesión de la app (se reinicia al reabrirla).
const customerShownFor = new Set<string>();

// Paleta de la app (la misma de CustomAlert): la app es oscura.
const c = {
  overlay: 'rgba(2,12,20,0.82)',
  card: 'rgba(8,38,56,0.97)',
  border: 'rgba(0,229,255,0.18)',
  title: '#FFFFFF',
  text: 'rgba(255,255,255,0.75)',
  muted: 'rgba(255,255,255,0.5)',
  track: 'rgba(255,255,255,0.12)',
  rowBg: 'rgba(255,255,255,0.06)',
  accent: '#00E5FF',
  ok: '#00E676',
  onAccent: '#051A26',
};

type Stage = { key: string; label: string; target: string; button: string; stepKeys: string[] };

const DRIVER_STAGES: Stage[] = [
  { key: 'perfil', label: 'Perfil', target: 'Docs', button: 'Completar perfil', stepKeys: ['profile_image'] },
  {
    key: 'documentos',
    label: 'Documentos',
    target: 'ImageGallery',
    button: 'Subir documentos',
    stepKeys: ['id_front', 'id_back', 'license_front', 'license_back', 'soat', 'card_front', 'card_back'],
  },
  { key: 'vehiculo', label: 'Vehículo', target: 'CarsEdit', button: 'Agregar vehículo', stepKeys: ['vehicle'] },
];

const CUSTOMER_STAGES: Stage[] = [
  { key: 'foto', label: 'Foto de perfil', target: 'Docs', button: 'Subir foto', stepKeys: ['profile_image'] },
  { key: 'cedula', label: 'Cédula', target: 'ImageGallery', button: 'Subir documentos', stepKeys: ['id_front', 'id_back'] },
];

/**
 * Pasos de registro pendientes. Un solo modal montado en TabNavigator:
 * - Conductor: se abre al entrar / volver a primer plano mientras falte algo
 *   (con enfriamiento) y cuando intenta aceptar un servicio.
 * - Cliente: una vez por sesión; nunca bloquea nada.
 * No se abre sobre un viaje activo (ruta distinta de HomeScreen o viaje guardado).
 */
const OnboardingModal: React.FC = () => {
  const navigation = useNavigation<any>();

  const userId = useSelector((s: RootState) => String((s as any).auth?.profile?.id || (s as any).auth?.user?.id || ''));
  const { userType, steps, pending, total, loading, refresh } = useOnboardingSteps();
  const [visible, setVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const isDriver = userType === 'driver';
  const isCustomer = userType === 'customer';

  // Valores recientes para los listeners (AppState / pedidos externos).
  const latest = useRef({ pending, loading, isDriver, isCustomer, userId });
  latest.current = { pending, loading, isDriver, isCustomer, userId };

  const onActiveTripOrDeepScreen = useCallback(async (): Promise<boolean> => {
    try {
      const state = navigation.getState?.();
      const top = state?.routes?.[state.index ?? 0]?.name;
      if (top && top !== 'HomeScreen') return true;
    } catch {}
    try {
      if (await AsyncStorage.getItem(ACTIVE_TRIP_STORAGE_KEY)) return true;
    } catch {}
    return false;
  }, [navigation]);

  const tryAutoOpen = useCallback(async () => {
    const { pending: p, loading: l, isDriver: d, isCustomer: cu, userId: uid } = latest.current;
    if (l || p === 0 || !uid || (!d && !cu)) return;
    if (AppState.currentState !== 'active') return;
    if (await onActiveTripOrDeepScreen()) {
      markOnboardingAutoOpenSettled();
      return;
    }

    if (cu) {
      markOnboardingAutoOpenSettled();
      if (customerShownFor.has(uid)) return;
      customerShownFor.add(uid);
      setVisible(true);
      return;
    }

    const key = LAST_OPEN_KEY_PREFIX + uid;
    try {
      const last = Number(await AsyncStorage.getItem(key)) || 0;
      if (Date.now() - last < DRIVER_COOLDOWN_MS) {
        markOnboardingAutoOpenSettled();
        return;
      }
      await AsyncStorage.setItem(key, String(Date.now()));
    } catch {
      // Sin AsyncStorage no hay enfriamiento persistente: se abre igual esta vez.
    }
    markOnboardingAutoOpenSettled();
    setVisible(true);
  }, [onActiveTripOrDeepScreen]);

  // Publica si el modal está abierto para que otros avisos esperen.
  useEffect(() => {
    setOnboardingModalOpen(visible && total > 0);
  }, [visible, total]);

  // Al terminar de cargar / cambiar los pendientes.
  useEffect(() => {
    tryAutoOpen();
  }, [loading, pending, userType, userId, tryAutoOpen]);

  // Al volver a primer plano (el hook ya refresca por su cuenta).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') setTimeout(tryAutoOpen, 1500);
    });
    return () => sub.remove();
  }, [tryAutoOpen]);

  // Pedido explícito (intento de aceptar un servicio): sin enfriamiento.
  useEffect(() => {
    return subscribeOnboardingRequests(() => {
      if (!latest.current.isDriver) return;
      refresh();
      setVisible(true);
    });
  }, [refresh]);

  // Si se completa todo con el modal abierto, se cierra solo.
  useEffect(() => {
    if (visible && !loading && pending === 0) setVisible(false);
  }, [visible, loading, pending]);

  const goTo = (target: string) => {
    setVisible(false);
    navigation.navigate(target as never);
  };

  const stageDefs = isCustomer ? CUSTOMER_STAGES : DRIVER_STAGES;
  const stages = stageDefs.map((def) => {
    const own = steps.filter((x) => def.stepKeys.includes(x.key));
    const doneCount = own.filter((x) => x.done).length;
    return { def, own, doneCount, complete: own.length > 0 && doneCount === own.length };
  });
  const firstIncomplete = stages.find((x) => !x.complete)?.def.key ?? stages[0]?.def.key ?? null;

  // Al abrir, queda seleccionada la primera etapa incompleta.
  useEffect(() => {
    if (visible) setSelectedKey(firstIncomplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const current = stages.find((x) => x.def.key === (selectedKey ?? firstIncomplete)) ?? stages[0];

  const done = total - pending;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const closeLabel = isCustomer ? 'Ahora no' : 'Más tarde';
  const title = isCustomer ? 'Ayúdanos a mejorar la seguridad' : 'Completa tu registro';
  const subtitle = isDriver
    ? 'Para poder aceptar servicios necesitas completar tu registro.'
    : 'Verificar tu foto y tu cédula nos ayuda a proteger a pasajeros y conductores. Puedes pedir servicios sin completarlo.';

  return (
    <Modal
      visible={visible && total > 0}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={[st.overlay, { backgroundColor: c.overlay }]}>
        <View style={[st.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.title, { color: c.title }]}>{title}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.subtitle, { color: c.text }]}>{subtitle}</Text>

          <View style={st.stagesRow}>
            {stages.map((stg) => {
              const selected = stg.def.key === current?.def.key;
              const inProgress = !stg.complete && stg.def.key === firstIncomplete;
              const state = stg.complete ? 'Hecha' : inProgress ? 'En curso' : 'Pendiente';
              const stateColor = stg.complete ? c.ok : inProgress ? c.accent : c.muted;
              return (
                <TouchableOpacity
                  key={stg.def.key}
                  style={[
                    st.stage,
                    { backgroundColor: c.rowBg, borderColor: selected ? c.accent : 'transparent' },
                  ]}
                  onPress={() => setSelectedKey(stg.def.key)}
                  activeOpacity={0.8}
                >
                  <View style={st.stageHead}>
                    {stg.complete ? (
                      <Ionicons name="checkmark-circle" size={16} color={c.ok} />
                    ) : (
                      <Ionicons
                        name={inProgress ? 'radio-button-on' : 'ellipse-outline'}
                        size={16}
                        color={stateColor}
                      />
                    )}
                    <Text
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                      style={[st.stageLabel, { color: c.title }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {stg.def.label}
                    </Text>
                  </View>
                  <Text
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    style={[st.stageState, { color: stateColor }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {state}
                  </Text>
                  {stg.own.length > 1 && (
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.stageCount, { color: c.muted }]}>
                      {stg.doneCount}/{stg.own.length}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={st.progressRow}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.progressText, { color: c.title }]}>
              {done} de {total} completados
            </Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.progressPct, { color: c.accent }]}>{pct}%</Text>
          </View>
          <View style={[st.track, { backgroundColor: c.track }]}>
            <View style={[st.fill, { width: `${pct}%`, backgroundColor: c.accent }]} />
          </View>

          <ScrollView style={st.list} contentContainerStyle={{ paddingBottom: 4 }}>
            {current?.own.map((x) => (
              <View key={x.key} style={[st.row, { backgroundColor: c.rowBg }]}>
                <Ionicons
                  name={x.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={x.done ? c.ok : c.muted}
                />
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.rowLabel, { color: x.done ? c.muted : c.title }]}>{x.label}</Text>
              </View>
            ))}
            {current && !current.complete && (
              <TouchableOpacity
                style={[st.stageBtn, { backgroundColor: c.accent }]}
                onPress={() => goTo(current.def.target)}
                activeOpacity={0.8}
              >
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.rowBtnText, { color: c.onAccent }]}>{current.def.button}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {isDriver && (
            <TouchableOpacity
              style={[st.supportBtn, { borderColor: c.border }]}
              onPress={() => goTo('Soporte')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={c.accent} />
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.supportText, { color: c.accent }]}>Contactar soporte</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={st.closeBtn} onPress={() => setVisible(false)} activeOpacity={0.7}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[st.closeText, { color: c.muted }]}>{closeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const st = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6, flexShrink: 0 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 14, fontWeight: '700' },
  progressPct: { fontSize: 14, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  fill: { height: 8, borderRadius: 4 },
  list: { flexGrow: 0, flexShrink: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 10,
    minHeight: 44,
    flexShrink: 0,
  },
  rowLabel: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  stagesRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stage: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 8, paddingHorizontal: 8 },
  stageHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stageLabel: { flex: 1, fontSize: 12, fontWeight: '800' },
  stageState: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  stageCount: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  stageBtn: { borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 4, flexShrink: 0 },
  rowBtn: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  rowBtnText: { fontSize: 12, fontWeight: '800' },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 6,
  },
  supportText: { fontSize: 14, fontWeight: '700' },
  closeBtn: { alignItems: 'center', paddingTop: 12, paddingBottom: 2 },
  closeText: { fontSize: 14, fontWeight: '700' },
});

export default OnboardingModal;
