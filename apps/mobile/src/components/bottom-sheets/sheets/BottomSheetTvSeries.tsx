import React, { useCallback } from 'react';
import tw from 'apps/mobile/src/lib/tw';
import { Icons } from 'apps/mobile/src/constants/Icons';
import { LinkProps, usePathname, useRouter } from 'expo-router';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import { upperFirst } from 'lodash';
import useBottomSheetStore from 'apps/mobile/src/stores/useBottomSheetStore';
import { View } from 'react-native';
import { ImageWithFallback } from 'apps/mobile/src/components/utils/ImageWithFallback';
import { TrueSheet as RNTrueSheet } from '@lodev09/react-native-true-sheet';
import TrueSheet from 'apps/mobile/src/components/ui/TrueSheet';
import BottomSheetDefaultView from '../templates/BottomSheetDefaultView';
import { BottomSheetProps } from '../BottomSheetManager';
import { useTranslations } from 'use-intl';
import { Button } from 'apps/mobile/src/components/ui/Button';
import { Text } from 'apps/mobile/src/components/ui/text';
import { useAuth } from 'apps/mobile/src/providers/AuthProvider';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from 'apps/mobile/src/theme/globals';
import BottomSheetShareTvSeries from './share/BottomSheetShareTvSeries';
import { FlashList } from '@shopify/flash-list';
import { getTmdbImage } from 'apps/mobile/src/lib/tmdb/getTmdbImage';
import { LogTvSeriesWithTvSeriesNoReview, TvSeriesCompact, UserSummary } from '@libs/api-js';

interface BottomSheetTvSeriesProps extends BottomSheetProps {
  tvSeries: TvSeriesCompact,
  log?: LogTvSeriesWithTvSeriesNoReview & { user: UserSummary },
  additionalItemsTop?: Item[];
  additionalItemsBottom?: Item[];
};

type Item = {
	icon: LucideIcon;
	label: string;
	onPress: () => void;
	submenu?: Item[];
  closeOnPress?: boolean;
  disabled?: boolean;
} | string;

