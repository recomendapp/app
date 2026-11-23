import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import tw from '../../lib/tw';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';

interface RefreshableStateContainerProps extends React.ComponentProps<typeof ScrollView> {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  bottomOffset?: number;
}

export const RefreshableStateContainer = ({
  children,
  onRefresh,
  refreshing = false,
  contentContainerStyle,
  bottomOffset: bottomOffsetProp,
  ...props
}: RefreshableStateContainerProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const computedBottomOffset = bottomOffsetProp !== undefined ? bottomOffsetProp : insets.bottom;
  return (
    <ScrollView
      contentContainerStyle={[
        tw`flex-grow items-center justify-center`,
        {
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          paddingBottom: computedBottomOffset + theme.spaces.md,
        },
        contentContainerStyle,
      ]}
      alwaysBounceVertical={true}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
};
