import { useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  BookmarkWithMedia,
  ListInfiniteBookmarks,
  ListPaginatedBookmarks,
  Profile,
  User,
} from '@libs/api-js';
import {
  resolveUpdater,
  ItemUpdater,
  removeListItemFromAllCaches,
  updateListItemInAllCaches,
} from '../utils';
import {
  userByIdOptions,
  userByUsernameOptions,
  userBookmarkByMediaOptions,
  userBookmarksAllOptions,
  userKeys,
} from '../users';
import { meOptions } from '../me';
import { useCallback } from 'react';

export const useUserCacheUpdate = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (user: User, updater: ItemUpdater<User | Profile>) => {
      queryClient.setQueryData(meOptions().queryKey, (old) => {
        if (!old || old.id !== user.id) return old;
        return {
          ...old,
          ...resolveUpdater(old, updater),
        };
      });

      queryClient.setQueryData(userByIdOptions({ userId: user.id }).queryKey, (old) => {
        if (!old) return undefined;
        return {
          ...old,
          ...resolveUpdater(old, updater),
        };
      });

      queryClient.setQueryData(
        userByUsernameOptions({ username: user.username }).queryKey,
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            ...resolveUpdater(old, updater),
          };
        },
      );
    },
    [queryClient],
  );
};

export const useBookmarkCacheUpdate = () => {
  const queryClient = useQueryClient();

  const setBookmark = useCallback(
    (data: BookmarkWithMedia) => {
      queryClient.setQueryData(
        userBookmarkByMediaOptions({
          userId: data.userId,
          mediaId: data.mediaId,
          type: data.type,
        }).queryKey,
        data,
      );

      const isInsert = data.createdAt === data.updatedAt;
      if (isInsert) {
        // The unfiltered "all" cache (the main watchlist view) can be patched directly since
        // we already have the full item with media — no need to wait on a refetch for it.
        queryClient.setQueryData(
          userBookmarksAllOptions({ userId: data.userId }).queryKey,
          (old) => {
            if (!old) return old;
            if (old.some((item) => item.id === data.id)) return old;
            return [data, ...old];
          },
        );

        // Paginated/infinite ordering depends on the server — invalidate rather than guess
        // the insertion position. The unfiltered "all" cache was already patched above, so
        // it's deliberately excluded here to avoid an immediate redundant refetch of it.
        queryClient.invalidateQueries({
          queryKey: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
        });
        queryClient.invalidateQueries({
          queryKey: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
        });
      } else {
        updateListItemInAllCaches<BookmarkWithMedia, ListPaginatedBookmarks, ListInfiniteBookmarks>(
          queryClient,
          {
            all: userKeys.bookmarks({ userId: data.userId, mode: 'all' }),
            paginated: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
            infinite: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
          },
          data,
        );
      }
    },
    [queryClient],
  );

  const deleteBookmark = useCallback(
    (data: Bookmark) => {
      queryClient.setQueryData(
        userBookmarkByMediaOptions({
          userId: data.userId,
          mediaId: data.mediaId,
          type: data.type,
        }).queryKey,
        null,
      );

      removeListItemFromAllCaches<BookmarkWithMedia, ListPaginatedBookmarks, ListInfiniteBookmarks>(
        queryClient,
        {
          all: userKeys.bookmarks({ userId: data.userId, mode: 'all' }),
          paginated: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
          infinite: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
        },
        data.id,
      );
    },
    [queryClient],
  );

  return { setBookmark, deleteBookmark };
};
