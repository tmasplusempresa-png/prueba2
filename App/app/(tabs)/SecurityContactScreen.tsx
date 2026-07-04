import { AntDesign, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ListRenderItem,
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BackupContact = {
  id: string;
  name?: string;
  mobile?: string;
};

const SecurityContactScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const handleContactLookup = () => {
    navigation.navigate("UserLookup");
  };

  const user = useSelector((state: any) => state.auth.user);
  const backupContacts = user.backupContacts
    ? Object.keys(user.backupContacts).map((key) => ({
        ...user.backupContacts[key],
        id: key,
      }))
    : [];

  const glow1 = useRef(new Animated.Value(0)).current;
  const glow2 = useRef(new Animated.Value(0)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow1, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, {
          toValue: 1,
          duration: 4700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow2, {
          toValue: 0,
          duration: 4700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 21000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [glow1, glow2, orbRotate]);

  const orbSpin = orbRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glow1Scale = glow1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const glow2Scale = glow2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22],
  });

  const renderBackupContact: ListRenderItem<BackupContact> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#00E5FF" />
          <Text style={styles.cardBadgeText}>Contacto #{item.id}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={16} color="rgba(234,251,255,0.8)" />
        <Text style={styles.cardText}>{item.name || "Sin nombre"}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={16} color="rgba(234,251,255,0.8)" />
        <Text style={styles.cardText}>{item.mobile || "Sin telefono"}</Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom + 12, 20),
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      <View pointerEvents="none" style={styles.bgLayer}>
        <Animated.View style={[styles.bgGlowOne, { transform: [{ scale: glow1Scale }] }]} />
        <Animated.View style={[styles.bgGlowTwo, { transform: [{ scale: glow2Scale }] }]} />
        <Animated.View style={[styles.bgOrb, { transform: [{ rotate: orbSpin }] }]}>
          <View style={styles.bgOrbInner} />
        </Animated.View>
        <View style={styles.bgGrid} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <AntDesign name="arrow-left" size={22} color="#EAFBFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerBadgeIcon}>
            <Ionicons name="people-outline" size={14} color="#00E5FF" />
          </View>
          <Text style={styles.headerText}>Contacto de Seguridad</Text>
        </View>

        <View style={styles.iconBtnPlaceholder} />
      </View>

      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Tu red de respaldo</Text>
        <Text style={styles.description}>
          Gestiona tus contactos de seguridad para compartir ubicacion y asistencia cuando lo necesites.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleContactLookup} activeOpacity={0.88}>
          <Ionicons name="search-outline" size={18} color="#03141A" />
          <Text style={styles.buttonText}>Consultar usuario</Text>
          <Ionicons name="arrow-forward" size={17} color="#03141A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={backupContacts}
        renderItem={renderBackupContact}
        keyExtractor={(item) => item.id.toString()}
        style={styles.contactList}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 18, 28) },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="shield-outline" size={30} color="rgba(0,229,255,0.8)" />
            <Text style={styles.emptyTitle}>Sin contactos registrados</Text>
            <Text style={styles.emptyText}>Agrega tu primer contacto de respaldo para mejorar tu seguridad.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgGlowOne: {
    position: "absolute",
    top: -130,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(0,229,255,0.22)",
  },
  bgGlowTwo: {
    position: "absolute",
    bottom: -140,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(14,165,233,0.18)",
  },
  bgOrb: {
    position: "absolute",
    top: "24%",
    left: "42%",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  bgOrbInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(0,229,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bgGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.16)",
  },
  iconBtnPlaceholder: {
    width: 42,
    height: 42,
  },
  headerText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#EAFBFF",
    letterSpacing: 0.2,
  },
  introCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(8,15,29,0.78)",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#00E5FF",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  introTitle: {
    color: "#EAFBFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    color: "rgba(223,244,255,0.84)",
  },
  button: {
    backgroundColor: "#00F4F5",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#03141A",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  contactList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "rgba(8,15,29,0.74)",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#00E5FF",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,229,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.28)",
  },
  cardBadgeText: {
    color: "#DFF8FF",
    fontWeight: "700",
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },
  cardText: {
    fontSize: 14,
    color: "rgba(234,251,255,0.9)",
  },
  emptyCard: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,15,29,0.72)",
    padding: 18,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "800",
    color: "#EAFBFF",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(223,244,255,0.8)",
    textAlign: "center",
  },
});

export default SecurityContactScreen;