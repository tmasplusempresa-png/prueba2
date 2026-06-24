// Silencia console.log en pruebas para output más limpio
jest.spyOn(console, 'log').mockImplementation(() => {});

// ─── Expo ──────────────────────────────────────────────────────────────────

jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} } },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// ─── @expo/vector-icons ────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  AntDesign: 'AntDesign',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  FontAwesome5: 'FontAwesome5',
  Feather: 'Feather',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Entypo: 'Entypo',
}));

// ─── expo-router ───────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '/',
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

// ─── React Navigation ──────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useIsFocused: () => true,
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Reanimated ────────────────────────────────────────────────────────────

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// ─── Safe Area ─────────────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
}));

// ─── Gesture Handler ───────────────────────────────────────────────────────

jest.mock('react-native-gesture-handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require('react-native');
  return {
    GestureHandlerRootView: RN.View,
    PanGestureHandler: RN.View,
    TapGestureHandler: RN.View,
    ScrollView: RN.ScrollView,
    Swipeable: RN.View,
    DrawerLayout: RN.View,
    State: {},
    Directions: {},
  };
});

// ─── AsyncStorage ──────────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// ─── Bottom Sheet ──────────────────────────────────────────────────────────

jest.mock('@gorhom/bottom-sheet', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require('react-native');
  return {
    __esModule: true,
    default: RN.View,
    BottomSheetModal: RN.View,
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetScrollView: RN.ScrollView,
    BottomSheetView: RN.View,
    useBottomSheetModal: () => ({ present: jest.fn(), dismiss: jest.fn() }),
  };
});

// ─── Lottie ────────────────────────────────────────────────────────────────

jest.mock('lottie-react-native', () => 'LottieView');