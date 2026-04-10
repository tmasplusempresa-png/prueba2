/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Colores corporativos: #ffffff (blanco), #00f4f5 (cyan), #00204a (navy)
const CORP_CYAN = '#00f4f5';
const CORP_NAVY = '#00204a';
const CORP_WHITE = '#ffffff';

const tintColorLight = CORP_CYAN;
const tintColorDark = CORP_WHITE;

export const Colors = {
  light: {
    text: '#11181C',
    background: CORP_WHITE,
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    main_color: CORP_CYAN
  },
  dark: {
    text: '#ECEDEE',
    background: CORP_NAVY,
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    main_color: CORP_CYAN
  },
};
