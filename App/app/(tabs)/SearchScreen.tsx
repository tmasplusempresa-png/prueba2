import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "@/common/store";
import Entypo from "react-native-vector-icons/Entypo";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import * as Animatable from "react-native-animatable";
import { Ionicons, AntDesign, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { API_KEY } from "@/config/AppConfig";
import { SUPABASE_URL, SUPABASE_ANON_KEY, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { useCustomerNavBottomPad } from '@/components/CustomerBottomNav';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Supabase REST directo (el cliente JS cuelga) ──
const MAX_FAVORITES = 5;

type Props = NativeStackScreenProps<any>;
const { width, height } = Dimensions.get("window");

interface Address {
  id: string;
  label: string;
  address: string;
  isFavorite?: boolean;
  typeAddress?: string | null;
  lat?: number;
  lng?: number;
  usageCount?: number;
}

const TYPE_ICONS: Record<string, { icon: string; family: string; color: string }> = {
  Casa: { icon: "home", family: "MaterialCommunityIcons", color: "#00E5FF" },
  Trabajo: { icon: "briefcase", family: "MaterialCommunityIcons", color: "#FFFFFF" },
  Gimnasio: { icon: "dumbbell", family: "MaterialCommunityIcons", color: "#00E5FF" },
  Supermercado: { icon: "cart", family: "MaterialCommunityIcons", color: "#00E676" },
  Parque: { icon: "tree", family: "MaterialCommunityIcons", color: "#69F0AE" },
  Escuela: { icon: "school", family: "MaterialCommunityIcons", color: "#00E5FF" },
  Restaurante: { icon: "silverware-fork-knife", family: "MaterialCommunityIcons", color: "#E91E63" },
  Otro: { icon: "map-marker-radius", family: "MaterialCommunityIcons", color: "#FFFFFF" },
};

type PlaceType = "Casa" | "Trabajo" | "Otro";
const PLACE_TYPES: PlaceType[] = ["Casa", "Trabajo", "Otro"];
/** Solo puede existir un lugar de cada uno de estos tipos por usuario; su nombre es el propio tipo. */
const UNIQUE_PLACE_TYPES: PlaceType[] = ["Casa", "Trabajo"];
const isFixedNameType = (type?: string | null) => !!type && (UNIQUE_PLACE_TYPES as string[]).includes(type);

// Floating diamond particle
const PARTICLES = [
  { size: 10, x: width * 0.12, y: height * 0.08, color: "#00E5FF", duration: 6000, delay: 0 },
  { size: 6,  x: width * 0.85, y: height * 0.14, color: "#FFFFFF", duration: 7500, delay: 400 },
  { size: 8,  x: width * 0.42, y: height * 0.25, color: "#00E5FF", duration: 8000, delay: 800 },
  { size: 5,  x: width * 0.7,  y: height * 0.38, color: "#FFFFFF", duration: 6500, delay: 200 },
  { size: 7,  x: width * 0.2,  y: height * 0.52, color: "#FFFFFF", duration: 7000, delay: 1000 },
  { size: 9,  x: width * 0.78, y: height * 0.62, color: "#00E5FF", duration: 8500, delay: 600 },
  { size: 5,  x: width * 0.55, y: height * 0.75, color: "#FFFFFF", duration: 6000, delay: 1200 },
  { size: 7,  x: width * 0.1,  y: height * 0.85, color: "#00E5FF", duration: 7200, delay: 300 },
  { size: 6,  x: width * 0.9,  y: height * 0.45, color: "#FFFFFF", duration: 6800, delay: 900 },
  { size: 4,  x: width * 0.35, y: height * 0.92, color: "#00E5FF", duration: 7800, delay: 500 },
];

const DiamondParticle = ({ size, x, y, color, duration, delay }: typeof PARTICLES[0]) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const fade = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: duration / 2, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.08, duration: duration / 2, useNativeDriver: true }),
      ])
    );
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -12, duration, delay, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 12, duration: duration * 0.8, useNativeDriver: true }),
      ])
    );
    fade.start();
    drift.start();
    return () => { fade.stop(); drift.stop(); };
  }, []);
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        opacity,
        transform: [{ translateY }, { rotate: "45deg" }],
        backgroundColor: color,
        borderRadius: size * 0.18,
      }}
    />
  );
};

