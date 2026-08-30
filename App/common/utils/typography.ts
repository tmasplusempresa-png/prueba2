import { TextStyle } from 'react-native';

/** Evita que la tipografía del sistema rompa layouts fijos (navbar, chips, etc.). */
export const FIXED_TEXT_PROPS = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const;

export const fixedLabelStyle: TextStyle = {
  includeFontPadding: false,
};
