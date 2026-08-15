import { useState } from 'react';
import { useHeaderHeight as useHeaderHeightElements } from 'expo-router/react-navigation';
import { Platform } from 'react-native';

const useHeaderHeight = (): number => {
  const headerHeight = useHeaderHeightElements();
  const [fixedHeight] = useState(headerHeight);

  return Platform.OS === 'android' ? fixedHeight : headerHeight;
};

export default useHeaderHeight;
