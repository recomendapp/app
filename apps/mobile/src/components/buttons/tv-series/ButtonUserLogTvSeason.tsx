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
import { TvSeasonCompact } from '@libs/api-js';
import { tvSeasonLogOptions } from '@libs/query-client';

interface ButtonUserLogTvSeasonProps {
  tvSeason: TvSeasonCompact;
}

const ButtonUserLogTvSeason = forwardRef<View, ButtonUserLogTvSeasonProps>(({ tvSeason }, ref) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { data: log } = useQuery(
    tvSeasonLogOptions({
      userId: user?.id,
      tvSeriesId: tvSeason.tvSeriesId,
      seasonNumber: tvSeason.seasonNumber,
    }),
  );

  const handlePress = () => {
    if (user) {
      router.push({
        pathname: '/tv-series/[tv_series_id]/season/[season_number]/log',
        params: { tv_series_id: tvSeason.tvSeriesId, season_number: tvSeason.seasonNumber },
      });
    } else {
      router.push({ pathname: '/auth', params: { redirect: pathname } });
    }
  };

  const statusColor = log?.status === 'watching' ? colors.accentOrange : colors.accentBlue;

  return (
    <View ref={ref} style={[{ overflow: 'visible' }]}>
      <Button
        variant="outline"
        size={log?.rating ? 'default' : 'icon'}
        icon={!log?.rating ? (log?.status === 'watching' ? Icons.Clock : Icons.Check) : undefined}
        onPress={handlePress}
        style={
          log?.rating
            ? {
                backgroundColor: colors.accentYellowForeground,
                borderColor: colors.accentYellow,
                aspectRatio: 4 / 3,
              }
            : log
              ? { backgroundColor: statusColor, ...tw`rounded-full` }
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
ButtonUserLogTvSeason.displayName = 'ButtonUserLogTvSeason';

export default ButtonUserLogTvSeason;
