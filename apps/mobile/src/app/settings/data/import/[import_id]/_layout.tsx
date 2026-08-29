import { Stack } from 'expo-router';
import { useTheme } from '../../../../../providers/ThemeProvider';

const SettingsDataImportDetailLayout = () => {
  const { defaultScreenOptions } = useTheme();
  return <Stack screenOptions={defaultScreenOptions} />;
};

export default SettingsDataImportDetailLayout;
