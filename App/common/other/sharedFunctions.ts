import { GetTripDistance } from "../other/GeoFunctions";
import { settings } from '@/scripts/settings';
import { FareCalculator } from "../actions/FareCalculator";
import { isNearAirport } from "../utils/airports";
import { DEFAULT_UMBRAL_INTERMUNICIPAL_KM } from "../../constants/fare";
import { colors } from "@/scripts/theme";
import supabase from "@/config/SupabaseConfig";

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
  captureBookingImage: false,
};

export const saveAddresses = async (booking: any, driverLocation: any) => {
  // Guardamos la dirección de destino como lugar reciente en Supabase
  try {
    await supabase.from('favorite_places' as any).upsert({
      user_id: booking.customer,
      name: booking.drop?.add || 'Destino reciente',
      description: booking.drop?.add || '',
      latitude: driverLocation.lat,
      longitude: driverLocation.lng,
      is_favorite: false,
    } as any);
  } catch {}
};

export const checkSearchPhrase = (_str: string) => '';

export const addActualsToBooking = async (booking: any) => {
  console.log('Inicio de addActualsToBooking con booking:', booking);

  const end_time = new Date();
  const totalTimeTaken = Math.abs(Math.round((end_time.getTime() - parseFloat(booking.startTime)) / 1000));

  booking.trip_end_time = `${end_time.getHours()}:${end_time.getMinutes()}:${end_time.getSeconds()}`;
  booking.endTime = end_time.getTime();
  booking.total_trip_time = totalTimeTaken;

  if (!settings.prepaid) {
    // Leer tarifas desde Supabase car_types (fuente única de verdad)
    let rates: any = {};
    const { data: carTypeRows } = await supabase
      .from('car_types')
      .select('*')
      .eq('name', booking.carType)
      .eq('is_active', true)
      .limit(1);

    if (carTypeRows?.length) {
      const ct = carTypeRows[0];
      rates = {
        rate_per_unit_distance:     parseFloat(ct.price_per_km)       || 0,
        rate_per_unit_distance_inter: parseFloat(ct.price_per_km_inter) || 0,
        rate_per_hour:              parseFloat(ct.rate_per_hour)       || 0,
        rate_per_hour_inter:        parseFloat(ct.rate_per_hour_inter) || 0,
        base_fare:                  parseFloat(ct.base_price)          || 0,
        base_fare_inter:            parseFloat(ct.base_price_inter)    || 0,
        min_fare:                   parseFloat(ct.min_fare)            || 0,
        min_fare_inter:             parseFloat(ct.min_fare_inter)      || 0,
        delta_aeropuerto:           parseFloat(ct.delta_aeropuerto)    || 0,
        delta_aeropuerto_prog:      parseFloat(ct.delta_aeropuerto_prog) || 0,
        convenience_fees:           parseFloat(ct.convenience_fee)     || 0,
        convenience_fee_type:       ct.convenience_fee_type            || 'flat',
      };
    }

    // Tracking desde Supabase
    const { data: trackingRows } = await supabase
      .from('booking_tracking' as any)
      .select('lat, lng, timestamp')
      .eq('booking_id', booking.id)
      .order('timestamp', { ascending: true });

    const trackingVal: Record<string, any> = {};
    (trackingRows || []).forEach((row: any, idx: number) => {
      trackingVal[`p${idx}`] = { lat: row.lat, lng: row.lng, status: 'STARTED' };
    });

    const res = await GetTripDistance(trackingVal);
    const distance = settings.convert_to_mile ? res.distance / 1.609344 : res.distance;

    // Detección por coords (Haversine + 40 aeropuertos Colombia).
    // booking.pickup / booking.drop traen { lat, lng } desde el INSERT original.
    const pickupLat = parseFloat(booking.pickup?.lat ?? booking.pickup_lat);
    const pickupLng = parseFloat(booking.pickup?.lng ?? booking.pickup_lng);
    const dropLat = parseFloat(booking.drop?.lat ?? booking.drop_lat);
    const dropLng = parseFloat(booking.drop?.lng ?? booking.drop_lng);
    const oAir = !isNaN(pickupLat) && !isNaN(pickupLng) ? isNearAirport(pickupLat, pickupLng) : null;
    const dAir = !isNaN(dropLat) && !isNaN(dropLng) ? isNearAirport(dropLat, dropLng) : null;
    const isAirport = !!(oAir || dAir);
    const isIntermunicipal = distance > DEFAULT_UMBRAL_INTERMUNICIPAL_KM;

    const { totalCost, grandTotal, convenience_fees } = FareCalculator(
      distance,
      totalTimeTaken,
      rates,
      null,
      settings.decimal,
      { isAirport, isIntermunicipal }
    );

    console.log('Tarifas calculadas:', { totalCost, grandTotal, convenience_fees });

    booking.drop = { add: booking.drop?.add, lat: booking.drop?.lat, lng: booking.drop?.lng };
    booking.dropAddress = booking.drop.add;
    booking.trip_cost = totalCost;
    booking.distance = parseFloat(distance).toFixed(settings.decimal);
    booking.convenience_fees = convenience_fees;
    booking.driver_share = totalCost;
    booking.coords = res.coords;
  }

  // Actualizar en Supabase
  try {
    await supabase
      .from('bookings')
      .update({
        trip_cost:        booking.trip_cost,
        driver_share:     booking.driver_share,
        convenience_fees: booking.convenience_fees,
        distance:         booking.distance,
        trip_end_time:    booking.trip_end_time,
        total_trip_time:  booking.total_trip_time,
        drop_lat:         booking.drop?.lat,
        drop_lng:         booking.drop?.lng,
        drop_address:     booking.drop?.add,
        coords:           booking.coords,
        status:           booking.status,
        driver_status:    booking.driver_status,
        customer_status:  booking.customer_status,
      } as any)
      .eq('id', booking.id);
    console.log('Reserva actualizada en Supabase.');
  } catch (error) {
    console.error('Error al actualizar la reserva en Supabase:', error);
  }

  return booking;
};

export const updateDriverQueue = (booking: any) => booking;

export const driverQueue = false;
