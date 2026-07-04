import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useIsFocused } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import supabase, { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/SupabaseConfig";
import { RootState } from "@/common/store";
import { settings } from "@/scripts/settings";
import { logout } from "@/common/reducers/authReducer";
import { AppConfig } from "@/config/AppConfig";
import { getDriverOwnReferralCode, DriverReferralCode } from "@/common/services/referralsService";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

type Props = NativeStackScreenProps<any>;

type PickerItem = {
  key: string;
  label: string;
  onPress: () => void;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  isSOS?: boolean;
};

const ITEM_H = 44;
const PICKER_H = 280;
const PICKER_PAD = (PICKER_H - ITEM_H) / 2;
const BG_IMAGE = require("../../assets/images/bg.png");

const ProfileScreen = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const profile = useSelector((state: RootState) => state.auth.profile) as any;
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [dbProfile, setDbProfile] = useState<{
    firstName: string | null;
    lastName: string | null;
    mobile: string | null;
    documentType: string | null;
    documentNumber: string | null;
    userType: string | null;
    referredByCode: string | null;
    referralId: string | null;
    rating: number | null;
  }>({
    firstName: null,
    lastName: null,
    mobile: null,
    documentType: null,
    documentNumber: null,
    userType: null,
    referredByCode: null,
    referralId: null,
    rating: null,
  });
  // Código de referido PROPIO (AAA-XXXXX) + conteo. null = aún generándose.
  const [ownReferral, setOwnReferral] = useState<DriverReferralCode | null>(null);
  const pickerRef = useRef<ScrollView>(null);
  const currentUserType = String(
    dbProfile.userType ||
      user?.usertype ||
      user?.user_type ||
      user?.userType ||
      user?.user_metadata?.usertype ||
      user?.user_metadata?.user_type ||
      "customer"
  )
    .trim()
    .toLowerCase();

  useEffect(() => {
    if (!isFocused) return;

    let cancelled = false;
    const controller = new AbortController();

    const fetchProfileData = async () => {
      const authId = user?.id || user?.auth_id;
      if (!authId) {
        if (!cancelled) setDbProfile({ firstName: null, lastName: null, mobile: null, documentType: null, documentNumber: null, userType: null, referredByCode: null, referralId: null, rating: null });
        return;
      }

      try {
        const url = `${SUPABASE_URL}/rest/v1/users?or=(auth_id.eq.${encodeURIComponent(authId)},id.eq.${encodeURIComponent(authId)})&select=first_name,last_name,mobile,document_type,document_number,user_type,referred_by_code,referral_id,rating&limit=1`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (cancelled) return;
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const p = data[0];
          if (!cancelled) {
            setDbProfile({
              firstName: p.first_name || null,
              lastName: p.last_name || null,
              mobile: p.mobile || null,
              documentType: p.document_type || null,
              documentNumber: p.document_number || null,
              userType: p.user_type || null,
              referredByCode: p.referred_by_code || null,
              referralId: p.referral_id || null,
              rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : null,
            });
          }
        }
      } catch (e: any) {
        if (!cancelled && e?.name !== 'AbortError') {
          setDbProfile({ firstName: null, lastName: null, mobile: null, documentType: null, documentNumber: null, userType: null, referredByCode: null, referralId: null, rating: null });
        }
      }
    };

    const fetchOwnReferral = async () => {
      const authId = user?.id || user?.auth_id;
      if (!authId) {
        if (!cancelled) setOwnReferral(null);
        return;
      }
      const code = await getDriverOwnReferralCode(authId, controller.signal);
      if (!cancelled) setOwnReferral(code);
    };

    fetchProfileData();
    fetchOwnReferral();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [user?.id, user?.auth_id, isFocused]);

  const displayFirstName =
    dbProfile.firstName ||
    profile?.first_name ||
    profile?.firstName ||
    user?.first_name ||
    user?.firstName ||
    user?.user_metadata?.first_name ||
    user?.user_metadata?.firstName ||
    "Usuario";

  const displayLastName =
    dbProfile.lastName ||
    profile?.last_name ||
    profile?.lastName ||
    user?.last_name ||
    user?.lastName ||
    user?.user_metadata?.last_name ||
    user?.user_metadata?.lastName ||
    "";

  const displayPhone =
    dbProfile.mobile ||
    profile?.mobile ||
    user?.mobile ||
    user?.phone ||
    user?.user_metadata?.phone ||
    "+57 300 000 0000";

  const displayDocumentType =
    dbProfile.documentType ||
    (profile as any)?.document_type ||
    user?.user_metadata?.document_type ||
    null;

  const displayDocumentNumber =
    dbProfile.documentNumber ||
    (profile as any)?.document_number ||
    user?.user_metadata?.document_number ||
    null;

  const displayReferredBy =
    dbProfile.referredByCode ||
    (profile as any)?.referred_by_code ||
    user?.user_metadata?.referred_by_code ||
    null;

  const displayUserTypeLabel =
    currentUserType === 'driver'
      ? 'Conductor'
      : currentUserType === 'customer'
      ? 'Cliente'
      : currentUserType;

  const stopBackgroundLocation = async () => {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    tasks.forEach((task) => {
      if (task.taskName === "background-location-task") {
        Location.stopLocationUpdatesAsync("background-location-task");
      }
    });
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      if (user?.usertype === "driver") {
        await Promise.race([
          stopBackgroundLocation(),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          ),
        ]).catch(() => {});
      }
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise<{ error: Error }>(
        (resolve) => setTimeout(() => resolve({ error: new Error('timeout') }), 8000)
      );
      const { error } = await Promise.race([signOutPromise, timeoutPromise]);
      if (error && error.message !== 'timeout') throw error;
      dispatch(logout());
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      showAlert('error', 'Error', `No se pudo cerrar sesión: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const refer = useCallback(async () => {
    try {
      const authId = user?.id || user?.auth_id || profile?.auth_id;
      if (!authId) {
        console.error('[ProfileScreen] refer: No authId found');
        return;
      }

      // Compartimos el código PROPIO del usuario (AAA-XXXXX) — el de
      // referral_codes, NO users.referral_id (que es el de quien lo invitó).
      const own = ownReferral ?? (await getDriverOwnReferralCode(authId));
      if (own && !ownReferral) setOwnReferral(own);

      const firstName = displayFirstName || 'Usuario';
      const ownCode = own?.referralCode;

      if (!ownCode) {
        showAlert(
          'info',
          'Código en preparación',
          'Tu código de referido se está generando. Inténtalo de nuevo en unos momentos.'
        );
        return;
      }

      const message =
        settings.bonus > 0
          ? `🚗 Imagina que con un solo viaje ayudas a que un conductor lleve el 100% de su trabajo a casa.\n\nDescarga Gratis T+Plus en Ios o Android y regístrate según tu sistema operativo.\n\n🔒 Tendrás seguridad en cada viaje y los conductores recibirán el pago completo, apoyando a sus familias.\n\n💸 Además, recibe un incentivo en tu próximo viaje.\n\n🎟️ Código de referido: ${ownCode}\n\n👉 https://tmasplus.com — Seguridad para ti. Justo para ti... Justo para todos!`
          : `🚗 Imagina que con un solo viaje ayudas a que un conductor lleve el 100% de su trabajo a casa.\n\nDescarga Gratis T+Plus en Ios o Android y regístrate según tu sistema operativo.\n\n🔒 Tendrás seguridad en cada viaje y los conductores recibirán el pago completo, apoyando a sus familias.\n\n🎟️ Código de referido: ${ownCode}\n\n👉 https://tmasplus.com — Seguridad para ti. Justo para ti... Justo para todos!`;

      Share.share({ message });
    } catch (error) {
      console.error('[ProfileScreen] refer error:', error);
    }
  }, [user, profile, ownReferral, displayFirstName]);

  const sos = useCallback(() => {
    const emergencyNumber = "123";
    const callLink = Platform.OS === "android" ? `tel:${emergencyNumber}` : `telprompt:${emergencyNumber}`;
    Linking.openURL(callLink).catch(() => {
      showAlert('error', 'Error', 'No se pudo iniciar la llamada al 123.');
    });
  }, []);

  const benefits = useCallback(() => {
    Linking.openURL("https://tmasplus.com/beneficios").catch(() => {});
  }, []);

  const baseItems: PickerItem[] = useMemo(
    () => [
      { key: "profile-config", label: "Configuracion de perfil", icon: "settings-outline", onPress: () => navigation.navigate("Docs") },
      { key: "change-password", label: "Cambiar contraseña", icon: "lock-closed-outline", onPress: () => navigation.navigate("ChangePassword") },
      { key: "security-contact", label: "Contacto de seguridad", icon: "people-outline", onPress: () => navigation.navigate("SecurityContact") },
      { key: "shared-trip", label: "Viaje Compartido", icon: "navigate-outline", onPress: () => navigation.navigate("ReceiveLocation") },
      { key: "chat", label: "Chat con tmasplus", icon: "chatbubble-ellipses-outline", onPress: () => navigation.navigate("Soporte") },
      { key: "benefits", label: "Beneficios", icon: "gift-outline", onPress: benefits },
      { key: "share", label: "Comparte y gana", icon: "share-social-outline", onPress: refer },
      { key: "sos", label: "S.O.S Emergencia", icon: "warning-outline", onPress: sos, isSOS: true },
      { key: "complaints", label: "Quejas y reclamos", icon: "help-buoy-outline", onPress: () => navigation.navigate("Complain") },
    ],
    [benefits, navigation, refer, sos]
  );

  const items = useMemo(() => {
    const out = [...baseItems];
    if (currentUserType === "customer") {
      out.splice(1, 0, { key: "saved-places", label: "Mis lugares", icon: "location-outline", onPress: () => navigation.navigate("Search") });
    }
    if (currentUserType === "driver") {
      out.splice(1, 0, { key: "carnet", label: "Carnet", icon: "card-outline", onPress: () => navigation.navigate("Carnet") });
      out.splice(3, 0, { key: "my-vehicles", label: "Mis Vehiculos", icon: "car-outline", onPress: () => navigation.navigate("CarsScreen") });
      out.push({ key: "insurance", label: "Aseguradora", icon: "shield-checkmark-outline", onPress: () => navigation.navigate("Insurance") });
    }
    out.push({ key: "updates", label: "Ver actualizaciones", icon: "refresh-outline", onPress: () => navigation.navigate("Updates") });
    return out;
  }, [baseItems, currentUserType, navigation]);

  const onPickerScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));
      if (idx !== activeIndex) {
        setActiveIndex(idx);
      }
    },
    [activeIndex, items.length]
  );

  const selectAndRun = (index: number) => {
    setActiveIndex(index);
    pickerRef.current?.scrollTo({ y: index * ITEM_H, animated: true });
    setTimeout(() => items[index]?.onPress(), 90);
  };

  const goBackFromProfile = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("HomeScreen");
  };

  return (
    <View style={styles.container}>
      <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
      <View pointerEvents="none" style={styles.bgOverlay} />
      {/* Eliminado: círculos/ellipses de fondo (bgGlowTop y bgGlowBottom) */}

      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={goBackFromProfile} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={20} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentArea}>
        <View style={styles.userCard}>
          <View style={styles.avatarRing}>
            {(user as any)?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person-outline" size={28} color="#00E5FF" />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.profileName}>{`${displayFirstName} ${displayLastName}`.trim()}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => {
                const r = dbProfile.rating ?? 0;
                const filled = n <= Math.round(r);
                return (
                  <AntDesign
                    key={n}
                    name="star"
                    size={14}
                    color={filled ? "#FFD700" : "rgba(255,255,255,0.25)"}
                    style={{ marginRight: 2 }}
                  />
                );
              })}
              <Text style={styles.ratingText}>
                {dbProfile.rating !== null
                  ? `${dbProfile.rating.toFixed(1)} / 5`
                  : "Sin calificaciones"}
              </Text>
            </View>
            <Text style={styles.profilePhone}>{displayPhone}</Text>
            {displayUserTypeLabel ? (
              <View style={styles.profileBadgeRow}>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>{displayUserTypeLabel}</Text>
                </View>
              </View>
            ) : null}
            {displayDocumentType || displayDocumentNumber ? (
              <Text style={styles.profileMeta} numberOfLines={1}>
                {displayDocumentType ? `${displayDocumentType} ` : ''}
                {displayDocumentNumber || 'sin número'}
              </Text>
            ) : (
              <Text style={styles.profileMetaMuted}>Sin documento registrado</Text>
            )}
            {displayReferredBy ? (
              <Text style={styles.profileMetaMuted} numberOfLines={1}>
                Referido por: {displayReferredBy}
              </Text>
            ) : null}
            {ownReferral ? (
              <Text style={styles.profileMeta} numberOfLines={1}>
                Tu código: {ownReferral.referralCode} · {ownReferral.totalReferrals}{' '}
                {ownReferral.totalReferrals === 1 ? 'referido' : 'referidos'}
              </Text>
            ) : (
              <Text style={styles.profileMetaMuted} numberOfLines={1}>
                Generando tu código…
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("Docs")} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={18} color="#00E5FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.pickerContainer}>
          <View pointerEvents="none" style={styles.pickerOverlayTop} />
          <View pointerEvents="none" style={styles.pickerOverlayBottom} />
          <View pointerEvents="none" style={styles.pickerHighlightZone} />

          <ScrollView
            ref={pickerRef}
            style={styles.pickerScroll}
            contentContainerStyle={{ paddingVertical: PICKER_PAD }}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_H}
            decelerationRate="fast"
            onMomentumScrollEnd={onPickerScroll}
            onScroll={onPickerScroll}
            scrollEventThrottle={16}
          >
            {items.map((item, i) => {
              const isActive = i === activeIndex;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.pickerItem}
                  activeOpacity={0.8}
                  onPress={() => selectAndRun(i)}
                >
                  <View style={styles.pickerIconWrap}>
                    <Ionicons
                      name={item.icon}
                      size={isActive ? 20 : 18}
                      color={item.isSOS && isActive ? "#E91E63" : "#00E5FF"}
                      style={{ opacity: isActive ? 1 : 0.56 }}
                    />
                  </View>
                  <Text
                    style={[
                      styles.pickerText,
                      isActive && styles.pickerTextActive,
                      item.isSOS && isActive && styles.pickerTextSOS,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.logoutWrap}>
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleLogout}>
            <MaterialIcons name="logout" size={18} color="#FFFFFF" />
            <Text style={styles.logoutText}>{loading ? "Cerrando..." : "Cerrar sesion"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>
          RT {AppConfig.runtime_Version} V {AppConfig.ios_app_version} B {AppConfig.android_app_version}
        </Text>
      </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#051A26",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,26,38,0.84)",
  },
  bgGlowTop: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(0,229,255,0.08)",
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: 90,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(0,188,212,0.05)",
  },
  headerArea: {
    paddingTop: 58,
    paddingHorizontal: 24,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,229,255,0.08)",
    backgroundColor: "rgba(5,26,38,0.82)",
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.26)",
    backgroundColor: "rgba(0,229,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  contentArea: {
    position: "relative",
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  userCard: {
    marginTop: 20,
    marginBottom: 16,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.22)",
    backgroundColor: "rgba(10,46,61,0.56)",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    marginRight: 14,
    backgroundColor: "#00E5FF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 31,
    backgroundColor: "#0A2E3D",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  profilePhone: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "600",
  },
  profileBadgeRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  profileBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,229,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.28)",
  },
  profileBadgeText: {
    color: "#00E5FF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  profileMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "#B6D4E0",
    fontWeight: "600",
  },
  profileMetaMuted: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontStyle: "italic",
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.24)",
    backgroundColor: "rgba(0,229,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerContainer: {
    height: PICKER_H,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    backgroundColor: "#0D1117",
  },
  pickerOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "38%",
    zIndex: 4,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  pickerOverlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "38%",
    zIndex: 4,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  pickerHighlightZone: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: ITEM_H,
    marginTop: -ITEM_H / 2,
    zIndex: 3,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(0,229,255,0.22)",
    borderBottomColor: "rgba(0,229,255,0.22)",
    backgroundColor: "rgba(0,229,255,0.06)",
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    height: ITEM_H,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  pickerIconWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pickerText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 19,
    fontWeight: "500",
    letterSpacing: -0.25,
  },
  pickerTextActive: {
    color: "#00E5FF",
    fontSize: 22,
    fontWeight: "700",
  },
  pickerTextSOS: {
    color: "#E91E63",
  },
  logoutWrap: {
    marginTop: 20,
    marginHorizontal: 10,
  },
  logoutBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  versionText: {
    marginTop: 18,
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },
});

export default ProfileScreen;
