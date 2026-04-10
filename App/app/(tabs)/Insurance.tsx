import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;

const Insurance = ({ navigation }: Props) => {
  const glow1 = useRef(new Animated.Value(0)).current;
  const glow2 = useRef(new Animated.Value(0)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow1, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, {
          toValue: 1,
          duration: 4800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow2, {
          toValue: 0,
          duration: 4800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glow1, glow2, orbRotate, pulse]);

  const orbSpin = orbRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glow1Scale = glow1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const glow2Scale = glow2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <View style={styles.container}>
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
          <AntDesign name="arrowleft" size={22} color="#EAFBFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerBadgeIcon}>
            <Ionicons name="shield-checkmark-outline" size={15} color="#00E5FF" />
          </View>
          <Text style={styles.headerText}>Aseguradora</Text>
        </View>

        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <Animated.View style={[styles.statusHalo, { transform: [{ scale: pulseScale }] }]} />
          <View style={styles.statusIconWrap}>
            <Ionicons name="shield-outline" size={38} color="#FCA5A5" />
          </View>
          <Text style={styles.statusTitle}>Sin aseguradora</Text>
          <Text style={styles.statusSubtitle}>
            Actualmente no tienes una aseguradora vinculada en la aplicacion.
          </Text>

          <View style={styles.statusBadge}>
            <Ionicons name="alert-circle-outline" size={14} color="#FECACA" />
            <Text style={styles.statusBadgeText}>Cobertura no activa</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Que significa esto</Text>
          <Text style={styles.infoBody}>
            Mientras aparezca este estado, no hay una poliza activa registrada para tu cuenta. Te recomendamos
            mantener tus datos de perfil y vehiculo al dia para facilitar una futura validacion.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Siguiente paso sugerido</Text>
          <Text style={styles.infoBody}>
            Contacta soporte para revisar disponibilidad de cobertura segun tu categoria de servicio y ciudad.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgGlowOne: {
    position: "absolute",
    top: -140,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(0,229,255,0.22)",
  },
  bgGlowTwo: {
    position: "absolute",
    bottom: -130,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(14,165,233,0.2)",
  },
  bgOrb: {
    position: "absolute",
    top: "30%",
    left: "42%",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.2)",
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
    marginBottom: 18,
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
  headerText: {
    fontSize: 17,
    color: "#EAFBFF",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  iconBtnPlaceholder: {
    width: 42,
    height: 42,
  },
  content: {
    paddingBottom: 28,
    gap: 14,
  },
  mainCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(8,15,29,0.78)",
    padding: 18,
    alignItems: "center",
    shadowColor: "#00E5FF",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  statusHalo: {
    position: "absolute",
    top: 20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(239,68,68,0.18)",
  },
  statusIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.45)",
    backgroundColor: "rgba(127,29,29,0.28)",
    marginTop: 6,
  },
  statusTitle: {
    marginTop: 14,
    color: "#FEE2E2",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  statusSubtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(255,241,242,0.86)",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  statusBadge: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.22)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.45)",
  },
  statusBadgeText: {
    color: "#FECACA",
    fontSize: 12,
    fontWeight: "700",
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,15,29,0.72)",
    padding: 16,
  },
  infoTitle: {
    color: "#DDF6FF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoBody: {
    color: "rgba(221,246,255,0.8)",
    fontSize: 14,
    lineHeight: 21,
  },
});

export default Insurance;
