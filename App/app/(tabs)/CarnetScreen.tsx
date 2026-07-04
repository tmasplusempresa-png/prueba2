import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { useColorScheme } from "react-native";
import { supabase } from "@/config/SupabaseConfig";
type Props = NativeStackScreenProps<any>;

const CarnetScreen = ({ navigation }: Props) => {
  const colorScheme = useColorScheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const profileData: any = typeof profile === 'object' && profile !== null ? profile : {};
  const isFocused = useIsFocused();
  const styles = colorScheme === "dark" ? darkStyles : lightStyles;
  const topSafeInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 10 : 12;
  const [dbProfile, setDbProfile] = useState<{
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    vehicleCategory: string | null;
    documentType: string | null;
    documentNumber: string | null;
  }>({
    firstName: null,
    lastName: null,
    profileImage: null,
    vehicleCategory: null,
    documentType: null,
    documentNumber: null,
  });

  const userData: any = typeof user === 'object' && user !== null ? user : {};
  const userTypeRaw = String(
    profileData?.user_type ||
    userData.usertype || userData.user_type || userData.userType ||
    userData.user_metadata?.usertype || userData.user_metadata?.user_type || userData.user_metadata?.userType ||
    ''
  ).trim().toLowerCase();
  const isDriver = userTypeRaw === 'driver';
  const carnetImage = isDriver
    ? require('@/assets/images/cardid_driver.png')
    : require('@/assets/images/cardid_rider.png');

  useEffect(() => {
    if (!isFocused) return;

    let cancelled = false;

    const fetchDbProfile = async () => {
      const authId = (userData?.id || userData?.auth_id || profile?.auth_id || profile?.id || '').toString();
      if (!authId) {
        if (!cancelled) {
          setDbProfile({ firstName: null, lastName: null, profileImage: null, vehicleCategory: null, documentType: null, documentNumber: null });
        }
        return;
      }

      try {
        await supabase.auth.getSession();

        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, profile_image, car_type, document_type, document_number')
          .or(`auth_id.eq.${authId},id.eq.${authId}`)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        console.log('[CarnetScreen] authId:', authId);
        console.log('[CarnetScreen] query error:', error);
        console.log('[CarnetScreen] query data:', JSON.stringify(data));

        if (error || !data) {
          setDbProfile({ firstName: null, lastName: null, profileImage: null, vehicleCategory: null, documentType: null, documentNumber: null });
          return;
        }

        const row = data as any;
        let vehicleCategory: string | null = row?.car_type || null;

        if (isDriver && row?.id && !vehicleCategory) {
          try {
            const { data: carData } = await supabase
              .from('cars')
              .select('car_type, service_type, vehicle_type, category')
              .eq('driver_id', String(row.id))
              .limit(1)
              .maybeSingle();

            if (carData) {
              vehicleCategory =
                (carData as any)?.car_type ||
                (carData as any)?.service_type ||
                (carData as any)?.vehicle_type ||
                (carData as any)?.category ||
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
          });
        }
      } catch (error: any) {
        if (!cancelled) {
          setDbProfile({ firstName: null, lastName: null, profileImage: null, vehicleCategory: null, documentType: null, documentNumber: null });
        }
      }
    };

    fetchDbProfile();

    return () => {
      cancelled = true;
    };
  }, [isFocused, profile?.auth_id, profile?.id, userData?.auth_id, userData?.id]);

  const displayFirstName = useMemo(
    () =>
      dbProfile.firstName ||
      profileData?.first_name ||
      profileData?.firstName ||
      userData?.first_name ||
      userData?.firstName ||
      userData?.user_metadata?.first_name ||
      userData?.user_metadata?.firstName ||
      'Usuario',
    [dbProfile.firstName, profileData?.firstName, profileData?.first_name, userData?.firstName, userData?.first_name, userData?.user_metadata?.firstName, userData?.user_metadata?.first_name]
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
      '',
    [dbProfile.lastName, profileData?.lastName, profileData?.last_name, userData?.lastName, userData?.last_name, userData?.user_metadata?.lastName, userData?.user_metadata?.last_name]
  );

  const displayProfileImage = useMemo(
    () =>
      dbProfile.profileImage ||
      profileData?.profile_image ||
      userData?.profile_image ||
      userData?.photoURL ||
      userData?.user_metadata?.avatar_url ||
      null,
    [dbProfile.profileImage, profileData?.profile_image, userData?.photoURL, userData?.profile_image, userData?.user_metadata?.avatar_url]
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

    if (!raw) return 'No definido';

    const text = String(raw).trim();
    if (!text) return 'No definido';
    return text;
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

  return (
    <View style={styles.container}>
      <ImageBackground
        source={carnetImage}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }] }>
        <TouchableOpacity testID="back-button" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"Carnet"} </Text>
        <Ionicons
          name="barcode-outline"
          size={24}
          color="#FFFFFF"
          style={styles.headerIcon}
        />
      </View>
      <View style={styles.cardContent}>
        {/* Profile Image - Positioned over the background circle (right for driver, left for client) */}
        <View style={[styles.profileImageContainer, !isDriver && styles.profileImageContainerRider]}>
          <Image
            source={
              displayProfileImage
                ? { uri: displayProfileImage }
                : require("@/assets/images/profile.png")
            }
            style={styles.profileImage}
          />
        </View>

        {/* Information Section - Below */}
        <View style={[styles.infoSection, !isDriver && styles.infoSectionRider]}>
          {/* Email */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Correo</Text>
            <Text style={styles.infoValueEmail} numberOfLines={1}>
              {user?.email || "No disponible"}
            </Text>
          </View>

          {/* Full Name */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre y Apellido</Text>
            <Text style={styles.infoValue}>
              {displayFirstName} {displayLastName}
            </Text>
          </View>

          {/* Document Type */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de Documento</Text>
            <Text style={styles.infoValue}>
              {dbProfile.documentType || profileData?.document_type || userData?.document_type || "N/A"}
            </Text>
          </View>

          {/* Document Number */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número de Documento</Text>
            <Text style={styles.infoValue}>
              {dbProfile.documentNumber || profileData?.document_number || userData?.document_number || "N/A"}
            </Text>
          </View>

          {isDriver && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoría de Vehículo</Text>
              <Text style={styles.infoValue}>{displayVehicleCategory}</Text>
            </View>
          )}
        </View>
      </View>
      </ImageBackground>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DDE1E7",
  },
  headerTitleStyle: {
    color: "#FFF",
    fontFamily: "SpaceMono",
    fontSize: 20,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerIcon: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 4,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    borderRadius: 0,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    position: "relative",
  },
  profileImageContainer: {
    position: "absolute",
    right: 25,
    top: 211,
  },
  // Client background mirrors the driver one: the profile circle sits on the LEFT.
  profileImageContainerRider: {
    left: 42,
    right: undefined,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#00f4f5",
  },
  infoSection: {
    width: "100%",
    paddingHorizontal: 10,
    gap: 10,
    marginTop: 444,
  },
  // Client background's white area starts a bit lower than the driver one.
  infoSectionRider: {
    marginTop: 477,
  },
  infoRow: {
    backgroundColor: "#F1F5F8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minHeight: 56,
    borderLeftWidth: 3,
    borderLeftColor: "#00f4f5",
  },
  fullName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  contactInfo: {
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#00f4f5",
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  infoValueEmail: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  referralSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,229,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.35)",
  },
  refLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  refValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DDE1E7",
  },
  headerTitleStyle: {
    color: "#FFF",
    fontFamily: "SpaceMono",
    fontSize: 20,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerIcon: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 4,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    borderRadius: 0,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    position: "relative",
  },
  profileImageContainer: {
    position: "absolute",
    right: 16,
    top: 350,
  },
  // Client background mirrors the driver one: the profile circle sits on the LEFT.
  profileImageContainerRider: {
    left: 16,
    right: undefined,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#00f4f5",
  },
  infoSection: {
    width: "100%",
    paddingHorizontal: 10,
    gap: 10,
    marginTop: 375,
  },
  // Client background's white area starts a bit lower than the driver one.
  infoSectionRider: {
    marginTop: 408,
  },
  infoRow: {
    backgroundColor: "#F1F5F8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minHeight: 56,
    borderLeftWidth: 3,
    borderLeftColor: "#00f4f5",
  },
  fullName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  contactInfo: {
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#00f4f5",
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  infoValueEmail: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  referralSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,229,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.35)",
  },
  refLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  refValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
});

export default CarnetScreen;
