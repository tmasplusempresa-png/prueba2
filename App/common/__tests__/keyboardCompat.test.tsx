import React from 'react';
import { ScrollView, Text } from 'react-native';
import { render } from '@testing-library/react-native';

/**
 * keyboardCompat con el módulo nativo ausente: no debe lanzar y debe degradar
 * al comportamiento anterior (hijos tal cual, ScrollView normal).
 */
function load(nativeModule: unknown, lib?: unknown) {
  let mod: any;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => {
      const rn = jest.requireActual('react-native');
      return new Proxy(rn, {
        get: (t, p) =>
          p === 'TurboModuleRegistry' ? { get: () => nativeModule } : t[p as keyof typeof t],
      });
    });
    if (lib === undefined) {
      jest.doMock(
        'react-native-keyboard-controller',
        () => {
          throw new Error('Cannot find module');
        },
        { virtual: true },
      );
    } else {
      jest.doMock('react-native-keyboard-controller', () => lib, { virtual: true });
    }
    mod = require('../utils/keyboardCompat');
  });
  return mod;
}

afterEach(() => {
  jest.dontMock('react-native');
  jest.dontMock('react-native-keyboard-controller');
});

describe('keyboardCompat sin módulo nativo', () => {
  it('no lanza al importarse y marca el módulo como no disponible', () => {
    expect(() => load(null)).not.toThrow();
    expect(load(null).keyboardControllerAvailable).toBe(false);
  });

  it('no carga la librería si el módulo nativo falta (aunque su import lanzaría)', () => {
    expect(load(null).keyboardControllerAvailable).toBe(false);
  });

  it('KeyboardProvider y KeyboardStickyView dejan pasar a los hijos', () => {
    const { KeyboardProvider, KeyboardStickyView } = load(null);
    const { getByText } = render(
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <KeyboardStickyView offset={{ opened: 4 }}>
          <Text>hijo</Text>
        </KeyboardStickyView>
      </KeyboardProvider>,
    );
    expect(getByText('hijo')).toBeTruthy();
  });

  it('KeyboardAwareScrollView degrada a ScrollView y descarta bottomOffset', () => {
    const { KeyboardAwareScrollView } = load(null);
    const { UNSAFE_getByType, getByText } = render(
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled">
        <Text>contenido</Text>
      </KeyboardAwareScrollView>,
    );
    expect(getByText('contenido')).toBeTruthy();
    const sv = UNSAFE_getByType(ScrollView);
    expect(sv.props.bottomOffset).toBeUndefined();
    expect(sv.props.keyboardShouldPersistTaps).toBe('handled');
  });
});

describe('keyboardCompat con módulo nativo presente', () => {
  it('usa los componentes de la librería', () => {
    const lib = {
      KeyboardProvider: ({ children }: any) => <>{children}</>,
      KeyboardStickyView: ({ children }: any) => <>{children}</>,
      KeyboardAwareScrollView: () => null,
    };
    const m = load({}, lib);
    expect(m.keyboardControllerAvailable).toBe(true);
    expect(m.KeyboardProvider).toBe(lib.KeyboardProvider);
    expect(m.KeyboardAwareScrollView).toBe(lib.KeyboardAwareScrollView);
  });
});
