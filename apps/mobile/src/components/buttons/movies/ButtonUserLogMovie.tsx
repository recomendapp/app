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

interface ButtonUserLogMovieProps {
  movie: MovieCompact;
}

const ButtonUserLogMovie = forwardRef<View, ButtonUserLogMovieProps>(({ movie }, ref) => {
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

  const handlePress = () => {
    if (user) {
      router.push({ pathname: '/film/[film_id]/log', params: { film_id: movie.id } });
    } else {
      router.push({ pathname: '/auth', params: { redirect: pathname } });
    }
  };

  return (
    <View ref={ref} style={[tw`relative`, { overflow: 'visible' }]}>
      <Button
        variant="outline"
        size={log?.rating ? 'default' : 'icon'}
        icon={!log?.rating ? Icons.Check : undefined}
        onPress={handlePress}
        style={
          log?.rating
            ? {
                backgroundColor: colors.accentYellowForeground,
                borderColor: colors.accentYellow,
                aspectRatio: 4 / 3,
              }
            : log
              ? { backgroundColor: colors.accentBlue, ...tw`rounded-full` }
              : tw`rounded-full`
        }
      >
        {log?.rating ? (
          <Text style={[tw`font-bold text-lg`, { color: colors.accentYellow }]}>{log.rating}</Text>
        ) : null}
      </Button>
      {log?.isLiked && (
        <View
          pointerEvents="none"
          style={[
            tw`absolute`,
            {
              zIndex: 1,
              elevation: 1,
            },
            log.rating !== null
              ? {
                  bottom: 4,
                  right: 4,
                }
              : {
                  bottom: 0,
                  right: 0,
                },
          ]}
        >
          <Icons.like color={colors.accentPink} fill={colors.accentPink} size={18} />
        </View>
      )}
    </View>
  );
});
ButtonUserLogMovie.displayName = 'ButtonUserLogMovie';

export default ButtonUserLogMovie;
