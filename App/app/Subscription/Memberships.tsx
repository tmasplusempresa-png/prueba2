import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/common/store";
import { fetchMemberships, renewMembership, createMembership, cancelMembership, selectMembershipLoading } from "@/common/reducers/membershipSlice";
import { differenceInDays } from "date-fns";

const SubscriptionCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const memberships = useSelector((state: RootState) => state.memberships.memberships);
  const isLoading = useSelector(selectMembershipLoading);

  // Filtrar membresía activa
  const activeMembership = memberships.find((membership) => membership.status === "ACTIVA");

  useEffect(() => {
    if (user?.uid) {
      // Cargar membresías al montar el componente si el usuario está autenticado
      dispatch(fetchMemberships(user.uid));
    }
  }, [dispatch, user?.uid]);

  const handleRenew = (uid: string) => {
    dispatch(renewMembership(uid))
      .then(() => {
        alert("Membresía renovada con éxito");
      })
      .catch(() => {
        alert("Error al renovar la membresía");
      });
  };

  const handleCancel = (uid: string) => {
    dispatch(cancelMembership(uid))
      .then(() => {
        alert("Membresía cancelada con éxito");
      })
      .catch(() => {
        alert("Error al cancelar la membresía");
      });
  };

  const handleCreateMembership = (plan: string) => {
    dispatch(createMembership(user.uid))
      .then(() => {
        alert(`Membresía de ${plan} creada con éxito`);
      })
      .catch(() => {
        alert("Error al crear la membresía");
      });
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00f4f5" />
      </View>
    );
  }

  // Calcular días restantes
  const daysLeft = activeMembership ? differenceInDays(new Date(activeMembership.fecha_terminada), new Date()) : 0;

  return (
    <View style={styles.container}>
      {/* Si no tiene membresía activa, mostrar opción para crear */}
      {!activeMembership ? (
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.planTitle}>No tienes una membresía activa</Text>
            <Text style={styles.planDescription}>
              Puedes adquirir una de nuestras membresías para comenzar a disfrutar de sus beneficios.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleCreateMembership('Scale')}
          >
            <Text style={styles.subscribeButtonText}>Crear Membresía Scale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleCreateMembership('Growth')}
          >
            <Text style={styles.subscribeButtonText}>Crear Membresía Growth</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleCreateMembership('Personal')}
          >
            <Text style={styles.subscribeButtonText}>Crear Membresía Personal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Si tiene membresía activa, mostrar detalles */
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.planTitle}>Membresía Activa</Text>
              <Text style={styles.planDescription}>Conductor Premium</Text>
            </View>
            <View style={[styles.statusBadge, activeMembership?.status === "ACTIVA" ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <Text style={styles.statusBadgeText}>
                {activeMembership?.status === "ACTIVA" ? "✓ ACTIVA" : "✕ INACTIVA"}
              </Text>
            </View>
          </View>

          {/* Días Restantes - Destacado */}
          <View style={[styles.daysRemaining, daysLeft <= 0 ? styles.daysRemainingExpired : daysLeft <= 7 ? styles.daysRemainingWarning : styles.daysRemainingActive]}>
            <Text style={styles.daysRemainingLabel}>DÍAS RESTANTES</Text>
            <Text style={styles.daysRemainingValue}>{Math.max(daysLeft, 0)}</Text>
            <Text style={styles.daysRemainingDate}>Vence: {activeMembership.fecha_terminada}</Text>
          </View>
          
          <View style={styles.planDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Text style={styles.detailLabel}>💰 Monto</Text>
                <Text style={styles.detailValue}>${activeMembership.costo}</Text>
              </View>
              <View style={styles.detailRight}>
                <Text style={styles.detailLabel}>📅 Inicio</Text>
                <Text style={styles.detailValue}>{activeMembership.fecha_inicio}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.renewButton} onPress={() => handleRenew(activeMembership.uid)}>
            <Text style={styles.renewButtonText}>Renovar Membresía</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.renewButton, { backgroundColor: "#E91E63" }]} onPress={() => handleCancel(activeMembership.uid)}>
            <Text style={styles.renewButtonText}>Cancelar Membresía</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de membresías históricas (todas, sin importar el estado) */}
      {memberships.length > 0 ? (
        <FlatList
          data={memberships}
          keyExtractor={(item) => item.uid.toString()}
          renderItem={({ item }) => {
            const itemDaysLeft = differenceInDays(new Date(item.fecha_terminada), new Date());
            return (
              <View style={[styles.transactionCard, item.status === "ACTIVA" ? styles.transactionCardActive : styles.transactionCardInactive]}>
                <View style={styles.transactionHeader}>
                  <View>
                    <Text style={styles.transactionTitle}>
                      {item.status === "ACTIVA" ? "✓" : "✕"} Membresía {item.status}
                    </Text>
                    <Text style={styles.transactionDate}>{item.fecha_inicio} → {item.fecha_terminada}</Text>
                  </View>
                  <View style={[styles.miniStatusBadge, item.status === "ACTIVA" ? styles.miniStatusActive : styles.miniStatusInactive]}>
                    <Text style={styles.miniStatusText}>
                      {item.status === "ACTIVA" ? itemDaysLeft >= 0 ? `${itemDaysLeft}d` : "Exp" : "No"}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionInfo}>💵 ${item.costo}</Text>
                  <Text style={styles.transactionInfo}>
                    {item.status === "ACTIVA" && itemDaysLeft >= 0 
                      ? `Quedan ${itemDaysLeft} ${itemDaysLeft === 1 ? "día" : "días"}`
                      : "Expirada"}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.noMembershipContainer}>
          <Text>No tienes membresías registradas</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  planDescription: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
  },
  statusBadgeActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  statusBadgeInactive: {
    backgroundColor: "#E0F7FA",
    borderColor: "#00BCD4",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  daysRemaining: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
  },
  daysRemainingActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  daysRemainingWarning: {
    backgroundColor: "#E0F7FA",
    borderColor: "#00BCD4",
  },
  daysRemainingExpired: {
    backgroundColor: "#E0F7FA",
    borderColor: "#00BCD4",
  },
  daysRemainingLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    letterSpacing: 1,
  },
  daysRemainingValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1976D2",
    marginVertical: 4,
  },
  daysRemainingDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  planDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLeft: {
    flex: 1,
  },
  detailRight: {
    flex: 1,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginTop: 4,
  },
  renewButton: {
    backgroundColor: "#333",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  renewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  subscribeButton: {
    backgroundColor: "#00f4f5",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  transactionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionCardActive: {
    borderLeftColor: "#4CAF50",
    backgroundColor: "#FAFAFA",
  },
  transactionCardInactive: {
    borderLeftColor: "#E91E63",
    backgroundColor: "#F5F5F5",
    opacity: 0.7,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
    color: "#000",
  },
  transactionDate: {
    fontSize: 12,
    color: "#999",
  },
  miniStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 44,
    alignItems: "center",
  },
  miniStatusActive: {
    backgroundColor: "#C8E6C9",
  },
  miniStatusInactive: {
    backgroundColor: "#B2EBF2",
  },
  miniStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  transactionInfo: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  noMembershipContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SubscriptionCard;

