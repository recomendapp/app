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

interface ButtonUserLogTvSeasonProps extends React.ComponentProps<typeof Button> {
  tvSeason: TvSeasonCompact;
}

/**
 * Consolidated log entry point for a season — mirrors ButtonUserLogTvSeries.tsx, minus the heart
 * badge (seasons have no like). Rating number when rated, otherwise a status icon (clock while
 * watching, checkmark once completed). Opens /tv-series/[tv_series_id]/season/[season_number]/log.
 */
const ButtonUserLogTvSeason = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserLogTvSeasonProps
>(({ tvSeason, style, onPress: onPressProps, ...props }, ref) => {
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

  const buttonStyle = log?.rating
    ? { backgroundColor: colors.accentYellowForeground, borderColor: colors.accentYellow }
    : {
        ...(log
          ? {
              backgroundColor: log.status === 'watching' ? colors.accentOrange : colors.accentBlue,
            }
          : undefined),
        ...tw`rounded-full`,
      };

  return (
    <View style={[tw`relative`, { overflow: 'visible' }]}>
      <Button
        ref={ref}
        variant="outline"
        size={log?.rating ? 'default' : 'icon'}
        icon={!log?.rating ? (log?.status === 'watching' ? Icons.Clock : Icons.Check) : undefined}
        onPress={(e) => {
          if (user) {
            router.push({
              pathname: '/tv-series/[tv_series_id]/season/[season_number]/log',
              params: { tv_series_id: tvSeason.tvSeriesId, season_number: tvSeason.seasonNumber },
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
        style={{ ...buttonStyle, ...style }}
        {...props}
      >
        {log?.rating ? (
          <Text style={[tw`font-bold`, { color: colors.accentYellow }]}>{log.rating}</Text>
        ) : null}
      </Button>
    </View>
  );
});
ButtonUserLogTvSeason.displayName = 'ButtonUserLogTvSeason';

export default ButtonUserLogTvSeason;
