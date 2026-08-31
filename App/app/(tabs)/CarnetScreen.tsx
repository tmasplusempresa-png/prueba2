import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootState } from "@/common/store";
import { supabase } from "@/config/SupabaseConfig";

type Props = NativeStackScreenProps<any>;

const LEGAL_ACREDITACION =
  "Este carnet digital acredita al portador como cliente, miembro del club de beneficios, contratante, funcionario o Invitado de la compañía T+Plus SAS, lo cual le da derecho a utilizar todos los servicios y beneficios que la compañía disponga.";

const LEGAL_LEY527 =
  "Este documento electrónico cumple con los criterios de equivalencia funcional y requisitos jurídicos aplicables a los mensajes de datos consagrados en el Capítulo II de la Ley 527 de 1999.";

const BG_IMAGE = require("../../assets/images/bg.png");
const LOGO = require("@/assets/images/logo-Preview-Photoroom.png");

const CYAN = "#00E5FF";
const CYAN_DEEP = "#00B8D4";
const NAVY = "#042B3D";
const NAVY_DARK = "#051A26";

export function formatCarnetCity(city: string | null | undefined): string {
  const raw = String(city || "").trim();
  if (!raw || raw.toLowerCase() === "sin ciudad") return "Sin ciudad";
  if (/colombia/i.test(raw)) return raw;
  return `${raw}, Colombia`;
}

export function buildCarnetQrPayload(input: {
  fullName: string;
  roleLabel: string;
  documentType: string;
  documentNumber: string;
  email: string;
  city: string;
}): string {
  const identification =
    input.documentNumber && input.documentNumber !== "N/A"
      ? `${input.documentType} ${input.documentNumber}`.trim()
      : input.email;

  return [
    "T+PLUS CARNET",
    input.fullName,
    input.roleLabel,
    identification,
    input.email,
    input.city,
  ].join("\n");
}

type CarnetInfoRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
  testID?: string;
};

function CarnetInfoRow({ icon, children, testID }: CarnetInfoRowProps) {
  return (
    <View style={styles.infoRow} testID={testID}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={CYAN_DEEP} />
      </View>
      <View style={styles.infoTextWrap}>{children}</View>
    </View>
  );
}

function CardBodyDecorations() {
  return (
    <>
      <View style={[styles.bodyDecorRing, styles.bodyDecorRingSoft]} pointerEvents="none" />
      <View style={[styles.bodyDecorRing, styles.bodyDecorRingStrong]} pointerEvents="none" />
      <View style={[styles.bodyDecorCircleLg, styles.bodyDecorCircleCyan]} pointerEvents="none" />
      <View style={[styles.bodyDecorCircleLg, styles.bodyDecorCircleNavy]} pointerEvents="none" />
      <View style={[styles.bodyDecorCircleSm, styles.bodyDecorCircleBright]} pointerEvents="none" />
      <View style={[styles.bodyDecorCircleSm, styles.bodyDecorCircleMid]} pointerEvents="none" />
      <View style={[styles.bodyDecorArc, styles.bodyDecorArcStrong]} pointerEvents="none" />
      <View style={styles.bodyDecorDiamond} pointerEvents="none" />
      <View style={styles.bodyDecorPill} pointerEvents="none" />
      <Text style={[styles.bodyDecorPlus, styles.bodyDecorPlusA, styles.bodyDecorPlusStrong]} pointerEvents="none">
        +
      </Text>
      <Text style={[styles.bodyDecorPlus, styles.bodyDecorPlusB]} pointerEvents="none">
        +
      </Text>
      <Text style={[styles.bodyDecorPlus, styles.bodyDecorPlusC, styles.bodyDecorPlusStrong]} pointerEvents="none">
        +
      </Text>
      <Text style={[styles.bodyDecorPlus, styles.bodyDecorPlusD]} pointerEvents="none">
        +
      </Text>
      <View style={styles.bodyDecorDots} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bodyDecorDot,
              i % 3 === 0 ? styles.bodyDecorDotBright : i % 3 === 1 ? styles.bodyDecorDotMid : null,
            ]}
          />
        ))}
      </View>
      <View style={styles.bodyDecorDotsRight} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[styles.bodyDecorDot, styles.bodyDecorDotBright]} />
        ))}
      </View>
    </>
  );
}

