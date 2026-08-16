import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useTranslations } from 'use-intl';
import React, { useCallback } from 'react';
import Fuse, { FuseOptionKey } from 'fuse.js';
import { AnimatedLegendListProps } from '@legendapp/list/reanimated';
import { KeyboardAwareLegendList } from '@legendapp/list/keyboard';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { Stack } from 'expo-router';
import type {
  NativeStackHeaderItemMenuAction,
  NativeStackHeaderItemMenuSubmenu,
} from 'expo-router';
import { upperFirst } from 'lodash';
import CollectionHeader from './CollectionHeader';
import tw from '../../lib/tw';
import { Icons } from '../../constants/Icons';
import { View } from '../ui/view';
import { ButtonProps } from '../ui/Button';
import { UseQueryResult } from '@tanstack/react-query';
import { CollectionItem } from './CollectionItem';
import { ImageType } from '../utils/ImageWithFallback';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../theme/globals';
import { LegendListRenderItemProps } from '@legendapp/list/react-native';
import { useWindowDimensions } from 'react-native';
import { useReanimatedHeaderHeight } from 'react-native-screens/reanimated';
import CollectionToolbar, { CollectionToolbarItem } from './CollectionToolbar';
import BottomSheetSort from '../bottom-sheets/sheets/BottomSheetSort';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import { ViewType } from '@libs/api-js';
import { CardError } from '../cards/CardError';
import { CardEmpty } from '../cards/CardEmpty';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIOS } from '../../platform/detection';

export interface SortByOption<T> {
  label: string;
  value: string;
  defaultOrder: 'asc' | 'desc';
  sortFn: (a: T, b: T, order: 'asc' | 'desc') => number;
}