export default function FavoritesScreen({ navigation, route }: Props) {
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const profile = useSelector((state: RootState) => state.auth.profile) as any;
  const insets = useSafeAreaInsets();
  const navBottomPad = useCustomerNavBottomPad();
  const headerTopPadding = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;
  const modalBottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom + 6, 24) : 28;
  const isCustomer = String(
    profile?.user_type ||
      user?.usertype ||
      user?.user_type ||
      user?.userType ||
      user?.user_metadata?.usertype ||
      user?.user_metadata?.user_type ||
      ''
  ).toLowerCase() === 'customer';
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAddressDetails, setNewAddressDetails] = useState<any>(null);
  const [newPlaceType, setNewPlaceType] = useState<PlaceType>("Otro");
  const [editingPlace, setEditingPlace] = useState<Address | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchAutocompleteRef = useRef<any>(null);
  const placeAutocompleteRef = useRef<any>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

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

  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(headerAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.spring(listAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Resolver user_id de Supabase ──
  const resolveUserId = useCallback(async (): Promise<string | null> => {
    const authId = user?.id || user?.auth_id || profile?.auth_id || profile?.id;
    if (!authId) return null;
    try {
      const headers = await getSupabaseAuthHeaders(true);
      const url = `${SUPABASE_URL}/rest/v1/users?or=(auth_id.eq.${encodeURIComponent(authId)},id.eq.${encodeURIComponent(authId)})&select=id&limit=1`;
      const resp = await fetch(url, { headers });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data?.[0]?.id || null;
    } catch { return null; }
  }, [user, profile]);

  // ── Cargar favoritos desde Supabase ──
  const loadFavorites = useCallback(async (userId: string) => {
    try {
      const headers = await getSupabaseAuthHeaders(true);
      const url = `${SUPABASE_URL}/rest/v1/favorite_places?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`;
      const resp = await fetch(url, { headers });
      if (!resp.ok) { console.warn('[FavPlaces] Error loading:', resp.status); return; }
      const rows = await resp.json();
      const mapped: Address[] = rows.map((r: any) => ({
        id: r.id,
        label: r.name || 'Lugar guardado',
        address: r.description,
        isFavorite: r.is_favorite,
        typeAddress: r.type_address,
        lat: r.latitude,
        lng: r.longitude,
        usageCount: r.usage_count,
      }));
      setAddresses(mapped);
    } catch (e) { console.warn('[FavPlaces] loadFavorites error:', e); }
  }, []);

  // ── Init: resolver userId + cargar datos ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      const uid = await resolveUserId();
      if (uid) {
        setSupabaseUserId(uid);
        await loadFavorites(uid);
      }
      setLoading(false);
    })();
  }, [user]);

  // ── Helpers: contar favoritos actuales ──
  const favoriteCount = addresses.filter(a => a.isFavorite).length;

  const isTypeTaken = (type: string | null, excludeId?: string) =>
    !!type &&
    (UNIQUE_PLACE_TYPES as string[]).includes(type) &&
    addresses.some(a => a.typeAddress === type && a.id !== excludeId);

  const showTypeTakenAlert = (type: string) =>
    showAlert(
      'warning',
      `Ya tienes ${type === 'Casa' ? 'una dirección de casa' : 'una dirección de trabajo'}`,
      'Edítala o elimínala para registrar una nueva.',
    );

  const openNewPlaceModal = (type: PlaceType = "Otro") => {
    if (favoriteCount >= MAX_FAVORITES) {
      showAlert('warning', 'Límite alcanzado', `Solo puedes tener ${MAX_FAVORITES} lugares favoritos. Elimina uno para agregar otro.`);
      return;
    }
    setEditingPlace(null);
    setNewAddressLabel("");
    setNewAddress("");
    setNewAddressDetails(null);
    setNewPlaceType(isTypeTaken(type) ? "Otro" : type);
    setModalVisible(true);
  };

  // ── Llegada desde Inicio (Casa / Trabajo sin registrar) ──
  const missingType = (route?.params as any)?.missingType as PlaceType | undefined;
  const missingNonce = (route?.params as any)?.nonce;
  useEffect(() => {
    if (!missingType || loading) return;
    navigation.setParams({ missingType: undefined, nonce: undefined });
    if (isTypeTaken(missingType)) return;
    const label = missingType === 'Casa' ? 'casa' : 'trabajo';
    showAlert(
      'info',
      `Aún no tienes dirección de ${label}`,
      `Crea tu dirección de ${label} para pedir tu viaje con un solo toque desde el inicio.`,
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => setAlertVisible(false) },
        { text: 'Crear ahora', onPress: () => { setAlertVisible(false); openNewPlaceModal(missingType); } },
      ],
    );
  }, [missingType, missingNonce, loading]);

  const openEditPlaceModal = (place: Address) => {
    const type = (PLACE_TYPES as string[]).includes(place.typeAddress || '')
      ? (place.typeAddress as PlaceType)
      : "Otro";
    setEditingPlace(place);
    setNewPlaceType(type);
    setNewAddressLabel(type === "Otro" ? place.label : "");
    setNewAddress(place.address || "");
    setNewAddressDetails(null);
    setModalVisible(true);
  };

  const closePlaceModal = () => {
    setModalVisible(false);
    setEditingPlace(null);
    setNewAddressLabel("");
    setNewAddress("");
    setNewAddressDetails(null);
    setNewPlaceType("Otro");
  };

  useEffect(() => {
    if (!modalVisible) return;
    const t = setTimeout(() => placeAutocompleteRef.current?.setAddressText(editingPlace?.address || ""), 50);
    return () => clearTimeout(t);
  }, [modalVisible, editingPlace]);

  const filteredAddresses = searchQuery.trim()
    ? addresses.filter(
        (a) =>
          a.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.typeAddress && a.typeAddress.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : addresses;

  // ── INSERT lugar desde barra de búsqueda → Supabase ──
  const handleSearchSelect = async (data: any, details: any = null) => {
    if (!details || !supabaseUserId) return;
    if (favoriteCount >= MAX_FAVORITES) {
      showAlert('warning', 'Límite alcanzado', `Solo puedes tener ${MAX_FAVORITES} lugares favoritos. Elimina uno para agregar otro.`);
      return;
    }
    const description = details.formatted_address || data.description;
    const lat = details.geometry.location.lat;
    const lng = details.geometry.location.lng;
    const nameComponents = details.address_components || [];
    const shortName =
      nameComponents.find((c: any) => c.types.includes("route"))?.short_name ||
      nameComponents.find((c: any) => c.types.includes("sublocality"))?.short_name ||
      data.structured_formatting?.main_text ||
      "Lugar guardado";

    try {
      const headers = await getSupabaseAuthHeaders(true);
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/favorite_places`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          user_id: supabaseUserId,
          name: shortName,
          description,
          latitude: lat,
          longitude: lng,
          is_favorite: true,
          type_address: 'Otro',
          usage_count: 1,
        }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        if (err.includes('máximo 5') || err.includes('P0001')) {
          showAlert('warning', 'Límite alcanzado', `Solo puedes tener ${MAX_FAVORITES} lugares favoritos.`);
        } else {
          console.warn('[FavPlaces] insert error:', err);
          showAlert('error', 'Error', 'No se pudo guardar el lugar.');
        }
        return;
      }
      const inserted = (await resp.json())[0];
      const newAddr: Address = {
        id: inserted.id,
        label: inserted.name,
        address: inserted.description,
        isFavorite: inserted.is_favorite,
        typeAddress: inserted.type_address,
        lat: inserted.latitude,
        lng: inserted.longitude,
        usageCount: inserted.usage_count,
      };
      setAddresses(prev => [newAddr, ...prev]);
    } catch (e) {
      console.warn('[FavPlaces] handleSearchSelect error:', e);
      showAlert('error', 'Error', 'Error de conexión al guardar.');
    }
    setSearchQuery("");
    searchAutocompleteRef.current?.setAddressText("");
  };

  // ── UPDATE lugar desde modal "Editar lugar" → Supabase ──
  const handleUpdatePlace = async (place: Address, placeName: string) => {
    const coords = newAddressDetails
      ? { latitude: newAddressDetails.geometry.location.lat, longitude: newAddressDetails.geometry.location.lng }
      : { latitude: place.lat, longitude: place.lng };
    try {
      const headers = await getSupabaseAuthHeaders(true);
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/favorite_places?id=eq.${encodeURIComponent(place.id)}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          name: placeName,
          description: newAddress,
          type_address: newPlaceType,
          ...coords,
        }),
      });
      if (!resp.ok) {
        console.warn('[FavPlaces] update error:', await resp.text());
        showAlert('error', 'Error', 'No se pudo actualizar el lugar.');
        return;
      }
      setAddresses(prev => prev.map(a => a.id === place.id
        ? { ...a, label: placeName, address: newAddress, typeAddress: newPlaceType, lat: coords.latitude, lng: coords.longitude }
        : a));
      closePlaceModal();
    } catch (e) {
      console.warn('[FavPlaces] handleUpdatePlace error:', e);
      showAlert('error', 'Error', 'Error de conexión al guardar.');
    }
  };

  // ── INSERT / UPDATE lugar desde el modal → Supabase ──
  const handleSavePlace = async () => {
    const placeName = newPlaceType === "Otro" ? newAddressLabel.trim() : newPlaceType;
    if (placeName === "" || newAddress.trim() === "") {
      showAlert('error', 'Error', 'Por favor, completa todos los campos.');
      return;
    }
    if (isTypeTaken(newPlaceType, editingPlace?.id)) {
      showTypeTakenAlert(newPlaceType);
      return;
    }
    if (editingPlace) {
      await handleUpdatePlace(editingPlace, placeName);
      return;
    }
    if (!newAddressDetails) {
      showAlert('error', 'Error', 'Por favor, selecciona una dirección válida.');
      return;
    }
    if (!supabaseUserId) {
      showAlert('error', 'Error', 'No se pudo identificar tu usuario.');
      return;
    }
    if (favoriteCount >= MAX_FAVORITES) {
      showAlert('warning', 'Límite alcanzado', `Solo puedes tener ${MAX_FAVORITES} lugares favoritos. Elimina uno para agregar otro.`);
      return;
    }

    try {
      const headers = await getSupabaseAuthHeaders(true);
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/favorite_places`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          user_id: supabaseUserId,
          name: placeName,
          description: newAddress,
          latitude: newAddressDetails.geometry.location.lat,
          longitude: newAddressDetails.geometry.location.lng,
          is_favorite: true,
          type_address: newPlaceType,
          usage_count: 1,
        }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        if (err.includes('máximo 5') || err.includes('P0001')) {
          showAlert('warning', 'Límite alcanzado', `Solo puedes tener ${MAX_FAVORITES} lugares favoritos.`);
        } else {
          console.warn('[FavPlaces] modal insert error:', err);
          showAlert('error', 'Error', 'No se pudo guardar el lugar.');
        }
        return;
      }
      const inserted = (await resp.json())[0];
      const newAddr: Address = {
        id: inserted.id,
        label: inserted.name,
        address: inserted.description,
        isFavorite: inserted.is_favorite,
        typeAddress: inserted.type_address,
        lat: inserted.latitude,
        lng: inserted.longitude,
        usageCount: inserted.usage_count,
      };
      setAddresses(prev => [newAddr, ...prev]);
    } catch (e) {
      console.warn('[FavPlaces] handleSavePlace error:', e);
      showAlert('error', 'Error', 'Error de conexión al guardar.');
    }

    closePlaceModal();
  };

  const handleLocationSelect = (data: any, details: any = null) => {
    if (details) {
      const selectedAddr = details.formatted_address;
      setNewAddress(selectedAddr);
      setNewAddressDetails(details);
    } else {
      setNewAddress(data.description);
      setNewAddressDetails(null);
    }
  };

  // ── DELETE lugar de Supabase ──
  const handleDeleteAddress = (id: string) => {
    showAlert('confirm', 'Eliminar dirección', '¿Está Seguro de eliminar esta dirección favorita?', [
      { text: 'Cancelar', style: 'cancel', onPress: () => setAlertVisible(false) },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setAlertVisible(false);
          try {
            const headers = await getSupabaseAuthHeaders(true);
            const url = `${SUPABASE_URL}/rest/v1/favorite_places?id=eq.${encodeURIComponent(id)}`;
            const resp = await fetch(url, { method: 'DELETE', headers });
            if (!resp.ok) {
              showAlert('error', 'Error', 'No se pudo eliminar el lugar.');
              return;
            }
            setAddresses(prev => prev.filter(a => a.id !== id));
          } catch (e) {
            console.warn('[FavPlaces] delete error:', e);
            showAlert('error', 'Error', 'Error de conexión al eliminar.');
          }
        },
      },
    ]);
  };

  const getTypeIcon = (type: string | null) => {
    if (!type || !TYPE_ICONS[type]) return null;
    const { icon, color } = TYPE_ICONS[type];
    return <MaterialCommunityIcons name={icon as any} size={16} color={color} />;
  };

  const renderPlaceTypeSelector = (
    selected: string | null,
    onSelect: (type: PlaceType) => void,
    excludeId?: string,
  ) => (
    <View style={styles.placeTypeRow}>
      {PLACE_TYPES.map((type) => {
        const isSelected = selected === type;
        const taken = isTypeTaken(type, excludeId);
        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.placeTypeOption,
              isSelected && styles.placeTypeOptionOn,
              taken && styles.placeTypeOptionTaken,
            ]}
            onPress={() => (taken ? showTypeTakenAlert(type) : onSelect(type))}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons
              name={TYPE_ICONS[type].icon as any}
              size={20}
              color={isSelected ? "#051A26" : "#00E5FF"}
            />
            <Text style={[styles.placeTypeTxt, isSelected && styles.placeTypeTxtOn]}>{type}</Text>
            {taken && <Text style={styles.placeTypeTakenTxt}>Registrada</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderAddressItem = ({ item, index }: { item: Address; index: number }) => {
    const typeInfo = item.typeAddress ? TYPE_ICONS[item.typeAddress] : null;
    return (
      <Animatable.View animation="fadeInUp" duration={600} delay={index * 80} useNativeDriver>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openEditPlaceModal(item)}
          style={styles.cardOuter}
        >
          <LinearGradient
            colors={["rgba(0,229,255,0.08)", "rgba(0,229,255,0.02)", "rgba(3,7,18,0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addressCard}
          >
            {/* Icon circle */}
            <View style={[styles.iconCircle, { borderColor: typeInfo?.color || "#00E5FF" }]}>
              {typeInfo ? (
                <MaterialCommunityIcons name={typeInfo.icon as any} size={22} color={typeInfo.color} />
              ) : (
                <Entypo name="location-pin" size={22} color="#00E5FF" />
              )}
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                {item.isFavorite && (
                  <Entypo name="star" size={16} color="#00E5FF" style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text style={styles.cardAddress} numberOfLines={2}>
                {item.address}
              </Text>
              {item.typeAddress && !isFixedNameType(item.typeAddress) && (
                <View style={[styles.typeBadge, { borderColor: typeInfo?.color || "#00E5FF" }]}>
                  {getTypeIcon(item.typeAddress)}
                  <Text style={[styles.typeBadgeText, { color: typeInfo?.color || "#00E5FF" }]}>
                    {item.typeAddress}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => openEditPlaceModal(item)}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <MaterialIcons name="edit" size={20} color="rgba(0,229,255,0.85)" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteAddress(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="delete-outline" size={22} color="rgba(255,82,82,0.7)" />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const renderEmptyList = () => (
    <Animatable.View animation="fadeIn" duration={800} style={styles.emptyContainer}>
      <MaterialCommunityIcons name="map-marker-off-outline" size={64} color="rgba(0,229,255,0.25)" />
      <Text style={styles.emptyTitle}>Sin direcciones guardadas</Text>
      <Text style={styles.emptySubtitle}>
        Toca el botón + para agregar tu primera dirección favorita
      </Text>
    </Animatable.View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Background gradient */}
      <LinearGradient colors={["#030712", "#051A26", "#030712"]} style={StyleSheet.absoluteFill} />

      {/* Diamond particles */}
      {PARTICLES.map((p, i) => (
        <DiamondParticle key={i} {...p} />
      ))}

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          isCustomer && styles.headerCustomer,
          {
            paddingTop: headerTopPadding,
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
          },
        ]}
      >
        {!isCustomer ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <AntDesign name="arrow-left" size={24} color="#E9F6FF" />
          </TouchableOpacity>
        ) : null}
        <View style={[styles.headerTitleWrap, isCustomer && styles.headerTitleWrapCustomer]}>
          {isCustomer ? <Text style={styles.headerEyebrow}>T+plus</Text> : null}
          <Text style={styles.headerTitle}>Mis Lugares Favoritos</Text>
          <Text style={styles.headerSubtitle}>
            {favoriteCount}/{MAX_FAVORITES} favoritos • {addresses.length} {addresses.length === 1 ? "lugar" : "lugares"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openNewPlaceModal()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#00E5FF", "#00B8D4"]}
            style={styles.addButtonGradient}
          >
            <Entypo name="plus" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Search bar - Google Places Autocomplete */}
      <View style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 4, zIndex: 50 }}>
        <GooglePlacesAutocomplete
          ref={searchAutocompleteRef}
          enablePoweredByContainer={false}
          placeholder="Buscar destino..."
          minLength={3}
          debounce={400}
          fetchDetails={true}
          keyboardShouldPersistTaps="handled"
          listViewDisplayed="auto"
          keepResultsAfterBlur={true}
          onPress={handleSearchSelect}
          query={{
            key: API_KEY,
            language: "es",
            components: "country:co",
          }}
          textInputProps={{
            onChangeText: (text: string) => setSearchQuery(text),
            selectionColor: "#00E5FF",
            placeholderTextColor: "rgba(255,255,255,0.3)",
          }}
          renderLeftButton={() => (
            <View style={styles.searchIconLeft}>
              <Ionicons name="search" size={18} color="rgba(0,229,255,0.6)" />
            </View>
          )}
          renderRightButton={() =>
            searchQuery.length > 0 ? (
              <TouchableOpacity
                style={styles.searchClearBtn}
                onPress={() => {
                  setSearchQuery("");
                  searchAutocompleteRef.current?.setAddressText("");
                }}
              >
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            ) : null
          }
          styles={{
            container: { flex: 0 },
            textInputContainer: {
              backgroundColor: "transparent",
              borderTopWidth: 0,
              borderBottomWidth: 0,
            },
            textInput: {
              height: 46,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(0,229,255,0.1)",
              borderRadius: 14,
              paddingLeft: 40,
              paddingRight: 36,
              fontSize: 15,
              color: "#fff",
            },
            listView: {
              backgroundColor: "#0D2137",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(0,229,255,0.15)",
              marginTop: 4,
              elevation: 10,
              shadowColor: "#00E5FF",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            row: {
              backgroundColor: "transparent",
              paddingVertical: 14,
              paddingHorizontal: 16,
            },
            separator: { backgroundColor: "rgba(0,229,255,0.08)", height: 1 },
            description: { color: "#fff", fontSize: 14 },
          }}
          nearbyPlacesAPI="GooglePlacesSearch"
        />
      </View>

      {/* Section header */}
      <Animatable.View animation="fadeInLeft" duration={600} delay={300}>
        <View style={styles.sectionRow}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>Lugares Frecuentes</Text>
          <View style={styles.sectionLine} />
        </View>
      </Animatable.View>

      {/* Address list */}
      <Animated.View style={[styles.listWrapper, { opacity: listAnim, zIndex: 1 }]}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>Cargando lugares...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAddresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, isCustomer && { paddingBottom: navBottomPad + 30 }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyList}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </Animated.View>

      {/* Modal: Nuevo / Editar lugar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closePlaceModal}
        presentationStyle="overFullScreen"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: modalBottomPadding }]}>
            <LinearGradient
              colors={["#0A1628", "#0D2137", "#0A1628"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* Modal glow */}
            <View style={styles.modalGlow} />

            <Text style={styles.modalTitle}>{editingPlace ? "Editar lugar" : "Nuevo Lugar"}</Text>
            <Text style={styles.modalSubtitle}>
              {editingPlace ? "Actualiza el tipo, nombre o dirección" : "Agrega una dirección a tus favoritos"}
            </Text>

            <Text style={styles.favoriteTypeTitle}>Tipo de lugar</Text>
            {renderPlaceTypeSelector(newPlaceType, setNewPlaceType, editingPlace?.id)}

            <View style={{ marginVertical: 12, zIndex: 10 }}>
              {newPlaceType === "Otro" && (
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="label-outline" size={20} color="#00E5FF" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del lugar (ej. Gimnasio)"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={newAddressLabel}
                    onChangeText={setNewAddressLabel}
                    selectionColor="#00E5FF"
                  />
                </View>
              )}
              <GooglePlacesAutocomplete
                ref={placeAutocompleteRef}
                placeholder="Buscar dirección..."
                minLength={2}
                fetchDetails={true}
                onPress={handleLocationSelect}
                textInputProps={{
                  placeholderTextColor: "rgba(255,255,255,0.35)",
                  selectionColor: "#00E5FF",
                }}
                query={{
                  key: API_KEY,
                  language: "es",
                  components: "country:co",
                }}
                styles={{
                  textInput: {
                    height: 48,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(0,229,255,0.15)",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingLeft: 40,
                    fontSize: 15,
                    color: "#fff",
                  },
                  container: { flex: 0, zIndex: 10 },
                  listView: {
                    position: "absolute",
                    top: 52,
                    zIndex: 20,
                    backgroundColor: "#0D2137",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(0,229,255,0.15)",
                    elevation: 10,
                  },
                  row: { backgroundColor: "transparent", paddingVertical: 12 },
                  description: { color: "#fff", fontSize: 14 },
                  separator: { backgroundColor: "rgba(0,229,255,0.08)" },
                }}
                renderLeftButton={() => (
                  <View style={styles.autocompleteIcon}>
                    <Ionicons name="location-sharp" size={18} color="#00E5FF" />
                  </View>
                )}
                nearbyPlacesAPI="GooglePlacesSearch"
                debounce={200}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSavePlace} activeOpacity={0.8}>
              <LinearGradient colors={["#00E5FF", "#00B8D4"]} style={styles.saveButtonGradient}>
                <Ionicons name={editingPlace ? "checkmark-circle" : "bookmark"} size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>{editingPlace ? "Guardar cambios" : "Guardar Lugar"}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closePlaceModal}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#030712",
  },
  // ─── Header ───
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerCustomer: {
    backgroundColor: "rgba(5,26,38,0.85)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitleWrapCustomer: {
    paddingHorizontal: 0,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00E5FF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  addButton: {
    borderRadius: 22,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  // ─── Search ───
  searchIconLeft: {
    position: "absolute",
    left: 12,
    top: 14,
    zIndex: 25,
  },
  searchClearBtn: {
    position: "absolute",
    right: 12,
    top: 14,
    zIndex: 25,
  },
  // ─── Section ───
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,229,255,0.12)",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(0,229,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginHorizontal: 12,
  },
  // ─── List ───
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  // ─── Card ───
  cardOuter: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.1)",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: "rgba(0,229,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  cardAddress: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 3,
    lineHeight: 18,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(0,229,255,0.04)",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 6,
  },
  // ─── Empty ───
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  // ─── Modals ───
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.12)",
    borderBottomWidth: 0,
  },
  modalGlow: {
    position: "absolute",
    top: -60,
    left: width / 2 - 80,
    width: 160,
    height: 120,
    borderRadius: 80,
    backgroundColor: "#00E5FF",
    opacity: 0.08,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
  },
  autocompleteIcon: {
    position: "absolute",
    left: 12,
    top: 14,
    zIndex: 15,
  },
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 16,
    elevation: 6,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelButtonText: {
    color: "rgba(0,229,255,0.7)",
    fontWeight: "600",
    fontSize: 15,
  },
  // ─── Detail modal ───
  favoriteTypeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(0,229,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  placeTypeRow: {
    flexDirection: "row",
    gap: 10,
  },
  placeTypeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.15)",
  },
  placeTypeOptionOn: {
    backgroundColor: "#00E5FF",
    borderColor: "#00E5FF",
  },
  placeTypeOptionTaken: {
    opacity: 0.45,
  },
  placeTypeTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  placeTypeTxtOn: {
    color: "#051A26",
    fontWeight: "700",
  },
  placeTypeTakenTxt: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
});




