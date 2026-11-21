/**
 * Acceso seguro a react-native-keyboard-controller.
 * En Android el KeyboardProvider reajusta el layout y a menudo cierra el teclado
 * apenas se abre (cualquier TextInput). Solo se activa en iOS; en Android se
 * usan los componentes nativos de React Native.
 */
import React from 'react';
import { Platform, ScrollView, TurboModuleRegistry } from 'react-native';
import type { ScrollViewProps } from 'react-native';

let KC: any = null;
try {
  if (Platform.OS === 'ios' && TurboModuleRegistry.get('KeyboardController')) {
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