export interface CollectionAction<T> {
  icon: any;
  label: string;
  variant?: ButtonProps['variant'];
  onPress: (item: T) => void;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export type CollectionMenuItem = NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu;
type MenuItem = CollectionMenuItem;

interface CollectionScreenConfig<T> extends Omit<AnimatedLegendListProps<T>, 'data'> {
  queryData: UseQueryResult<T[] | undefined>;
  scrollY?: SharedValue<number>;
  headerHeight?: SharedValue<number>;
  screenTitle: string;
  hideHeader?: boolean;
  hideTitle?: boolean;
  hideNumberOfItems?: boolean;
  screenSubtitle?: string | React.ReactNode | (() => React.ReactNode);
  poster?: string;
  posterType?: ImageType;
  searchPlaceholder: string;
  emptyStateMessage?: string;
  sortByOptions: SortByOption<T>[];
  swipeActions?: CollectionAction<T>[];
  bottomSheetActions?: CollectionAction<T>[];
  customFilters?: React.ReactNode;
  additionalToolbarItems?: CollectionToolbarItem[];
  /**
   * Extra native menu items contributed by the screen embedding this CollectionScreen, merged
   * into CollectionScreen's own single native "…" header menu on iOS (sort by / view toggle) —
   * only one `unstable_headerRightItems` can be active per screen, so this is how a screen adds
   * its own actions (e.g. like/save/share) without spawning a second header button.
   *
   * `Top` renders as an icon-only row at the top of the menu (Apple Music-style, no labels —
   * see `layout: 'palette'`). `Bottom` renders as a normal labelled section at the end, after
   * sort/view — unlike `additionalToolbarItems` (Android's in-content toolbar), this isn't
   * auto-merged from anywhere, so the caller controls its exact ordering.
   */
  additionalHeaderRightItemsTop?: MenuItem[];
  additionalHeaderRightItemsBottom?: MenuItem[];
  getItemId: (item: T) => string | number;
  getItemTitle: (item: T) => string;
  getItemSubtitle?: (item: T) => string;
  getItemImageUrl?: (item: T) => string;
  getItemUrl?: (item: T) => string;
  getItemBackdropUrl?: (item: T) => string;
  getCreatedAt?: (item: T) => string;
  onItemAction?: (item: T) => void;
  defaultView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  fuseKeys?: FuseOptionKey<T>[];
  fuseThreshold?: number;
}

const CollectionScreen = <T extends Record<string, any>>({
  queryData,
  scrollY: scrollYProp,
  headerHeight: headerHeightProp,
  renderItem: renderItemProp,
  screenTitle,
  hideHeader,
  hideTitle,
  hideNumberOfItems,
  screenSubtitle,
  poster,
  posterType,
  searchPlaceholder,
  emptyStateMessage,
  sortByOptions,
  swipeActions,
  bottomSheetActions,
  customFilters,
  additionalToolbarItems,
  additionalHeaderRightItemsTop,
  additionalHeaderRightItemsBottom,
  getItemId,
  getItemTitle,
  getItemSubtitle,
  getItemImageUrl,
  getItemUrl,
  getItemBackdropUrl,
  getCreatedAt,
  onItemAction,
  defaultView = 'list',
  onViewChange,
  maintainVisibleContentPosition = false,
  numColumns = 4,
  fuseKeys,
  fuseThreshold = 0.5,
  ...props
}: CollectionScreenConfig<T>) => {
  const insets = useSafeAreaInsets();
  const navigationHeaderHeight = useReanimatedHeaderHeight();
  const t = useTranslations();
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { data, isLoading, isRefetching, refetch, isError } = queryData;

  // Shared Values
  const scrollYInternal = useSharedValue(0);
  const headerHeightInternal = useSharedValue(0);
  const scrollY = scrollYProp || scrollYInternal;
  const headerHeight = headerHeightProp || headerHeightInternal;

  const [view, setView] = React.useState<ViewType>(defaultView);

  const [nativeSearch, setNativeSearch] = React.useState('');
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortByOption<T>>(sortByOptions[0]);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>(sortByOptions[0].defaultOrder);
  const { progress: keyboardProgress } = useReanimatedKeyboardAnimation();

  const fuse = React.useMemo(() => {
    return new Fuse(data || [], {
      keys: fuseKeys || [{ name: 'title', getFn: (item) => getItemTitle(item) }],
      threshold: fuseThreshold,
    });
  }, [fuseKeys, fuseThreshold, data, getItemTitle]);

  const backdrops = React.useMemo(() => {
    return data?.map((item) => getItemBackdropUrl?.(item)).filter(Boolean) || [];
  }, [data, getItemBackdropUrl]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      // eslint-disable-next-line react-compiler/react-compiler
      scrollY.value = event.contentOffset.y;
    },
  });

  const filteredItems = React.useMemo(() => {
    if (nativeSearch.length > 0) {
      return fuse.search(nativeSearch).map(({ item }) => item);
    }
    return data || [];
  }, [nativeSearch, fuse, data]);

  const renderItems = React.useMemo(() => {
    if (sortBy && sortBy.sortFn) {
      return [...filteredItems].sort((a, b) => sortBy.sortFn(a, b, sortOrder));
    }
    return filteredItems;
  }, [filteredItems, sortBy, sortOrder]);

  // Handlers
  const handleViewChange = useCallback(
    (newView: ViewType) => {
      setView(newView);
      onViewChange?.(newView);
    },
    [onViewChange],
  );
  const handleSortBy = () => {
    openSheet(BottomSheetSort, {
      options: sortByOptions,
      selectedValue: sortBy.value,
      order: sortOrder,
      onChange: (value, order) => {
        setSortBy(value);
        setSortOrder(order);
      },
    });
  };
  // Native sort menu: tapping the already-active field flips its order, tapping a different
  // field switches to it (resetting to that option's own default order).
  const handleNativeSortSelect = useCallback(
    (option: SortByOption<T>) => {
      if (option.value === sortBy.value) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(option);
        setSortOrder(option.defaultOrder);
      }
    },
    [sortBy.value],
  );

  // Reserves insets.bottom as a footer that shrinks to 0 in sync with the keyboard's own
  // animation curve — passing an animated value through contentContainerStyle directly isn't
  // supported by this (non-Reanimated) list variant, so a genuine Animated.View footer is used
  // instead, keeping the static PADDING_VERTICAL always applied via contentContainerStyle.
  const keyboardFooterStyle = useAnimatedStyle(() => ({
    height: interpolate(keyboardProgress.value, [0, 1], [insets.bottom, 0], Extrapolation.CLAMP),
  }));

  // Mirrors the native header's real (Reanimated-synced) height, including its search-bar
  // collapse/expand transition — a plain useHeaderHeight() value doesn't react to that.
  const searchSpacerStyle = useAnimatedStyle(() => ({
    height: navigationHeaderHeight.value,
  }));

  // Render
  const renderItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<T>) => {
      return (
        <CollectionItem
          key={getItemId(item)}
          item={item}
          swipeActions={swipeActions}
          bottomSheetActions={bottomSheetActions}
          getItemId={getItemId}
          getItemTitle={getItemTitle}
          getItemSubtitle={getItemSubtitle}
          getItemImageUrl={getItemImageUrl}
          getItemUrl={getItemUrl}
          onItemAction={onItemAction}
          view={view}
          index={index}
        />
      );
    },
    [
      swipeActions,
      bottomSheetActions,
      getItemId,
      getItemTitle,
      getItemSubtitle,
      getItemImageUrl,
      getItemUrl,
      onItemAction,
      view,
    ],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: searchPlaceholder,
            // Apple Music-style: hide on scroll down, reveal on scroll up.
            hideWhenScrolling: true,
            onChangeText: (e) => setNativeSearch(e.nativeEvent.text),
            onFocus: () => setIsSearchActive(true),
            onBlur: () => setIsSearchActive(false),
            onCancelButtonPress: () => {
              setNativeSearch('');
              setIsSearchActive(false);
            },
          },
          unstable_headerRightItems: () => [
            {
              type: 'menu' as const,
              label: upperFirst(t('common.messages.menu')),
              icon: { type: 'sfSymbol' as const, name: 'ellipsis' as const },
              menu: {
                items: [
                  ...(additionalHeaderRightItemsTop && additionalHeaderRightItemsTop.length > 0
                    ? [
                        {
                          type: 'submenu' as const,
                          label: '',
                          inline: true,
                          layout: 'palette' as const,
                          items: additionalHeaderRightItemsTop,
                        },
                      ]
                    : []),
                  {
                    type: 'submenu' as const,
                    label: '',
                    inline: true,
                    items: [
                      {
                        type: 'submenu' as const,
                        label: upperFirst(t('common.messages.sort_by')),
                        icon: {
                          type: 'sfSymbol' as const,
                          name: (sortOrder === 'desc' ? 'arrow.down' : 'arrow.up') as
                            | 'arrow.down'
                            | 'arrow.up',
                        },
                        items: sortByOptions.map((option) => {
                          const isActive = option.value === sortBy.value;
                          return {
                            type: 'action' as const,
                            label: option.label,
                            description: isActive
                              ? upperFirst(
                                  t(
                                    sortOrder === 'desc'
                                      ? 'common.messages.order_desc'
                                      : 'common.messages.order_asc',
                                  ),
                                )
                              : undefined,
                            state: (isActive ? 'on' : 'off') as 'on' | 'off',
                            onPress: () => handleNativeSortSelect(option),
                          };
                        }),
                      },
                      {
                        type: 'action' as const,
                        label:
                          view === 'grid'
                            ? upperFirst(t('common.messages.grid', { count: 1 }))
                            : upperFirst(t('common.messages.list', { count: 1 })),
                        icon: {
                          type: 'sfSymbol' as const,
                          name: (view === 'grid' ? 'square.grid.2x2' : 'list.bullet') as
                            | 'square.grid.2x2'
                            | 'list.bullet',
                        },
                        onPress: () => handleViewChange(view === 'grid' ? 'list' : 'grid'),
                      },
                    ],
                  },
                  ...(additionalHeaderRightItemsBottom &&
                  additionalHeaderRightItemsBottom.length > 0
                    ? [
                        {
                          type: 'submenu' as const,
                          label: '',
                          inline: true,
                          items: additionalHeaderRightItemsBottom,
                        },
                      ]
                    : []),
                ],
              },
            },
          ],
        }}
      />
      <KeyboardAwareLegendList
        keyboardOffset={insets.bottom}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View>
            {!hideHeader &&
              (isSearchActive ? (
                // CollectionHeader normally offsets its content by the (transparent) native
                // header's height — preserve that spacing so the list doesn't scroll under it.
                <Animated.View style={searchSpacerStyle} />
              ) : (
                <CollectionHeader
                  title={screenTitle}
                  hideTitle={hideTitle}
                  poster={poster}
                  posterType={posterType}
                  bottomText={screenSubtitle}
                  numberOfItems={data?.length || 0}
                  hideNumberOfItems={hideNumberOfItems}
                  scrollY={scrollY}
                  headerHeight={headerHeight}
                  backdrops={backdrops}
                />
              ))}
            {!isLoading && !isIOS && (
              <View style={tw`gap-2`}>
                <CollectionToolbar
                  view={view}
                  onViewChange={handleViewChange}
                  sortOrder={sortOrder}
                  sortByLabel={sortBy.label}
                  onSelectSort={handleSortBy}
                  additionalToolbarItems={additionalToolbarItems}
                />
                {customFilters}
              </View>
            )}
          </View>
        }
        ListHeaderComponentStyle={tw`mb-2`}
        data={renderItems || []}
        extraData={view}
        renderItem={renderItemProp || renderItem}
        keyExtractor={(item) => getItemId(item).toString()}
        ListEmptyComponent={
          <View style={tw`flex-1 items-center justify-center`}>
            {isLoading ? (
              <Icons.Loader />
            ) : isError ? (
              <CardError />
            ) : nativeSearch.length > 0 ? (
              <CardEmpty icon={'🔍'} label={upperFirst(t('common.messages.no_results'))} />
            ) : (
              <CardEmpty
                icon={'🫙'}
                label={emptyStateMessage || t('help_hints.playlists.items.empty')}
              />
            )}
          </View>
        }
        ListFooterComponent={<Animated.View style={keyboardFooterStyle} />}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingBottom: PADDING_VERTICAL,
          gap: GAP,
        }}
        maintainVisibleContentPosition={maintainVisibleContentPosition}
        numColumns={
          view === 'grid'
            ? SCREEN_WIDTH < 360
              ? numColumns - 1
              : SCREEN_WIDTH < 414
                ? numColumns
                : SCREEN_WIDTH < 600
                  ? numColumns + 1
                  : SCREEN_WIDTH < 768
                    ? numColumns + 2
                    : numColumns + 3
            : 1
        }
        {...props}
      />
    </>
  );
};

export default CollectionScreen;
