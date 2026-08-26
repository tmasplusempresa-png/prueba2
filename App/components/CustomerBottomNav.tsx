import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  InteractionManager,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export type CustomerNavTab = 'home' | 'historial' | 'viajar' | 'lugares' | 'perfil';

/**
 * Iconos candidatos para Historial (Ionicons).
 *  1. 'time-outline'           — reloj (historial clásico) ← actual
 *  2. 'document-text-outline'  — documento / registros
 *  3. 'receipt-outline'        — recibos / viajes
 *  4. 'list-outline'           — lista de actividad
 *  5. 'albums-outline'         — historial apilado
 */
export const HISTORIAL_ICON: React.ComponentProps<typeof Ionicons>['name'] = 'time-outline';

const ACTIVE = '#00E5FF';
const INACTIVE = 'rgba(255,255,255,0.3)';

const ROUTE_TO_TAB: Record<string, CustomerNavTab> = {
  Home: 'home',
  Historial: 'historial',
  Lugares: 'lugares',
  Profile: 'perfil',
};

const TAB_TO_ROUTE: Record<Exclude<CustomerNavTab, 'viajar'>, string> = {
  home: 'Home',
  historial: 'Historial',
  lugares: 'Lugares',
  perfil: 'Profile',
};

/** Custom tab bar for customer material-top-tabs (swipe + persistent bar). */
export default function CustomerBottomNav({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const navigateLockRef = useRef(false);
  const navCtrScale = useRef(new Animated.Value(1)).current;
  const navPulseScale = useRef(new Animated.Value(1)).current;
  const navPulseOp = useRef(new Animated.Value(0.45)).current;

  const currentRoute = state.routes[state.index]?.name ?? 'Home';
  const active: CustomerNavTab = ROUTE_TO_TAB[currentRoute] ?? 'home';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(navPulseScale, { toValue: 2.4, duration: 2400, useNativeDriver: true }),
          Animated.timing(navPulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(navPulseOp, { toValue: 0, duration: 2400, useNativeDriver: true }),
          Animated.timing(navPulseOp, { toValue: 0.45, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [navPulseOp, navPulseScale]);

  const goTab = useCallback(
    (tab: Exclude<CustomerNavTab, 'viajar'>) => {
      const routeName = TAB_TO_ROUTE[tab];
      if (active === tab) return;
      Haptics.selectionAsync().catch(() => {});
      navigation.navigate(routeName);
    },
    [active, navigation]
  );

  const goViajar = useCallback(() => {
    if (navigateLockRef.current) return;
    navigateLockRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.timing(navCtrScale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.spring(navCtrScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
    InteractionManager.runAfterInteractions(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('CreateReservation');
      } else {
        navigation.navigate('CreateReservation' as never);
      }
      setTimeout(() => {
        navigateLockRef.current = false;
      }, 650);
    });
  }, [navigation, navCtrScale]);

  const bottomOffset = insets.bottom + 10;

  return (
    // overflow visible: el pulse del botón central puede salir del pill
    <View style={[styles.bottomNav, { paddingBottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.navShell} pointerEvents="box-none">
        {/* Capa glass recortada (solo el blur); no envuelve el botón Viajar */}
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
          <TouchableOpacity style={styles.navItem} onPress={() => goTab('home')} activeOpacity={0.7}>
            <Ionicons name={active === 'home' ? 'home' : 'home-outline'} size={22} color={active === 'home' ? ACTIVE : INACTIVE} />
            <Text style={[styles.navLbl, active === 'home' && styles.navLblActive]}>Inicio</Text>
            {active === 'home' && <View style={styles.navInd} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => goTab('historial')} activeOpacity={0.7}>
            <Ionicons name={HISTORIAL_ICON} size={22} color={active === 'historial' ? ACTIVE : INACTIVE} />
            <Text style={[styles.navLbl, active === 'historial' && styles.navLblActive]}>Historial</Text>
            {active === 'historial' && <View style={styles.navInd} />}
          </TouchableOpacity>

          {/* Slot central: botón centrado verticalmente; label comentado a pedido */}
          <TouchableOpacity style={styles.navCenterItem} onPress={goViajar} activeOpacity={1}>
            <View style={styles.navCenterPulseWrap}>
              <Animated.View
                pointerEvents="none"
                style={[styles.navCenterPulseRing, { transform: [{ scale: navPulseScale }], opacity: navPulseOp }]}
              />
              <Animated.View style={[styles.navCenterBtn, { transform: [{ scale: navCtrScale }] }]}>
                <Ionicons name="navigate" size={26} color="#051A26" />
              </Animated.View>
            </View>
            {/* <Text style={styles.navLbl}>Viajar</Text> */}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => goTab('lugares')} activeOpacity={0.7}>
            <Ionicons
              name={active === 'lugares' ? 'location' : 'location-outline'}
              size={22}
              color={active === 'lugares' ? ACTIVE : INACTIVE}
            />
            <Text style={[styles.navLbl, active === 'lugares' && styles.navLblActive]}>Lugares</Text>
            {active === 'lugares' && <View style={styles.navInd} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => goTab('perfil')} activeOpacity={0.7}>
            <Ionicons
              name={active === 'perfil' ? 'person' : 'person-outline'}
              size={22}
              color={active === 'perfil' ? ACTIVE : INACTIVE}
            />
            <Text style={[styles.navLbl, active === 'perfil' && styles.navLblActive]}>Perfil</Text>
            {active === 'perfil' && <View style={styles.navInd} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/** Extra bottom padding so scroll content clears the floating glass nav. */
export function useCustomerNavBottomPad() {
  const insets = useSafeAreaInsets();
  return 100 + insets.bottom + 10;
}

const styles = StyleSheet.create({
  bottomNav: {
    paddingHorizontal: 16,
    // Espacio arriba para que el pulse no se corte contra el borde del shell
    paddingTop: 22,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  navShell: {
    position: 'relative',
    overflow: 'visible',
    // Sombra suave de flotación (borde/elevación del pill)
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    minWidth: 52,
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
  navLbl: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
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
