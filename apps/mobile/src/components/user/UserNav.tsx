import { useAuth } from '../../providers/AuthProvider';
import { Skeleton } from '../ui/Skeleton';
import { GestureResponderEvent, Pressable, PressableProps } from 'react-native';
import { useRouter } from 'expo-router';
import UserAvatar from './UserAvatar';
import { forwardRef, useCallback } from 'react';
import tw from '../../lib/tw';

export const UserNav = forwardRef<React.ComponentRef<typeof Pressable>, PressableProps>(
  ({ onPress, onLongPress, style, ...props }, ref) => {
    const router = useRouter();
    const { user } = useAuth();

    const handlePress = useCallback(
      (event: GestureResponderEvent) => {
        if (!user?.username) return;
        router.push({ pathname: '/user/[username]', params: { username: user.username } });
        onPress?.(event);
      },
      [onPress, router, user?.username],
    );

    const handleLongPress = useCallback(
      (event: GestureResponderEvent) => {
        router.push({ pathname: '/settings' });
        onLongPress?.(event);
      },
      [onLongPress, router],
    );

    if (user === null) return null;

    if (user === undefined) {
      return <Skeleton style={[tw`w-12 h-12 rounded-full`, style as object]} />;
    }

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={style}
        {...props}
      >
        <UserAvatar full_name={user.name} avatar_url={user.avatar} />
      </Pressable>
    );
  },
);
UserNav.displayName = 'UserNav';
