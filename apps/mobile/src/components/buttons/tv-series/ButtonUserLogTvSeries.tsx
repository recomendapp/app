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
import { TvSeriesCompact } from '@libs/api-js';
import { tvSeriesLogOptions } from '@libs/query-client';

interface ButtonUserLogTvSeriesProps {
  tvSeries: TvSeriesCompact;
}

const ButtonUserLogTvSeries = forwardRef<View, ButtonUserLogTvSeriesProps>(({ tvSeries }, ref) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { data: log } = useQuery(
    tvSeriesLogOptions({
      userId: user?.id,
      tvSeriesId: tvSeries.id,
    }),
  );

  const handlePress = () => {
    if (user) {
      router.push({
        pathname: '/tv-series/[tv_series_id]/log',
        params: { tv_series_id: tvSeries.id },
      });
    } else {
      router.push({ pathname: '/auth', params: { redirect: pathname } });
    }
  };

  const statusColor = log?.status === 'watching' ? colors.accentOrange : colors.accentBlue;

  return (
    <View ref={ref} style={[tw`relative`, { overflow: 'visible' }]}>
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
ButtonUserLogTvSeries.displayName = 'ButtonUserLogTvSeries';

export default ButtonUserLogTvSeries;
