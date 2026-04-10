import React from "react";
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
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { useColorScheme } from "react-native";
type Props = NativeStackScreenProps<any>;

const CarnetScreen = ({ navigation }: Props) => {
  const colorScheme = useColorScheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const styles = colorScheme === "dark" ? darkStyles : lightStyles;
  const topSafeInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 10 : 12;

  const userData: any = typeof user === 'object' && user !== null ? user : {};
  const userTypeRaw = String(
    profile?.user_type ||
    userData.usertype || userData.user_type || userData.userType ||
    userData.user_metadata?.usertype || userData.user_metadata?.user_type || userData.user_metadata?.userType ||
    ''
  ).trim().toLowerCase();
  const isDriver = userTypeRaw === 'driver';
  const carnetImage = isDriver
    ? require('@/assets/images/cardid_driver.png')
    : require('@/assets/images/cardid_rider.png');
  console.log('🔍 CarnetScreen - userTypeRaw:', userTypeRaw, '→', isDriver ? 'driver' : 'rider');
  console.log('🔍 CarnetScreen - nombre usuario:', userData?.email || user?.email);
  return (
    <View style={[styles.container, { paddingTop: 20 + topSafeInset }] }>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
      <ImageBackground
        source={carnetImage}
        style={styles.background}
        imageStyle={{ borderRadius: 16 }}
        resizeMode="cover"
      >
      <View style={styles.cardContent}>
        {/* Profile Image - Positioned left and lower on card */}
        <View style={styles.profileImageContainer}>
          <Image
            source={
              userData?.profile_image
                ? { uri: userData.profile_image }
                : require("@/assets/images/profile.png")
            }
            style={styles.profileImage}
          />
        </View>

        {/* Information Section - Below */}
        <View style={styles.infoSection}>
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
              {userData?.first_name || "Usuario"} {userData?.last_name || ""}
            </Text>
          </View>

          {/* Document Type */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de Documento</Text>
            <Text style={styles.infoValue}>
              {userData?.docType || "N/A"}
            </Text>
          </View>

          {/* Document Number */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número de Documento</Text>
            <Text style={styles.infoValue}>
              {userData?.verifyId || "N/A"}
            </Text>
          </View>
        </View>
      </View>
      </ImageBackground>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  headerTitleStyle: {
    color: "#FFF",
    fontFamily: "SpaceMono",
    fontSize: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    position: "relative",
  },
  profileImageContainer: {
    position: "absolute",
    right: 16,
    top: 155,
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
    marginTop: 333, 
  },
  infoRow: {
    backgroundColor: "rgba(0,244,245,0.12)",
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
    backgroundColor: "#474747",
    padding: 20,
  },
  headerTitleStyle: {
    color: "#FFF",
    fontFamily: "SpaceMono",
    fontSize: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    position: "relative",
  },
  profileImageContainer: {
    position: "absolute",
    right: 18,
    top: 597,
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
    marginTop: 220,
  },
  infoRow: {
    backgroundColor: "rgba(0,244,245,0.12)",
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
