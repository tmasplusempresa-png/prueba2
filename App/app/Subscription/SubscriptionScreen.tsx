import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { differenceInDays } from "date-fns";
import { RootState, AppDispatch } from "@/common/store";
import { fetchMemberships, selectMembershipLoading } from "@/common/reducers/membershipSlice";
import { preferredConductorId } from "@/common/utils/driverIds";

const SubscriptionScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => (state as any).auth.profile);
  const memberships = useSelector((state: RootState) => state.memberships.memberships);
  const isLoading = useSelector(selectMembershipLoading);
  const [hasFetched, setHasFetched] = useState(false);
  const conductorId = preferredConductorId(user, profile);

  // Filtrar membresía activa
  const activeMembership = memberships.find((membership) => membership.status === "ACTIVA");

  useEffect(() => {
    if (conductorId && !hasFetched) {
      console.log("Cargando membresías para el conductor:", conductorId);
      dispatch(fetchMemberships(conductorId)).then(() => setHasFetched(true));
    }
  }, [dispatch, conductorId, hasFetched]);

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
  if (!fecha_terminada) return 0;
  try {
    return Math.max(differenceInDays(new Date(fecha_terminada), new Date()), 0);
  } catch {
    return 0;
  }
}
