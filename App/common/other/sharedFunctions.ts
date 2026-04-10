import { firebase } from "@/config/configureFirebase";
import { GetDistance, GetTripDistance, } from "../other/GeoFunctions";
import { fetchAddressfromCoords } from '../other/GoogleAPIFunctions'; 
import { onValue, child, push,  update, get, query, orderByKey, ref} from "firebase/database";
import { settings } from '@/scripts/settings'
import { FareCalculator } from "../actions/FareCalculator";
import { colors } from "@/scripts/theme";
import { database } from "@/config/SupabaseConfig";

export const MAIN_COLOR = colors.TAXIPRIMARY;

export const appConsts = {
  needEmergemcy: true,
  hasMultiDrop: true,
  makePending: false,
  hasOptions: false,
  checkWallet: true,
  acceptWithAmount: false,
  hasStartOtp: true,
  canCall: true,
  showBookingOptions: false,
  captureBookingImage: false
}

export const saveAddresses = async (booking, driverLocation) => {
  const { singleUserRef } = firebase;
  let latlng = driverLocation.lat + "," + driverLocation.lng;
  let address = await fetchAddressfromCoords(latlng);
  onValue(child(singleUserRef(booking.customer), "savedAddresses"), (savedAdd) => {
      if (savedAdd.val()) {
        let addresses = savedAdd.val();
        let didNotMatch = true;
        for (let key in addresses) {
          let entry = addresses[key];
          if (
            GetDistance(
              entry.lat,
              entry.lng,
              driverLocation.lat,
              driverLocation.lng
            ) < 0.1
          ) {
            didNotMatch = false;
            let count = entry.count ? entry.count + 1 : 1;
            update(child(singleUserRef(booking.customer),"savedAddresses/" + key),{ count: count });
            break;
          }
        }
        if (didNotMatch) {
          push(child(singleUserRef(booking.customer),"savedAddresses"),{
            description: address,
            lat: booking.drop.lat,
            lng: booking.drop.lng,
            count: 1,
          });
        }
      } else {
        push(child(singleUserRef(booking.customer),"savedAddresses"),{
          description: address,
          lat: booking.drop.lat,
          lng: booking.drop.lng,
          count: 1,
        });
      }
    }, {onlyOnce:true});
  return address;
};

export const checkSearchPhrase = (str) => {
  return ""
}

export const addActualsToBooking = async (booking: any) => {
  console.log("Inicio de addActualsToBooking con booking:", booking);

  const end_time = new Date();
  const totalTimeTaken = Math.abs(Math.round((end_time.getTime() - parseFloat(booking.startTime)) / 1000));

  console.log("Tiempo de finalización calculado:", end_time);
  console.log("Tiempo total del viaje en segundos:", totalTimeTaken);

  // Actualizar datos comunes de la reserva
  booking.trip_end_time = `${end_time.getHours()}:${end_time.getMinutes()}:${end_time.getSeconds()}`;
  booking.endTime = end_time.getTime();
  booking.total_trip_time = totalTimeTaken;

  console.log("Datos comunes actualizados en la reserva:", {
    trip_end_time: booking.trip_end_time,
    endTime: booking.endTime,
    total_trip_time: booking.total_trip_time
  });

  // Si la reserva no es prepagada, calcular tarifas y otros datos
  if (!settings.prepaid) {
    console.log("La reserva NO es prepagada. Iniciando cálculos adicionales...");

    const cartypesRef = ref(database, "cartypes");
    const carsSnap = await get(cartypesRef);
    const cars = carsSnap.val();

    let rates = {};
    for (let carType in cars) {
      if (cars[carType].name === booking.carType) {
        rates = cars[carType];
        break;
      }
    }

    // Obtener los datos de seguimiento del viaje
    const trackingSnap = await get(query(ref(database, `tracking/${booking.id}`), orderByKey()));
    const trackingVal = trackingSnap.val();
    console.log("Datos de seguimiento obtenidos para la reserva:", trackingVal);

    // Calcular la distancia recorrida
    const res = await GetTripDistance(trackingVal);
    const distance = settings.convert_to_mile ? res.distance / 1.609344 : res.distance;
    console.log("Distancia calculada:", distance);
    console.log("Coordenadas del viaje:", res.coords);

    // Calcular tarifas
    const { grandTotal, convenience_fees } = FareCalculator(distance, totalTimeTaken, rates, null, settings.decimal);
    console.log("Tarifas calculadas:", {
      grandTotal: grandTotal,
      convenience_fees: convenience_fees
    });

    // Actualizar el objeto de la reserva con los nuevos datos
    booking.drop = {
      add: booking.drop.add,
      lat: booking.drop.lat,
      lng: booking.drop.lng,
    };
    booking.dropAddress = booking.drop.add;
    booking.trip_cost = grandTotal;
    booking.distance = parseFloat(distance).toFixed(settings.decimal);
    booking.convenience_fees = convenience_fees;
    booking.driver_share = (grandTotal - convenience_fees).toFixed(settings.decimal);
    booking.coords = res.coords;

    console.log("Reserva actualizada con datos de costos y distancia:", {
      drop: booking.drop,
      trip_cost: booking.trip_cost,
      distance: booking.distance,
      convenience_fees: booking.convenience_fees,
      driver_share: booking.driver_share,
      coords: booking.coords
    });
  } else {
    console.log("La reserva es prepagada, no se calculan tarifas adicionales.");
  }

  // Actualizar la base de datos con los cambios
  try {
    await update(ref(database, `bookings/${booking.id}`), booking);
    console.log("Reserva actualizada correctamente en la base de datos.");
  } catch (error) {
    console.error("Error al actualizar la reserva en la base de datos:", error);
  }

  return booking;
};

export const updateDriverQueue = (booking) => {
  return booking;
};

export const driverQueue= false;

