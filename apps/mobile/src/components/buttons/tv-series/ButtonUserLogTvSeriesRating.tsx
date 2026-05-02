import { useAuth } from '../../../providers/AuthProvider';
import { Icons } from '../../../constants/Icons';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import tw from '../../../lib/tw';
import { usePathname, useRouter } from 'expo-router';
import { Button } from '../../ui/Button';
import BottomSheetRating from '../../bottom-sheets/sheets/BottomSheetRating';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { useToast } from '../../Toast';
import { forwardRef, useCallback } from 'react';
import { getTmdbImage } from '../../../lib/tmdb/getTmdbImage';
import { Text } from '../../ui/text';
import { useTheme } from '../../../providers/ThemeProvider';
import { TvSeriesCompact } from '@libs/api-js';
import { useQuery } from '@tanstack/react-query';
import { tvSeriesLogOptions, useTvSeriesLogSetMutation } from '@libs/query-client';

interface ButtonUserLogTvSeriesRatingProps
  extends Omit<React.ComponentProps<typeof Button>, 'icon'> {
  tvSeries: TvSeriesCompact;
}

const ButtonUserLogTvSeriesRating = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserLogTvSeriesRatingProps
>(({ tvSeries, variant = 'outline', style, onPress: onPressProps, iconProps, ...props }, ref) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  // Requests
  const { data: log } = useQuery(
    tvSeriesLogOptions({
      userId: user?.id,
      tvSeriesId: tvSeries.id,
    }),
  );
  // Mutations
  const { mutateAsync: rate } = useTvSeriesLogSetMutation();

  // Handlers
  const handleRate = useCallback(
    async (rating: number | null) => {
      await rate(
        {
          path: {
            tv_series_id: tvSeries.id,
          },
          body: {
            rating,
          },
        },
        {
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [tvSeries.id, toast, t, rate],
  );

  return (
    <Button
      ref={ref}
      variant={variant}
      iconProps={iconProps}
      size={log?.rating ? 'default' : 'icon'}
      icon={!log?.rating ? Icons.Star : undefined}
      onPress={(e) => {
        if (user) {
          openSheet(BottomSheetRating, {
            media: {
              title: tvSeries.name || '',
              imageUrl: getTmdbImage({ path: tvSeries?.posterPath, size: 'w342' }) || '',
              type: 'tv_series',
            },
            onRatingChange: handleRate,
            rating: log?.rating || null,
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
        ...(!log?.rating
          ? tw`rounded-full`
          : { backgroundColor: colors.accentYellowForeground, borderColor: colors.accentYellow }),
        ...style,
      }}
      {...props}
    >
      {log?.rating ? (
        <Text style={[tw`font-bold`, { color: colors.accentYellow }]}>{log.rating}</Text>
      ) : null}
    </Button>
  );
});
ButtonUserLogTvSeriesRating.displayName = 'ButtonUserLogTvSeriesRating';

export default ButtonUserLogTvSeriesRating;
