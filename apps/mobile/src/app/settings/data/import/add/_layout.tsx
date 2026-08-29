import { Stack } from 'expo-router';
import { useTheme } from '../../../../../providers/ThemeProvider';

const SettingsDataImportAddLayout = () => {
  const { defaultScreenOptions, isLiquidGlassAvailable } = useTheme();
  return (
    <Stack
      screenOptions={{
        ...defaultScreenOptions,
        ...(isLiquidGlassAvailable
          ? {
              contentStyle: { backgroundColor: 'transparent' },
              headerStyle: { backgroundColor: 'transparent' },
            }
          : {}),
      }}
    />
  );
};

export default SettingsDataImportAddLayout;
