import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RootState } from "@/common/store";
import { Database } from "@/config/database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';

const BG_IMAGE = require("../../assets/images/bg.png");
const DEFAULT_CAR_IMAGE = require("../../assets/images/TREAS-X.png");

const CATEGORY_IMAGES: Record<string, any> = {
  "T+Plus Taxi": require("../../assets/images/categoryTaxi.png"),
  "T+Plus Van": require("../../assets/images/categoryVan.png"),
  "T+Plus Particular": require("../../assets/images/categoryParticular.png"),
  "T+Plus Especial": require("../../assets/images/categoryEspecial.png"),
};

const getCategoryImage = (carType?: string) => {
  if (carType && CATEGORY_IMAGES[carType]) {
    return CATEGORY_IMAGES[carType];
  }
  return DEFAULT_CAR_IMAGE;
};

const PLATE_CHECK_URL = `${SUPABASE_URL}/rest/v1/cars`;
const PLATE_DEBOUNCE_MS = 600;

type PickerTarget = "ownership" | "vehicle" | null;

type VehicleFormData = {
  vehicleNumber: string;
  vehicleNoMotor: string;
  vehicleNoChasis: string;
  vehicleForm: string;
  vehicleModel: string;
  vehicleMake: string;
  vehicleCylinders: string;
  vehicleColor: string;
  vehicleFuel: string;
  vehicleNoVin: string;
  vehicleNoSerie: string;
  vehiclePassengers: string;
  carType: string;
  vehicleMetalup: string;
  vehicleDoors: string;
};

type SelectOption = { label: string; value: string };

const INITIAL_VEHICLE_DATA: VehicleFormData = {
  vehicleNumber: "",
  vehicleNoMotor: "",
  vehicleNoChasis: "",
  vehicleForm: "",
  vehicleModel: "",
  vehicleMake: "",
  vehicleCylinders: "",
  vehicleColor: "",
  vehicleFuel: "",
  vehicleNoVin: "",
  vehicleNoSerie: "",
  vehiclePassengers: "",
  carType: "TREAS-X",
  vehicleMetalup: "",
  vehicleDoors: "",
};

type CarInsert = Database["public"]["Tables"]["cars"]["Insert"];

const OCR_ENDPOINTS = [
  "https://us-central1-treasupdate.cloudfunctions.net/analyzeImage",
  "https://us-central1-treasupdate.cloudfunctions.net/detectCar",
];

