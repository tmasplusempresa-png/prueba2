import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/app/(tabs)/index";
import ProfileScreen from "@/app/(tabs)/ProfileScreen";
import WalletScreen from "@/app/(tabs)/WalletDetails";
import SearchScreen from "@/app/(tabs)/SearchScreen";
import CustomerMap from "@/app/(tabs)/CustomerMap";
import TripPreviewScreen from "@/app/(tabs)/TripPreviewScreen";
import CustomerHomeScreen from "@/app/(tabs)/CustomerHomeScreen";
import CarsScreen from "@/app/Vehicle/carScreen";
import ActiveBookingScreen from "@/app/Booking/ActiveBookingScreen";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Platform, Dimensions, useColorScheme, StyleSheet, View, ActivityIndicator } from "react-native";
import { colors } from "@/scripts/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const { height, width } = Dimensions.get("window");

// Stack Navigator for Customer Map with Trip Preview
const CustomerMapStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{ 
        headerShown: false,
        animationEnabled: Platform.OS !== "android"
      }}
      initialRouteName="CustomerMapHome"
    >
      <Stack.Screen 
        name="CustomerMapHome" 
        component={CustomerMap}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TripPreviewScreen" 
        component={TripPreviewScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator for Customer — starts at new home screen
const CustomerStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: Platform.OS !== "android",
      }}
      initialRouteName="CustomerHome"
    >
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="CustomerMap" component={CustomerMap} />
      <Stack.Screen name="TripPreviewScreen" component={TripPreviewScreen} />
    </Stack.Navigator>
  );
};

const useHasNotch = () => {
  return Platform.OS === "ios" &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    [780, 812, 844, 852, 896, 926, 932].some(
      size => height === size || width === size
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
  const hasNotch = useHasNotch();
  const colorScheme = useColorScheme();

  const tabBarActiveTintColor = "#00f4f5";
  const tabBarInactiveTintColor = colorScheme === 'dark' ? '#888888' : colors.HEADER;

  const tabBarStyle = {
    backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    height: hasNotch ? 80 : 55,
  };

  // Build screens first and then pick a sensible initial route.
  // Default to the first available tab when no user-specific home exists.

  const tabScreens = useMemo(() => {
    const screens = [];

    if (currentUserType === "driver") {
      screens.push(
        {
          name: "Map",
          component: HomeScreen,
          title: "Inicio",
          icon: "map-outline",
        },
        {
          name: "Wallet",
          component: WalletScreen,
          title: "Billetera",
          icon: "card-outline",
        },
        {
          name: "CarsScreen",
          component: CarsScreen,
          title: "Vehiculo",
          icon: "car-outline",
        }
      );
    }

    if (currentUserType === "customer") {
      screens.push({
        name: "CustMap",
        component: CustomerStackNavigator,
        title: "Inicio",
        icon: "home-outline",
      });
    }

    screens.push(
      {
        name: "SearchScreen",
        component: SearchScreen, 
        title: "Favoritos",
        icon: "star-outline",
      },
      {
        name: "RideList",
        component: ActiveBookingScreen,
        title: "Historial",
        icon: "book",
        badge: true,
        badgeCount: (user as any)?.activeBookings?.length || 0,
      },
      {
        name: "Profile",
        component: ProfileScreen,
        title: "Perfil",
        icon: "person-outline",
      }
    );

    return screens;
  }, [currentUserType, user]);

  const initialRoute = useMemo(() => {
    if (currentUserType === "driver") return "Map";
    if (currentUserType === "customer") return "CustMap";
    return tabScreens[0]?.name ?? "RideList";
  }, [currentUserType, tabScreens]);

  if (!currentUserType) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#00f4f5" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      screenOptions={({ route }) => {
        const screen = tabScreens.find(s => s.name === route.name);
        return {
          animationEnabled: Platform.OS !== "android",
          tabBarIcon: ({ color, size }) => {
            const iconName = screen?.icon;
            if (iconName) {
              const IconComponent = AntDesign.name === iconName ? AntDesign : Ionicons;
              return <IconComponent name={iconName} size={size} color={color} />;
            }
            return null;
          },
          tabBarActiveTintColor,
          tabBarInactiveTintColor,
          tabBarBadge:
            screen?.badge && screen.badgeCount > 0 ? screen.badgeCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarStyle: { display: "none" },
          tabBarLabelStyle: styles.label,
        };
      }}
    >
      {tabScreens.map(screen => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            headerShown: false,
            title: screen.title,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
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
