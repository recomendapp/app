import { forwardRef } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { Icons } from '../../constants/Icons';
import { Button } from '../ui/Button';
import { Playlist } from '@libs/api-js';
import { useUserPlaylistLike } from '@libs/query-client';

interface ButtonActionPlaylistLikeProps extends React.ComponentProps<typeof Button> {
  playlist: Playlist;
}

const ButtonActionPlaylistLike = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonActionPlaylistLikeProps
>(
  (
    { playlist, variant = 'ghost', size = 'icon', icon = Icons.like, onPress, iconProps, ...props },
    ref,
  ) => {
    const { colors } = useTheme();
    const { user } = useAuth();

    const { isLiked, toggle } = useUserPlaylistLike({
      userId: user?.id,
      playlistId: playlist.id,
    });

    if (!user) return null;

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        icon={icon}
        iconProps={{
          color: isLiked ? colors.accentPink : colors.foreground,
          fill: isLiked ? colors.accentPink : 'transparent',
          ...iconProps,
        }}
        onPress={(e) => {
          toggle();
          onPress?.(e);
        }}
        {...props}
      />
    );
  },
);
ButtonActionPlaylistLike.displayName = 'ButtonActionPlaylistLike';

export default ButtonActionPlaylistLike;
