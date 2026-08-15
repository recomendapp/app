import { SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useTranslations } from 'use-intl';
import { useTheme } from '../../providers/ThemeProvider';
import React, { useCallback } from 'react';
import Fuse, { FuseOptionKey } from 'fuse.js';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import CollectionHeader from './CollectionHeader';
import { SearchBar } from '../ui/searchbar';
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
import CollectionToolbar, { CollectionToolbarItem } from './CollectionToolbar';
import BottomSheetSort from '../bottom-sheets/sheets/BottomSheetSort';
import useBottomSheetStore from '../../stores/useBottomSheetStore';
import { ViewType } from '@libs/api-js';
import { CardError } from '../cards/CardError';
import { CardEmpty } from '../cards/CardEmpty';

const MemoizedSearchBar = React.memo(SearchBar);

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

interface CollectionScreenConfig<T>
  extends Omit<React.ComponentProps<typeof AnimatedLegendList<T>>, 'data'> {
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
  const { bottomOffset, tabBarHeight } = useTheme();
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

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortByOption<T>>(sortByOptions[0]);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>(sortByOptions[0].defaultOrder);

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
    if (debouncedSearch.length > 0) {
      return fuse.search(debouncedSearch).map(({ item }) => item);
    }
    return data || [];
  }, [debouncedSearch, fuse, data]);

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
      <AnimatedLegendList
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View>
            {!hideHeader && (
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
            )}
            {!isLoading && (
              <View style={tw`gap-2`}>
                <MemoizedSearchBar
                  value={search}
                  onChangeText={setSearch}
                  onSearch={setDebouncedSearch}
                  debounceMs={200}
                  placeholder={searchPlaceholder}
                />
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
            ) : (
              <CardEmpty
                icon={'🫙'}
                label={emptyStateMessage || t('help_hints.playlists.items.empty')}
              />
            )}
          </View>
        }
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingBottom: bottomOffset + PADDING_VERTICAL,
          gap: GAP,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{
          bottom: tabBarHeight,
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
