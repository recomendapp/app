import { forwardRef } from 'react';
import { View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { Button } from '../../ui/Button';
import { Text } from '../../ui/text';
import { Icons } from '../../../constants/Icons';
import tw from '../../../lib/tw';
import { MovieCompact } from '@libs/api-js';
import { movieLogOptions } from '@libs/query-client';

interface ButtonUserLogMovieProps extends React.ComponentProps<typeof Button> {
  movie: MovieCompact;
}

/**
 * Consolidated log entry point — replaces the separate rating/like/watch/watch-date buttons
 * with one that opens /film/[film_id]/log. Mirrors FilmBottomAccessory.ios.tsx's SwiftUI
 * version: rating number when rated, otherwise the watch checkmark (filled once watched), plus
 * a small heart badge in the corner when liked.
 */
const ButtonUserLogMovie = forwardRef<React.ComponentRef<typeof Button>, ButtonUserLogMovieProps>(
  ({ movie, style, onPress: onPressProps, ...props }, ref) => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { data: log } = useQuery(
      movieLogOptions({
        userId: user?.id,
        movieId: movie.id,
      }),
    );

    const buttonStyle = log?.rating
      ? { backgroundColor: colors.accentYellowForeground, borderColor: colors.accentYellow }
      : { ...(log ? { backgroundColor: colors.accentBlue } : undefined), ...tw`rounded-full` };

    return (
      // overflow: 'visible' explicitly, since the heart badge below is deliberately
      // positioned to poke out past the button's own edge.
      <View style={[tw`relative`, { overflow: 'visible' }]}>
        <Button
          ref={ref}
          variant="outline"
          size={log?.rating ? 'default' : 'icon'}
          icon={!log?.rating ? Icons.Check : undefined}
          onPress={(e) => {
            if (user) {
              router.push({ pathname: '/film/[film_id]/log', params: { film_id: movie.id } });
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
          style={{ ...buttonStyle, ...style }}
          {...props}
        >
          {log?.rating ? (
            <Text style={[tw`font-bold`, { color: colors.accentYellow }]}>{log.rating}</Text>
          ) : null}
        </Button>
        {log?.isLiked && (
          <View
            pointerEvents="none"
            style={[tw`absolute bottom-0 right-0`, { zIndex: 1, elevation: 1 }]}
          >
            <Icons.like color={colors.accentPink} fill={colors.accentPink} size={14} />
          </View>
        )}
      </View>
    );
  },
);
ButtonUserLogMovie.displayName = 'ButtonUserLogMovie';

export default ButtonUserLogMovie;
