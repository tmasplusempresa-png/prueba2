import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/app/(tabs)/index";
import ProfileScreen from "@/app/(tabs)/ProfileScreen";
import WalletScreen from "@/app/(tabs)/WalletDetails";
import SearchScreen from "@/app/(tabs)/SearchScreen";
import CustomerMap from "@/app/(tabs)/CustomerMap";
import TripPreviewScreen from "@/app/(tabs)/TripPreviewScreen";
import CustomerHomeScreen from "@/app/(tabs)/CustomerHomeScreen";
import ReservationsScreen from "@/app/(tabs)/ReservationsScreen";
import CarsScreen from "@/app/Vehicle/carScreen";
import ActiveBookingScreen from "@/app/Booking/ActiveBookingScreen";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Dimensions, useColorScheme, StyleSheet, View, ActivityIndicator } from "react-native";
import { colors } from "@/scripts/theme";
import CustomerBottomNav from "@/components/CustomerBottomNav";

const Tab = createBottomTabNavigator();
const CustomerTabs = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();
const { height, width } = Dimensions.get("window");

const CustomerHomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "android" ? "none" : "default",
      }}
      initialRouteName="CustomerHome"
    >
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="CustomerMap" component={CustomerMap} />
      <Stack.Screen name="TripPreviewScreen" component={TripPreviewScreen} />
    </Stack.Navigator>
  );
};

/**
 * Customer root: swipeable tabs + one persistent bottom bar.
 * Order: Home ↔ Historial ↔ Lugares ↔ Profile
 * "Viajar" opens CreateReservation (action, not a tab page).
 */
const CustomerTabNavigator: React.FC = () => {
  return (
    <View style={styles.customerRoot}>
      <CustomerTabs.Navigator
        initialRouteName="Home"
        tabBarPosition="bottom"
        tabBar={(props) => (
          <View style={styles.floatingTabBar} pointerEvents="box-none">
            <CustomerBottomNav {...props} />
          </View>
        )}
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
        }}
      >
        <CustomerTabs.Screen name="Home" component={CustomerHomeStack} options={{ title: "Inicio" }} />
        <CustomerTabs.Screen name="Historial" component={ReservationsScreen} options={{ title: "Historial" }} />
        <CustomerTabs.Screen name="Lugares" component={SearchScreen} options={{ title: "Lugares" }} />
        <CustomerTabs.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
      </CustomerTabs.Navigator>
    </View>
  );
};

const useHasNotch = () => {
  return (
    Platform.OS === "ios" &&
    !Platform.isPad &&
    !(Platform as any).isTVOS &&
    [780, 812, 844, 852, 896, 926, 932].some(
      (size) => height === size || width === size
    )
  );
};

const DriverTabNavigator: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const hasNotch = useHasNotch();
  const colorScheme = useColorScheme();
  const tabBarActiveTintColor = "#00f4f5";
  const tabBarInactiveTintColor = colorScheme === "dark" ? "#888888" : (colors as any).HEADER;

  const tabScreens = useMemo(
    () => [
      { name: "Map", component: HomeScreen, title: "Inicio", icon: "map-outline" as const },
      { name: "Wallet", component: WalletScreen, title: "Billetera", icon: "card-outline" as const },
      { name: "CarsScreen", component: CarsScreen, title: "Vehiculo", icon: "car-outline" as const },
      { name: "SearchScreen", component: SearchScreen, title: "Favoritos", icon: "star-outline" as const },
      {
        name: "RideList",
        component: ActiveBookingScreen,
        title: "Historial",
        icon: "book" as const,
        badge: true,
        badgeCount: (user as any)?.activeBookings?.length || 0,
      },
      { name: "Profile", component: ProfileScreen, title: "Perfil", icon: "person-outline" as const },
    ],
    [user]
  );

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => {
        const screen = tabScreens.find((s) => s.name === route.name);
        return {
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            const iconName = screen?.icon;
            if (!iconName) return null;
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor,
          tabBarInactiveTintColor,
          tabBarBadge: screen?.badge && screen.badgeCount > 0 ? screen.badgeCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarStyle: { display: "none", height: hasNotch ? 80 : 55 },
          tabBarLabelStyle: styles.label,
        };
      }}
    >
      {tabScreens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{ headerShown: false, title: screen.title }}
        />
      ))}
    </Tab.Navigator>
  );
};

const TabNavigator: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const currentUserTypeRaw =
    profile?.user_type ||
    (user as any)?.usertype ||
    (user as any)?.user_type ||
    (user as any)?.userType ||
    (user as any)?.user_metadata?.usertype ||
    (user as any)?.user_metadata?.user_type ||
    (user as any)?.user_metadata?.userType ||
    null;

  const currentUserType = useMemo(() => {
    const normalized = String(currentUserTypeRaw || "").trim().toLowerCase();
    if (normalized === "driver" || normalized === "customer" || normalized === "company") {
      return normalized;
    }
    return null;
  }, [currentUserTypeRaw]);

  if (!currentUserType) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#00f4f5" />
      </View>
    );
  }

  if (currentUserType === "customer") {
    return <CustomerTabNavigator />;
  }

  return <DriverTabNavigator />;
};

const styles = StyleSheet.create({
  customerRoot: {
    flex: 1,
    backgroundColor: "#051A26",
  },
  floatingTabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    overflow: "visible",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#041B2D",
  },
  badge: {
    transform: [{ scaleX: 1 }],
  },
  label: {
    fontSize: 14,
    transform: [{ scaleX: 1 }],
  },
});

export default TabNavigator;
