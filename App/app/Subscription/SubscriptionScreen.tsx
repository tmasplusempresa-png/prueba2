import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { RootState, AppDispatch } from "@/common/store";
import { fetchMemberships, selectMembershipLoading } from "@/common/reducers/membershipSlice";

const SubscriptionScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  const memberships = useSelector((state: RootState) => state.memberships.memberships);
  const isLoading = useSelector(selectMembershipLoading);
  const [hasFetched, setHasFetched] = useState(false);

  // Filtrar membresía activa
  const activeMembership = memberships.find((membership) => membership.status === "ACTIVA");

  useEffect(() => {
    if (user?.uid && !hasFetched) {
      console.log("Cargando membresías para el usuario:", user.uid);
      dispatch(fetchMemberships(user.uid)).then(() => setHasFetched(true));
    }
  }, [dispatch, user?.uid, hasFetched]);

  useEffect(() => {
    if (hasFetched && !isLoading) {
      if (activeMembership) {
        console.log('Se encontró membresía activa, navegando a Memberships');
        navigation.navigate('Memberships');
      } else {
        console.log('No se encontró membresía activa, navegando a ChosePlan');
        navigation.navigate('ChosePlan');
      }
    }
  }, [hasFetched, isLoading, activeMembership, navigation]);

  // Verifica el estado de carga
  if (isLoading && !hasFetched) {
    console.log('Mostrando indicador de carga...');
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00f4f5" />
      </View>
    );
  }

  // Mostrar días restantes si hay una membresía activa
  if (activeMembership) {
    const daysLeft = calculateDaysLeft(activeMembership.fecha_terminada);
    return (
      <View style={styles.container}>
        <Text style={styles.daysLeftText}>Días restantes: {daysLeft}</Text>
      </View>
    );
  }

  // En caso de que no entre en ninguno de los estados
  return null;
};

const styles = {
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  daysLeftText: {
    fontSize: 18,
    fontWeight: "bold",
  },
};

export default SubscriptionScreen;

function calculateDaysLeft(fecha_terminada: any) {
  throw new Error("Function not implemented.");
}
