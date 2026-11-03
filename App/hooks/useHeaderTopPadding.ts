import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Padding superior para los headers propios (todas las pantallas usan
 * headerShown: false). En iOS insets.top ya trae la altura de la isla
 * dinámica / notch / barra de estado según el modelo, así que el header queda
 * justo debajo. En Android se conserva la fórmula histórica, o el valor fijo
 * que la pantalla ya usaba si se pasa `androidPadding`, para no mover nada ahí.
 */
export function useHeaderTopPadding(iosExtra = 8, androidPadding?: number): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'android') {
    return androidPadding ?? Math.max(insets.top, 10) + 8;
  }
  return insets.top + iosExtra;
}

/**
 * Padding inferior para paneles pegados al borde de abajo. En iOS usa la
 * altura real de la barra de inicio (0 en iPhones con botón Home, donde cae a
 * `iosMin`). Android conserva el valor fijo que ya tenía la pantalla.
 */
export function useBottomSafePadding(iosMin: number, androidPadding: number): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'android') return androidPadding;
  return insets.bottom > 0 ? insets.bottom : iosMin;
}

export default useHeaderTopPadding;
