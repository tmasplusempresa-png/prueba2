import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { HISTORIAL_ICON } from '@/components/CustomerBottomNav';
import { invokeDriverGoActivate } from '@/common/utils/driverGoBridge';
import { FIXED_TEXT_PROPS } from '@/common/utils/typography';
import { RootState } from '@/common/store';

export type DriverNavTab = 'vehiculo' | 'billetera' | 'go' | 'historial' | 'perfil';

/** Conductor autenticado — pantallas principales del navbar no muestran volver. */
export function useIsDriverUser() {
  const profile = useSelector((s: RootState) => s.auth.profile);
  const user = useSelector((s: RootState) => s.auth.user) as Record<string, unknown> | null;
  const type = String(
    profile?.user_type || user?.user_type || user?.usertype || user?.userType || ''
  )
    .trim()
    .toLowerCase();
  return type === 'driver';
}

export function selectDriverOnline(state: RootState) {
  const auth = state.auth;
  const user = auth.user as Record<string, unknown> | null;
  return Boolean(
    auth.profile?.driver_active_status ||
      user?.driver_active_status ||
      user?.driverActiveStatus
  );
}

const ACTIVE = '#00E5FF';
const INACTIVE = 'rgba(255,255,255,0.3)';

const ROUTE_TO_TAB: Record<string, DriverNavTab> = {
  Cars: 'vehiculo',
  Wallet: 'billetera',
  Map: 'go',
  Historial: 'historial',
  Profile: 'perfil',
};

const TAB_TO_ROUTE: Record<Exclude<DriverNavTab, 'go'>, string> = {
  vehiculo: 'Cars',
  billetera: 'Wallet',
  historial: 'Historial',
  perfil: 'Profile',
};

const DRIVER_TAB_ROUTE_NAMES = ['Cars', 'Wallet', 'Map', 'Historial', 'Profile'];

/** True when the screen is rendered inside the driver swipe tab navigator. */
export function useIsDriverTabScreen() {
  const navigation = useNavigation();
  let nav: ReturnType<typeof useNavigation> | undefined = navigation;
  while (nav) {
    const state = nav.getState();
    if (state?.type === 'tab') {
      const names = state.routeNames as string[];
      if (names.includes('Map') && names.includes('Cars')) return true;
    }
    nav = nav.getParent();
  }
  return false;
}

/** Extra bottom padding so scroll content clears the floating glass nav. */
export function useDriverNavBottomPad() {
  const insets = useSafeAreaInsets();
  return 100 + insets.bottom + 10;
}

