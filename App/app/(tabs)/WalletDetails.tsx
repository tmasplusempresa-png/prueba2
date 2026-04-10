import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome, Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/common/store";
import { format, differenceInDays } from "date-fns";
import {
  fetchWalletHistory,
  selectWalletHistory,
  selectWalletLoading,
} from "@/common/reducers/walletSlice";
import {
  fetchMemberships,
  selectMembershipLoading,
} from "@/common/reducers/membershipSlice";
import { listenToSettingsChanges, selectSettings } from "@/common/reducers/settingsSlice";
import { supabase } from "@/config/SupabaseConfig";

type Props = NativeStackScreenProps<any>;

const WalletDetails = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const walletHistory = useSelector(selectWalletHistory);
  const walletLoading = useSelector(selectWalletLoading);
  const memberships = useSelector(
    (state: RootState) => state.memberships.memberships
  );
  const isLoadingMemberships = useSelector(selectMembershipLoading);
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector(selectSettings);
  
  // 🔄 Estado local para actualizar en tiempo real
  const [realtimeMemberships, setRealtimeMemberships] = useState<any[]>([]);
  const [membershipRefresh, setMembershipRefresh] = useState(false);

  const glow1 = useRef(new Animated.Value(0)).current;
  const glow2 = useRef(new Animated.Value(0)).current;
  const glow3 = useRef(new Animated.Value(0)).current;
  // Orb animation - Comentado: El círculo del orb no se está usando en la interfaz
  // const orbRotate = useRef(new Animated.Value(0)).current; // Orb animation not used
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(listenToSettingsChanges());
  }, [dispatch]);

  // 📡 CARGAR MEMBRESÍAS Y CONFIGURAR LISTENER EN TIEMPO REAL
  useEffect(() => {
    if (user?.id) {
      console.log('👤 [WalletDetails] Usuario actual:', {
        uid: user?.id,
        email: (user as any)?.email,
      });
      
      // Cargar historial
      dispatch(fetchWalletHistory(user?.id));
      
      // Cargar membresías desde Redux
      console.log('📡 [WalletDetails] Haciendo dispatch de fetchMemberships con UID:', user?.id);
      dispatch(fetchMemberships(user?.id));
      
      // 🔄 Configurar Realtime listener para membresías (CON TIMEOUT)
      console.log('📡 [WalletDetails] Subscribiendo a cambios en memberships para:', user.id);
      
      const channel = supabase
        .channel(`memberships-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'memberships',
            filter: `conductor=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔔 [Realtime] Cambio detectado en memberships:', payload);
            setMembershipRefresh(!membershipRefresh); // Trigger re-render
            // Re-cargar desde BD (asíncrono, no bloquea)
            dispatch(fetchMemberships(user.id));
          }
        )
        .subscribe((status) => {
          console.log('📡 [Realtime] Estado de suscripción:', status);
        });
      
      // Cleanup
      return () => {
        console.log('🧹 [WalletDetails] Limpiando suscripción de Realtime');
        supabase.removeChannel(channel);
      };
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow1, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow2, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow3, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow3, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();


    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [glow1, glow2, glow3, shineAnim]);

  const calculateDaysRemaining = (endDate: string | Date | undefined) => {
    if (!endDate) return 0;
    try {
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
      return differenceInDays(end, new Date());
    } catch (e) {
      console.error('Error calculando días restantes:', e);
      return 0;
    }
  };

  // 🎯 Usar membresías del Redux (ya están en tiempo real con fetchMemberships)
  const activeMembership = memberships && memberships.length > 0 
    ? memberships[0] // Tomar la más reciente
    : null;

  console.log('📊 [WalletDetails] Membresía actual:', activeMembership);

  const daysRemaining = activeMembership
    ? calculateDaysRemaining(activeMembership.fecha_terminada)
    : 0;

  // ✅ NO bloquear la UI si está cargando - permitir ver datos parciales mientras se carga
  // if (walletLoading || isLoadingMemberships) return <Text>Loading...</Text>;

  const walletBalance = user?.walletBalance || 0;
  const hasHistory = Array.isArray(walletHistory) && walletHistory.length > 0;
  const latestHistory = hasHistory ? walletHistory[walletHistory.length - 1] : null;
  
  // 🟢 DETERMINAR ESTADO REAL DE LA MEMBRESÍA
  let membershipStatus = "❌ Sin datos";
  let statusColor = "#E91E63";
  
  if (activeMembership) {
    const estado = activeMembership.status?.toUpperCase();
    const diasRestantes = daysRemaining;
    
    if (estado === 'ACTIVA' && diasRestantes > 0) {
      membershipStatus = "✅ ACTIVA";
      statusColor = "#4CAF50";
    } else if (estado === 'ACTIVA' && diasRestantes <= 0) {
      membershipStatus = "⏰ VENCIDA";
      statusColor = "#00E5FF";
    } else if (estado === 'PENDIENTE') {
      membershipStatus = "⏳ PENDIENTE";
      statusColor = "#2196F3";
    } else if (estado === 'CANCELADA') {
      membershipStatus = "❌ CANCELADA";
      statusColor = "#E91E63";
    } else {
      membershipStatus = `${estado}`;
      statusColor = "#9C27B0";
    }
  }
  
  const expiryDate = activeMembership?.fecha_terminada
    ? format(new Date(activeMembership.fecha_terminada), "dd/MM/yyyy")
    : "-- / --";
    
  const startDate = activeMembership?.fecha_inicio
    ? format(new Date(activeMembership.fecha_inicio), "dd/MM/yyyy")
    : "-- / --";

  const renewalText = activeMembership && daysRemaining > 0
    ? `Te quedan ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'} de membresía`
    : activeMembership?.status === 'PENDIENTE'
    ? "Tu membresía está pendiente de activación"
    : "Necesita renovar su suscripción";

  // const orbSpin = orbRotate.interpolate({ ... }); // Not used

  const shineX = shineAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [-320, -320, 420],
  });

  const cardGlowOpacity = glow1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.28],
  });

  return (
    <View style={styles.container}>
      {/* Eliminado: elipses/círculos de fondo (walletGlowOne, walletGlowTwo, walletGlowThree, walletOrb, walletOrbInner) */}

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#D9F6FF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Mi Billetera</Text>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => Linking.openURL("https://wa.me/573118841054")}
        >
          <MaterialIcons name="settings" size={22} color="#00E5FF" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardWrap}>
          <View style={styles.membershipCard}>
            <Animated.View style={[styles.cardShine, { transform: [{ translateX: shineX }] }]} />
            <View style={styles.cardTopRow}>
              <View style={styles.cardLogoWrap}>
                <Image
                  source={require("@/assets/images/logo-Preview-Photoroom.png")}
                  style={styles.cardLogo}
                />
              </View>
              <View
                style={[
                  styles.statusPill,
                  activeMembership?.status === 'ACTIVA' && daysRemaining > 0 ? styles.statusPillActive : styles.statusPillExpired,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    activeMembership?.status === 'ACTIVA' && daysRemaining > 0 ? styles.statusDotActive : styles.statusDotExpired,
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    activeMembership?.status === 'ACTIVA' && daysRemaining > 0 ? styles.statusPillTextActive : styles.statusPillTextExpired,
                  ]}
                >
                  {membershipStatus}
                </Text>
              </View>
            </View>

            {/* 🎯 MOSTRAR DÍAS RESTANTES DESTACADO */}
            {activeMembership && (
              <View style={[
                styles.daysRemainBox,
                daysRemaining > 7 ? styles.daysRemainBoxGreen :
                daysRemaining > 0 ? styles.daysRemainBoxYellow :
                styles.daysRemainBoxRed
              ]}>
                <Text style={styles.daysRemainLabel}>DÍAS RESTANTES</Text>
                <Text style={styles.daysRemainValue}>{Math.max(daysRemaining, 0)}</Text>
              </View>
            )}

            {/* 🔄 INDICADOR DE LOADING */}
            {isLoadingMemberships && !activeMembership && (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="large" color="#00E5FF" />
                <Text style={styles.loadingText}>Cargando membresía...</Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardFooterLabel}>Membresia</Text>
                <Text style={styles.cardFooterValue}>
                  Conductor {activeMembership?.status === 'ACTIVA' ? 'Premium' : 'Estándar'}
                </Text>
              </View>
              <View style={styles.cardFooterRight}>
                <Text style={styles.cardFooterLabel}>Vence</Text>
                <Text style={styles.cardFooterDate}>{expiryDate}</Text>
              </View>
            </View>

            {/* 📊 MOSTRAR MÁS DETALLES */}
            <View style={styles.cardDetailsRow}>
              <View style={styles.cardDetailItem}>
                <Text style={styles.cardDetailLabel}>Costo</Text>
                <Text style={styles.cardDetailValue}>${Number(activeMembership?.costo || 0).toLocaleString("es-CO")}</Text>
              </View>
              <View style={styles.cardDetailItem}>
                <Text style={styles.cardDetailLabel}>Inicio</Text>
                <Text style={styles.cardDetailValue}>{startDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {activeMembership ? (
          <View style={styles.supportBannerHighlight}>
            <Image
              source={require("@/assets/images/logo-Preview-Photoroom.png")}
              style={styles.supportBannerLogo}
            />
            <View style={styles.supportBannerContent}>
              <Text style={styles.supportBannerTitle}>¡Ya eres miembro!</Text>
              <Text style={styles.supportBannerSubtitle}>Necesitas ayuda? Contáctanos</Text>
            </View>
            <TouchableOpacity
              style={styles.supportBannerBtn}
              onPress={() => Linking.openURL("https://wa.me/573118841054")}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.alertBanner}>
            <View style={styles.alertIconWrap}>
              <Ionicons name="warning-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.alertTextWrap}>
              <Text style={styles.alertTitle}>Membresia por Vencer</Text>
              <Text style={styles.alertSub}>{renewalText}</Text>
            </View>
            <TouchableOpacity
              style={styles.renewMiniBtn}
              onPress={() => Linking.openURL("https://mpago.li/12iuk56")}
            >
              <Text style={styles.renewMiniBtnText}>Renovar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsRow}>
          {/* Viajes - Comentado: Se quitó esta métrica de la interfaz */}
          {/* <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="car-sport-outline" size={18} color="#00E5FF" />
            </View>
            <Text style={styles.statValue}>{walletHistory?.length || 0}</Text>
            <Text style={styles.statLabel}>Viajes</Text>
          </View> */}

          {/* Ganado/Día - Comentado: Se quitó esta métrica de la interfaz */}
          {/* <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="cash-outline" size={18} color="#00E5FF" />
            </View>
            <Text style={styles.statValue}>
              ${activeMembership && activeMembership.periodo ? Number(walletBalance / activeMembership.periodo || 0).toLocaleString("es-CO") : 0}
            </Text>
            <Text style={styles.statLabel}>Ganado/Día</Text>
          </View> */}

          {/* Rating - Comentado: Se quitó esta métrica de la interfaz */}
          {/* <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="star-outline" size={18} color="#00E5FF" />
            </View>
            <Text style={styles.statValue}>5.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View> */}
        </View>

        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={styles.ctaMain}
            onPress={() => Linking.openURL("https://mpago.li/12iuk56")}
          >
            <Ionicons name="refresh-outline" size={20} color="#051A26" />
            <Text style={styles.ctaMainText}>Renovar Membresia</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.packagesWrap}>
        {[
          ...(settings.Membership
            ? [{ icon: "local-offer", text: "Membresía", mode: "membership" }]
            : []),
          ...(user && user?.cartype === "TREAS-X" && settings.KilimetrsWallet
            ? [{ icon: "road", text: "Kilómetros", mode: "kms" }]
            : []),
        ].map(({ icon, text, mode }, idx) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.packageBtn,
              idx === 1 && { marginTop: 10 },
            ]}
            onPress={() => navigation.navigate("ChosePlan", { mode })}
          >
            {icon === "local-offer" ? (
              <MaterialIcons name={icon} size={24} color="white" />
            ) : (
              <FontAwesome name={icon} size={24} color="white" />
            )}
            <Text style={styles.packageBtnText}>
              Paquete {text}
            </Text>
          </TouchableOpacity>
        ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#051A26",
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  walletGlowOne: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#00E5FF",
    top: -80,
    right: -80,
    opacity: 0.2,
  },
  walletGlowTwo: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#00b0ff",
    left: -80,
    bottom: "18%",
    opacity: 0.18,
  },
  walletGlowThree: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(0,229,255,0.65)",
    left: "50%",
    top: "45%",
    marginLeft: -90,
    marginTop: -90,
    opacity: 0.1,
  },
  walletOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: "20%",
    right: -60,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletOrbInner: {
    width: 155,
    height: 155,
    borderRadius: 77.5,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "rgba(5,26,38,0.75)",
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(10,46,61,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  cardWrap: {
    marginTop: 10,
    marginBottom: 14,
  },
  membershipCard: {
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    width: "100%",
    backgroundColor: "rgba(0, 55, 84, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.28)",
    overflow: "hidden",
  },
  cardShine: {
    position: "absolute",
    top: -20,
    width: 140,
    height: 300,
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ rotate: "-20deg" }],
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLogoWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cardLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  cardLogoMain: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    backgroundColor: "rgba(0,229,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.32)",
    gap: 6,
  },
  statusPillExpired: {
    backgroundColor: "transparent",
    borderColor: "#FFFFFF",
  },
  statusPillActive: {
    backgroundColor: "rgba(76, 175, 80, 0.14)",
    borderColor: "rgba(76, 175, 80, 0.32)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#00E5FF",
  },
  statusDotExpired: {
    backgroundColor: "#FFFFFF",
  },
  statusDotActive: {
    backgroundColor: "#4CAF50",
  },
  statusPillText: {
    color: "#00E5FF",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusPillTextExpired: {
    color: "#FFFFFF",
  },
  statusPillTextActive: {
    color: "#4CAF50",
  },
  daysRemainBox: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  daysRemainBoxGreen: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "#4CAF50",
  },
  daysRemainBoxYellow: {
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    borderColor: "#00E5FF",
  },
  daysRemainBoxRed: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderColor: "#E91E63",
  },
  daysRemainLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  daysRemainValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#00E5FF",
  },
  cardDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,229,255,0.12)",
  },
  cardDetailItem: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.38)",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardDetailValue: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,229,255,0.16)",
    paddingTop: 12,
  },
  cardFooterRight: {
    alignItems: "flex-end",
  },
  cardFooterLabel: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    textTransform: "uppercase",
  },
  cardFooterValue: {
    color: "#00E5FF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  cardFooterDate: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  alertBanner: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  alertSub: {
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
    fontSize: 12,
  },
  renewMiniBtn: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  renewMiniBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 8,
    backgroundColor: "rgba(10,46,61,0.6)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    alignItems: "center",
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,229,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 17,
    textAlign: "center",
  },
  statLabel: {
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    textTransform: "uppercase",
  },
  ctaWrap: {
    marginBottom: 14,
  },
  ctaMain: {
    borderRadius: 22,
    backgroundColor: "#00E5FF",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaMainText: {
    color: "#051A26",
    fontWeight: "800",
    fontSize: 16,
  },
  packagesWrap: {
    paddingBottom: 24,
  },
  packageBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(0,229,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  packageBtnText: {
    color: "#E8FCFF",
    fontWeight: "700",
    fontSize: 14,
  },
  
  // 🔄 LOADING SECTION
  loadingSection: {
    marginTop: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,229,255,0.12)",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "rgba(0,229,255,0.8)",
    fontWeight: "500",
  },
  
  // 🎨 BANNER DE SOPORTE MEJORADO
  supportBannerHighlight: {
    marginHorizontal: 4,
    marginVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(0,229,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(0,229,255,0.35)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  supportBannerLogo: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
  supportBannerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  supportBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00E5FF",
    marginBottom: 2,
  },
  supportBannerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  supportBannerBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(37,211,102,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.35)",
  },
});

export default WalletDetails;

