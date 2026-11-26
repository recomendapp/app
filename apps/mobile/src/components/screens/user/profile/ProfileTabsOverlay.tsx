import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { useTheme } from '../../../../providers/ThemeProvider';
import ProfileHeader from './ProfileHeader';
import ProfileTabBar from './ProfileTabBar';
import { useProfileTabs } from './ProfileTabsProvider';

/**
 * The profile header and the tab row, as one block over the four lists.
 *
 * It is handed to the navigator as its tab bar, which is what gives it the
 * navigation state, but it takes no room in that column: it is positioned
 * absolutely so the pager fills the screen and each list clears the block with
 * its own top padding. Scrolling slides the block up until the tab row meets
 * the navigation bar, where it stops.
 *
 * It takes no touches of its own either, beyond the controls it holds: a drag
 * on the header is a drag on the list behind it, which is what gives the whole
 * screen the system's own scrolling, bounce and pull to refresh.
 */
const ProfileTabsOverlay = (tabBarProps: MaterialTopTabBarProps) => {
  const { colors } = useTheme();
  const { profile, profileIsLoading, focusedOffset, collapseRange, measureOverlay } =
    useProfileTabs();

  // The list's own overscroll, which the header follows down so the two move
  // as one.
  const bouncePull = useDerivedValue(() => Math.max(0, -focusedOffset.value));

  const overlayStyle = useAnimatedStyle(() => {
    const collapse = Math.min(Math.max(focusedOffset.value, 0), collapseRange.value);

    return { transform: [{ translateY: -collapse + bouncePull.value }] };
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      onLayout={(event) => measureOverlay(event.nativeEvent.layout.height)}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          backgroundColor: colors.background,
        },
        overlayStyle,
      ]}
    >
      {profileIsLoading || !profile ? (
        <ProfileHeader skeleton />
      ) : (
        <ProfileHeader profile={profile} />
      )}
      <ProfileTabBar {...tabBarProps} />
    </Animated.View>
  );
};

export default ProfileTabsOverlay;
