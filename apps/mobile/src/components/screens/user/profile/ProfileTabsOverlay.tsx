import { ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { useTheme } from '../../../../providers/ThemeProvider';
import ProfileHeader from './ProfileHeader';
import ProfileTabBar from './ProfileTabBar';
import { PULL_THRESHOLD, REFRESH_BAND, useProfileTabs } from './ProfileTabsProvider';

/** Movement before a drag counts as vertical, and before it counts as sideways. */
const DRAG_SLOP = 6;
const SIDEWAYS_SLOP = 10;

/** How much of a pull past the top the header actually follows. */
const PULL_RESISTANCE = 0.5;

/**
 * The profile header and the tab row, as one block over the four lists.
 *
 * It is handed to the navigator as its tab bar, which is what gives it the
 * navigation state, but it takes no room in that column: it is positioned
 * absolutely so the pager fills the screen and each list clears the block with
 * its own top padding. Scrolling slides the block up until the tab row meets
 * the navigation bar, where it stops.
 */
const ProfileTabsOverlay = (tabBarProps: MaterialTopTabBarProps) => {
  const { colors } = useTheme();
  const {
    profile,
    profileIsLoading,
    scrollRefs,
    focusedTab,
    focusedOffset,
    collapseRange,
    dragPull,
    contentShift,
    isRefreshing,
    measureOverlay,
    requestRefresh,
    syncOffsets,
  } = useProfileTabs();

  // Where the focused list stood when the drag began, and where the drag has
  // taken it since -- a value of its own, so the fling can go on moving it once
  // the finger is gone.
  const dragOrigin = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const dragOffset = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const touchStart = useSharedValue({ x: 0, y: 0 });

  // The overlay covers the lists, so a drag that starts on it never reaches
  // one. It is turned into a scroll of whichever list is focused.
  useAnimatedReaction(
    () => (isDragging.value ? dragOffset.value : null),
    (offset) => {
      if (offset === null) return;
      scrollTo(scrollRefs[focusedTab.value], 0, offset, false);
    },
  );

  const pan = Gesture.Pan()
    // Claimed by hand: the pinned row and the tab buttons are touch targets of
    // their own, and a gesture that activated on its own would take every touch
    // that lands on them. This one only claims a touch once it has moved
    // further down than sideways, so taps and the pinned row's own scrolling
    // are left alone.
    .manualActivation(true)
    .onTouchesDown((event) => {
      const touch = event.changedTouches[0];
      touchStart.value = { x: touch.x, y: touch.y };
    })
    .onTouchesMove((event, manager) => {
      const touch = event.changedTouches[0];
      const sideways = Math.abs(touch.x - touchStart.value.x);
      const vertical = Math.abs(touch.y - touchStart.value.y);

      if (vertical > DRAG_SLOP && vertical > sideways) {
        manager.activate();
      } else if (sideways > SIDEWAYS_SLOP) {
        manager.fail();
      }
    })
    .onStart((event) => {
      cancelAnimation(dragOffset);
      dragOrigin.value = Math.max(focusedOffset.value, 0);
      dragOffset.value = dragOrigin.value;
      dragStart.value = event.translationY;
      isDragging.value = true;
    })
    .onUpdate((event) => {
      const travelled = event.translationY - dragStart.value;
      const next = dragOrigin.value - travelled;

      // Past the top there is nothing left to scroll, so the drag turns into a
      // pull: a programmatic scroll cannot enter the list's own bounce.
      dragOffset.value = Math.max(0, next);
      dragPull.value = next < 0 ? -next * PULL_RESISTANCE : 0;
    })
    .onEnd((event) => {
      if (dragPull.value >= PULL_THRESHOLD) runOnJS(requestRefresh)();
      dragPull.value = withTiming(0, { duration: 200 });

      dragOffset.value = withDecay(
        { velocity: -event.velocityY, clamp: [0, Math.max(collapseRange.value, 0)] },
        () => {
          isDragging.value = false;
          // A drag that brought the header back has to reach the other lists
          // too, the same way the end of a scroll does.
          runOnJS(syncOffsets)();
        },
      );
    });

  // Two ways down, which never happen at once: the list's own bounce, which
  // moves the list by itself, and `contentShift`, which is what the lists are
  // moved by from here -- a drag past the top, plus the spinner's room. The
  // header has to follow both.
  const bouncePull = useDerivedValue(() => Math.max(0, -focusedOffset.value));

  const overlayStyle = useAnimatedStyle(() => {
    const collapse = Math.min(Math.max(focusedOffset.value, 0), collapseRange.value);

    return {
      transform: [{ translateY: -collapse + bouncePull.value + contentShift.value }],
    };
  });

  const spinnerStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, (bouncePull.value + dragPull.value) / PULL_THRESHOLD);

    return {
      opacity: isRefreshing.value ? 1 : progress,
      transform: [{ scale: isRefreshing.value ? 1 : 0.6 + progress * 0.4 }],
    };
  });

  return (
    <>
      {/* Outside the block that moves, and over it: a refresh spinner stays
          where it is while the content slides past, the way a scroll view's own
          does. Only its opacity and size follow the pull. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: REFRESH_BAND,
            zIndex: 2,
            justifyContent: 'center',
          },
          spinnerStyle,
        ]}
      >
        <ActivityIndicator color={colors.mutedForeground} />
      </Animated.View>

      <Animated.View
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
        <GestureDetector gesture={pan}>
          <Animated.View>
            {profileIsLoading || !profile ? (
              <ProfileHeader skeleton />
            ) : (
              <ProfileHeader profile={profile} />
            )}
            <ProfileTabBar {...tabBarProps} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </>
  );
};

export default ProfileTabsOverlay;