const BottomSheetTvSeries = React.forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetTvSeriesProps
>(({ id, tvSeries, log, additionalItemsTop = [], additionalItemsBottom = [], ...props }, ref) => {
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  const closeSheet = useBottomSheetStore((state) => state.closeSheet);
  const { colors, mode, isLiquidGlassAvailable } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const pathname = usePathname();
  // REFs
  const BottomSheetMainCreditsRef = React.useRef<RNTrueSheet>(null);
  // States
  const items: Item[] = React.useMemo(() => ([
    'header',
    ...additionalItemsTop,
    {
      icon: Icons.Share,
      onPress: () => openSheet(BottomSheetShareTvSeries, {
        tvSeries: tvSeries,
      }),
      label: upperFirst(t('common.messages.share')),
    },
    ...((log) ? [
      {
        icon: Icons.Feed,
        onPress: () => router.push({ pathname: '/user/[username]/tv-series/[tv_series_id]', params: { username: log.user.username, tv_series_id: tvSeries.id } }),
        label: upperFirst(t('common.messages.go_to_activity')),
      },
    ] : []),
    {
      icon: Icons.Movie,
      onPress: () => router.push({ pathname: '/tv-series/[tv_series_id]', params: { tv_series_id: tvSeries.id }}),
      label: upperFirst(t('common.messages.go_to_tv_series')),
      disabled: tvSeries.url ? pathname.startsWith(tvSeries.url) : false
    },
    ...((tvSeries.createdBy && tvSeries.createdBy.length > 0) ? [
      tvSeries.createdBy.length > 1 ? {
        icon: Icons.Users,
        onPress: () => BottomSheetMainCreditsRef.current?.present(),
        label: upperFirst(t('common.messages.show_creator', { gender: 'male', count: tvSeries.createdBy.length })),
        closeOnPress: false,
      } : {
        icon: Icons.User,
        onPress: () => router.push({ pathname: '/person/[person_id]', params: { person_id: tvSeries.createdBy![0].id } }),
        label: upperFirst(t('common.messages.go_to_creator', { gender: tvSeries.createdBy![0].gender === 1 ? 'female' : 'male', count: 1 }))
      },
    ] : []),
    ...(user ? [
      {
        icon: Icons.AddPlaylist,
        onPress: () => tvSeries.id && router.push({
          pathname: '/playlist/add/[type]/[id]',
          params: {
            type: 'tv_series',
            id: tvSeries.id,
            title: tvSeries.name,
          }
        }),
        label: upperFirst(t('common.messages.add_to_playlist')),
      },
      {
        icon: Icons.Reco,
        onPress: () => tvSeries.id && router.push({
          pathname: '/reco/send/[type]/[id]',
          params: {
            type: 'tv_series',
            id: tvSeries.id,
          }
        }),
        label: upperFirst(t('common.messages.send_to_friend')),
      }
    ] : []),
    ...additionalItemsBottom,
  ]), [tvSeries, additionalItemsTop, additionalItemsBottom, openSheet, router, t, pathname, log, user]);

  const renderItem = useCallback(({ item }: { item: Item }) => {
    if (typeof item === 'string') {
      return (
        <View
        style={[
          { backgroundColor: isLiquidGlassAvailable ? 'transparent' : colors.muted, borderColor: colors.mutedForeground },
          tw`border-b p-4`,
        ]}
        >
          <View style={tw`flex-row items-center gap-2 `}>
            <ImageWithFallback
            alt={tvSeries.name ?? ''}
            source={{ uri: getTmdbImage({ path: tvSeries.posterPath, size: 'w342' }) ?? '' }}
            style={[
              { aspectRatio: 2 / 3, height: 'fit-content' },
              tw.style('rounded-md w-12'),
            ]}
            type={'tv_series'}
            />
            <View style={tw`shrink`}>
              <Text numberOfLines={2} style={tw`shrink`}>{tvSeries.name}</Text>
              {tvSeries.createdBy && tvSeries.createdBy.length > 0 && (
                <Text numberOfLines={1} style={[{ color: colors.mutedForeground }, tw`shrink`]}>
                {tvSeries.createdBy?.map((creator) => creator.name).join(', ')}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    return (
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
    );
  }, [colors.mutedForeground, colors.muted, closeSheet, id, tvSeries, isLiquidGlassAvailable]);


  return (
    <TrueSheet
    ref={ref}
    scrollable
    {...props}
    >
      <FlashList
      data={items}
      bounces={false}
      stickyHeaderIndices={[0]}
      keyExtractor={(_, i) => i.toString()}
      renderItem={renderItem}
      indicatorStyle={mode === 'dark' ? 'white' : 'black'}
      nestedScrollEnabled
      />
      {tvSeries.createdBy && (
        <BottomSheetDefaultView
        ref={BottomSheetMainCreditsRef}
        id={`${id}-credits`}
        scrollable
        >
          <FlashList
          data={tvSeries.createdBy}
          bounces={false}
          renderItem={({ item }) => (
            <Button
            variant="ghost"
            size="fit"
            onPress={() => {
              BottomSheetMainCreditsRef.current?.dismiss();
              closeSheet(id);
              router.push(item.url as LinkProps['href']);
            }}
            style={[
              { paddingVertical: PADDING_HORIZONTAL, paddingHorizontal: PADDING_HORIZONTAL },
            ]}
            >
              <View style={tw`flex-1 flex-row items-center gap-2 justify-between`}>
                <Text>{item.name}</Text>
                <Icons.ChevronRight color={colors.mutedForeground} size={16} />
              </View>
            </Button>
          )}
          indicatorStyle={mode === 'dark' ? 'white' : 'black'}
          nestedScrollEnabled
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingTop: PADDING_VERTICAL,
          }}
          />
        </BottomSheetDefaultView>
      )}
    </TrueSheet>
  );
});
BottomSheetTvSeries.displayName = 'BottomSheetTvSeries';

export default BottomSheetTvSeries;