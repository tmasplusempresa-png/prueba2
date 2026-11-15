/**
 * Acceso seguro a react-native-keyboard-controller. Si el módulo nativo no está
 * en el binario (p. ej. un dev client viejo), todo degrada a los componentes de
 * react-native y la app no se cae. `keyboardControllerAvailable` permite que un
 * componente conserve su lógica manual de teclado en ese caso.
 */
import React from 'react';
import { ScrollView, TurboModuleRegistry } from 'react-native';
import type { ScrollViewProps } from 'react-native';

let KC: any = null;
try {
  if (TurboModuleRegistry.get('KeyboardController')) {
    KC = require('react-native-keyboard-controller');
  }
} catch {
  KC = null;
}

export const keyboardControllerAvailable: boolean = !!KC;

type ProviderProps = { children?: React.ReactNode; statusBarTranslucent?: boolean; navigationBarTranslucent?: boolean };
const PassThrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export const KeyboardProvider: React.ComponentType<ProviderProps> = KC ? KC.KeyboardProvider : PassThrough;

type StickyProps = { children?: React.ReactNode; offset?: { closed?: number; opened?: number } };
export const KeyboardStickyView: React.ComponentType<StickyProps> = KC ? KC.KeyboardStickyView : PassThrough;

type AwareProps = ScrollViewProps & { bottomOffset?: number };
const FallbackAwareScrollView = React.forwardRef<ScrollView, AwareProps>(function FallbackAwareScrollView(
  { bottomOffset: _ignored, ...rest },
  ref,
) {
  return <ScrollView ref={ref} {...rest} />;
});
export const KeyboardAwareScrollView: React.ComponentType<any> = KC
  ? KC.KeyboardAwareScrollView
  : FallbackAwareScrollView;
