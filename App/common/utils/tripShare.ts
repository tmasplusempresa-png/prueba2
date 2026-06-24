import { Share, Linking } from "react-native";
import * as Location from "expo-location";

const SUPPORT_EMAIL = "soporte@tmasplus.online";

type Role = "customer" | "driver";

export interface ShareTripContext {
  estimatedTime?: string | null;
  estimatedDistance?: string | null;
}

const formatKms = (booking: any, estimatedDistance?: string | null) => {
  if (estimatedDistance) return estimatedDistance;
  const raw = booking?.distance ?? booking?.trip_distance;
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  if (typeof n === "number" && !isNaN(n) && n > 0) return `${n.toFixed(1)} km`;
  return "-";
};

const formatTime = (estimatedTime?: string | null) => estimatedTime || "-";

const getCategory = (b: any) =>
  b?.car_type || b?.tripType || b?.category || b?.vehicle_type || "-";

const getBrand = (b: any) =>
  b?.vehicleMake || b?.vehicle_make || b?.car_model || b?.vehicle_model || "-";

const getPlate = (b: any) =>
  b?.plate_number || b?.vehicle_number || "-";

const getOrigin = (b: any) =>
  b?.pickup?.add || b?.pickup_address || b?.pickupAddress || "-";

const getDestination = (b: any) =>
  b?.drop?.add || b?.drop_address || b?.dropAddress || "-";

const getDriverName = (b: any) =>
  b?.driver_name || b?.driverName || "-";

export const buildCustomerTripMessage = (
  booking: any,
  locationUrl: string,
  ctx: ShareTripContext = {},
) => {
  return (
    `Hola! Todo esta bien en este momento, Aun asi quiero compartir contigo los datos de el conductor que me esta atendiendo en este momento por el app T+Plus:\n\n` +
    `Conductor: ${getDriverName(booking)}\n` +
    `Marca del vehiculo: ${getBrand(booking)}\n` +
    `Placa: ${getPlate(booking)}\n` +
    `Categoria: ${getCategory(booking)}\n` +
    `Origen: ${getOrigin(booking)}\n` +
    `Destino: ${getDestination(booking)}\n` +
    `Kms: ${formatKms(booking, ctx.estimatedDistance)}\n` +
    `Tiempo: ${formatTime(ctx.estimatedTime)}\n\n` +
    `Mi ubicacion actual: ${locationUrl}\n\n` +
    `Este es el tiempo estimado de llegada aunque puede variar por trafico, para que lo tengas en cuenta y asi puedas estar pendiente de mi!\n\n` +
    `Gracias por siempre estar cuando te necesito. Cualquier cosa el correo de soporte de T+Plus es ${SUPPORT_EMAIL} .`
  );
};

export const buildDriverTripMessage = (
  booking: any,
  locationUrl: string,
  ctx: ShareTripContext = {},
) => {
  return (
    `Hola estoy conduciendo con T+Plus en un viaje y esta es mi actual ubicacion: ${locationUrl}\n\n` +
    `Estos son los datos de mi servicio por si no me comunico contigo prontamente: Todo esta bien en este momento, Aun asi quiero compartir contigo los datos del servicio que estoy atendiendo en este momento por el app T+Plus:\n\n` +
    `Categoria: ${getCategory(booking)}\n` +
    `Origen: ${getOrigin(booking)}\n` +
    `Destino: ${getDestination(booking)}\n` +
    `Kms: ${formatKms(booking, ctx.estimatedDistance)}\n` +
    `Tiempo: ${formatTime(ctx.estimatedTime)}\n\n` +
    `Este es el tiempo estimado de llegada aunque puede variar por trafico, para que lo tengas en cuenta y asi puedas estar pendiente de mi!\n\n` +
    `Gracias por siempre estar cuando te necesito. Cualquier cosa el correo de soporte de T+Plus es ${SUPPORT_EMAIL} .`
  );
};

const getCurrentLocationUrl = async (): Promise<string | null> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
};

export interface ShareTripResult {
  ok: boolean;
  error?: "permission" | "share";
}

export async function shareTrip(
  role: Role,
  booking: any,
  user: any,
  ctx: ShareTripContext = {},
): Promise<ShareTripResult> {
  try {
    const locationUrl = await getCurrentLocationUrl();
    if (!locationUrl) return { ok: false, error: "permission" };

    const message =
      role === "driver"
        ? buildDriverTripMessage(booking, locationUrl, ctx)
        : buildCustomerTripMessage(booking, locationUrl, ctx);

    if (role === "driver") {
      await Share.share({ message });
    } else {
      const contacts = user?.backupContacts || [];
      if (contacts.length === 0) {
        await Share.share({ message });
      } else {
        contacts.forEach((c: any) => {
          const url = `https://api.whatsapp.com/send?phone=${c.mobile}&text=${encodeURIComponent(
            message,
          )}`;
          Linking.openURL(url);
        });
      }
    }
    return { ok: true };
  } catch (e) {
    console.error("[tripShare] error:", e);
    return { ok: false, error: "share" };
  }
}