export default function DriverBottomNav({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const goCtrScale = useRef(new Animated.Value(1)).current;
  const goPulseScale = useRef(new Animated.Value(1)).current;
  const goPulseOp = useRef(new Animated.Value(0.45)).current;
  const goBreathScale = useRef(new Animated.Value(1)).current;

  const driverOnline = useSelector(selectDriverOnline);
  const goLockRef = useRef(false);

  const currentRoute = state.routes[state.index]?.name ?? 'Map';
  const active: DriverNavTab = ROUTE_TO_TAB[currentRoute] ?? 'go';

  useEffect(() => {
    if (driverOnline) {
      goPulseScale.setValue(1);
      goPulseOp.setValue(0);
      goBreathScale.setValue(1);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(goPulseScale, { toValue: 2.4, duration: 2400, useNativeDriver: true }),
          Animated.timing(goPulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(goPulseOp, { toValue: 0, duration: 2400, useNativeDriver: true }),
          Animated.timing(goPulseOp, { toValue: 0.45, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );

    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(goBreathScale, { toValue: 1.07, duration: 900, useNativeDriver: true }),
        Animated.timing(goBreathScale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );

    pulseLoop.start();
    breathLoop.start();
    return () => {
      pulseLoop.stop();
      breathLoop.stop();
    };
  }, [driverOnline, goBreathScale, goPulseOp, goPulseScale]);

  const goTab = useCallback(
    (tab: Exclude<DriverNavTab, 'go'>) => {
      const routeName = TAB_TO_ROUTE[tab];
      if (active === tab) return;
      Haptics.selectionAsync().catch(() => {});
      navigation.navigate(routeName);
    },
    [active, navigation]
  );

  const onGoPress = useCallback(() => {
    if (goLockRef.current) return;
    goLockRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.timing(goCtrScale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.spring(goCtrScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
    if (active !== 'go') {
      navigation.navigate('Map');
    }
    if (!driverOnline) {
      invokeDriverGoActivate();
    }
    setTimeout(() => {
      goLockRef.current = false;
    }, 1800);
  }, [active, driverOnline, goCtrScale, navigation]);

  const bottomOffset = insets.bottom + 10;

  return (
    <View style={[styles.bottomNav, { paddingBottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.navShell} pointerEvents="box-none">
        <View style={styles.navGlassClip} pointerEvents="none">
          <BlurView
            intensity={Platform.OS === 'ios' ? 55 : 70}
            tint="dark"
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.navGlassTint} />
        </View>

        <View style={styles.navItems}>
          <TouchableOpacity style={styles.navItem} onPress={() => goTab('vehiculo')} activeOpacity={0.7}>
            <Ionicons
              name={active === 'vehiculo' ? 'car' : 'car-outline'}
              size={22}
              color={active === 'vehiculo' ? ACTIVE : INACTIVE}
            />
            <Text
              {...FIXED_TEXT_PROPS}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.navLbl, active === 'vehiculo' && styles.navLblActive]}
            >
              Vehículo
            </Text>
            {active === 'vehiculo' && <View style={styles.navInd} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => goTab('billetera')} activeOpacity={0.7}>
            <Ionicons
              name={active === 'billetera' ? 'wallet' : 'wallet-outline'}
              size={22}
              color={active === 'billetera' ? ACTIVE : INACTIVE}
            />
            <Text
              {...FIXED_TEXT_PROPS}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.navLbl, active === 'billetera' && styles.navLblActive]}
            >
              Billetera
            </Text>
            {active === 'billetera' && <View style={styles.navInd} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCenterItem} onPress={onGoPress} activeOpacity={1}>
            <View style={styles.navCenterPulseWrap}>
              {!driverOnline && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.navCenterPulseRing,
                    { transform: [{ scale: goPulseScale }], opacity: goPulseOp },
                  ]}
                />
              )}
              <Animated.View
                style={[
                  styles.navCenterBtn,
                  !driverOnline && styles.navCenterBtnGo,
                  {
                    transform: [
                      {
                        scale: driverOnline
                          ? goCtrScale
                          : Animated.multiply(goCtrScale, goBreathScale),
                      },
                    ],
                  },
                ]}
              >
                {driverOnline ? (
                  <Image
                    source={require('@/assets/images/logo-Preview-Photoroom.png')}
                    style={styles.goLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Text {...FIXED_TEXT_PROPS} style={styles.goText}>GO</Text>
                )}
              </Animated.View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => goTab('historial')} activeOpacity={0.7}>
            <Ionicons name={HISTORIAL_ICON} size={22} color={active === 'historial' ? ACTIVE : INACTIVE} />
            <Text
              {...FIXED_TEXT_PROPS}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.navLbl, active === 'historial' && styles.navLblActive]}
            >
              Historial
            </Text>
            {active === 'historial' && <View style={styles.navInd} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => goTab('perfil')} activeOpacity={0.7}>
            <Ionicons
              name={active === 'perfil' ? 'person' : 'person-outline'}
              size={22}
              color={active === 'perfil' ? ACTIVE : INACTIVE}
            />
            <Text
              {...FIXED_TEXT_PROPS}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.navLbl, active === 'perfil' && styles.navLblActive]}
            >
              Perfil
            </Text>
            {active === 'perfil' && <View style={styles.navInd} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export { DRIVER_TAB_ROUTE_NAMES };

const styles = StyleSheet.create({
  bottomNav: {
    paddingHorizontal: 16,
    paddingTop: 22,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  navShell: {
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 16,
  },
  navGlassClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  navGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,26,38,0.28)',
  },
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    overflow: 'visible',
    zIndex: 2,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 14,
    minWidth: 48,
    maxWidth: 64,
    flex: 1,
    position: 'relative',
  },
  navCenterItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 64,
    overflow: 'visible',
  },
  navCenterPulseWrap: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  navCenterPulseRing: {
    position: 'absolute',
    left: -8,
    right: -8,
    top: -8,
    bottom: -8,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(0,229,255,0.35)',
  },
  navCenterBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 14,
  },
  navCenterBtnGo: {
    backgroundColor: '#00E5FF',
  },
  goLogo: {
    width: 34,
    height: 34,
  },
  goText: {
    color: '#051A26',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  navLbl: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  navLblActive: { color: '#00E5FF' },
  navInd: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#00E5FF',
  },
});
