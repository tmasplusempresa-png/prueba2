import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Image,
  StatusBar,
} from "react-native";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;

const CustomerSupport = ({ navigation }: Props) => {
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

  const glow1 = useRef(new Animated.Value(0)).current;
  const glow2 = useRef(new Animated.Value(0)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow1, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow2, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [glow1, glow2, orbRotate]);

  const openWhatsAppChat = async () => {
    const phone = "573118841054";
    const text = "Hola";
    const deepLink = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
    const universalLink = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    const apiLink = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;

    const tryOpen = async (url: string) => {
      try {
        await Linking.openURL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (await tryOpen(deepLink)) return;
    if (await tryOpen(universalLink)) return;
    if (await tryOpen(apiLink)) return;

    showAlert(
      'warning',
      'WhatsApp no disponible',
      'No fue posible abrir WhatsApp. Por favor instala la aplicacion de WhatsApp o contactanos al +57 311 884 1054.'
    );
  };

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
    outputRange: [1, 1.18],
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
          <AntDesign name="arrow-left" size={22} color="#EAFBFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerBadgeIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={15} color="#00E5FF" />
          </View>
          <Text style={styles.headerText}>Chat con tmasplus</Text>
        </View>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>Asistente en linea</Text>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Online</Text>
          </View>
        </View>
        <Text style={styles.heroSubtitle}>
          Nuestro equipo esta listo para ayudarte por WhatsApp con soporte rapido y personalizado.
        </Text>

        <View style={styles.botImageWrap}>
        <Image
          source={require("@/assets/images/chatBot.png")}
          style={styles.botImage}
          resizeMode="cover"
        />
        </View>
      </View>

      <View style={styles.actionWrap}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={openWhatsAppChat}
          activeOpacity={0.88}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>
      </View>

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
    backgroundColor: "#030712",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 26,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgGlowOne: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0,229,255,0.22)",
  },
  bgGlowTwo: {
    position: "absolute",
    bottom: -120,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(16,185,129,0.2)",
  },
  bgOrb: {
    position: "absolute",
    top: "28%",
    left: "40%",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bgOrbInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(0,229,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bgGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: "transparent",
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
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(8,15,29,0.78)",
    padding: 16,
    shadowColor: "#00E5FF",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginTop: 8,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 18,
    color: "#EAFBFF",
    fontWeight: "800",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.2)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.45)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  liveText: {
    color: "#B8FFE2",
    fontSize: 12,
    fontWeight: "700",
  },
  heroSubtitle: {
    marginTop: 10,
    color: "rgba(223,244,255,0.82)",
    fontSize: 14,
    lineHeight: 20,
  },
  botImageWrap: {
    marginTop: 14,
    width: "100%",
    height: 320,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  botImage: {
    width: "100%",
    height: "100%",
  },
  actionWrap: {
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButton: {
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

export default CustomerSupport;
