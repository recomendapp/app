import { useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  BookmarkWithMedia,
  ListInfiniteBookmarks,
  ListInfiniteRecos,
  ListInfiniteRecoTargets,
  ListPaginatedBookmarks,
  ListPaginatedRecos,
  ListPaginatedRecoTargets,
  Profile,
  Reco,
  RecoSendResponse,
  RecoTarget,
  RecoWithMedia,
  User,
} from '@libs/api-js';
import {
  resolveUpdater,
  ItemUpdater,
  removeListItemFromAllCaches,
  updateListItemInAllCaches,
  updateOrRemoveListItemInAllCaches,
} from '../utils';
import {
  userByIdOptions,
  userByUsernameOptions,
  userBookmarkByMediaOptions,
  userBookmarksAllOptions,
  userRecoSendAllOptions,
  userRecoSendPaginatedOptions,
  userRecoSendInfiniteOptions,
  userRecosAllOptions,
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

export const useRecoTargetCacheUpdate = () => {
  const queryClient = useQueryClient();

  const markSent = useCallback(
    (data: RecoSendResponse) => {
      updateListItemInAllCaches<RecoTarget, ListPaginatedRecoTargets, ListInfiniteRecoTargets>(
        queryClient,
        {
          all: userRecoSendAllOptions({
            userId: data.senderId,
            mediaId: data.mediaId,
            mediaType: data.type,
          }).queryKey,
          paginated: userRecoSendPaginatedOptions({
            userId: data.senderId,
            mediaId: data.mediaId,
            mediaType: data.type,
          }).queryKey,
          infinite: userRecoSendInfiniteOptions({
            userId: data.senderId,
            mediaId: data.mediaId,
            mediaType: data.type,
          }).queryKey,
        },
        { alreadySent: true },
        (item) => data.sent.includes(item.id),
      );
    },
    [queryClient],
  );

  return { markSent };
};

export const useRecoCacheUpdate = ({
  userId,
}: {
  userId?: string;
} = {}) => {
  const queryClient = useQueryClient();

  // `RecoWithMedia` (the grouped-by-media DTO) has no `userId` field — it's always scoped to
  // "the current user's received recos" implicitly. Realtime RECEIVED events are only ever
  // delivered to the receiver's own room, so `userId` must come from the caller (the logged-in
  // user), not from the payload.
  const upsertReceived = useCallback(
    (data: RecoWithMedia) => {
      if (!userId) return;

      // The unfiltered "all" cache can be upserted directly since the payload already carries
      // the complete, correct senders array for this media (recomputed server-side) — no need to
      // wait on a refetch for it.
      queryClient.setQueryData(userRecosAllOptions({ userId }).queryKey, (old) => {
        if (!old) return old;
        const index = old.findIndex(
          (item) => item.mediaId === data.mediaId && item.type === data.type,
        );
        if (index === -1) return [data, ...old];
        const next = [...old];
        next[index] = data;
        return next;
      });

      // Paginated/infinite ordering depends on the server — invalidate rather than guess the
      // insertion/reorder position. The unfiltered "all" cache was already patched above, so
      // it's deliberately excluded here to avoid an immediate redundant refetch of it.
      queryClient.invalidateQueries({
        queryKey: userKeys.recos({ userId, mode: 'paginated' }),
      });
      queryClient.invalidateQueries({
        queryKey: userKeys.recos({ userId, mode: 'infinite' }),
      });
    },
    [queryClient, userId],
  );

  // `Reco` (bare, ungrouped) always carries `userId` — the receiver whose grouped list is
  // affected — regardless of whether the sender or the receiver triggered the deletion.
  const removeDeleted = useCallback(
    (recos: Reco[]) => {
      const firstReco = recos[0];
      if (!firstReco) return;

      const removedSenderIds = new Set(recos.map((r) => r.id));

      updateOrRemoveListItemInAllCaches<RecoWithMedia, ListPaginatedRecos, ListInfiniteRecos>(
        queryClient,
        {
          all: userKeys.recos({ userId: firstReco.userId, mode: 'all' }),
          paginated: userKeys.recos({ userId: firstReco.userId, mode: 'paginated' }),
          infinite: userKeys.recos({ userId: firstReco.userId, mode: 'infinite' }),
        },
        (item) => item.mediaId === firstReco.mediaId && item.type === firstReco.type,
        (item) => {
          const remainingSenders = item.senders.filter((s) => !removedSenderIds.has(s.id));

          if (remainingSenders.length === 0) {
            return null;
          }

          const newLatestCreatedAt = remainingSenders.reduce((latest, current) =>
            current.createdAt > latest.createdAt ? current : latest,
          ).createdAt;

          return {
            senders: remainingSenders,
            latestCreatedAt: newLatestCreatedAt,
          };
        },
      );
    },
    [queryClient],
  );

  return { upsertReceived, removeDeleted };
};
