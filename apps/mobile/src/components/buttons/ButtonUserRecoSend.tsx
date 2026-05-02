import React from 'react';
import { Pressable } from 'react-native';
import { Icons } from '../../constants/Icons';
import { useAuth } from '../../providers/AuthProvider';
import { usePathname, useRouter } from 'expo-router';
import { Button } from '../ui/Button';
import tw from '../../lib/tw';

interface ButtonUserRecoSendProps extends React.ComponentProps<typeof Button> {
  mediaId: number;
  mediaType: 'movie' | 'tv_series';
  mediaTitle?: string | null;
}

const ButtonUserRecoSend = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  ButtonUserRecoSendProps
>(
  (
    {
      mediaId,
      mediaType,
      mediaTitle,
      icon = Icons.Reco,
      variant = 'outline',
      size = 'icon',
      style,
      onPress: onPressProps,
      ...props
    },
    ref,
  ) => {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    return (
      <Button
        ref={ref}
        variant={variant}
        icon={icon}
        size={size}
        onPress={(e) => {
          if (user) {
            router.push({
              pathname: '/reco/send/[type]/[id]',
              params: {
                type: mediaType,
                id: mediaId,
                title: mediaTitle,
              },
            });
          } else {
            router.push({
              pathname: '/auth',
              params: {
                redirect: pathname,
              },
            });
          }
          onPressProps?.(e);
        }}
        style={{
          ...tw`rounded-full`,
          ...style,
        }}
        {...props}
      />
    );
  },
);
ButtonUserRecoSend.displayName = 'ButtonUserRecoSend';

export default ButtonUserRecoSend;
