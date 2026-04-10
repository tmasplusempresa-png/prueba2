import { Ionicons } from "@expo/vector-icons";
import React from "react";
import moment from "moment/min/moment-with-locales";
import { roundPrice } from "@/hooks/roundPrice";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";

interface Booking {
  id: string;
  customerName: string;
  origin: string;
  destination: string;
  price: string;
  time: string;
  distance: string;
}

interface BookingsViewProps {
  bookings: Booking[];
  onAccept: (booking: Booking) => void;
  onDecline: (booking: Booking) => void;
}

const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  onAccept,
  onDecline,
}) => {

  const containerStyle = bookings.length > 0
    ? styles.containerView
    : [styles.containerView, { backgroundColor: "transparent" }];

  const determineTripType = (coords) => {
    if (!coords || coords.length < 2 || !coords[0] || !coords[1]) {
      return "Coordenadas no disponibles";
    }

    const cityLimits = {
      northEast: { latitude: 4.8, longitude: -73.9 },
      southWest: { latitude: 4.5, longitude: -74.2 },
    };

    const isWithinCityLimits = (coord) => {
      return (
        coord?.latitude >= cityLimits.southWest.latitude &&
        coord?.latitude <= cityLimits.northEast.latitude &&
        coord?.longitude >= cityLimits.southWest.longitude &&
        coord?.longitude <= cityLimits.northEast.longitude
      );
    };

    const isUrban = isWithinCityLimits(coords[0]) && isWithinCityLimits(coords[1]);
    return isUrban ? "Urbano" : "Intermunicipal";
  };

  const calculateEstimatedCost = (estimate: number, isPeakHour: boolean) => {
    if (isPeakHour) {
      return `${roundPrice(estimate + 5000)} - ${roundPrice(estimate + 5000 + (estimate * 0.3))}`;
    }
    return `${roundPrice(estimate)} - ${roundPrice(estimate + (estimate * 0.3))}`;
  };

  const isPeakHour = (tripDate: string) => {
    const hour = moment(tripDate).hour();
    return (hour >= 5 && hour < 8) || (hour >= 16 && hour < 20);
  };

  return (
    <View style={styles.containerStyle}>
      <ScrollView contentContainerStyle={styles.container}>
        {bookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.header}>
              <Image
                source={
                  booking.customer_image
                    ? { uri: booking.customer_image }
                    : require("@/assets/images/profile.png")
                }
                style={styles.image}
              />
              <Text style={styles.customerName}>
                {booking.bookLater ? (
                  <View style={{ flexDirection: "row", justifyContent: "center", alignItems: 'center', width: '100%' }}>
                    <Image
                      source={require("./../assets/images/iconos3d/45.png")}
                      style={{ width: 100, height: 100, }}
                    />
                    <Text style={[styles.customerName, { color: "#00f4f5", }]}>


                      PROGRAMADO{" "}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{ flexDirection: "row", justifyContent: "center" }}
                  >
                    <Image
                      source={require("./../assets/images/iconos3d/46.png")}
                      style={{ width: 50, height: 50 }}
                    />
                    <Text style={[styles.customerName, { color: "#00f4f5" }]}>
                      INMEDIATO{" "}
                    </Text>
                    <Image
                      source={require("./../assets/images/iconos3d/46.png")}
                      style={{ width: 50, height: 50 }}
                    />
                  </View>
                )}
              </Text>
              <Text style={styles.customerName}>
                {moment(booking.tripdate).format("lll")}
              </Text>
              <Text style={[styles.customerName,{ color: "#00f4f5"}]}>
                {booking.payment_mode === "cash"
                  ? "Efectivo"
                  : booking.payment_mode === "corp"
                    ? "Empresarial"
                    : booking.payment_mode === "Daviplata"
                      ? "Daviplata"
                      : booking.payment_mode === "Wallet"
                        ? "Billetera"
                        : "Otro método"}
              </Text>

            </View>
            <View style={styles.addressContainer}>
              <Text style={styles.address}>
                <Text style={styles.dot}>
                  {" "}
                  <Ionicons
                    name="location-sharp"
                    size={26}
                    color="green"
                  />{" "}
                </Text>
                {booking.pickup.add}
              </Text>
              <Text style={styles.address}>
                <Text style={styles.dot}>
                  {" "}
                  <Ionicons name="location-sharp" size={26} color="red" />{" "}
                </Text>
                {booking.drop.add}
              </Text>
            </View>

            <View style={styles.tripFareContainer}>
              <Text style={styles.tripFareTitle}>Datos de Reserva</Text>

              <View
                style={{
                  flexDirection: "row",
                  width: "95%",
                }}
              >
                <View style={{ width: "50%" }}>
                  <Text style={styles.tripDetail}>Costo Estimado: </Text>
                  <Text style={styles.tripDetail}>Distancia Estimada: </Text>
                  <Text style={styles.tripDetail}>Tiempo Estimado: </Text>
                  <Text style={styles.tripDetail}>Tipo de Recorrido: </Text>
                  <Text style={styles.tripDetail}>Intermunicipal/Urbano: </Text>
                  <Text style={styles.tripDetail}>Observaciones: </Text>
                </View>

                <View style={{ width: "50%", alignItems: "flex-end" }}>
                  <Text style={styles.tripDetail}>
                    <Text style={[styles.price, { fontSize: 18, fontWeight: 'bold', }]}>
                      {roundPrice(calculateEstimatedCost(parseInt(booking.estimate, 10), isPeakHour(booking.tripdate)))}
                    </Text>
                  </Text>
                  <Text style={styles.tripDetail}>
                    <Text style={styles.tripDetail}>{booking.distance} </Text>
                  </Text>
                  <Text style={styles.tripDetail}>
                    <Text style={styles.tripDetail}>{booking.estimateTime}</Text>
                  </Text>
                  <Text style={styles.tripDetail}>
                    <Text style={styles.tripDetail}>{booking.tripType}</Text>
                  </Text>
                  <Text style={styles.tripDetail}>
                    <Text style={styles.tripDetail}>{determineTripType(booking?.coords)}</Text>
                  </Text>
                  <Text style={styles.tripDetail}>{booking.Observations}</Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonDecline}
                onPress={() => onDecline(booking)}
              >
                <Text style={styles.buttonText}>Ignorar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonAccept}
                onPress={() => onAccept(booking)}
              >
                <Text style={styles.buttonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  container: {
    padding: 10,
    paddingBottom: 20, // Asegura que el último elemento sea visible al hacer scroll
  },
  bookingCard: {
    top: 30,
    backgroundColor: "#eee",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    alignItems: "center",
    top: -50
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 30,
    marginBottom: 10,
    shadowColor: "#0000",
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 1.25,
    shadowRadius: 7,
    elevation: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  wishes: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginHorizontal: 10,
  },
  addressContainer: {
    width: "100%",
    marginBottom: 10,
  },
  address: {
    fontSize: 16,
    marginVertical: 5,
  },
  dot: {
    color: "#00f4f5",
    fontSize: 20,
  },
  tripFareContainer: {
    width: "100%",
    alignItems: "baseline",
  },
  tripFareTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tripDetail: {
    fontSize: 14,
    marginVertical: 5,
    alignItems: "baseline",
  },
  price: {
    color: "#00f4f5",
    fontSize: 16,
  },
  distance: {
    color: "#00f4f5",
    fontSize: 16,
  },
  time: {
    color: "#00f4f5",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  buttonDecline: {
    backgroundColor: "#3333",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 12,
  },
  buttonAccept: {
    backgroundColor: "#00f4f5",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonTextAccept: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default BookingsView;