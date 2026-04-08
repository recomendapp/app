import { forwardRef, useMemo } from 'react';
import tw from 'apps/mobile/src/lib/tw';
import { Icons } from 'apps/mobile/src/constants/Icons';
import { usePathname, useRouter } from 'expo-router';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import { upperFirst } from 'lodash';
import useBottomSheetStore from 'apps/mobile/src/stores/useBottomSheetStore';
import TrueSheet from 'apps/mobile/src/components/ui/TrueSheet';
import { BottomSheetProps } from '../BottomSheetManager';
import { useTranslations } from 'use-intl';
import { Button } from 'apps/mobile/src/components/ui/Button';
import { useAuth } from 'apps/mobile/src/providers/AuthProvider';
import { PADDING_VERTICAL } from 'apps/mobile/src/theme/globals';
import { Alert } from 'react-native';
import { useToast } from 'apps/mobile/src/components/Toast';
import { FlashList } from '@shopify/flash-list';
import { ReviewTvSeries, UserSummary } from '@libs/api-js';
import { useTvSeriesReviewDeleteMutation } from '@libs/query-client';

interface BottomSheetReviewTvSeriesProps extends BottomSheetProps {
  review: ReviewTvSeries,
  author: UserSummary;
  additionalItemsTop?: Item[];
  additionalItemsBottom?: Item[];
};

interface Item {
	icon: LucideIcon;
	label: string;
	onPress: () => void;
	submenu?: Item[];
  closeOnPress?: boolean;
  disabled?: boolean;
}

export const BottomSheetReviewTvSeries = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetReviewTvSeriesProps
>(({ id, review, author, additionalItemsTop = [], additionalItemsBottom = [], ...props }, ref) => {
  const toast = useToast();
  const closeSheet = useBottomSheetStore((state) => state.closeSheet);
  const { colors, mode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const pathname = usePathname();
  // Mutations
  const { mutateAsync: deleteReview } = useTvSeriesReviewDeleteMutation();
  // States
  const items = useMemo<Item[]>(() => [
    ...additionalItemsTop,
    {
      icon: Icons.Movie,
      onPress: () => router.push({
        pathname: '/user/[username]/tv-series/[tv_series_id]',
        params: {
          username: author.username,
          tv_series_id: review.tvSeriesId,
        }
      }),
      label: upperFirst(t('common.messages.go_to_review')),
      disabled: pathname.startsWith(`/user/${author.username}/tv-series/${review.tvSeriesId}`),
    },
    ...(user?.id === author.id ? [
      {
        icon: Icons.Edit,
        onPress: () => router.push({
          pathname: '/tv-series/[tv_series_id]/review',
          params: {
            tv_series_id: review.tvSeriesId,
          }
        }),
        label: upperFirst(t('common.messages.edit_review')),
      },
      {
        icon: Icons.Delete,
        onPress: async () => {
          Alert.alert(
            upperFirst(t('common.messages.are_u_sure')),
            undefined,
            [
              {
                text: upperFirst(t('common.messages.cancel')),
                style: 'cancel',
              },
              {
                text: upperFirst(t('common.messages.delete')),
                onPress: async () => {
                  await deleteReview({
                    path: {
                      tv_series_id: review.tvSeriesId,
                    }
                  }, {
                    onSuccess: () => {
                      toast.success(upperFirst(t('common.messages.deleted')));
                      if (pathname.startsWith(`/user/${author.username}/tv-series/${review.tvSeriesId}`)) {
                        if (router.canGoBack()) {
                          router.back()
                        } else {
                          router.replace({
                            pathname: '/tv-series/[tv_series_id]',
                            params: {
                              tv_series_id: review.tvSeriesId,
                            }
                          });
                        }
                      }
                      closeSheet(id);
                    },
                    onError: () => {
                      toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
                    },
                  });
                },
                style: 'destructive',
              }
            ], {
              userInterfaceStyle: mode,
            }
          )
        },
        label: upperFirst(t('common.messages.delete')),
        closeOnPress: false,
      }
    ] : []),
    ...additionalItemsBottom,
  ], [
    additionalItemsTop,
    additionalItemsBottom,
    closeSheet,
    id,
    mode,
    router,
    pathname,
    review,
    user?.id,
    t,
    toast,
    deleteReview,
  ]);
  return (
    <TrueSheet
    ref={ref}
    scrollable
    {...props}
    >
      <FlashList
      contentContainerStyle={{ paddingTop: PADDING_VERTICAL }}
      data={items}
      bounces={false}
      keyExtractor={(_, i) => i.toString()}
      stickyHeaderIndices={[0]}
      renderItem={({ item }) => (
        <Button
        variant='ghost'
        icon={item.icon}
        iconProps={{
          color: colors.mutedForeground,
        }}
        disabled={item.disabled}
        style={tw`justify-start h-auto py-4`}
        onPress={() => {
          (item.closeOnPress || item.closeOnPress === undefined) && closeSheet(id);
          item.onPress();
        }}
        >
          {item.label}
        </Button>
      )}
      indicatorStyle={mode === 'dark' ? 'white' : 'black'}
      nestedScrollEnabled
      />
    </TrueSheet>
  );
});
BottomSheetReviewTvSeries.displayName = 'BottomSheetReviewTvSeries';