const VEHICLE_TEXT_PATTERNS: Partial<Record<keyof VehicleFormData, RegExp[]>> = {
  vehicleNoMotor: [/(?:MOTOR|NO\.?\s*MOTOR|NUMERO\s*DE\s*MOTOR)\s*[:#-]?\s*([A-Z0-9-]{5,})/i],
  vehicleNoChasis: [/(?:CHASIS|CHASIS\s*NO\.?|NUMERO\s*DE\s*CHASIS)\s*[:#-]?\s*([A-Z0-9-]{5,})/i],
  vehicleNoVin: [/(?:VIN|NUMERO\s*DE\s*VIN)\s*[:#-]?\s*([A-Z0-9-]{8,})/i],
  vehicleNoSerie: [/(?:SERIE|NUMERO\s*DE\s*SERIE)\s*[:#-]?\s*([A-Z0-9-]{5,})/i],
  vehiclePassengers: [/(?:PASAJEROS|PUESTOS)\s*[:#-]?\s*(\d{1,2})/i],
  vehicleDoors: [/(?:PUERTAS)\s*[:#-]?\s*(\d{1,2})/i],
};

const findVehicleFieldValue = (text: string, patterns: RegExp[] = []) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
};

const REQUIRED_FIELDS: Array<keyof VehicleFormData> = [
  "vehicleNumber",
  "vehicleMake",
  "vehicleModel",
  "vehicleForm",
  "vehicleFuel",
  "carType",
];

const formatDebugError = (error: unknown) => {
  if (!error) {
    return "Error desconocido";
  }

  if (error instanceof Error) {
    const asAny = error as any;
    const code = asAny?.code ? ` | code=${asAny.code}` : "";
    const details = asAny?.details ? ` | details=${asAny.details}` : "";
    const hint = asAny?.hint ? ` | hint=${asAny.hint}` : "";
    return `${error.message}${code}${details}${hint}`;
  }

  try {
    return JSON.stringify(error);
  } catch (_jsonError) {
    return String(error);
  }
};

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractVehicleInfoFromText = (
  sourceText: string,
  brands: Array<{ label: string; value: string }>
): Partial<VehicleFormData> => {
  const text = sourceText
    .replace(/\s+/g, " ")
    .replace(/[|]/g, "I")
    .trim();
  const upperText = text.toUpperCase();

  const plateMatch = upperText.match(/\b[A-Z]{3}\s?\d{3}\b|\b[A-Z]{3}\s?\d{2}[A-Z]\b/);
  const modelMatch = upperText.match(/\b20(0[6-9]|1\d|2[0-6])\b/);
  const fuelMatch =
    upperText.includes("DIESEL") ? "Diesel" :
    upperText.includes("ELECTR") ? "ELECTRICO" :
    upperText.includes("GASOL") ? "Gasolina" :
    upperText.includes(" GAS ") ? "Gas" :
    "";
  const formMatch = ["AUTOMOVIL", "CAMIONETA", "VAN", "MICROBUS", "CAMPERO"].find((item) => upperText.includes(item)) || "";
  const bodyworkMatch = ["VAN", "4X4", "CERRADA", "COUPE", "DOBLE CABINA", "HATCH BACK", "MINIVAN", "CROSSOVER", "SEDAN", "STATION WAGON"]
    .find((item) => upperText.includes(item.toUpperCase())) || "";
  const matchedBrand = brands.find((brand) => upperText.includes(brand.value.toUpperCase()));

  return {
    vehicleNumber: plateMatch ? plateMatch[0].replace(/\s+/g, "") : "",
    vehicleNoMotor: findVehicleFieldValue(text, VEHICLE_TEXT_PATTERNS.vehicleNoMotor),
    vehicleNoChasis: findVehicleFieldValue(text, VEHICLE_TEXT_PATTERNS.vehicleNoChasis),
    vehicleNoVin: findVehicleFieldValue(text, VEHICLE_TEXT_PATTERNS.vehicleNoVin),
    vehicleNoSerie: findVehicleFieldValue(text, VEHICLE_TEXT_PATTERNS.vehicleNoSerie),
    vehiclePassengers: findVehicleFieldValue(text, VEHICLE_TEXT_PATTERNS.vehiclePassengers),
    vehicleDoors: findVehicleFieldValue(text, VEHICLE_TEXT_PATTERNS.vehicleDoors),
    vehicleModel: modelMatch?.[0] || "",
    vehicleFuel: fuelMatch,
    vehicleForm: formMatch,
    vehicleMetalup: bodyworkMatch,
    vehicleMake: matchedBrand?.value || "",
  };
};

const CarsEditScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const authUser = useSelector((state: RootState) => state.auth.user) as any;

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUriVehicle, setImageUriVehicle] = useState<string | null>(null);
  const [imageBase64Vehicle, setImageBase64Vehicle] = useState<string | null>(null);
  const [log, setLog] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [vehicleData, setVehicleData] = useState<VehicleFormData>(INITIAL_VEHICLE_DATA);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectModalTitle, setSelectModalTitle] = useState("");
  const [activeSelectField, setActiveSelectField] = useState<keyof VehicleFormData | null>(null);
  const [activeSelectOptions, setActiveSelectOptions] = useState<SelectOption[]>([]);
  const [plateExists, setPlateExists] = useState(false);
  const [plateMsg, setPlateMsg] = useState("");
  const [plateChecking, setPlateChecking] = useState(false);
  const [driverVehicleCount, setDriverVehicleCount] = useState<number | null>(null);
  const plateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedDriverIdRef = useRef<string | null>(null);
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

  const vehicleTypes = ["Automovil", "Camioneta", "VAN", "Microbus", "Campero"];
  const serviceTypes = [
    { description: "TaxiPlus (Vehículo tipo Taxi)", value: "T+Plus Taxi" },
    { description: "VanPlus (Van Pax 11 Servicio Especial)", value: "T+Plus Van" },
    { description: "XPlus (Vehículo Particular Sedan o Hatchback 2006 en adelante)", value: "T+Plus Particular" },
    { description: "ConfortPlus (Camioneta o Automóvil Servicio de Especial)", value: "T+Plus Especial" },
  ];
  const bodyworkTypes = ["VAN", "4x4", "Cerrada", "Coupe", "Doble Cabina", "Hatch Back", "MiniVan", "CROSSOVER", "Sedan", "Station Wagon"];
  const marcasDeVehiculos = [
    { label: "Brilliance", value: "Brilliance" },
    { label: "Byd", value: "Byd" },
    { label: "Chana", value: "Chana" },
    { label: "Changan", value: "Changan" },
    { label: "Chery", value: "Chery" },
    { label: "Chery Tiggo", value: "Chery Tiggo" },
    { label: "Chevrolet", value: "Chevrolet" },
    { label: "Chevrolet Aveo", value: "Chevrolet Aveo" },
    { label: "Chevrolet Beat", value: "Chevrolet Beat" },
    { label: "Chevrolet Camaro", value: "Chevrolet Camaro" },
    { label: "Chevrolet Captiva", value: "Chevrolet Captiva" },
    { label: "Chevrolet Corsa", value: "Chevrolet Corsa" },
    { label: "Chevrolet Cruze", value: "Chevrolet Cruze" },
    { label: "Chevrolet Optra", value: "Chevrolet Optra" },
    { label: "Chevrolet Sail", value: "Chevrolet Sail" },
    { label: "Chevrolet Sonic", value: "Chevrolet Sonic" },
    { label: "Chevrolet Spark", value: "Chevrolet Spark" },
    { label: "Chevrolet Swift", value: "Chevrolet Swift" },
    { label: "Chevrolet Tracker", value: "Chevrolet Tracker" },
    { label: "Citroen", value: "Citroen" },
    { label: "Dfsk", value: "Dfsk" },
    { label: "Dodge", value: "Dodge" },
    { label: "BYD ELA‰CTRICO", value: "BYD ELA‰CTRICO" },
    { label: "FAW", value: "FAW" },
    { label: "Fiat", value: "Fiat" },
    { label: "Ford", value: "Ford" },
    { label: "Ford Ecosport", value: "Ford Ecosport" },
    { label: "Ford Fiesta", value: "Ford Fiesta" },
    { label: "Fotton", value: "Fotton" },
    { label: "Geely", value: "Geely" },
    { label: "Great", value: "Great" },
    { label: "Honda", value: "Honda" },
    { label: "Honda Civic", value: "Honda Civic" },
    { label: "Hyundai", value: "Hyundai" },
    { label: "Hyundai Accent", value: "Hyundai Accent" },
    { label: "Hyundai I10", value: "Hyundai I10" },
    { label: "Hyundai I25", value: "Hyundai I25" },
    { label: "Hyundai Tucson", value: "Hyundai Tucson" },
    { label: "Jac", value: "Jac" },
    { label: "Jac S2", value: "Jac S2" },
    { label: "Kia", value: "Kia" },
    { label: "Kia ", value: "Kia " },
    { label: "Kia Carens", value: "Kia Carens" },
    { label: "Kia Cerato", value: "Kia Cerato" },
    { label: "Kia Picanto", value: "Kia Picanto" },
    { label: "Kia Rio", value: "Kia Rio" },
    { label: "Kia Soul", value: "Kia Soul" },
    { label: "Kia Sportage", value: "Kia Sportage" },
    { label: "Lifan", value: "Lifan" },
    { label: "Mahindra", value: "Mahindra" },
    { label: "Mazda", value: "Mazda" },
    { label: "Mazda 2", value: "Mazda 2" },
    { label: "Mazda 3", value: "Mazda 3" },
    { label: "Mazda 6", value: "Mazda 6" },
    { label: "Mazda Bt 50", value: "Mazda Bt 50" },
    { label: "Mg", value: "Mg" },
    { label: "Nissan", value: "Nissan" },
    { label: "Nissan ", value: "Nissan " },
    { label: "Nissan March", value: "Nissan March" },
    { label: "Nissan Sentra", value: "Nissan Sentra" },
    { label: "Nissan Tiida", value: "Nissan Tiida" },
    { label: "Nissan Versa", value: "Nissan Versa" },
    { label: "Nissan X Trail", value: "Nissan X Trail" },
    { label: "Peugeot", value: "Peugeot" },
    { label: "Renault", value: "Renault" },
    { label: "Renault Clio", value: "Renault Clio" },
    { label: "Renault Duster", value: "Renault Duster" },
    { label: "Renault Koleos", value: "Renault Koleos" },
    { label: "Renault Kwid", value: "Renault Kwid" },
    { label: "Renault Logan", value: "Renault Logan" },
    { label: "Renault Sandero", value: "Renault Sandero" },
    { label: "Renault Stepway", value: "Renault Stepway" },
    { label: "Renault Symbol", value: "Renault Symbol" },
    { label: "Saic Wuling", value: "Saic Wuling" },
    { label: "Sail", value: "Sail" },
    { label: "Seat", value: "Seat" },
    { label: "Skoda", value: "Skoda" },
    { label: "Spark", value: "Spark" },
    { label: "Ssang Yong", value: "Ssang Yong" },
    { label: "Suzuki", value: "Suzuki" },
    { label: "Suzuki Jimny", value: "Suzuki Jimny" },
    { label: "Suzuki Swift", value: "Suzuki Swift" },
    { label: "Suzuky", value: "Suzuky" },
    { label: "Toyota", value: "Toyota" },
    { label: "Toyota Corolla", value: "Toyota Corolla" },
    { label: "Volkswagen", value: "Volkswagen" },
    { label: "Volkswagen Gol", value: "Volkswagen Gol" },
    { label: "Volkswagen Voyage", value: "Volkswagen Voyage" },
    { label: "Zotye", value: "Zotye" },
    { label: "Otra", value: "Otra" },
  ];
  const CilindrajesDeVehiculos = [
    { label: "Menos de 1.0L", value: "Menos de 1.0L" },
    { label: "1.0L - 1.4L", value: "1.0L - 1.4L" },
    { label: "1.5L - 1.9L", value: "1.5L - 1.9L" },
    { label: "2.0L - 2.4L", value: "2.0L - 2.4L" },
    { label: "2.5L - 2.9L", value: "2.5L - 2.9L" },
    { label: "3.0L - 3.4L", value: "3.0L - 3.4L" },
    { label: "3.5L - 3.9L", value: "3.5L - 3.9L" },
    { label: "4.0L - 4.4L", value: "4.0L - 4.4L" },
    { label: "4.5L - 4.9L", value: "4.5L - 4.9L" },
    { label: "MA¡s de 5.0L", value: "MA¡s de 5.0L" },
  ];
  const TipoCombustible = [
    { label: "GASOLINA", value: "Gasolina" },
    { label: "DIESEL", value: "Diesel" },
    { label: "Electrico", value: "ELECTRICO" },
    { label: "GAS", value: "Gas" },
    { label: "Gas/Gasol", value: "GasolGas" },
    { label: "Gasol/Elect", value: "GasolElect" },
  ];
  const ModelosDeVehiculos = [
    { label: "2006", value: "2006" },
    { label: "2007", value: "2007" },
    { label: "2008", value: "2008" },
    { label: "2009", value: "2009" },
    { label: "2010", value: "2010" },
    { label: "2011", value: "2011" },
    { label: "2012", value: "2012" },
    { label: "2013", value: "2013" },
    { label: "2014", value: "2014" },
    { label: "2015", value: "2015" },
    { label: "2016", value: "2016" },
    { label: "2017", value: "2017" },
    { label: "2018", value: "2018" },
    { label: "2019", value: "2019" },
    { label: "2020", value: "2020" },
    { label: "2021", value: "2021" },
    { label: "2022", value: "2022" },
    { label: "2023", value: "2023" },
    { label: "2024", value: "2024" },
    { label: "2025", value: "2025" },
    { label: "2026", value: "2026" },
    { label: "2027", value: "2027" },
  ];

  // â”€â”€ Resolver driver_id al montar y contar vehÃ­culos â”€â”€
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authId = authUser?.auth_id || authUser?.id;
        if (!authId) return;

        // Resolver driver_id
        const userUrl = `${PLATE_CHECK_URL.replace('/cars', '/users')}?or=(auth_id.eq.${encodeURIComponent(authId)},id.eq.${encodeURIComponent(authId)})&select=id&limit=1`;
        const userRes = await fetch(userUrl, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        if (!userRes.ok || cancelled) return;
        const users = await userRes.json();
        if (!Array.isArray(users) || users.length === 0 || cancelled) return;
        const driverId = users[0].id;
        resolvedDriverIdRef.current = driverId;

        // Contar vehÃ­culos del conductor
        const countUrl = `${PLATE_CHECK_URL}?driver_id=eq.${encodeURIComponent(driverId)}&select=id`;
        const countRes = await fetch(countUrl, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        if (!countRes.ok || cancelled) return;
        const cars = await countRes.json();
        if (!cancelled) setDriverVehicleCount(Array.isArray(cars) ? cars.length : 0);
      } catch (e) {
        console.warn("Error al contar vehiculos:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [authUser?.id, authUser?.auth_id]);

  // â”€â”€ ValidaciÃ³n de placa en tiempo real â”€â”€
  useEffect(() => {
    const plate = (vehicleData.vehicleNumber || "").trim().toUpperCase();

    if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current);

    if (!plate || plate.length < 5 || !/^[A-Z0-9-]{5,8}$/.test(plate)) {
      setPlateExists(false);
      setPlateMsg("");
      setPlateChecking(false);
      return;
    }

    setPlateChecking(true);

    plateDebounceRef.current = setTimeout(async () => {
      try {
        // Buscar todos los registros con esta placa
        const url = `${PLATE_CHECK_URL}?plate=eq.${encodeURIComponent(plate)}&select=id,driver_id`;
        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        if (!res.ok) {
          setPlateExists(false);
          setPlateMsg("");
          return;
        }

        const rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          // Placa disponible
          setPlateExists(false);
          setPlateMsg("");
          return;
        }

        const currentDriverId = resolvedDriverIdRef.current;

        // Verificar si ESTE conductor ya tiene esta placa
        const alreadyMine = rows.some((r: any) => r.driver_id === currentDriverId);
        if (alreadyMine) {
          setPlateExists(true);
          setPlateMsg("Ya tienes esta placa registrada en tus vehiculos");
          return;
        }

        // Contar conductores distintos que tienen esta placa
        const uniqueDrivers = new Set(rows.map((r: any) => r.driver_id));
        if (uniqueDrivers.size >= 3) {
          setPlateExists(true);
          setPlateMsg("Esta placa ya alcanza el maximo de 3 conductores");
          return;
        }

        // Placa vÃ¡lida â€” otro conductor la tiene pero aÃºn hay cupo
        setPlateExists(false);
        setPlateMsg(`Placa compartida (${uniqueDrivers.size}/3 conductores)`);
      } catch {
        setPlateExists(false);
        setPlateMsg("");
      } finally {
        setPlateChecking(false);
      }
    }, PLATE_DEBOUNCE_MS);

    return () => {
      if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current);
    };
  }, [vehicleData.vehicleNumber]);

  const isFormComplete = useMemo(
    () => REQUIRED_FIELDS.every((field) => (vehicleData[field] || "").trim() !== ""),
    [vehicleData]
  );

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<keyof VehicleFormData, string>> = {};

    REQUIRED_FIELDS.forEach((field) => {
      if (!(vehicleData[field] || "").trim()) {
        errors[field] = "Este campo es obligatorio";
      }
    });

    const plate = (vehicleData.vehicleNumber || "").trim().toUpperCase();
    if (plate && !/^[A-Z0-9-]{5,8}$/.test(plate)) {
      errors.vehicleNumber = "Placa invalida (5-8 caracteres alfanumericos)";
    }

    const doorsRaw = (vehicleData.vehicleDoors || "").trim();
    if (doorsRaw) {
      if (!/^\d+$/.test(doorsRaw)) {
        errors.vehicleDoors = "Debe ser un numero entero";
      } else {
        const doors = Number.parseInt(doorsRaw, 10);
        if (doors < 1 || doors > 7) {
          errors.vehicleDoors = "Puertas debe estar entre 1 y 7";
        }
      }
    }

    const passengersRaw = (vehicleData.vehiclePassengers || "").trim();
    if (passengersRaw) {
      if (!/^\d+$/.test(passengersRaw)) {
        errors.vehiclePassengers = "Debe ser un numero entero";
      } else {
        const passengers = Number.parseInt(passengersRaw, 10);
        if (passengers < 1 || passengers > 12) {
          errors.vehiclePassengers = "Pasajeros debe estar entre 1 y 12";
        }
      }
    }

    return errors;
  }, [vehicleData]);

  const hasValidationErrors = useMemo(
    () => Object.keys(fieldErrors).length > 0 || plateExists || (driverVehicleCount !== null && driverVehicleCount >= 2),
    [fieldErrors, plateExists, driverVehicleCount]
  );

  const completedFields = useMemo(() => {
    const fieldCount = Object.values(vehicleData).filter(Boolean).length;
    return fieldCount + (imageUriVehicle ? 1 : 0);
  }, [imageUriVehicle, vehicleData]);

  const totalFields = Object.keys(vehicleData).length + 1;
  const headerTopPadding = Platform.OS === "android" ? Math.max(insets.top, 10) + 8 : insets.top + 8;
  const footerBottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 14) + 12 : insets.bottom + 14;

  const normalizeFieldValue = (field: keyof VehicleFormData, value: string) => {
    if (["vehicleNumber", "vehicleNoMotor", "vehicleNoChasis", "vehicleNoVin", "vehicleNoSerie"].includes(field)) {
      return value.toUpperCase();
    }

    return value;
  };

  const openSelectModal = (
    field: keyof VehicleFormData,
    label: string,
    options: SelectOption[]
  ) => {
    setActiveSelectField(field);
    setSelectModalTitle(label);
    setActiveSelectOptions(options.filter((item) => (item.value || "").trim() !== ""));
    setSelectModalVisible(true);
  };

  const closeSelectModal = () => {
    setSelectModalVisible(false);
    setActiveSelectField(null);
    setActiveSelectOptions([]);
    setSelectModalTitle("");
  };

  const updateField = (field: keyof VehicleFormData, value: string) => {
    setVehicleData((current) => ({
      ...current,
      [field]: normalizeFieldValue(field, value ?? ""),
    }));
  };

  const getBase64 = (uri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = function () {
        reject(new Error("Failed to fetch base64 from uri"));
      };
      xhr.open("GET", uri);
      xhr.responseType = "blob";
      xhr.send();
    });
  };

  const processImage = async (uri: string) => {
    setLoading(true);
    setLog("");

    try {
      const base64 = await getBase64(uri);
      let responseData: any = null;
      let lastError: unknown = null;

      for (const endpoint of OCR_ENDPOINTS) {
        try {
          const response = await axios.post(endpoint, { imageBase64: base64 });
          responseData = response.data;
          break;
        } catch (error) {
          lastError = error;

          if (!axios.isAxiosError(error) || error.response?.status !== 404) {
            throw error;
          }
        }
      }

      if (!responseData) {
        throw lastError || new Error("OCR service unavailable");
      }

      const vehicleInfo = Array.isArray(responseData)
        ? extractVehicleInfoFromText(
            String(responseData?.[0]?.description || ""),
            marcasDeVehiculos
          )
        : responseData || {};
      const detectedValues = Object.values(vehicleInfo).filter(Boolean).length;

      setVehicleData((current) => ({
        ...current,
        ...vehicleInfo,
      }));
      setLog(
        detectedValues > 0
          ? "Tarjeta leida parcialmente. Revisa y completa los datos faltantes."
          : "Se analizo la imagen, pero no se detectaron campos suficientes. Completa el formulario manualmente."
      );
      setLoaded(true);
    } catch (error) {
      console.warn("Error processing image:", error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setLog("El servicio de lectura no esta disponible en este momento. Puedes seguir llenando el formulario manualmente.");
      } else {
        setLog("No se pudo leer la tarjeta de propiedad. Intenta nuevamente o completa el formulario manualmente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelection = async (fromCamera: boolean) => {
    if (!pickerTarget) {
      return;
    }

    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          showAlert(
            'warning',
            'Permiso requerido',
            'Necesitamos acceso a tu camara para tomar la foto. Activalo en Configuracion > Aplicaciones.'
          );
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showAlert(
            'warning',
            'Permiso requerido',
            'Necesitamos acceso a tu galeria para cargar la imagen. Activalo en Configuracion > Aplicaciones.'
          );
          return;
        }
      }

      const imageOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: pickerTarget === "vehicle" ? ([1, 1] as [number, number]) : ([5, 3] as [number, number]),
        quality: 0.85,
        base64: true,
      };

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(imageOptions)
        : await ImagePicker.launchImageLibraryAsync(imageOptions);

      if (result.canceled || !result.assets?.[0]?.uri) {
        setPickerTarget(null);
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      const base64 = asset.base64 || null;

      if (pickerTarget === "vehicle") {
        setImageUriVehicle(uri);
        setImageBase64Vehicle(base64);
      } else {
        setImageUri(uri);
        await processImage(uri);
      }
    } catch (err) {
      console.warn("Error al seleccionar imagen:", err);
      showAlert('error', 'Error', 'No se pudo abrir la camara o galeria. Intentalo de nuevo.');
    } finally {
      setPickerTarget(null);
    }
  };

  const isUuid = (value?: string) => {
    if (!value) {
      return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  const resolveDriverId = async (): Promise<string> => {
    if (resolvedDriverIdRef.current) {
      return resolvedDriverIdRef.current;
    }

    const candidateIds = [authUser?.auth_id, authUser?.id, authUser?.user_id]
      .map((value) => String(value || "").trim())
      .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

    if (candidateIds.length === 0) {
      throw new Error("No se pudo resolver el usuario autenticado.");
    }

    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };

    const uuidCandidates = candidateIds.filter((c) => isUuid(c));
    const allPromises: Promise<{ driverId?: string; error?: Error }>[] = [];

    for (const candidateId of uuidCandidates) {
      allPromises.push(
        fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(candidateId)}&select=id&limit=1`, {
          method: "GET",
          headers,
        })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0 && data[0].id) {
              return { driverId: data[0].id };
            }
            return {};
          })
          .catch((err) => ({ error: err }))
      );

      allPromises.push(
        fetch(`${SUPABASE_URL}/rest/v1/users?auth_id=eq.${encodeURIComponent(candidateId)}&select=id&limit=1`, {
          method: "GET",
          headers,
        })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0 && data[0].id) {
              return { driverId: data[0].id };
            }
            return {};
          })
          .catch((err) => ({ error: err }))
      );
    }

    const results = await Promise.all(allPromises);
    for (const result of results) {
      if (result.driverId) {
        return result.driverId;
      }
    }

    throw new Error("No se encontrA³ el perfil de conductor.");
  };

  const handleAddCar = async () => {
    if (!isFormComplete || hasValidationErrors || plateExists) {
      if (driverVehicleCount !== null && driverVehicleCount >= 2) {
        showAlert('warning', 'Limite alcanzado', 'Ya tienes el maximo de 2 vehiculos registrados. Elimina uno para agregar otro.');
        return;
      }
      setLog("Revisa los campos marcados antes de guardar.");
      showAlert('warning', 'Campos invalidos', 'Corrige los campos marcados para continuar.');
      return;
    }

    setLoading(true);
    setLog("[1/5] Iniciando guardado del vehiculo...");

    let debugStep = "inicio";

    try {
      debugStep = "resolver_driver_id";
      setLog("[2/5] Validando conductor en Base de Datos...");

      const driverId = await withTimeout(
        resolveDriverId(),
        30000,
        "La validacion del conductor tarda demasiado. Verifica tu conexion e intenta nuevamente."
      );

      const capacity = Number.parseInt(vehicleData.vehiclePassengers || "4", 10);

      // Build payload with only valid fields
      const carPayload: Partial<CarInsert> = {};
      carPayload.driver_id = driverId;
      carPayload.make = vehicleData.vehicleMake || "Sin marca";
      carPayload.model = vehicleData.vehicleModel || "Sin modelo";
      carPayload.plate = (vehicleData.vehicleNumber || "").toUpperCase().trim();
      if (vehicleData.vehicleColor) carPayload.color = vehicleData.vehicleColor;
      carPayload.fuel_type = vehicleData.vehicleFuel || "Gasolina";
      carPayload.transmission = "MECANICO";
      carPayload.capacity = Number.isFinite(capacity) && capacity > 0 ? capacity : 4;
      carPayload.is_active = false;
      // El base64 ya lo entrega expo-image-picker (base64: true) — evita fetch(file://)
      // que es inestable en Android release con Hermes.
      const imageBase64: string | null = imageBase64Vehicle;
      const features = {
        vehicleNoMotor: vehicleData.vehicleNoMotor,
        vehicleNoChasis: vehicleData.vehicleNoChasis,
        vehicleNoVin: vehicleData.vehicleNoVin,
        vehicleNoSerie: vehicleData.vehicleNoSerie,
        vehicleForm: vehicleData.vehicleForm,
        vehicleCylinders: vehicleData.vehicleCylinders,
        vehicleDoors: vehicleData.vehicleDoors,
        vehicleMetalup: vehicleData.vehicleMetalup,
        carType: vehicleData.carType,
        imageBase64,
      };
      if (Object.values(features).some((v) => !!v)) {
        carPayload.features = features;
      }

      debugStep = "insert_cars";
      setLog("[3/5] Insertando vehA­culo...");

      // REST directo â€” el cliente Supabase JS cuelga.
      // IMPORTANTE: usar JWT del usuario, no el anon key. La tabla `cars` tiene RLS
      // que exige auth.uid() para INSERT/UPDATE; con el anon key falla con 42501.
      const authHeaders = await getSupabaseAuthHeaders(true);
      const restHeaders = {
        ...authHeaders,
        'Prefer': 'return=representation',
      };

      let createError: any = null;
      let insertedRow: any = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const insertResp = await withTimeout(
            fetch(`${SUPABASE_URL}/rest/v1/cars`, {
              method: 'POST',
              headers: restHeaders,
              body: JSON.stringify(carPayload),
            }),
            60000,
            "La creación del vehículo tarda demasiado. Inténtalo nuevamente."
          );
          const insertData = await insertResp.json();

          if (!insertResp.ok) {
            createError = insertData;
          } else {
            createError = null;
            insertedRow = Array.isArray(insertData) ? insertData[0] : insertData;
          }
        } catch (err) {
          createError = err;
        }

        if (!createError) break;

        if (attempt < 2) {
          setLog(`Insert lento detectado (${formatDebugError(createError)}). Reintentando...`);
          await delay(1500);
        }
      }

      if (createError) {
        setLog(`[ERROR] Insert cars: ${formatDebugError(createError)}`);
        throw new Error(`Fallo en insert de cars: ${formatDebugError(createError)}`);
      }

      let createdCarId: string | null = insertedRow?.id || null;

      // Si no obtuvimos el ID de la respuesta, buscarlo
      if (!createdCarId && imageUriVehicle) {
        try {
          debugStep = "buscar_id_vehiculo";
          setLog("[4/5] Confirmando ID del vehA­culo reciA©n creado...");

          const plate = encodeURIComponent((vehicleData.vehicleNumber || "").toUpperCase().trim());
          const findUrl = `${SUPABASE_URL}/rest/v1/cars?driver_id=eq.${encodeURIComponent(driverId)}&plate=eq.${plate}&order=created_at.desc&limit=1&select=id`;
          const findResp = await withTimeout(
            fetch(findUrl, {
              method: 'GET',
              headers: authHeaders,
            }),
            12000,
            "No se pudo confirmar el id del vehiculo creado."
          );
          const findData = await findResp.json();

          if (Array.isArray(findData) && findData.length > 0 && findData[0].id) {
            createdCarId = findData[0].id;
          }
        } catch (findIdError) {
          setLog(`[ERROR] Buscar id vehÃ­culo: ${formatDebugError(findIdError)}`);
          console.warn("No se pudo obtener el id reciA©n creado:", formatDebugError(findIdError));
        }
      }

      if (imageBase64Vehicle && createdCarId) {
        try {
          debugStep = "leer_imagen_local";
          setLog("[5/5] Subiendo imagen del vehA­culo...");

          // Decodificar base64 a bytes sin pasar por fetch(file://) — esto fallaba
          // silenciosamente en builds de release Android (Hermes), subiendo 0 bytes.
          let imageBytes: Uint8Array;
          try {
            const binary = global.atob(imageBase64Vehicle);
            imageBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              imageBytes[i] = binary.charCodeAt(i);
            }
          } catch (decodeErr) {
            setLog("[ERROR] No se pudo decodificar la imagen seleccionada.");
            throw new Error("No se pudo decodificar la imagen seleccionada.");
          }

          if (imageBytes.byteLength === 0) {
            setLog("[ERROR] La imagen seleccionada está vacía.");
            throw new Error("La imagen seleccionada está vacía.");
          }

          debugStep = "subir_imagen_storage";
          const storagePath = `${createdCarId}/car_image.jpg`;
          let uploadUrl: string | null = null;
          let uploadError: string | null = null;
          const maxAttempts = 3;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            setLog(`[INFO] Subiendo imagen (intento ${attempt})...`);
            try {
              const storageResp = await withTimeout(
                fetch(`${SUPABASE_URL}/storage/v1/object/vehicle-images/${storagePath}`, {
                  method: 'POST',
                  headers: {
                    ...authHeaders,
                    'Content-Type': 'image/jpeg',
                    'x-upsert': 'true',
                  },
                  body: imageBytes as unknown as BodyInit,
                }),
                15000,
                "La carga de imagen tarda demasiado."
              );

              if (storageResp.ok) {
                uploadUrl = `${SUPABASE_URL}/storage/v1/object/public/vehicle-images/${storagePath}`;
                uploadError = null;
                break;
              } else {
                const errBody = await storageResp.text();
                uploadError = `Status ${storageResp.status}: ${errBody}`;
              }
            } catch (e: any) {
              uploadError = e?.message || 'Error desconocido';
            }
            setLog(`[ERROR] Subir imagen (intento ${attempt}): ${uploadError}`);
            await delay(1200);
          }

          if (uploadUrl) {
            debugStep = "actualizar_url_imagen_cars";

            const updateResp = await withTimeout(
              fetch(`${SUPABASE_URL}/rest/v1/cars?id=eq.${encodeURIComponent(createdCarId)}`, {
                method: 'PATCH',
                headers: restHeaders,
                body: JSON.stringify({ car_image: uploadUrl, updated_at: new Date().toISOString() }),
              }),
              10000,
              "La actualización de la imagen tarda demasiado."
            );

            if (!updateResp.ok) {
              const errBody = await updateResp.text();
              setLog(`[ERROR] Asociar imagen: ${errBody}`);
              console.warn("No se pudo asociar la imagen:", errBody);
            }
          } else {
            setLog(`[ERROR] Subir imagen: ${uploadError || 'Error desconocido'}`);
            console.warn("No se pudo subir la imagen tras varios intentos:", uploadError);
          }
        } catch (imageError) {
          setLog(`[ERROR] Subir imagen: ${formatDebugError(imageError)}`);
          console.warn("Error opcional al subir imagen:", formatDebugError(imageError));
        }
      }

      const successMessage = createdCarId
        ? `Vehículo creado correctamente. ID: ${createdCarId}`
        : "Vehículo creado correctamente.";
      setLog(successMessage);
      showAlert('success', 'Vehiculo guardado', successMessage, [
        { text: 'Continuar', onPress: () => { setAlertVisible(false); navigation.goBack(); } },
      ]);
    } catch (error) {
      const debugMessage = formatDebugError(error);
      setLog(`[ERROR] Guardado vehÃ­culo: ${debugMessage}`);
      console.warn(`Error al crear el veh­culo en etapa [${debugStep}]:`, debugMessage);
      const message = `Fallo en etapa: ${debugStep}. ${debugMessage}`;
      showAlert('error', 'Error al guardar vehiculo', message);
    } finally {
      setLoading(false);
    }
  };

  const renderTextField = (
    label: string,
    field: keyof VehicleFormData,
    placeholder: string,
    keyboardType: "default" | "numeric" = "default"
  ) => (
    <View style={styles.fieldCard} key={field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldShell}>
        <TextInput
          value={vehicleData[field]}
          onChangeText={(text) => updateField(field, text)}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.36)"
          style={styles.textInput}
          keyboardType={keyboardType}
          autoCapitalize="characters"
        />
      </View>
      {fieldErrors[field] ? (
        <Text style={[styles.fieldErrorText, { color: '#fff' }]}>{fieldErrors[field]}</Text>
      ) : null}
      {field === "vehicleNumber" && plateChecking && (
        <View style={styles.plateCheckRow}>
          <ActivityIndicator size="small" color="#00E5FF" />
          <Text style={styles.plateCheckingText}>Verificando placa...</Text>
        </View>
      )}
      {field === "vehicleNumber" && !plateChecking && plateExists && (
        <View style={styles.plateCheckRow}>
          <Ionicons name="alert-circle" size={15} color="#E91E63" />
          <Text style={styles.plateExistsText}>{plateMsg || "Esta placa no se puede registrar"}</Text>
        </View>
      )}
      {field === "vehicleNumber" && !plateChecking && !plateExists && plateMsg !== "" && (
        <View style={styles.plateCheckRow}>
          <Ionicons name="information-circle" size={15} color="#00E5FF" />
          <Text style={styles.plateInfoText}>{plateMsg}</Text>
        </View>
      )}
    </View>
  );

  const renderSelectField = (
    label: string,
    field: keyof VehicleFormData,
    placeholder: string,
    items: Array<{ label: string; value: string }>
  ) => {
    const hasValue = Boolean((vehicleData[field] || "").trim());
    const sanitizedItems = items.filter((item) => (item.value || "").trim() !== "");
    const selectedLabel =
      sanitizedItems.find((item) => item.value === vehicleData[field])?.label || "";

    const leftIconName: keyof typeof Ionicons.glyphMap =
      field === "vehicleMake" ? "car-sport-outline" :
      field === "vehicleModel" ? "calendar-outline" :
      field === "vehicleForm" ? "layers-outline" :
      field === "carType" ? "briefcase-outline" :
      field === "vehicleCylinders" ? "speedometer-outline" :
      field === "vehicleFuel" ? "flame-outline" :
      field === "vehicleMetalup" ? "cube-outline" :
      "list-outline";

    return (
    <View style={styles.fieldCard} key={field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => openSelectModal(field, label, sanitizedItems)}
        style={[styles.fieldShell, styles.selectShell, hasValue && styles.selectShellActive]}
      >
        <Ionicons
          name={leftIconName}
          size={16}
          color={hasValue ? "#00E5FF" : "rgba(255,255,255,0.46)"}
          style={styles.selectLeftIcon}
        />
        <Text style={[styles.selectValueText, !hasValue && styles.selectPlaceholderText]}>
          {hasValue ? selectedLabel : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={hasValue ? "#00E5FF" : "rgba(255,255,255,0.5)"}
          style={styles.selectRightIcon}
        />
      </TouchableOpacity>
      {fieldErrors[field] ? <Text style={styles.fieldErrorText}>{fieldErrors[field]}</Text> : null}
    </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
      <View pointerEvents="none" style={styles.bgOverlay} />
      <View pointerEvents="none" style={styles.bgGlowTop} />
      <View pointerEvents="none" style={styles.bgGlowBottom} />

      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: headerTopPadding }]}> 
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.84}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Crear Vehiculo</Text>
          </View>

          <View style={styles.headerCounter}>
            <Text style={styles.headerCounterText}>{completedFields}/{totalFields}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: footerBottomPadding + 130 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroTag}>T+plus</Text>
            <Text style={styles.heroTitle}>Registra tu vehiculo con la nueva interfaz</Text>
            <Text style={styles.heroText}>
              Mantuvimos todos los datos del flujo anterior, pero ahora el alta sigue la linea visual futurista del prototipo.
            </Text>
          </View>

          {driverVehicleCount !== null && driverVehicleCount >= 2 && (
            <View style={styles.limitBanner}>
              <Ionicons name="warning" size={20} color="#E91E63" />
              <View style={{ flex: 1 }}>
                <Text style={styles.limitBannerTitle}>Limite alcanzado</Text>
                <Text style={styles.limitBannerText}>Ya tienes {driverVehicleCount} vehi­culos registrados (ma¡ximo 2). Elimina uno para agregar otro.</Text>
              </View>
            </View>
          )}

          {driverVehicleCount !== null && driverVehicleCount < 2 && (
            <View style={styles.infoBanner}>
              <Ionicons name="car-sport" size={18} color="#00E5FF" />
              <Text style={styles.infoBannerText}>Tienes {driverVehicleCount}/2 vehiculos registrados</Text>
            </View>
          )}

          <View style={styles.avatarSection}>
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.avatarRing}
              onPress={() => setPickerTarget("vehicle")}
            >
              <View style={styles.avatarInner}>
                <Image
                  source={imageUriVehicle ? { uri: imageUriVehicle } : getCategoryImage(vehicleData.carType)}
                  style={styles.avatarImage}
                />
                <View style={styles.avatarCameraBtn}>
                  <Ionicons name="camera" size={16} color="#051A26" />
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.avatarTitle}>Foto del Vehiculo</Text>
            <Text style={styles.avatarSubtext}>Toca la imagen para cargar la foto principal que vera el conductor.</Text>
          </View>

          <View style={styles.utilityCard}>
            <View style={styles.utilityCopy}>
              <Text style={styles.utilityTag}>Lectura inteligente</Text>
              <Text style={styles.utilityTitle}>Tarjeta de propiedad</Text>
              <Text style={styles.utilityText}>Puedes tomar una foto o cargarla desde la galeria para autocompletar varios campos.</Text>
            </View>

            <TouchableOpacity
              style={styles.utilityButton}
              activeOpacity={0.9}
              onPress={() => showAlert('info', 'Proximamente', 'Esta funcion aun no esta disponible.')}
            >
              <Ionicons name="scan" size={16} color="#051A26" />
              <Text style={styles.utilityButtonText}>Leer tarjeta</Text>
            </TouchableOpacity>

            {imageUri ? <Image source={{ uri: imageUri }} style={styles.documentPreview} /> : null}

            {log ? (
              <View style={styles.logCard}>
                <Ionicons name="sparkles" size={16} color="#00E5FF" />
                <Text style={styles.logText}>{log}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Datos Base</Text>
            <Text style={styles.sectionTitle}>Identificacion del vehiculo</Text>
            {renderTextField("Placa del Vehiculo", "vehicleNumber", "Ej. ABC123")}
            {renderTextField("Numero de Motor", "vehicleNoMotor", "Ej. 1A2B3C4D5E")}
            {renderTextField("Numero de Chasis", "vehicleNoChasis", "Ej. 9XYZ87654321")}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Especificaciones</Text>
            <Text style={styles.sectionTitle}>Configuracion principal</Text>
            {renderSelectField("Marca del Vehiculo", "vehicleMake", "Selecciona una marca", marcasDeVehiculos)}
            {renderSelectField("Modelo del Vehiculo", "vehicleModel", "Selecciona el modelo", ModelosDeVehiculos)}
            {renderSelectField("Clase de Vehiculo", "vehicleForm", "Selecciona una clase", vehicleTypes.map((type) => ({ label: type, value: type })))}
            {renderSelectField("Tipo de Servicio", "carType", "Selecciona un servicio", serviceTypes.map((type) => ({ label: type.description, value: type.value })))}
            {renderSelectField("Cilindraje del Vehiculo", "vehicleCylinders", "Selecciona el cilindraje", CilindrajesDeVehiculos)}
            {renderSelectField("Tipo de Combustible", "vehicleFuel", "Selecciona", TipoCombustible)}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Detalles</Text>
            <Text style={styles.sectionTitle}>Informacion operativa</Text>
            {renderTextField("Color del Vehiculo", "vehicleColor", "Ej. Negro")}
            {renderTextField("Numero de VIN", "vehicleNoVin", "Ej. 3HGCM56457G701234")}
            {renderTextField("Cantidad de Puertas", "vehicleDoors", "Ej. 4", "numeric")}
            {renderTextField("Numero de Serie", "vehicleNoSerie", "Ej. SER123456")}
            {renderTextField("Numero de Pasajeros", "vehiclePassengers", "Ej. 4", "numeric")}
            {renderSelectField("Tipo de Carroceria", "vehicleMetalup", "Selecciona una carroceria", bodyworkTypes.map((type) => ({ label: type, value: type })))}
          </View>
        </ScrollView>

        <View style={[styles.fixedBottom, { paddingBottom: footerBottomPadding }]}> 
          <Text style={styles.fixedBottomMeta}>Completa los campos obligatorios. La foto principal ahora es opcional para guardar.</Text>
          <TouchableOpacity
            style={[styles.saveButton, (!isFormComplete || hasValidationErrors) && styles.saveButtonDisabled]}
            activeOpacity={0.9}
            onPress={handleAddCar}
            disabled={loading}
          >
            <Text style={[styles.saveButtonText, (!isFormComplete || hasValidationErrors) && styles.saveButtonTextDisabled]}>Guardar Vehiculo</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={isFormComplete && !hasValidationErrors ? "#051A26" : "rgba(255,255,255,0.55)"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pickerTarget === "vehicle" ? "Foto principal del vehiculo" : "Tarjeta de propiedad"}
            </Text>
            <Text style={styles.modalSubtitle}>Elige como quieres cargar la imagen.</Text>

            <TouchableOpacity style={styles.modalButton} onPress={() => void handleImageSelection(true)}>
              <Ionicons name="camera-outline" size={18} color="#051A26" />
              <Text style={styles.modalButtonText}>Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => void handleImageSelection(false)}>
              <Ionicons name="images-outline" size={18} color="#00E5FF" />
              <Text style={styles.modalButtonSecondaryText}>Cargar desde galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancel} onPress={() => setPickerTarget(null)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSelectModal}
      >
        <View style={styles.selectModalBackdrop}>
          <View style={[styles.selectModalCard, { paddingBottom: Math.max(insets.bottom, 14) + 10 }]}> 
            <View style={styles.selectModalHeader}>
              <Text style={styles.selectModalTitle}>{selectModalTitle}</Text>
              <TouchableOpacity onPress={closeSelectModal} style={styles.selectModalCloseBtn}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeSelectOptions}
              keyExtractor={(item) => `${item.value}`}
              style={styles.selectModalList}
              contentContainerStyle={styles.selectModalListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const active = activeSelectField ? vehicleData[activeSelectField] === item.value : false;
                return (
                  <TouchableOpacity
                    activeOpacity={0.86}
                    style={[styles.selectOptionRow, active && styles.selectOptionRowActive]}
                    onPress={() => {
                      if (activeSelectField) {
                        updateField(activeSelectField, item.value || "");
                      }
                      closeSelectModal();
                    }}
                  >
                    <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>{item.label}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={18} color="#00E5FF" /> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.selectEmptyText}>No hay opciones disponibles.</Text>}
            />
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.loadingText}>Procesando informacion del vehiculo...</Text>
        </View>
      ) : null}

      {loaded ? (
        <View style={styles.loadedOverlay}>
          <View style={styles.loadedCard}>
            <LottieView
              source={require("@/json/animation.json")}
              autoPlay
              loop={false}
              style={styles.loadedAnimation}
              onAnimationFinish={() => setLoaded(false)}
            />
            <Text style={styles.loadedText}>Terminamos la lectura inicial. Verifica los datos antes de guardar.</Text>
          </View>
        </View>
      ) : null}
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
  root: {
    flex: 1,
    backgroundColor: "#051A26",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.34,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,26,38,0.72)",
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: -20,
    right: -20,
    height: 260,
    backgroundColor: "rgba(0,229,255,0.12)",
    borderRadius: 180,
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: -120,
    left: -60,
    right: -60,
    height: 240,
    backgroundColor: "rgba(0,188,212,0.10)",
    borderRadius: 200,
  },
  keyboardRoot: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(0,229,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.28)",
  },
  headerPillText: {
    color: "#00E5FF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  headerCounter: {
    minWidth: 54,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerCounterText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  heroCard: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: "rgba(8,35,50,0.74)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
  },
  heroTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,229,255,0.12)",
    color: "#00E5FF",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    marginBottom: 10,
  },
  heroText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 2,
    marginBottom: 6,
  },
  avatarRing: {
    width: 158,
    height: 158,
    borderRadius: 79,
    padding: 3,
    backgroundColor: "rgba(0,229,255,0.75)",
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 12,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 76,
    backgroundColor: "rgba(5,26,38,0.86)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "86%",
    height: "86%",
    resizeMode: "contain",
  },
  avatarCameraBtn: {
    position: "absolute",
    right: 16,
    bottom: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#00E5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
  },
  avatarSubtext: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 24,
  },
  utilityCard: {
    padding: 20,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  utilityCopy: {
    marginBottom: 14,
  },
  utilityTag: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  utilityTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  utilityText: {
    color: "rgba(255,255,255,0.66)",
    lineHeight: 19,
    fontSize: 13,
  },
  utilityButton: {
    height: 48,
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  utilityButtonText: {
    color: "#051A26",
    fontSize: 15,
    fontWeight: "800",
  },
  documentPreview: {
    width: "100%",
    height: 160,
    borderRadius: 18,
    resizeMode: "cover",
    marginBottom: 12,
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(0,229,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
  },
  logText: {
    flex: 1,
    color: "#D8FBFF",
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "rgba(8,35,50,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sectionEyebrow: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  fieldCard: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  fieldShell: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
  },
  selectShell: {
    backgroundColor: "rgba(0,229,255,0.05)",
    borderColor: "rgba(0,229,255,0.18)",
  },
  selectShellActive: {
    borderColor: "rgba(0,229,255,0.42)",
    backgroundColor: "rgba(0,229,255,0.09)",
  },
  selectLeftIcon: {
    position: "absolute",
    left: 14,
    top: 18,
    zIndex: 2,
  },
  selectRightIcon: {
    position: "absolute",
    right: 14,
    top: 17,
  },
  selectValueText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 14,
    paddingLeft: 30,
    paddingRight: 34,
  },
  selectPlaceholderText: {
    color: "rgba(255,255,255,0.46)",
    fontWeight: "600",
  },
  textInput: {
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 14,
  },
  fixedBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: "rgba(5,26,38,0.94)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  fixedBottomMeta: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  saveButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: "#00E5FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.12)",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#051A26",
    fontSize: 17,
    fontWeight: "900",
  },
  saveButtonTextDisabled: {
    color: "rgba(255,255,255,0.55)",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#0A2E3D",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  modalButton: {
    height: 50,
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#051A26",
    fontSize: 15,
    fontWeight: "800",
  },
  modalButtonSecondary: {
    height: 50,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  modalButtonSecondaryText: {
    color: "#00E5FF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalCancel: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  modalCancelText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },
  selectModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "flex-end",
  },
  selectModalCard: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#0A2E3D",
    borderTopWidth: 1,
    borderColor: "rgba(0,229,255,0.22)",
    maxHeight: "72%",
  },
  selectModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.09)",
  },
  selectModalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  selectModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  selectModalList: {
    width: "100%",
  },
  selectModalListContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
  },
  selectOptionRow: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  selectOptionRowActive: {
    backgroundColor: "rgba(0,229,255,0.12)",
    borderColor: "rgba(0,229,255,0.45)",
  },
  selectOptionText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10,
  },
  selectOptionTextActive: {
    color: "#D9FCFF",
    fontWeight: "800",
  },
  selectEmptyText: {
    color: "rgba(255,255,255,0.56)",
    textAlign: "center",
    paddingVertical: 18,
    fontSize: 13,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  loadedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadedCard: {
    width: "100%",
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    backgroundColor: "rgba(8,35,50,0.96)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
  },
  loadedAnimation: {
    width: 140,
    height: 140,
  },
  loadedText: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  fieldErrorText: {
    color: "#E91E63",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  plateCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  plateCheckingText: {
    color: "#00E5FF",
    fontSize: 12,
    fontWeight: "600",
  },
  plateExistsText: {
    color: "#E91E63",
    fontSize: 12,
    fontWeight: "700",
  },
  plateInfoText: {
    color: "#00E5FF",
    fontSize: 12,
    fontWeight: "600",
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(233,30,99,0.35)",
    backgroundColor: "rgba(233,30,99,0.12)",
    padding: 14,
    marginBottom: 14,
  },
  limitBannerTitle: {
    color: "#E91E63",
    fontSize: 14,
    fontWeight: "800",
  },
  limitBannerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.2)",
    backgroundColor: "rgba(0,229,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  infoBannerText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default CarsEditScreen;
