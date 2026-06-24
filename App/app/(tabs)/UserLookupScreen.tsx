import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/SupabaseConfig';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';

const BACKUP_CONTACTS_KEY = "tmasplus_backup_contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<any>;

type FoundUser = {
  id: string;
  mobile: string;
  firstName?: string;
};

type BackupContact = {
  id: string;
  name?: string;
  mobile?: string;
};

const UserLookupScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  const [phoneNumber, setPhoneNumber] = useState("+57");
  const [userData, setUserData] = useState<FoundUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backupContacts, setBackupContacts] = useState<BackupContact[]>([]);
  const user = useSelector((state: any) => state.auth.user);

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
          duration: 3300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow1, {
          toValue: 0,
          duration: 3300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, {
          toValue: 1,
          duration: 4600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow2, {
          toValue: 0,
          duration: 4600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 23000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [glow1, glow2, orbRotate]);

  useEffect(() => {
    fetchBackupContacts();
  }, [user?.uid]);

  const lookupUser = async () => {
    if (phoneNumber.trim() === "" || phoneNumber.length < 10) {
      showAlert('error', 'Error', 'Por favor, ingresa un número de teléfono válido.');
      return;
    }

    setIsLoading(true);
    try {
      const mobile = phoneNumber.trim();
      const url = `${SUPABASE_URL}/rest/v1/users?mobile=eq.${encodeURIComponent(mobile)}&select=id,first_name,mobile`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();

      if (!rows || rows.length === 0) {
        showAlert('warning', 'Usuario no encontrado', 'El número de teléfono ingresado no corresponde a ningún usuario.');
      } else {
        const row = rows[0];
        setUserData({
          id: row.id,
          mobile: row.mobile,
          firstName: row.first_name,
        });
      }
    } catch (error) {
      showAlert('error', 'Error', 'Ocurrió un problema al consultar el usuario. Inténtalo nuevamente.');
      console.error("Error al consultar el usuario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackupContacts = async () => {
    if (!user?.uid) return;
    try {
      const raw = await AsyncStorage.getItem(`${BACKUP_CONTACTS_KEY}_${user.uid}`);
      if (raw) {
        const contacts: Record<string, any> = JSON.parse(raw);
        const arr = Object.keys(contacts).map((key) => ({ ...contacts[key], id: key }));
        setBackupContacts(arr);
      } else {
        setBackupContacts([]);
      }
    } catch (e) {
      console.error("Error al cargar contactos de respaldo:", e);
      setBackupContacts([]);
    }
  };

  const renderBackupContact = ({ item }: { item: BackupContact }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Contacto #{item.id}</Text>
      <Text style={styles.cardText}>Nombre: {item.name || "Sin nombre"}</Text>
      <Text style={styles.cardText}>Telefono: {item.mobile || "Sin telefono"}</Text>
    </View>
  );

  const saveAsBackupContact = async () => {
    if (!userData) {
      showAlert('error', 'Error', 'No hay datos de usuario para guardar como contacto de respaldo.');
      return;
    }
    if (!user?.uid) {
      showAlert('error', 'Error', 'No se ha identificado al usuario actual.');
      return;
    }

    const { id, mobile, firstName } = userData;

    try {
      const storageKey = `${BACKUP_CONTACTS_KEY}_${user.uid}`;
      const raw = await AsyncStorage.getItem(storageKey);
      let existing: Record<string, any> = raw ? JSON.parse(raw) : {};
      const nextNum = Object.keys(existing).length + 1;

      existing[nextNum] = { uid: id, mobile, name: firstName };

      await AsyncStorage.setItem(storageKey, JSON.stringify(existing));
      await fetchBackupContacts();

      showAlert('success', 'Éxito', `Contacto de respaldo #${nextNum} guardado correctamente.`);
    } catch (error) {
      console.error("Error al guardar el contacto de respaldo:", error);
      showAlert('error', 'Error', 'Ocurrió un problema al guardar el contacto de respaldo.');
    }
  };

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
            <Ionicons name="search-outline" size={14} color="#00E5FF" />
          </View>
          <Text style={styles.headerText}>Consultar Usuario</Text>
        </View>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Busqueda por telefono</Text>
        <Text style={styles.subtitle}>Escribe el numero completo para verificar si el usuario existe.</Text>

        <View style={styles.inputWrap}>
          <Ionicons name="call-outline" size={17} color="rgba(234,251,255,0.72)" />
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="numeric"
            placeholder="Ingresa el numero de telefono"
            placeholderTextColor="rgba(223,244,255,0.35)"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={lookupUser}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color="#03141A" />
          ) : (
            <>
              <Ionicons name="scan-outline" size={18} color="#03141A" />
              <Text style={styles.buttonText}>Consultar usuario</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {userData && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Usuario encontrado</Text>
          <Text style={styles.resultText}>Nombre: {userData.firstName}</Text>
          <Text style={styles.resultText}>Telefono: {userData.mobile}</Text>
          <TouchableOpacity
            style={styles.backupButton}
            onPress={saveAsBackupContact}
            activeOpacity={0.88}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color="#03141A" />
            <Text style={styles.backupButtonText}>
              Marcar como Contacto de Respaldo
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={backupContacts}
        renderItem={renderBackupContact}
        keyExtractor={(item) => item.id.toString()}
        style={styles.contactList}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 18, 28) },
        ]}
      />
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
    right: -85,
    width: 290,
    height: 290,
    borderRadius: 145,
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
    top: "26%",
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
  sectionCard: {
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
  sectionTitle: {
    color: "#EAFBFF",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(223,244,255,0.82)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  inputWrap: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(5,13,24,0.7)",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#EAFBFF",
  },
  button: {
    backgroundColor: "#00F4F5",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#03141A",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  resultContainer: {
    marginTop: 2,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "rgba(8,15,29,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#D8FBFF",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 8,
    color: "rgba(234,251,255,0.88)",
  },
  backupButton: {
    backgroundColor: "#00F4F5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  backupButtonText: {
    color: "#03141A",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  contactList: {
    flex: 1,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "rgba(8,15,29,0.74)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
    color: "#D8FBFF",
  },
  cardText: {
    fontSize: 13,
    color: "rgba(234,251,255,0.88)",
    marginBottom: 4,
  },
});

export default UserLookupScreen;