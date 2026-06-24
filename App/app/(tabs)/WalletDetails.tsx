import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
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
  const profile = useSelector((state: RootState) => state.auth.profile);
  const walletHistory = useSelector(selectWalletHistory);
  const walletLoading = useSelector(selectWalletLoading);
  const memberships = useSelector(
    (state: RootState) => state.memberships.memberships
  );
  const isLoadingMemberships = useSelector(selectMembershipLoading);
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector(selectSettings);

  // FK: memberships.conductor → auth.users(id). Probamos auth_id primero
  // y caemos a users.id por compatibilidad con datos legacy.
  const driverIdCandidates = useMemo(
    () =>
      Array.from(
        new Set(
          [profile?.auth_id, (user as any)?.auth_id, profile?.id, user?.id, (user as any)?.uid]
            .map((v) => (v ? String(v) : ''))
            .filter(Boolean),
        ),
      ),
    [profile?.auth_id, profile?.id, (user as any)?.auth_id, user?.id, (user as any)?.uid],
  );
  const driverConductorId = driverIdCandidates[0];
  

  const glowAnimRef = useRef({
    glow1: new Animated.Value(0),
    glow2: new Animated.Value(0),
    glow3: new Animated.Value(0),
    shineAnim: new Animated.Value(0),
  }).current;

  const { glow1, glow2, glow3, shineAnim } = glowAnimRef;

  useEffect(() => {
    dispatch(listenToSettingsChanges());
  }, [dispatch]);

  // 📡 Cargar datos iniciales
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWalletHistory(user?.id));
    }
    if (driverConductorId) {
      // Un único fetch con el id canónico (igual que index.tsx). Disparar uno
      // por cada candidato sobrescribe state.memberships y borra la membresía
      // activa cuando el último candidato no tiene filas.
      dispatch(fetchMemberships(driverConductorId));
    }
  }, [dispatch, user?.id, driverConductorId]);

  // 🔄 Configurar Realtime listener solo cuando la pantalla está enfocada
  useFocusEffect(
    React.useCallback(() => {
      if (!driverConductorId) return;

      const channel = supabase
        .channel(`memberships-${driverConductorId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'memberships',
            filter: `conductor=eq.${driverConductorId}`,
          },
          () => {
            dispatch(fetchMemberships(driverConductorId));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [driverConductorId, dispatch])
  );

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

  // 🎯 Filtrar por candidatos de conductor para no confundir membresías de otro id
  // (fetchMemberships sobrescribe state.memberships con el último candidato consultado).
  const activeMembership = useMemo(() => {
    if (!memberships || memberships.length === 0) return null;
    const mine = memberships.filter((m: any) =>
      driverIdCandidates.includes(String(m.conductor))
    );
    const list = mine.length > 0 ? mine : memberships;
    return (
      list.find((m: any) => m?.status?.toString().toUpperCase() === 'ACTIVA') ||
      list[0] ||
      null
    );
  }, [memberships, driverIdCandidates]);

  const daysRemaining = useMemo(
    () =>
      activeMembership
        ? calculateDaysRemaining(activeMembership.fecha_terminada)
        : 0,
    [activeMembership]
  );

  const walletBalance = user?.walletBalance || 0;
  const hasHistory = Array.isArray(walletHistory) && walletHistory.length > 0;

  // 🟢 Memoizar el estado de membresía
  const { membershipStatus, expiryDate, startDate, renewalText } = useMemo(() => {
    let status = "❌ Sin datos";

    if (activeMembership) {
      const estado = activeMembership.status?.toUpperCase();

      if (estado === 'ACTIVA' && daysRemaining > 0) {
        status = "✅ ACTIVA";
      } else if (estado === 'ACTIVA' && daysRemaining <= 0) {
        status = "⏰ VENCIDA";
      } else if (estado === 'PENDIENTE') {
        status = "⏳ PENDIENTE";
      } else if (estado === 'CANCELADA') {
        status = "❌ CANCELADA";
      } else {
        status = `${estado}`;
      }
    }

    const expiry = activeMembership?.fecha_terminada
      ? format(new Date(activeMembership.fecha_terminada), "dd/MM/yyyy")
      : "-- / --";

    const start = activeMembership?.fecha_inicio
      ? format(new Date(activeMembership.fecha_inicio), "dd/MM/yyyy")
      : "-- / --";

    const renewal = activeMembership && daysRemaining > 0
      ? `Te quedan ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'} de membresía`
      : activeMembership?.status === 'PENDIENTE'
      ? "Tu membresía está pendiente de activación"
      : "No tienes membresía registrada. Adquiere una para poder aceptar servicios.";

    return { membershipStatus: status, expiryDate: expiry, startDate: start, renewalText: renewal };
  }, [activeMembership, daysRemaining]);

  const shineX = useMemo(
    () =>
      shineAnim.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [-320, -320, 420],
      }),
    [shineAnim]
  );

  const cardGlowOpacity = useMemo(
    () =>
      glow1.interpolate({
        inputRange: [0, 1],
        outputRange: [0.16, 0.28],
      }),
    [glow1]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#D9F6FF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Mi Billetera</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => Linking.openURL("https://wa.me/573118841054")}
        >
          <MaterialIcons name="help" size={22} color="#00E5FF" />
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

            {activeMembership ? (
              <>
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
              </>
            ) : (
              <View style={styles.noMembershipSection}>
                <Ionicons name="information-circle-outline" size={32} color="#FF6B6B" />
                <Text style={styles.noMembershipText}>No tienes una membresía activa</Text>
                <Text style={styles.noMembershipSubtext}>Debes adquirir una membresía para poder aceptar y completar servicios en T+Plus.</Text>
                <TouchableOpacity
                  style={styles.ctaMini}
                  onPress={() => Linking.openURL("https://mpago.li/12iuk56")}
                >
                  <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.ctaMiniText}>Obtener Membresía</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {activeMembership ? (
          <View style={styles.supportBannerHighlight}>
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
              <Ionicons name="alert-circle-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.alertTextWrap}>
              <Text style={styles.alertTitle}>❌ Sin Membresía Activa</Text>
              <Text style={styles.alertSub}>No tienes una membresía registrada. Para poder aceptar servicios, necesitas adquirir una membresía.</Text>
            </View>
            <TouchableOpacity
              style={styles.renewMiniBtn}
              onPress={() => Linking.openURL("https://mpago.li/12iuk56")}
            >
              <Text style={styles.renewMiniBtnText}>Obtener</Text>
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

  // 🔴 SECCIÓN SIN MEMBRESÍA
  noMembershipSection: {
    marginTop: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,229,255,0.12)",
  },
  noMembershipText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B6B",
    textAlign: "center",
  },
  noMembershipSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  ctaMini: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaMiniText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});

export default WalletDetails;

