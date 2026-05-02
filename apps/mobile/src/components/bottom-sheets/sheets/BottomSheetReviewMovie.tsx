import { forwardRef, useMemo } from 'react';
import tw from '../../../lib/tw';
import { Icons } from '../../../constants/Icons';
import { usePathname, useRouter } from 'expo-router';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { upperFirst } from 'lodash';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import TrueSheet from '../../ui/TrueSheet';
import { BottomSheetProps } from '../BottomSheetManager';
import { useTranslations } from 'use-intl';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../providers/AuthProvider';
import { PADDING_VERTICAL } from '../../../theme/globals';
import { Alert } from 'react-native';
import { useToast } from '../../Toast';
import { FlashList } from '@shopify/flash-list';
import { ReviewMovie, UserSummary } from '@libs/api-js';
import { useMovieReviewDeleteMutation } from '@libs/query-client';

interface BottomSheetReviewMovieProps extends BottomSheetProps {
  review: ReviewMovie;
  author: UserSummary;
  additionalItemsTop?: Item[];
  additionalItemsBottom?: Item[];
}

interface Item {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  submenu?: Item[];
  closeOnPress?: boolean;
  disabled?: boolean;
}

export const BottomSheetReviewMovie = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetReviewMovieProps
>(({ id, review, author, additionalItemsTop = [], additionalItemsBottom = [], ...props }, ref) => {
  const closeSheet = useBottomSheetStore((state) => state.closeSheet);
  const toast = useToast();
  const { colors, mode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const pathname = usePathname();
  // Mutations
  const { mutateAsync: deleteReview } = useMovieReviewDeleteMutation();
  // States
  const items = useMemo<Item[]>(
    () => [
      ...additionalItemsTop,
      {
        icon: Icons.Movie,
        onPress: () =>
          router.push({
            pathname: '/user/[username]/film/[film_id]',
            params: {
              username: author.username,
              film_id: review.movieId,
            },
          }),
        label: upperFirst(t('common.messages.go_to_review')),
        disabled: pathname.startsWith(`/user/${author.username}/film/${review.movieId}`),
      },
      ...(user?.id === author.id
        ? [
            {
              icon: Icons.Edit,
              onPress: () =>
                router.push({
                  pathname: '/film/[film_id]/review',
                  params: {
                    film_id: review.movieId,
                  },
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
                        await deleteReview(
                          {
                            path: {
                              movie_id: review.movieId,
                            },
                          },
                          {
                            onSuccess: () => {
                              toast.success(upperFirst(t('common.messages.deleted')));
                              if (
                                pathname.startsWith(
                                  `/user/${author.username}/film/${review.movieId}`,
                                )
                              ) {
                                if (router.canGoBack()) {
                                  router.back();
                                } else {
                                  router.replace({
                                    pathname: '/film/[film_id]',
                                    params: {
                                      film_id: review.movieId,
                                    },
                                  });
                                }
                              }
                              closeSheet(id);
                            },
                            onError: () => {
                              toast.error(upperFirst(t('common.messages.error')), {
                                description: upperFirst(t('common.messages.an_error_occurred')),
                              });
                            },
                          },
                        );
                      },
                      style: 'destructive',
                    },
                  ],
                  {
                    userInterfaceStyle: mode,
                  },
                );
              },
              label: upperFirst(t('common.messages.delete')),
              closeOnPress: false,
            },
          ]
        : []),
      ...additionalItemsBottom,
    ],
    [
      additionalItemsTop,
      additionalItemsBottom,
      closeSheet,
      id,
      mode,
      pathname,
      review,
      router,
      user?.id,
      t,
      toast,
      deleteReview,
    ],
  );

  return (
    <TrueSheet ref={ref} scrollable {...props}>
      <FlashList
        data={items}
        contentContainerStyle={{ paddingTop: PADDING_VERTICAL }}
        bounces={false}
        keyExtractor={(_, i) => i.toString()}
        stickyHeaderIndices={[0]}
        renderItem={({ item }) => (
          <Button
            variant="ghost"
            icon={item.icon}
            iconProps={{
              color: colors.mutedForeground,
            }}
            disabled={item.disabled}
            style={tw`justify-start h-auto py-4`}
            onPress={() => {
              if (item.closeOnPress || item.closeOnPress === undefined) {
                closeSheet(id);
              }
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
BottomSheetReviewMovie.displayName = 'BottomSheetReviewMovie';
