import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { RootState } from "@/common/store";
import { VEHICLE_RULES } from "@/common/utils/vehicleRules";

type Props = NativeStackScreenProps<any>;

const BG_IMAGE = require("../../assets/images/bg.png");
const FALLBACK_CAR_IMAGE = require("../../assets/images/iconos3d/12.png");

const CATEGORY_IMAGES: Record<string, any> = {
  "T+Plus Taxi": require("../../assets/images/categoryTaxi.png"),
  "T+Plus Van": require("../../assets/images/categoryVan.png"),
  "T+Plus Particular": require("../../assets/images/categoryParticular.png"),
  "T+Plus Especial": require("../../assets/images/categoryEspecial.png"),
};

const getCategoryImage = (carType?: string) => {
  if (carType && CATEGORY_IMAGES[carType]) {
    return CATEGORY_IMAGES[carType];
  }
  return FALLBACK_CAR_IMAGE;
};

import { SUPABASE_URL, SUPABASE_ANON_KEY, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

const REST_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

/** Mapea una fila de Supabase `cars` al formato que usa la UI */
const mapCarRow = (row: any) => ({
  id: row.id,
  driver_id: row.driver_id,
  vehicleMake: row.make || row.vehicle_make || '',
  vehicleModel: row.model || row.vehicle_model || '',
  vehicleNumber: row.plate || row.vehicle_number || '',
  vehicleColor: row.color || row.vehicle_color || '',
  // service_type es la columna canónica (actualizada por dashboard web).
  // features.carType queda como fallback legacy para vehículos no migrados.
  carType: row.service_type || row.features?.carType || '',
  car_image: row.car_image || null,
  active: row.is_active ?? false,
  vehicleFuel: row.fuel_type || '',
  vehicleCylinders: row.features?.vehicleCylinders || '',
  vehicleDoors: row.features?.vehicleDoors || '',
  vehicleMetalup: row.features?.vehicleMetalup || '',
  vehicleForm: row.features?.vehicleForm || '',
  vehicleNoMotor: row.features?.vehicleNoMotor || '',
  vehicleNoChasis: row.features?.vehicleNoChasis || '',
  vehicleNoVin: row.features?.vehicleNoVin || '',
  vehicleNoSerie: row.features?.vehicleNoSerie || '',
  vehiclePassengers: row.capacity?.toString() || '',
  vehicleLine: row.features?.vehicleLine || '',
  created_at: row.created_at,
});

/* ─── Componente animado para cada tarjeta ─── */
const AnimatedCard = ({ children, index, style }: { children: React.ReactNode; index: number; style?: any }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay: index * 100, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

const CarsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const isFocused = useIsFocused();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isVehicleActive, setIsVehicleActive] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('error');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info' | 'confirm', title: string, message: string, buttons?: AlertButton[]) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  // Animaciones header
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;

  const headerTopPadding = Platform.OS === "android" ? Math.max(insets.top, 10) + 8 : 10;
  const contentBottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 12) + 88 : insets.bottom + 100;
  const modalBottomPadding = insets.bottom + 20;

  const vehicleLimitReached = vehicles.length >= VEHICLE_RULES.MAX_VEHICLES_PER_DRIVER;

  /* ─── Resolver driver_id vía REST ─── */
  const resolveDriverId = useCallback(async (): Promise<string | null> => {
    const candidateIds = [user?.auth_id, user?.id, user?.user_id]
      .map((value: any) => String(value || "").trim())
      .filter((value: string, index: number, array: string[]) => value.length > 0 && array.indexOf(value) === index);

    if (candidateIds.length === 0) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const authHeaders = await getSupabaseAuthHeaders(true);

    try {
      // 1) Buscar coincidencia directa en users.id
      for (const candidateId of candidateIds) {
        if (!isUuid.test(candidateId)) continue;

        const byIdUrl = `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(candidateId)}&select=id&limit=1`;
        const byIdResp = await fetchWithTimeout(byIdUrl, { headers: authHeaders }, 12000);
        if (!byIdResp.ok) continue;
        const byIdData = await byIdResp.json();
        if (Array.isArray(byIdData) && byIdData.length > 0 && byIdData[0]?.id) {
          return byIdData[0].id;
        }
      }

      // 2) Si no existe, buscar por users.auth_id
      for (const candidateId of candidateIds) {
        if (!isUuid.test(candidateId)) continue;

        const byAuthUrl = `${SUPABASE_URL}/rest/v1/users?auth_id=eq.${encodeURIComponent(candidateId)}&select=id&limit=1`;
        const byAuthResp = await fetchWithTimeout(byAuthUrl, { headers: authHeaders }, 12000);
        if (!byAuthResp.ok) continue;
        const byAuthData = await byAuthResp.json();
        if (Array.isArray(byAuthData) && byAuthData.length > 0 && byAuthData[0]?.id) {
          return byAuthData[0].id;
        }
      }
    } catch (e: any) {
      console.warn('[CarsScreen] resolveDriverId error:', e?.message);
    }

    return null;
  }, [user?.id, user?.auth_id]);

  /* ─── Cargar vehículos del conductor ─── */
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const driverId = await resolveDriverId();
      if (!driverId) {
        setVehicles([]);
        setLoading(false);
        return;
      }

      const authHeaders = await getSupabaseAuthHeaders(true);
      const url = `${SUPABASE_URL}/rest/v1/cars?driver_id=eq.${encodeURIComponent(driverId)}&order=created_at.desc`;
      const resp = await fetchWithTimeout(url, { headers: authHeaders }, 15000);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      const mapped = Array.isArray(data) ? data.map(mapCarRow) : [];
      setVehicles(mapped);
    } catch (e: any) {
      const msg = e?.name === 'AbortError'
        ? 'Tiempo de espera agotado. Revisa tu conexión.'
        : (e?.message || 'Error desconocido');
      console.warn('[CarsScreen] Error cargando vehículos:', msg);
      setError(msg);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [resolveDriverId]);

  useEffect(() => {
    if (isFocused) {
      loadVehicles();
    }
  }, [isFocused, loadVehicles]);

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(heroScale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [headerOpacity, heroScale]);

  useEffect(() => {
    if (selectedCar) setIsVehicleActive(Boolean(selectedCar.active));
  }, [selectedCar]);

  const detailRows = useMemo(
    () => [
      { label: "Marca", value: selectedCar?.vehicleMake },
      { label: "Modelo", value: selectedCar?.vehicleModel },
      { label: "Color", value: selectedCar?.vehicleColor },
      { label: "Tipo de vehiculo", value: selectedCar?.carType },
      { label: "Linea", value: selectedCar?.vehicleLine },
      { label: "Carroceria", value: selectedCar?.vehicleMetalup },
      { label: "Cilindrada", value: selectedCar?.vehicleCylinders },
      { label: "Puertas", value: selectedCar?.vehicleDoors },
      { label: "Combustible", value: selectedCar?.vehicleFuel },
      { label: "Numero de serie", value: selectedCar?.vehicleNoSerie },
      { label: "Numero de motor", value: selectedCar?.vehicleNoMotor },
      { label: "Numero de chasis", value: selectedCar?.vehicleNoChasis },
      { label: "Numero de VIN", value: selectedCar?.vehicleNoVin },
      { label: "Placa", value: selectedCar?.vehicleNumber },
      { label: "Pasajeros", value: selectedCar?.vehiclePassengers },
    ],
    [selectedCar]
  );

  const navigateToCreateVehicle = () => navigation.navigate("CarsEdit");

  const openDetails = (car: any) => {
    setSelectedCar(car);
    setModalVisible(true);
  };

  /* ─── Eliminar vehículo vía REST ─── */
  const onDelete = async (car: any) => {
    if (!car?.id) return;

    showAlert('confirm', 'Eliminar vehículo', `¿Estás seguro de eliminar ${car.vehicleMake} ${car.vehicleModel} (${car.vehicleNumber})?`, [
      { text: 'Cancelar', style: 'cancel', onPress: () => setAlertVisible(false) },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setAlertVisible(false);
          setDeleting(true);
          try {
            const authHeaders = await getSupabaseAuthHeaders(true);
            const resp = await fetch(
              `${SUPABASE_URL}/rest/v1/cars?id=eq.${encodeURIComponent(car.id)}`,
              {
                method: 'DELETE',
                headers: { ...authHeaders, 'Prefer': 'return=representation' },
              }
            );
            if (!resp.ok) {
              const body = await resp.text();
              throw new Error(body || `HTTP ${resp.status}`);
            }
            // Cuando RLS bloquea el DELETE silenciosamente, Supabase responde 200/204
            // pero con 0 filas afectadas. Con Prefer=return=representation podemos
            // confirmar que sí se eliminó leyendo el body.
            const text = await resp.text();
            let deletedRows: any[] = [];
            try { deletedRows = text ? JSON.parse(text) : []; } catch {}
            if (!Array.isArray(deletedRows) || deletedRows.length === 0) {
              throw new Error('La base de datos rechazó la eliminación (sin permisos RLS o el vehículo ya no existe).');
            }
            setModalVisible(false);
            setSelectedCar(null);
            await loadVehicles();
          } catch (e: any) {
            showAlert('error', 'Error', `No se pudo eliminar: ${e?.message}`);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  /* ─── Activar / desactivar vehículo vía REST ─── */
  const toggleSwitch = async () => {
    if (!selectedCar?.id || toggling) return;

    setToggling(true);
    try {
      const driverId = selectedCar.driver_id || (await resolveDriverId());
      if (!driverId) throw new Error("No se pudo resolver el conductor");

      const authHeaders = await getSupabaseAuthHeaders(true);
      const writeHeaders = { ...authHeaders, 'Prefer': 'return=representation' };

      // Desactivar todos los vehículos del conductor
      await fetch(
        `${SUPABASE_URL}/rest/v1/cars?driver_id=eq.${encodeURIComponent(driverId)}`,
        {
          method: 'PATCH',
          headers: writeHeaders,
          body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
        }
      );

      // Activar solo el seleccionado (si lo estamos prendiendo)
      const newActive = !isVehicleActive;
      if (newActive) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/cars?id=eq.${encodeURIComponent(selectedCar.id)}`,
          {
            method: 'PATCH',
            headers: writeHeaders,
            body: JSON.stringify({ is_active: true, updated_at: new Date().toISOString() }),
          }
        );
      }

      // Actualizar datos del vehículo activo en la tabla users
      if (newActive) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(driverId)}`,
          {
            method: 'PATCH',
            headers: writeHeaders,
            body: JSON.stringify({
              vehicle_number: selectedCar.vehicleNumber || '',
              vehicle_make: selectedCar.vehicleMake || '',
              car_type: selectedCar.carType || '',
              car_image: selectedCar.car_image || '',
              updated_at: new Date().toISOString(),
            }),
          }
        );
      }

      setIsVehicleActive(newActive);
      await loadVehicles();
    } catch (e: any) {
      showAlert('error', 'Error', `No se pudo actualizar: ${e?.message}`);
    } finally {
      setToggling(false);
    }
  };

  /* ─── Conteo animado ─── */
  const countLabel = vehicles.length === 1 ? '1 vehículo' : `${vehicles.length} vehículos`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />

      <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
      <View pointerEvents="none" style={styles.bgOverlay} />
      <View pointerEvents="none" style={styles.bgGlowTop} />
      <View pointerEvents="none" style={styles.bgGlowBottom} />

      <Animated.View style={[styles.header, { paddingTop: headerTopPadding, opacity: headerOpacity }]}>        
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.84}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerEyebrow}>T+plus</Text>
          <Text style={styles.headerTitle}>Mis Vehiculos</Text>
        </View>

        <TouchableOpacity
          style={[styles.headerCreateBtn, vehicleLimitReached && { opacity: 0.38 }]}
          onPress={vehicleLimitReached ? undefined : navigateToCreateVehicle}
          activeOpacity={vehicleLimitReached ? 1 : 0.9}
        >
          <Ionicons name="add" size={18} color="#051A26" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ scale: heroScale }] }}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTag}>Crear Vehiculo</Text>
            <Text style={styles.heroTitle}>Tu acceso inteligente para conducir en T+plus</Text>
            <Text style={styles.heroText}>
              Administra tus vehiculos, activa el que usaras hoy y agrega uno nuevo cuando lo necesites.
            </Text>

            {vehicleLimitReached ? (
              <View style={styles.vehicleLimitBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#E91E63" />
                <Text style={styles.vehicleLimitBannerText}>
                  Límite alcanzado · {vehicles.length}/{VEHICLE_RULES.MAX_VEHICLES_PER_DRIVER} vehículos
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.heroButton} onPress={navigateToCreateVehicle} activeOpacity={0.88}>
                <Text style={styles.heroButtonText}>Añadir Vehiculo</Text>
                <Ionicons name="arrow-forward" size={16} color="#051A26" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Contador */}
        {!loading && vehicles.length > 0 && (
          <View style={styles.countRow}>
            <Ionicons name="car-sport" size={16} color="#00E5FF" />
            <Text style={styles.countText}>{countLabel} registrados</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.feedbackCard}>
            <ActivityIndicator color="#00E5FF" size="large" />
            <Text style={styles.feedbackText}>Cargando tus vehiculos...</Text>
          </View>
        ) : error ? (
          <View style={styles.feedbackCard}>
            <MaterialIcons name="error-outline" size={22} color="#E91E63" />
            <Text style={styles.feedbackText}>No fue posible cargar tus vehiculos.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadVehicles} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : vehicles.length > 0 ? (
          <View style={styles.vehicleList}>
            {vehicles.map((car: any, index: number) => (
              <AnimatedCard key={car.id || `v-${index}`} index={index} style={styles.vehicleCard}>
                <TouchableOpacity activeOpacity={0.92} onPress={() => openDetails(car)}>
                  <View style={styles.vehicleImageWrap}>
                    <Image
                      source={car?.car_image ? { uri: car.car_image } : getCategoryImage(car?.carType)}
                      style={styles.vehicleImage}
                      resizeMode="cover"
                    />
                    <View style={[styles.statusPill, car?.active ? styles.statusPillActive : styles.statusPillInactive]}>
                      <View style={[styles.statusDot, { backgroundColor: car?.active ? '#00E5FF' : 'rgba(255,255,255,0.4)' }]} />
                      <Text style={[styles.statusPillText, car?.active ? styles.statusPillTextActive : styles.statusPillTextInactive]}>
                        {car?.active ? "Activo" : "Inactivo"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleTitle}>{`${car?.vehicleMake || "Vehiculo"} ${car?.vehicleModel || ""}`.trim()}</Text>
                    <Text style={styles.vehicleSubtitle}>{car?.vehicleNumber || "Placa no disponible"}</Text>

                    <View style={styles.vehicleMetaRow}>
                      <View style={styles.vehicleMetaItem}>
                        <Ionicons name="speedometer-outline" size={14} color="rgba(255,255,255,0.5)" style={{ marginBottom: 4 }} />
                        <Text style={styles.vehicleMetaLabel}>Servicio</Text>
                        <Text style={styles.vehicleMetaValue}>{car?.carType || "No definido"}</Text>
                      </View>
                      <View style={styles.vehicleMetaItem}>
                        <Ionicons name="color-palette-outline" size={14} color="rgba(255,255,255,0.5)" style={{ marginBottom: 4 }} />
                        <Text style={styles.vehicleMetaLabel}>Color</Text>
                        <Text style={styles.vehicleMetaValue}>{car?.vehicleColor || "No definido"}</Text>
                      </View>
                      <View style={styles.vehicleMetaItem}>
                        <Ionicons name="flame-outline" size={14} color="rgba(255,255,255,0.5)" style={{ marginBottom: 4 }} />
                        <Text style={styles.vehicleMetaLabel}>Combustible</Text>
                        <Text style={styles.vehicleMetaValue}>{car?.vehicleFuel || "—"}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.vehicleActions}>
                    <TouchableOpacity style={styles.vehicleActionBtn} onPress={() => openDetails(car)} activeOpacity={0.85}>
                      <Ionicons name="eye-outline" size={18} color="#00E5FF" />
                      <Text style={styles.vehicleActionLabel}>Detalles</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.vehicleActionBtnDanger} onPress={() => onDelete(car)} activeOpacity={0.85}>
                      <Ionicons name="trash-outline" size={18} color="#E91E63" />
                      <Text style={styles.vehicleActionLabelDanger}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>
            ))}
          </View>
        ) : (
          <AnimatedCard index={0} style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="car-sport-outline" size={40} color="#00E5FF" />
            </View>
            <Text style={styles.emptyTitle}>Aun no has creado un vehiculo</Text>
            <Text style={styles.emptyText}>
              Usa la nueva opcion de Añadir Vehiculo para registrar tu carro y dejarlo listo para operar.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={navigateToCreateVehicle} activeOpacity={0.9}>
              <Text style={styles.emptyButtonText}>Crear Vehiculo</Text>
            </TouchableOpacity>
          </AnimatedCard>
        )}
      </ScrollView>

      {/* ─── Modal Detalles ─── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: modalBottomPadding }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Detalles</Text>
                <Text style={styles.modalTitle}>Vehiculo</Text>
              </View>

              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  style={styles.modalIconBtnDanger}
                  onPress={() => onDelete(selectedCar)}
                  activeOpacity={0.85}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#E91E63" />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="#E91E63" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalIconBtn} onPress={() => setModalVisible(false)} activeOpacity={0.85}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedCar && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <Image
                  source={selectedCar?.car_image ? { uri: selectedCar.car_image } : getCategoryImage(selectedCar?.carType)}
                  style={styles.modalVehicleImage}
                  resizeMode="cover"
                />

                {/* Info rápida dentro del modal */}
                <View style={styles.modalQuickInfo}>
                  <Text style={styles.modalCarName}>
                    {`${selectedCar?.vehicleMake || ''} ${selectedCar?.vehicleModel || ''}`.trim() || "Sin nombre"}
                  </Text>
                  <View style={styles.modalPlateBadge}>
                    <Text style={styles.modalPlateText}>{selectedCar?.vehicleNumber || 'Sin placa'}</Text>
                  </View>
                </View>

                <View style={styles.activeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeLabel}>Activar Vehiculo</Text>
                    <Text style={styles.activeHelp}>Solo un vehiculo puede quedar activo al mismo tiempo.</Text>
                  </View>
                  {toggling ? (
                    <ActivityIndicator color="#00E5FF" />
                  ) : (
                    <Switch
                      trackColor={{ false: "rgba(255,255,255,0.14)", true: "#00E5FF" }}
                      thumbColor={isVehicleActive ? "#051A26" : "#D6E4EA"}
                      ios_backgroundColor="rgba(255,255,255,0.14)"
                      onValueChange={toggleSwitch}
                      value={isVehicleActive}
                    />
                  )}
                </View>

                <View style={styles.detailList}>
                  {detailRows.map((row) =>
                    row.value ? (
                      <View key={row.label} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{row.label}</Text>
                        <Text style={styles.detailValue}>{row.value}</Text>
                      </View>
                    ) : null
                  )}
                </View>

                <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </Pressable>
              </ScrollView>
            )}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#051A26",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,26,38,0.83)",
  },
  bgGlowTop: {
    position: "absolute",
    top: -70,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0,229,255,0.08)",
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: 50,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(0,188,212,0.06)",
  },
  header: {
    position: "relative",
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00E5FF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerCreateBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00E5FF",
  },
  container: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    backgroundColor: "rgba(10,46,61,0.58)",
    padding: 22,
    marginBottom: 18,
    overflow: "hidden",
  },
  heroTag: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "800",
    color: "#051A26",
    backgroundColor: "#00E5FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: -0.6,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.74)",
    marginBottom: 18,
  },
  heroButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#051A26",
  },
  vehicleLimitBanner: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,167,38,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,167,38,0.38)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  vehicleLimitBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00E5FF",
  },
  feedbackCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10,46,61,0.5)",
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  feedbackText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    fontWeight: "600",
  },
  retryBtn: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: "rgba(0,229,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.22)",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00E5FF",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },
  vehicleList: {
    gap: 14,
  },
  vehicleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    backgroundColor: "rgba(10,46,61,0.54)",
    padding: 14,
  },
  vehicleImageWrap: {
    position: "relative",
    marginBottom: 14,
  },
  vehicleImage: {
    width: "100%",
    height: 170,
    borderRadius: 18,
  },
  statusPill: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillActive: {
    backgroundColor: "rgba(0,229,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.28)",
  },
  statusPillInactive: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusPillTextActive: {
    color: "#00E5FF",
  },
  statusPillTextInactive: {
    color: "#D6E4EA",
  },
  vehicleInfo: {
    marginBottom: 14,
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: "#00E5FF",
    fontWeight: "700",
    marginBottom: 12,
  },
  vehicleMetaRow: {
    flexDirection: "row",
    gap: 10,
  },
  vehicleMetaItem: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  vehicleMetaLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.52)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  vehicleMetaValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  vehicleActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  vehicleActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(0,229,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
  },
  vehicleActionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00E5FF",
  },
  vehicleActionBtnDanger: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,107,107,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.18)",
  },
  vehicleActionLabelDanger: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E91E63",
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    backgroundColor: "rgba(10,46,61,0.52)",
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    marginBottom: 18,
  },
  emptyButton: {
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#051A26",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  modalCard: {
    maxHeight: "88%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#082331",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(0,229,255,0.12)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00E5FF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  modalHeaderActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  modalIconBtnDanger: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,107,0.08)",
  },
  modalContent: {
    paddingBottom: 24,
  },
  modalVehicleImage: {
    width: "100%",
    height: 210,
    borderRadius: 20,
    marginBottom: 14,
  },
  modalQuickInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalCarName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    flex: 1,
  },
  modalPlateBadge: {
    borderRadius: 10,
    backgroundColor: "rgba(0,229,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.24)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalPlateText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#00E5FF",
    letterSpacing: 1,
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    marginBottom: 16,
    gap: 14,
  },
  activeLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  activeHelp: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    marginTop: 4,
    maxWidth: 220,
  },
  detailList: {
    gap: 10,
  },
  detailRow: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    paddingVertical: 14,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#051A26",
  },
});

export default CarsScreen;

