import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useProfileTabs } from './ProfileTabsProvider';

/**
 * Holds a tab's list and moves it with the header.
 *
 * A drag on the header, and the room the spinner keeps while a refresh runs,
 * both move the header over a list that knows nothing about either -- the
 * header would travel alone. This box carries the list the same distance.
 */
const ProfileTabContent = ({ children }: { children: React.ReactNode }) => {
  const { contentShift } = useProfileTabs();

  const shiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentShift.value }],
  }));

  return <Animated.View style={[{ flex: 1 }, shiftStyle]}>{children}</Animated.View>;
};

export default ProfileTabContent;
