import { useEffect } from 'react';
import { realtime } from '@libs/api-js';
import { usePersonFollowCacheUpdate } from '../users';

export function useRealtimeSyncPersonFollow(enabled: boolean) {
  const { setPersonFollow, deletePersonFollow } = usePersonFollowCacheUpdate();

  useEffect(() => {
    if (!enabled) return;

    return realtime.onPersonFollowEvents({
      onPersonFollowSet: (follow) => {
        setPersonFollow(follow);
      },
      onPersonFollowDeleted: (follow) => {
        deletePersonFollow(follow);
      },
    });
  }, [enabled, setPersonFollow, deletePersonFollow]);
}