function CarnetDecorations() {
  return (
    <>
      <View style={styles.decorRing} pointerEvents="none" />
      <View style={styles.decorCircleLg} pointerEvents="none" />
      <View style={styles.decorCircleSm} pointerEvents="none" />
      <Text style={[styles.decorPlus, styles.decorPlusA]} pointerEvents="none">
        +
      </Text>
      <Text style={[styles.decorPlus, styles.decorPlusB]} pointerEvents="none">
        +
      </Text>
      <Text style={[styles.decorPlus, styles.decorPlusC]} pointerEvents="none">
        +
      </Text>
      <View style={styles.decorDots} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.decorDot} />
        ))}
      </View>
    </>
  );
}

const CarnetScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const profileData: any = typeof profile === "object" && profile !== null ? profile : {};
  const isFocused = useIsFocused();
  const headerTopPadding = Platform.OS === "android" ? Math.max(insets.top, 10) + 8 : insets.top + 8;

  const [dbProfile, setDbProfile] = useState<{
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    vehicleCategory: string | null;
    documentType: string | null;
    documentNumber: string | null;
    city: string | null;
  }>({
    firstName: null,
    lastName: null,
    profileImage: null,
    vehicleCategory: null,
    documentType: null,
    documentNumber: null,
    city: null,
  });

  const userData: any = typeof user === "object" && user !== null ? user : {};
  const userTypeRaw = String(
    profileData?.user_type ||
      userData.usertype ||
      userData.user_type ||
      userData.userType ||
      userData.user_metadata?.usertype ||
      userData.user_metadata?.user_type ||
      userData.user_metadata?.userType ||
      ""
  )
    .trim()
    .toLowerCase();
  const isDriver = userTypeRaw === "driver";
  const roleLabel = isDriver ? "Conductor" : "Cliente";

  useEffect(() => {
    if (!isFocused) return;

    let cancelled = false;

    const fetchDbProfile = async () => {
      const authId = (userData?.id || userData?.auth_id || profile?.auth_id || profile?.id || "").toString();
      if (!authId) {
        if (!cancelled) {
          setDbProfile({
            firstName: null,
            lastName: null,
            profileImage: null,
            vehicleCategory: null,
            documentType: null,
            documentNumber: null,
            city: null,
          });
        }
        return;
      }

      try {
        await supabase.auth.getSession();

        const { data, error } = await supabase
          .from("users")
          .select("id, first_name, last_name, profile_image, car_type, document_type, document_number, city")
          .or(`auth_id.eq.${authId},id.eq.${authId}`)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          setDbProfile({
            firstName: null,
            lastName: null,
            profileImage: null,
            vehicleCategory: null,
            documentType: null,
            documentNumber: null,
            city: null,
          });
          return;
        }

        const row = data as any;
        let vehicleCategory: string | null = row?.car_type || null;

        if (isDriver && row?.id && !vehicleCategory) {
          try {
            const { data: carData } = await supabase
              .from("cars")
              .select("service_type, car_type, vehicle_type, category, features")
              .eq("driver_id", String(row.id))
              .limit(1)
              .maybeSingle();

            if (carData) {
              vehicleCategory =
                (carData as any)?.service_type ||
                (carData as any)?.car_type ||
                (carData as any)?.vehicle_type ||
                (carData as any)?.category ||
                (carData as any)?.features?.carType ||
                null;
            }
          } catch {
            // Keep null fallback when cars lookup fails.
          }
        }

        if (!cancelled) {
          setDbProfile({
            firstName: row?.first_name || null,
            lastName: row?.last_name || null,
            profileImage: row?.profile_image || null,
            vehicleCategory,
            documentType: row?.document_type || null,
            documentNumber: row?.document_number || null,
            city: row?.city || null,
          });
        }
      } catch {
        if (!cancelled) {
          setDbProfile({
            firstName: null,
            lastName: null,
            profileImage: null,
            vehicleCategory: null,
            documentType: null,
            documentNumber: null,
            city: null,
          });
        }
      }
    };

    fetchDbProfile();

    return () => {
      cancelled = true;
    };
  }, [isFocused, isDriver, profile?.auth_id, profile?.id, userData?.auth_id, userData?.id]);

  const displayFirstName = useMemo(
    () =>
      dbProfile.firstName ||
      profileData?.first_name ||
      profileData?.firstName ||
      userData?.first_name ||
      userData?.firstName ||
      userData?.user_metadata?.first_name ||
      userData?.user_metadata?.firstName ||
      "Usuario",
    [
      dbProfile.firstName,
      profileData?.firstName,
      profileData?.first_name,
      userData?.firstName,
      userData?.first_name,
      userData?.user_metadata?.firstName,
      userData?.user_metadata?.first_name,
    ]
  );

  const displayLastName = useMemo(
    () =>
      dbProfile.lastName ||
      profileData?.last_name ||
      profileData?.lastName ||
      userData?.last_name ||
      userData?.lastName ||
      userData?.user_metadata?.last_name ||
      userData?.user_metadata?.lastName ||
      "",
    [
      dbProfile.lastName,
      profileData?.lastName,
      profileData?.last_name,
      userData?.lastName,
      userData?.last_name,
      userData?.user_metadata?.lastName,
      userData?.user_metadata?.last_name,
    ]
  );

  const displayProfileImage = useMemo(
    () =>
      dbProfile.profileImage ||
      profileData?.profile_image ||
      userData?.profile_image ||
      userData?.photoURL ||
      userData?.user_metadata?.avatar_url ||
      null,
    [
      dbProfile.profileImage,
      profileData?.profile_image,
      userData?.photoURL,
      userData?.profile_image,
      userData?.user_metadata?.avatar_url,
    ]
  );

  const displayVehicleCategory = useMemo(() => {
    if (!isDriver) return null;

    const raw =
      dbProfile.vehicleCategory ||
      profileData?.car_type ||
      profileData?.carType ||
      userData?.car_type ||
      userData?.carType ||
      userData?.user_metadata?.car_type ||
      userData?.user_metadata?.carType ||
      null;

    if (!raw) return "No definido";

    const text = String(raw).trim();
    return text || "No definido";
  }, [
    dbProfile.vehicleCategory,
    isDriver,
    profileData?.car_type,
    profileData?.carType,
    userData?.car_type,
    userData?.carType,
    userData?.user_metadata?.car_type,
    userData?.user_metadata?.carType,
  ]);

  const displayDocumentType =
    dbProfile.documentType || profileData?.document_type || userData?.document_type || "N/A";
  const displayDocumentNumber =
    dbProfile.documentNumber || profileData?.document_number || userData?.document_number || "N/A";
  const displayEmail = user?.email || "No disponible";
  const displayCity = formatCarnetCity(
    dbProfile.city || profileData?.city || userData?.city || userData?.user_metadata?.city
  );
  const fullName = `${displayFirstName} ${displayLastName}`.trim();

  const qrPayload = useMemo(
    () =>
      buildCarnetQrPayload({
        fullName,
        roleLabel,
        documentType: displayDocumentType,
        documentNumber: displayDocumentNumber,
        email: displayEmail,
        city: displayCity,
      }),
    [
      displayCity,
      displayDocumentNumber,
      displayDocumentType,
      displayEmail,
      fullName,
      roleLabel,
    ]
  );

  const goBack = () => {
    if (typeof navigation.canGoBack === "function" && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("HomeScreen");
  };

  return (
    <View style={styles.container}>
      <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
      <View pointerEvents="none" style={styles.bgOverlay} />

      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity
          testID="back-button"
          style={styles.headerBackBtn}
          onPress={goBack}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={20} color={CYAN} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerEyebrow}>T+plus</Text>
          <Text style={styles.headerTitle}>Mi Carnet</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
      >
        <View style={styles.carnetCard}>
          <LinearGradient
            colors={[CYAN, CYAN_DEEP, NAVY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeader}
          >
            <CarnetDecorations />
            <View style={styles.floatingCarnetBadge}>
              <Ionicons name="ribbon-outline" size={20} color={NAVY} />
            </View>
            <View style={styles.cardHeaderContent}>
              <Image source={LOGO} style={styles.brandLogo} resizeMode="contain" />
              <Text style={styles.cardHeaderCaption}>Identificación digital oficial</Text>
            </View>
          </LinearGradient>

          <View style={styles.cardWave} pointerEvents="none" />

          <View style={styles.avatarWrap}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarRing}>
                {displayProfileImage ? (
                  <Image source={{ uri: displayProfileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons name="person" size={34} color={CYAN} />
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.cardBody}>
            <CardBodyDecorations />
            <Text style={styles.personName} numberOfLines={2}>
              {fullName}
            </Text>
            <LinearGradient
              colors={["#FFFFFF", "#E8FAFD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rolePill}
            >
              <View style={styles.rolePillInner}>
                <Ionicons
                  name={isDriver ? "car-sport-outline" : "person-circle-outline"}
                  size={14}
                  color={CYAN_DEEP}
                />
                <Text style={styles.rolePillText}>{roleLabel}</Text>
              </View>
            </LinearGradient>

            <View style={styles.infoBlock}>
              <CarnetInfoRow icon="mail-outline">
                <Text style={styles.infoValue} numberOfLines={2}>
                  {displayEmail}
                </Text>
              </CarnetInfoRow>

              <CarnetInfoRow icon="id-card-outline">
                <Text style={styles.infoValue}>
                  <Text>{displayDocumentType}</Text>
                  <Text style={styles.infoDivider}> · </Text>
                  <Text>{displayDocumentNumber}</Text>
                </Text>
              </CarnetInfoRow>

              <CarnetInfoRow icon="location-outline">
                <Text style={styles.infoValue}>{displayCity}</Text>
              </CarnetInfoRow>

              {isDriver && displayVehicleCategory ? (
                <CarnetInfoRow icon="car-outline" testID="vehicle-category-row">
                  <Text style={styles.infoValue}>{displayVehicleCategory}</Text>
                </CarnetInfoRow>
              ) : null}
            </View>

            <View style={styles.qrSection} testID="carnet-qr-section">
              <View style={styles.qrFrame}>
                <QRCode
                  value={qrPayload}
                  size={148}
                  color={NAVY_DARK}
                  backgroundColor="#FFFFFF"
                  quietZone={10}
                />
              </View>
              <Text style={styles.qrHint}>Escanea el QR para verificar identidad T+Plus</Text>
            </View>
          </View>

          <LinearGradient
            colors={[NAVY_DARK, NAVY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardFooter}
          >
            <View style={styles.legalStrip}>
              <Ionicons name="shield-checkmark" size={14} color={CYAN} />
              <Text style={styles.legalText}>{LEGAL_ACREDITACION}</Text>
            </View>
            <View style={styles.legalDivider} />
            <Text style={styles.legalTextSecondary}>{LEGAL_LEY527}</Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY_DARK,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,26,38,0.9)",
  },
  header: {
    paddingHorizontal: 20,
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
  headerTitleWrap: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: CYAN,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  carnetCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  cardHeader: {
    height: 118,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 14,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  cardHeaderContent: {
    alignItems: "center",
    zIndex: 2,
  },
  floatingCarnetBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    shadowColor: NAVY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  brandLogo: {
    width: 118,
    height: 50,
    tintColor: "#FFFFFF",
  },
  cardHeaderCaption: {
    marginTop: 2,
    color: "rgba(255,255,255,0.95)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  decorRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
    top: -50,
    right: -40,
  },
  decorCircleLg: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: 18,
    left: -28,
  },
  decorCircleSm: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
    bottom: 24,
    right: 28,
  },
  decorPlus: {
    position: "absolute",
    color: "rgba(255,255,255,0.35)",
    fontSize: 22,
    fontWeight: "300",
  },
  decorPlusA: {
    top: 22,
    right: 52,
    fontSize: 18,
  },
  decorPlusB: {
    bottom: 30,
    left: 36,
    fontSize: 26,
  },
  decorPlusC: {
    top: 48,
    left: 78,
    fontSize: 14,
  },
  decorDots: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 36,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  decorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  cardWave: {
    height: 22,
    marginTop: -1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: -56,
    marginBottom: 2,
    zIndex: 2,
  },
  avatarOuter: {
    padding: 4,
    borderRadius: 58,
    backgroundColor: "#FFFFFF",
    shadowColor: NAVY_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: CYAN,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 45,
    backgroundColor: "#E8F9FC",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 22,
    overflow: "hidden",
    position: "relative",
  },
  bodyDecorRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
  },
  bodyDecorRingSoft: {
    borderColor: "rgba(0,229,255,0.14)",
    top: -40,
    left: -50,
  },
  bodyDecorRingStrong: {
    borderColor: "rgba(0,229,255,0.32)",
    width: 96,
    height: 96,
    borderRadius: 48,
    top: 150,
    right: 10,
    borderWidth: 2,
  },
  bodyDecorCircleLg: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  bodyDecorCircleCyan: {
    backgroundColor: "rgba(0,229,255,0.14)",
    top: 60,
    right: -36,
  },
  bodyDecorCircleNavy: {
    backgroundColor: "rgba(4,43,61,0.07)",
    top: 180,
    left: -44,
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  bodyDecorCircleSm: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  bodyDecorCircleBright: {
    backgroundColor: "rgba(0,229,255,0.22)",
    bottom: 110,
    left: 16,
  },
  bodyDecorCircleMid: {
    backgroundColor: "rgba(0,184,212,0.16)",
    top: 24,
    left: 42,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  bodyDecorArc: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  bodyDecorArcStrong: {
    borderColor: "rgba(0,184,212,0.2)",
    bottom: -120,
    right: -60,
    borderWidth: 2,
  },
  bodyDecorDiamond: {
    position: "absolute",
    width: 28,
    height: 28,
    backgroundColor: "rgba(0,229,255,0.18)",
    top: 96,
    right: 54,
    transform: [{ rotate: "45deg" }],
  },
  bodyDecorPill: {
    position: "absolute",
    width: 64,
    height: 18,
    borderRadius: 12,
    backgroundColor: "rgba(4,43,61,0.06)",
    bottom: 56,
    right: 20,
  },
  bodyDecorPlus: {
    position: "absolute",
    fontWeight: "300",
  },
  bodyDecorPlusStrong: {
    color: "rgba(0,229,255,0.38)",
  },
  bodyDecorPlusA: {
    top: 28,
    right: 24,
    fontSize: 22,
  },
  bodyDecorPlusB: {
    color: "rgba(0,184,212,0.28)",
    bottom: 148,
    right: 64,
    fontSize: 16,
  },
  bodyDecorPlusC: {
    top: 120,
    left: 20,
    fontSize: 20,
  },
  bodyDecorPlusD: {
    color: "rgba(4,43,61,0.16)",
    bottom: 36,
    left: 54,
    fontSize: 24,
  },
  bodyDecorDots: {
    position: "absolute",
    left: 14,
    top: 90,
    width: 36,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  bodyDecorDotsRight: {
    position: "absolute",
    right: 16,
    bottom: 88,
    width: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  bodyDecorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,184,212,0.2)",
  },
  bodyDecorDotBright: {
    backgroundColor: "rgba(0,229,255,0.42)",
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  bodyDecorDotMid: {
    backgroundColor: "rgba(0,184,212,0.32)",
  },
  personName: {
    textAlign: "center",
    color: NAVY_DARK,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 8,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  rolePill: {
    borderRadius: 22,
    padding: 1.5,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.45)",
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 1,
  },
  rolePillInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  rolePillText: {
    color: NAVY,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  infoBlock: {
    width: "100%",
    gap: 10,
    zIndex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,184,212,0.18)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,229,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoTextWrap: {
    flex: 1,
    alignItems: "center",
  },
  infoValue: {
    textAlign: "center",
    color: NAVY_DARK,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  infoDivider: {
    color: CYAN_DEEP,
    fontWeight: "700",
  },
  qrSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 18,
    zIndex: 1,
  },
  qrFrame: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,184,212,0.22)",
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NAVY_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  qrHint: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(4,43,61,0.55)",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  cardFooter: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  legalStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  legalText: {
    flex: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
  },
  legalDivider: {
    height: 1,
    backgroundColor: "rgba(0,229,255,0.2)",
    marginBottom: 10,
  },
  legalTextSecondary: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default CarnetScreen;
