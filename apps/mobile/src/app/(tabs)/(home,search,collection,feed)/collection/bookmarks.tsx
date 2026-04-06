import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { useSharedValue } from "react-native-reanimated";
import { useUIStore } from "apps/mobile/src/stores/useUIStore";
import AnimatedStackScreen from "apps/mobile/src/components/ui/AnimatedStackScreen";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useToast } from "apps/mobile/src/components/Toast";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { useQuery } from "@tanstack/react-query";
import { userBookmarksAllOptions, useUserBookmarkDeleteByMediaMutation } from "@libs/query-client";
import { BookmarkWithMedia } from "@packages/api-js";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import richTextToPlainString from "apps/mobile/src/utils/richTextToPlainString";
import { BottomSheetBookmarkComment } from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetBookmarkComment";
import CollectionScreen, { CollectionAction, SortByOption } from "apps/mobile/src/components/collection/CollectionScreen";
import BottomSheetMovie from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetMovie";
import BottomSheetTvSeries from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetTvSeries";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";

const BookmarksScreen = () => {
    const t = useTranslations();
    const toast = useToast();
    const { user } = useAuth();
    const { mode } = useTheme();
    const openSheet = useBottomSheetStore((state) => state.openSheet);
    const view = useUIStore((state) => state.watchlist.view);
    const setWatchlist = useUIStore((state) => state.setWatchlist);
    const queryData = useQuery(userBookmarksAllOptions({
        userId: user?.id,
    }));
    const screenTitle = upperFirst(t('common.messages.for_later'));
    // Mutations
    const { mutateAsync: deleteWatchlist } = useUserBookmarkDeleteByMediaMutation();
    // SharedValues
    const scrollY = useSharedValue(0);
    const headerHeight = useSharedValue(0);

    // Handlers
    const handleDeleteWatchlist = useCallback((data: BookmarkWithMedia) => {
        const title = (data.type === 'movie' ? data.media.title : data.media.name) || upperFirst(t('common.messages.unknown'));
        Alert.alert(
            upperFirst(t('common.messages.are_u_sure')),
            upperFirst(richTextToPlainString(t.rich('pages.collection.watchlist.modal.delete_confirm.description', { title: title, important: (chunk) => `"${chunk}"` }))),
            [
                {
                    text: upperFirst(t('common.messages.cancel')),
                    style: 'cancel',
                },
                {
                    text: upperFirst(t('common.messages.delete')),
                    onPress: async () => {
                        await deleteWatchlist({
                            path: {
                                media_id: data.mediaId,
                                type: data.type,
                            }
                        }, {
                            onSuccess: () => {
                                toast.success(upperFirst(t('common.messages.deleted', { count: 1, gender: 'male' })));
                            },
                            onError: () => {
                                toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
                            }
                        });
                    },
                    style: 'destructive',
                }
            ], {
                userInterfaceStyle: mode,
            }
        )
    }, [deleteWatchlist, t, toast, mode,]);

    const handleOpenSheet = useCallback((data: BookmarkWithMedia) => {
        openSheet(BottomSheetBookmarkComment, {
            data,
        });
    }, [openSheet]);

    const sortByOptions = useMemo((): SortByOption<BookmarkWithMedia>[] => ([
        {
            label: upperFirst(t('common.messages.date_added')),
            value: 'created_at',
            defaultOrder: 'desc',
            sortFn: (a, b, order) => {
                const aTime = new Date(a.createdAt).getTime();
                const bTime = new Date(b.createdAt).getTime();
                return order === 'asc' ? aTime - bTime : bTime - aTime;
            },
        },
        {
            label: upperFirst(t('common.messages.alphabetical')),
            value: 'alphabetical',
            defaultOrder: 'asc',
            sortFn: (a, b, order) => {
                const titleA = (a.type === 'movie' ? a.media.title : a.media.name) || '';
                const titleB = (b.type === 'movie' ? b.media.title : b.media.name) || '';
                const result = titleA.localeCompare(titleB);
                return order === 'asc' ? result : -result;
            },
        },
    ]), [t]);
    const bottomSheetActions = useMemo((): CollectionAction<BookmarkWithMedia>[] => {
        return [
            {
                icon: Icons.Delete,
                label: upperFirst(t('common.messages.delete')),
                variant: 'destructive',
                onPress: handleDeleteWatchlist,
                position: 'bottom',
            },
            {
                icon: Icons.Comment,
                label: upperFirst(t('common.messages.view_comment', { count: 1})),
                onPress: handleOpenSheet,
                position: 'top',
            }
        ];
    }, [handleDeleteWatchlist, handleOpenSheet, t]);
    const swipeActions = useMemo((): CollectionAction<BookmarkWithMedia>[] => [
        {
            icon: Icons.Comment,
            label: upperFirst(t('common.messages.comment', { count: 1 })),
            onPress: handleOpenSheet,
            variant: 'accent-yellow',
            position: 'left',
        },
        {
            icon: Icons.Delete,
            label: upperFirst(t('common.messages.delete')),
            onPress: handleDeleteWatchlist,
            variant: 'destructive',
            position: 'right',
        }
    ], [handleDeleteWatchlist, handleOpenSheet, t]);

    const onItemAction = useCallback((data: BookmarkWithMedia) => {
        if (!bottomSheetActions?.length) return;
        const additionalItems = bottomSheetActions.map(action => ({
            icon: action.icon,
            label: action.label,
            onPress: () => action.onPress(data),
            position: action.position,
        }));
        if (data.type === 'movie') {
            openSheet(BottomSheetMovie, {
                movie: data.media,
                additionalItemsTop: additionalItems.filter(action => action.position === 'top'),
                additionalItemsBottom: additionalItems.filter(action => action.position === 'bottom'),
            })
        } else if (data.type === 'tv_series') {
            openSheet(BottomSheetTvSeries, {
                tvSeries: data.media,
                additionalItemsTop: additionalItems.filter(action => action.position === 'top'),
                additionalItemsBottom: additionalItems.filter(action => action.position === 'bottom'),
            })
        }
    }, [bottomSheetActions, openSheet]);

    return (
    <>
        <AnimatedStackScreen
		options={{
			headerTitle: screenTitle,
		}}
		scrollY={scrollY}
		triggerHeight={headerHeight}
		/>
		<CollectionScreen
		queryData={queryData}
		screenTitle={screenTitle}
		// Search
		searchPlaceholder={upperFirst(t('common.messages.search_film_or_tv_series', { count: 1 }))}
		fuseKeys={[
			{
				name: 'title',
                getFn: (item) => (item.type === 'movie' ? item.media.title : item.media.name) || '',
			},
		]}
		// Sort
		sortByOptions={sortByOptions}
		// Getters
		getItemId={(item) => item.id}
		getItemTitle={(item) => (item.type === 'movie' ? item.media.title : item.media.name) || ''}
		getItemSubtitle={(item) => {
            if (item.type === 'movie') {
                return item.media.directors.map((director) => director.name).join(', ') || '';
            } else if (item.type === 'tv_series') {
                return item.media.createdBy?.map((creator) => creator.name).join(', ') || '';
            }
            return '';
        }}
        getItemImageUrl={(item) => getTmdbImage({ path: item.media.posterPath, size: 'w342' }) || ''}
		getItemUrl={(item) => item.media.url || ''}
		getItemBackdropUrl={(item) => getTmdbImage({ path: item.media.backdropPath, size: 'w780' }) || ''}
		getCreatedAt={(item) => item.createdAt}
		// Actions
		bottomSheetActions={bottomSheetActions}
		swipeActions={swipeActions}
		onItemAction={onItemAction}
		// SharedValues
		scrollY={scrollY}
		headerHeight={headerHeight}
		// View
		defaultView={view}
		onViewChange={(view) => setWatchlist({ view })}
        />
    </>
    )
};

export default BookmarksScreen;