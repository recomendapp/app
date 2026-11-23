import Colors, { TColors } from '../constants/Colors';
import { DarkTheme, ThemeProvider as NativeThemeProvider } from 'expo-router/react-navigation';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { Appearance, Platform } from 'react-native';
import { isLiquidGlassAvailable as utilsIsLiquidGlassAvailable } from 'expo-glass-effect';
import { NavigationBar } from 'expo-navigation-bar';
import { getModeFromColor } from '../utils/getModeFromColor';
import { NativeStackNavigationOptions } from 'expo-router';
import { theme as staticTheme, type Theme } from '../theme';

type ThemeMode = 'light' | 'dark';

type StatusBarStyle = NonNullable<NativeStackNavigationOptions['statusBarStyle']>;

type ThemeContextType = {
  colors: TColors;
  theme: Theme;
  statusBarStyle: StatusBarStyle;
  applyColors: (theme: keyof typeof Colors) => void;
  defaultScreenOptions: NativeStackNavigationOptions;
  mode: ThemeMode;
  isLiquidGlassAvailable: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children?: React.ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const isLiquidGlassAvailable = utilsIsLiquidGlassAvailable();
  const [colors, setColors] = useState(Colors['dark']);
  const mode = useMemo((): ThemeMode => getModeFromColor(colors.background), [colors.background]);
  const applyColors = useCallback((theme: keyof typeof Colors) => {
    setColors(Colors[theme]);
  }, []);

  const statusBarStyle: StatusBarStyle = mode === 'dark' ? 'light' : 'dark';

  const defaultScreenOptions = useMemo<NativeStackNavigationOptions>(
    () => ({
      animation: 'ios_from_right',
      statusBarStyle,
      headerShown: true,
      headerTintColor: colors.foreground,
      headerStyle: {
        backgroundColor: colors.background,
        // backgroundColor: isLiquidGlassAvailable ? 'transparent' : colors.background,
      },
      contentStyle: {
        backgroundColor: colors.background,
        // backgroundColor: isLiquidGlassAvailable ? 'transparent' : colors.background,
      },
      headerShadowVisible: false,
      headerTitleAlign: 'center',
      headerBackButtonDisplayMode: 'minimal',
    }),
    [colors, statusBarStyle],
  );

  useEffect(() => {
    Appearance.setColorScheme(mode);
    if (Platform.OS === 'android') {
      NavigationBar.setStyle(mode);
    }
  }, [mode]);

  useEffect(() => {
    setBackgroundColorAsync(colors.background);
  }, [colors]);

  return (
    <NativeThemeProvider
      value={{
        dark: mode === 'dark',
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.muted,
          text: colors.foreground,
          border: colors.border,
          notification: colors.accentYellow,
        },
        fonts: DarkTheme.fonts,
      }}
    >
      <ThemeContext.Provider
        value={{
          applyColors,
          colors,
          theme: staticTheme,
          statusBarStyle,
          defaultScreenOptions,
          mode,
          isLiquidGlassAvailable,
        }}
      >
        {children}
      </ThemeContext.Provider>
    </NativeThemeProvider>
  );
};

export const useTheme = () => {
  const context = use(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
