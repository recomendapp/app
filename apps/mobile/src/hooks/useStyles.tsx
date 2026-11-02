import { TColors } from '../constants/Colors';
import { useTheme } from '../providers/ThemeProvider';
import { useMemo } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

// React Native's strict type API no longer exports `StyleSheet.NamedStyles`.
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

interface Styles<T extends NamedStyles<T>> {
  colors: TColors;
  styles: T;
}

export default function <T extends NamedStyles<T>>(createStyle: (colors: TColors) => T): Styles<T> {
  const { colors } = useTheme();

  return {
    colors: colors,
    styles: useMemo(() => createStyle(colors), [colors, createStyle]),
  };
}
