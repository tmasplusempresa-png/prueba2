import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, update } from "firebase/database";

type Props = NativeStackScreenProps<any>;

type DocKey =
  | "verifyIdImage"
  | "verifyIdImageBk"
  | "SOATImage"
  | "cardPropImage"
  | "cardPropImageBK"
  | "licenseImage"
  | "licenseImageBack";

type DocDef = {
  key: DocKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
};

const DOC_DEFS: DocDef[] = [
  { key: "verifyIdImage", label: "Cedula Frente", icon: "card-outline", accent: "#E91E63" },
  { key: "verifyIdImageBk", label: "Cedula Posterior", icon: "copy-outline", accent: "#E91E63" },
  { key: "SOATImage", label: "SOAT", icon: "document-text-outline", accent: "#00E5FF" },
  { key: "cardPropImage", label: "Propiedad Frente", icon: "wallet-outline", accent: "#FACC15" },
  { key: "cardPropImageBK", label: "Propiedad Posterior", icon: "albums-outline", accent: "#F87171" },
  { key: "licenseImage", label: "Licencia Frente", icon: "id-card-outline", accent: "#22D3EE" },
  { key: "licenseImageBack", label: "Licencia Posterior", icon: "reader-outline", accent: "#34D399" },
];

const ImageGalleryComponent = ({ navigation, route }: Props) => {
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const { data } = route.params || {};

  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocDef | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [candidateUri, setCandidateUri] = useState<string | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

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

  const [savedUris, setSavedUris] = useState<Record<DocKey, string | null>>({
    verifyIdImage: user?.verifyIdImage || null,
    verifyIdImageBk: user?.verifyIdImageBk || null,
    SOATImage: user?.SOATImage || null,
    cardPropImage: user?.cardPropImage || null,
    cardPropImageBK: user?.cardPropImageBK || user?.cardPropImageBk || null,
    licenseImage: user?.licenseImage || null,
    licenseImageBack: user?.licenseImageBack || null,
  });

  const [pendingUris, setPendingUris] = useState<Partial<Record<DocKey, string>>>({});

  const glowPulse = useRef(new Animated.Value(0)).current;
  const orbSpin = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const orbLoop = Animated.loop(
      Animated.timing(orbSpin, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    glowLoop.start();
    orbLoop.start();

    return () => {
      glowLoop.stop();
      orbLoop.stop();
    };
  }, [glowPulse, orbSpin]);

  const docs = useMemo(() => {
    const isCustomer = user?.usertype === "customer";
    const defs = isCustomer ? DOC_DEFS.slice(0, 1) : DOC_DEFS;
    return defs.map((doc) => ({
      ...doc,
      currentUri: savedUris[doc.key] || null,
      nextUri: pendingUris[doc.key] || null,
    }));
  }, [pendingUris, savedUris, user?.usertype]);

  const pendingCount = useMemo(() => Object.keys(pendingUris).length, [pendingUris]);

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.42],
  });

  const orbRotate = orbSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const openSourcePicker = (doc: DocDef) => {
    setSelectedDoc(doc);
    setSourceModalVisible(true);
  };

  const showImagePreview = (uri: string | null) => {
    if (!uri) return;
    setPreviewUri(uri);
    setPreviewModalVisible(true);
  };

  const getImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [5, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCandidateUri(result.assets[0].uri);
      setSourceModalVisible(false);
      setCompareModalVisible(true);
    }
  };

  const getImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert('warning', 'Permiso denegado', 'Se requiere acceso a la cámara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [5, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCandidateUri(result.assets[0].uri);
      setSourceModalVisible(false);
      setCompareModalVisible(true);
    }
  };

  const confirmCandidate = () => {
    if (!selectedDoc || !candidateUri) {
      setCompareModalVisible(false);
      return;
    }

    setPendingUris((prev) => ({
      ...prev,
      [selectedDoc.key]: candidateUri,
    }));

    setCompareModalVisible(false);
    setCandidateUri(null);
  };

  const discardCandidate = () => {
    setCompareModalVisible(false);
    setCandidateUri(null);
  };

  const uploadDoc = async (userId: string, docKey: DocKey, localUri: string) => {
    const storage = getStorage();
    const storageRef = ref(storage, `users/${userId}/${docKey}`);

    const response = await fetch(localUri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    const db = getDatabase();
    const updates: Record<string, string> = {};
    updates[`/users/${userId}/${docKey}`] = downloadURL;
    await update(dbRef(db), updates);

    return downloadURL;
  };

  const handleUpdate = async () => {
    if (pendingCount === 0) {
      showAlert('info', 'Sin cambios', 'No hay documentos nuevos por confirmar.');
      return;
    }

    const userId = user?.uid || user?.id;
    if (!userId) {
      showAlert('error', 'Error', 'No se pudo identificar al usuario autenticado.');
      return;
    }

    showAlert('confirm', 'Confirmar actualización', `Vas a reemplazar ${pendingCount} documento(s). ¿Deseas continuar?`, [
      { text: 'Cancelar', style: 'cancel', onPress: () => setAlertVisible(false) },
      {
        text: 'Confirmar',
        onPress: async () => {
          setAlertVisible(false);
          try {
            setLoadingUpload(true);
            const updated: Partial<Record<DocKey, string | null>> = {};

            const entries = Object.entries(pendingUris) as Array<[DocKey, string]>;
            for (const [docKey, uri] of entries) {
              const remoteUrl = await uploadDoc(userId, docKey, uri);
              updated[docKey] = remoteUrl;
            }

            setSavedUris((prev) => ({
              ...prev,
              ...updated,
            }));

            setPendingUris({});
            showAlert('success', 'Listo', 'Los documentos se actualizaron correctamente.');
          } catch (error) {
            console.error("Error updating docs:", error);
            showAlert('error', 'Error', 'No se pudieron actualizar los documentos. Intenta nuevamente.');
          } finally {
            setLoadingUpload(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgLayer}>
        <Animated.View
          style={[
            styles.bgGlow,
            styles.bgGlowTop,
            { transform: [{ scale: glowScale }], opacity: glowOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.bgGlow,
            styles.bgGlowBottom,
            { transform: [{ scale: glowScale }], opacity: glowOpacity },
          ]}
        />
        <Animated.View style={[styles.bgOrb, { transform: [{ rotate: orbRotate }] }]} />
        <View style={styles.bgGrid} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            if (data === "Process") {
              navigation.navigate("Map", { openModal: true });
            } else {
              navigation.goBack();
            }
          }}
        >
          <AntDesign name="arrowleft" size={22} color="#E9F6FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documentos</Text>
        <View style={styles.headerIconWrap}>
          <Ionicons name="images-outline" size={18} color="#00E5FF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Revisa la imagen actual y confirma cualquier cambio antes de guardar.</Text>

        {docs.map((doc) => (
          <View key={doc.key} style={styles.docCard}>
            <View style={styles.docTop}>
              <View style={[styles.docIcon, { borderColor: `${doc.accent}66` }]}>
                <Ionicons name={doc.icon} size={20} color={doc.accent} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{doc.label}</Text>
                <Text style={styles.docStatus}>
                  {doc.nextUri ? "Cambio pendiente de confirmar" : doc.currentUri ? "Imagen guardada" : "Sin imagen"}
                </Text>
              </View>
              <TouchableOpacity style={styles.changeBtn} onPress={() => openSourcePicker(doc)}>
                <Ionicons name="camera-outline" size={18} color="#00E5FF" />
              </TouchableOpacity>
            </View>

            <View style={styles.previewRow}>
              <TouchableOpacity style={styles.previewCard} onPress={() => showImagePreview(doc.currentUri)} activeOpacity={0.9}>
                <Text style={styles.previewLabel}>Actual</Text>
                {doc.currentUri ? (
                  <Image source={{ uri: doc.currentUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewEmpty}>
                    <Ionicons name="image-outline" size={20} color="#6F96A9" />
                    <Text style={styles.previewEmptyText}>Sin imagen</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.previewCard} onPress={() => showImagePreview(doc.nextUri || null)} activeOpacity={0.9}>
                <Text style={styles.previewLabel}>Nueva</Text>
                {doc.nextUri ? (
                  <Image source={{ uri: doc.nextUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewEmpty}>
                    <Ionicons name="swap-horizontal-outline" size={20} color="#6F96A9" />
                    <Text style={styles.previewEmptyText}>Sin cambio</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.updateBtn, loadingUpload && styles.updateBtnDisabled]} onPress={handleUpdate} disabled={loadingUpload}>
          <Text style={styles.updateBtnText}>
            {loadingUpload ? "Actualizando..." : `Actualizar Ahora${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent animationType="slide" visible={sourceModalVisible} onRequestClose={() => setSourceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona una opción</Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={getImageFromLibrary}>
              <Ionicons name="images" size={18} color="#062331" />
              <Text style={styles.modalPrimaryText}>Cargar Imagen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondaryBtn} onPress={getImageFromCamera}>
              <Ionicons name="camera" size={18} color="#E9F6FF" />
              <Text style={styles.modalSecondaryText}>Tomar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSourceModalVisible(false)}>
              <MaterialIcons name="cancel" size={18} color="#E91E63" />
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={compareModalVisible} onRequestClose={discardCandidate}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.compareModalCard]}>
            <Text style={styles.modalTitle}>Confirmar cambio</Text>
            <Text style={styles.compareSubtitle}>Verifica la imagen nueva antes de reemplazar la actual.</Text>

            <View style={styles.compareRow}>
              <View style={styles.compareBox}>
                <Text style={styles.compareLabel}>Actual</Text>
                {selectedDoc && savedUris[selectedDoc.key] ? (
                  <Image source={{ uri: savedUris[selectedDoc.key] as string }} style={styles.compareImage} />
                ) : (
                  <View style={styles.previewEmpty}>
                    <Text style={styles.previewEmptyText}>Sin imagen</Text>
                  </View>
                )}
              </View>

              <View style={styles.compareBox}>
                <Text style={styles.compareLabel}>Nueva</Text>
                {candidateUri ? (
                  <Image source={{ uri: candidateUri }} style={styles.compareImage} />
                ) : (
                  <View style={styles.previewEmpty}>
                    <Text style={styles.previewEmptyText}>Sin imagen</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.compareActions}>
              <TouchableOpacity style={styles.keepOldBtn} onPress={discardCandidate}>
                <Text style={styles.keepOldText}>Conservar actual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmCandidate}>
                <Text style={styles.confirmText}>Confirmar cambio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={previewModalVisible} onRequestClose={() => setPreviewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.imagePreviewModal}>
            <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewModalVisible(false)}>
              <Ionicons name="close" size={22} color="#E9F6FF" />
            </TouchableOpacity>
            {previewUri ? <Image source={{ uri: previewUri }} style={styles.fullImage} /> : null}
          </View>
        </View>
      </Modal>

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
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
  },
  bgGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#00E5FF",
  },
  bgGlowTop: {
    width: 280,
    height: 280,
    top: -120,
    right: -110,
  },
  bgGlowBottom: {
    width: 220,
    height: 220,
    left: -90,
    bottom: 120,
    backgroundColor: "#00B8D4",
  },
  bgOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.1)",
    right: -100,
    top: "45%",
  },
  bgGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 20, 30, 0.6)",
  },
  header: {
    zIndex: 2,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.2)",
    backgroundColor: "rgba(10, 46, 61, 0.68)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#E9F6FF",
    fontSize: 20,
    fontWeight: "800",
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    backgroundColor: "rgba(10, 46, 61, 0.68)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    zIndex: 2,
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 12,
  },
  subtitle: {
    color: "#9EC2D4",
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  docCard: {
    borderRadius: 18,
    backgroundColor: "rgba(10,46,61,0.62)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    padding: 14,
    gap: 12,
  },
  docTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,25,37,0.8)",
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    color: "#E9F6FF",
    fontSize: 14,
    fontWeight: "700",
  },
  docStatus: {
    color: "#8DB2C4",
    fontSize: 12,
    marginTop: 2,
  },
  changeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.22)",
    backgroundColor: "rgba(0,229,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewRow: {
    flexDirection: "row",
    gap: 10,
  },
  previewCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(6, 25, 36, 0.8)",
    padding: 8,
    gap: 8,
  },
  previewLabel: {
    color: "#A7C5D4",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 92,
    borderRadius: 10,
    resizeMode: "cover",
  },
  previewEmpty: {
    height: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.12)",
    backgroundColor: "rgba(3, 15, 23, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  previewEmptyText: {
    color: "#6F96A9",
    fontSize: 11,
    fontWeight: "600",
  },
  updateBtn: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#00E5FF",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  updateBtnDisabled: {
    opacity: 0.7,
  },
  updateBtnText: {
    color: "#052333",
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.24)",
    backgroundColor: "rgba(10, 38, 53, 0.95)",
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    color: "#E9F6FF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  modalPrimaryBtn: {
    borderRadius: 14,
    backgroundColor: "#00E5FF",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalPrimaryText: {
    color: "#052333",
    fontWeight: "800",
    fontSize: 14,
  },
  modalSecondaryBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.28)",
    backgroundColor: "rgba(6,25,36,0.9)",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalSecondaryText: {
    color: "#E9F6FF",
    fontWeight: "700",
    fontSize: 14,
  },
  modalCancelBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,106,123,0.38)",
    backgroundColor: "rgba(255,106,123,0.08)",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalCancelText: {
    color: "#E91E63",
    fontWeight: "700",
    fontSize: 14,
  },
  compareModalCard: {
    gap: 10,
  },
  compareSubtitle: {
    textAlign: "center",
    color: "#9BBCCD",
    fontSize: 12,
    marginBottom: 4,
  },
  compareRow: {
    flexDirection: "row",
    gap: 10,
  },
  compareBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(6,25,36,0.9)",
    padding: 8,
    gap: 6,
  },
  compareLabel: {
    color: "#A7C5D4",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  compareImage: {
    width: "100%",
    height: 116,
    borderRadius: 10,
    resizeMode: "cover",
  },
  compareActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  keepOldBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingVertical: 12,
    alignItems: "center",
  },
  keepOldText: {
    color: "#E9F6FF",
    fontSize: 13,
    fontWeight: "700",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#00E5FF",
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: {
    color: "#052333",
    fontSize: 13,
    fontWeight: "800",
  },
  imagePreviewModal: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#051A26",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.24)",
  },
  previewCloseBtn: {
    position: "absolute",
    zIndex: 2,
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: "100%",
    height: 380,
    resizeMode: "contain",
    backgroundColor: "#020D14",
  },
});

export default ImageGalleryComponent;



