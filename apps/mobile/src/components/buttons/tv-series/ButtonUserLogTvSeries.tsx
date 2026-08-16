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

interface ButtonUserLogTvSeriesProps extends React.ComponentProps<typeof Button> {
  tvSeries: TvSeriesCompact;
}

/**
 * Consolidated log entry point — replaces the separate rating/like/watch buttons with one that
 * opens /tv-series/[tv_series_id]/log. Mirrors ButtonUserLogMovie.tsx: rating number when rated,
 * otherwise a status icon (clock while watching, checkmark once completed), plus a small heart
 * badge in the corner when liked.
 */
const ButtonUserLogTvSeries = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserLogTvSeriesProps
>(({ tvSeries, style, onPress: onPressProps, ...props }, ref) => {
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
    // overflow: 'visible' explicitly, since the heart badge below is deliberately
    // positioned to poke out past the button's own edge.
    <View style={[tw`relative`, { overflow: 'visible' }]}>
      <Button
        ref={ref}
        variant="outline"
        size={log?.rating ? 'default' : 'icon'}
        icon={!log?.rating ? (log?.status === 'watching' ? Icons.Clock : Icons.Check) : undefined}
        onPress={(e) => {
          if (user) {
            router.push({
              pathname: '/tv-series/[tv_series_id]/log',
              params: { tv_series_id: tvSeries.id },
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
});
ButtonUserLogTvSeries.displayName = 'ButtonUserLogTvSeries';

export default ButtonUserLogTvSeries;
