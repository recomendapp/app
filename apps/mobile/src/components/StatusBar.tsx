import { useTheme } from '../providers/ThemeProvider';
import { StatusBar as StatusBarNative, StatusBarProps } from 'expo-status-bar';

const StatusBar = (props: StatusBarProps) => {
  const { statusBarStyle } = useTheme();
  // Android only in practice: on iOS the native stack's statusBarStyle wins,
  // because the Info.plist enables UIViewControllerBasedStatusBarAppearance.
  return <StatusBarNative style={statusBarStyle} {...props} />;
};

export default StatusBar;
