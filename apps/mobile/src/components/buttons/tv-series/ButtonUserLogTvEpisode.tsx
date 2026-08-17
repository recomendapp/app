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
import { TvEpisode } from '@libs/api-js';
import { tvEpisodeLogOptions } from '@libs/query-client';

interface ButtonUserLogTvEpisodeProps {
  episode: TvEpisode;
}

/**
 * Consolidated log entry point for an episode — same visual language as ButtonUserLogTvSeason.tsx,
 * minus the "watching" status color: an episode log has no status, just watched/not-watched (see
 * LogTvEpisodeRequest), plus an optional rating.
 */
const ButtonUserLogTvEpisode = forwardRef<View, ButtonUserLogTvEpisodeProps>(({ episode }, ref) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { data: log } = useQuery(
    tvEpisodeLogOptions({
      userId: user?.id,
      tvSeriesId: episode.tvSeriesId,
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
    }),
  );

  const handlePress = () => {
    if (user) {
      router.push({
        pathname: '/tv-series/[tv_series_id]/season/[season_number]/episode/[episode_number]/log',
        params: {
          tv_series_id: episode.tvSeriesId,
          season_number: episode.seasonNumber,
          episode_number: episode.episodeNumber,
        },
      });
    } else {
      router.push({ pathname: '/auth', params: { redirect: pathname } });
    }
  };

  return (
    <View ref={ref} style={[{ overflow: 'visible' }]}>
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
    </View>
  );
});
ButtonUserLogTvEpisode.displayName = 'ButtonUserLogTvEpisode';

export default ButtonUserLogTvEpisode;
