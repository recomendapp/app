import { useEffect } from 'react';
import { realtime } from '@libs/api-js';
import { useBookmarkCacheUpdate } from '../users';

export function useRealtimeSyncBookmarks(enabled: boolean) {
  const { setBookmark, deleteBookmark } = useBookmarkCacheUpdate();

  useEffect(() => {
    if (!enabled) return;

    return realtime.onBookmarkEvents({
      onBookmarkSet: (bookmark) => {
        setBookmark(bookmark);
      },
      onBookmarkDeleted: (bookmark) => {
        deleteBookmark(bookmark);
      },
    });
  }, [enabled, setBookmark, deleteBookmark]);
}
