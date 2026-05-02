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
import { FlashList } from '@shopify/flash-list';
import { LogMovie, UserSummary } from '@libs/api-js';

interface BottomSheetLogMovieProps extends BottomSheetProps {
  log: LogMovie;
  profile: UserSummary;
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

export const BottomSheetLogMovie = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetLogMovieProps
>(({ id, log, profile, additionalItemsTop = [], additionalItemsBottom = [], ...props }, ref) => {
  const closeSheet = useBottomSheetStore((state) => state.closeSheet);
  const { colors, mode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const pathname = usePathname();
  // States
  const items = useMemo<Item[]>(
    () => [
      ...additionalItemsTop,
      {
        icon: Icons.Feed,
        onPress: () =>
          router.push({
            pathname: '/user/[username]/film/[film_id]',
            params: {
              username: profile.username,
              film_id: log.movieId,
            },
          }),
        label: upperFirst(t('common.messages.go_to_activity')),
        disabled: pathname.startsWith(`/user/${profile.username}/film/${log.movieId}`),
      },
      {
        icon: Icons.Movie,
        label: upperFirst(t('common.messages.go_to_film')),
        onPress: () =>
          router.push({
            pathname: '/film/[film_id]',
            params: {
              film_id: log.movieId,
            },
          }),
      },
      {
        icon: Icons.User,
        label: upperFirst(t('common.messages.go_to_user')),
        onPress: () =>
          router.push({
            pathname: '/user/[username]',
            params: {
              username: profile.username,
            },
          }),
        disabled: pathname.startsWith(`/user/${profile.username}`),
      },
      ...(user?.id === profile.id
        ? [
            {
              icon: Icons.Edit,
              onPress: () =>
                router.push({
                  pathname: '/film/[film_id]/review',
                  params: {
                    film_id: log.movieId,
                  },
                }),
              label: upperFirst(t('common.messages.edit_review')),
            },
          ]
        : []),
      ...additionalItemsBottom,
    ],
    [
      additionalItemsTop,
      additionalItemsBottom,
      log.movieId,
      pathname,
      profile.username,
      router,
      t,
      user?.id,
      profile.id,
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
BottomSheetLogMovie.displayName = 'BottomSheetLogMovie';
