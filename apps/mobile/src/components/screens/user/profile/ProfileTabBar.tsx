import { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import type { LucideProps } from 'lucide-react-native';
import { upperFirst } from 'lodash';
import { Icons } from '../../../../constants/Icons';
import tw from '../../../../lib/tw';
import { useTheme } from '../../../../providers/ThemeProvider';
import { ContextMenu } from '../../../ui/context-menu';
import { useProfileTabs, type ProfileTab } from './ProfileTabsProvider';

const TAB_ICONS: Record<ProfileTab, React.ComponentType<LucideProps>> = {
  index: Icons.Grid,
  films: Icons.Movie,
  'tv-series': Icons.Tv,
  playlists: Icons.Playlist,
};

const ICON_SIZE = 22;

/**
 * The row of tabs, and the only place that knows which one is focused: the
 * navigator hands it the state, and it tells the provider, so the collapsing
 * header follows the right list.
 *
 * Everything that moves is driven by `position`, the pager's own progress: the
 * colours and the bar follow the reader's thumb through a swipe instead of
 * jumping when the tab finally changes. It is a React Native animated value,
 * not a Reanimated one, so this file stays on that API rather than bridging
 * between the two.
 */
const ProfileTabBar = ({
  state,
  descriptors,
  emitter,
  navigateToTab,
  position,
}: MaterialTopTabBarProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { measureTabBar, focusTab, menus } = useProfileTabs();

  const focusedTab = state.routes[state.index]?.name as ProfileTab | undefined;
  useEffect(() => {
    if (focusedTab) focusTab(focusedTab);
  }, [focusedTab, focusTab]);

  // The row's own width, not the pager's: a display cutout or a side
  // navigation bar takes a slice off the edges, and the bar is padded by it.
  const [rowWidth, setRowWidth] = useState(0);
  const tabWidth = rowWidth / state.routes.length;
  const inputRange = state.routes.map((_, index) => index);

  const indicatorStyle = {
    width: tabWidth,
    transform: [
      {
        translateX: position.interpolate({
          inputRange,
          outputRange: inputRange.map((index) => index * tabWidth),
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const onPressTab = useCallback(
    (routeKey: string, isFocused: boolean) => {
      const event = emitter.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigateToTab(routeKey);
    },
    [emitter, navigateToTab],
  );

  return (
    <View
      onLayout={(event) => measureTabBar(event.nativeEvent.layout.height)}
      style={{
        borderColor: colors.border,
        borderBottomWidth: 1,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View style={tw`flex-row`} onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const Icon = TAB_ICONS[route.name as ProfileTab] ?? Icons.Grid;
          const isFocused = state.index === index;

          const menu = menus[route.name as ProfileTab];

          const tab = (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={upperFirst(label)}
              onPress={() => onPressTab(route.key, isFocused)}
              // The width is given rather than flexed: a tab holding a menu is
              // wrapped in a native host that sizes itself to its contents, so
              // a `flex-1` inside it would shrink to the icon and leave it off
              // centre.
              style={[tw`items-center py-3`, { width: tabWidth || undefined }]}
            >
              <Icon color={colors.mutedForeground} size={ICON_SIZE} />
              {/* The focused colour laid over the muted one: a crossfade needs
                  no colour interpolation, which an icon's `color` prop -- a
                  prop, not a style -- cannot be given anyway. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  tw`absolute inset-0 items-center py-3`,
                  {
                    opacity: position.interpolate({
                      inputRange,
                      outputRange: inputRange.map((routeIndex) => (routeIndex === index ? 1 : 0)),
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <Icon color={colors.foreground} size={ICON_SIZE} />
              </Animated.View>
            </Pressable>
          );

          // The menu belongs to the tab the reader is already on: elsewhere a
          // tap has somewhere to go, and taking it to open a menu would strand
          // them. The others stay plain, so the tap travels.
          return (
            <View key={route.key} style={tw`flex-1 items-center`}>
              {isFocused && menu?.items.length ? (
                <ContextMenu title={menu.title} items={menu.items}>
                  {tab}
                </ContextMenu>
              ) : (
                tab
              )}
            </View>
          );
        })}

        {tabWidth > 0 && (
          <Animated.View
            style={[
              tw`absolute bottom-0 left-0 h-0.5`,
              { backgroundColor: colors.foreground },
              indicatorStyle,
            ]}
          />
        )}
      </View>
    </View>
  );
};

export default ProfileTabBar;
