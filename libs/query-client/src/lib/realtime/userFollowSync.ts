import { useEffect } from 'react';
import { realtime } from '@libs/api-js';
import { useUserFollowCacheUpdate } from '../users';

export function useRealtimeSyncUserFollow(enabled: boolean) {
  const { setFollow, deleteFollow, acceptFollow, declineFollow } = useUserFollowCacheUpdate();

  useEffect(() => {
    if (!enabled) return;

    return realtime.onUserFollowEvents({
      onUserFollowSet: (follow) => {
        setFollow(follow);
      },
      onUserFollowDeleted: (follow) => {
        deleteFollow(follow);
      },
      onUserFollowAccepted: (follow) => {
        acceptFollow(follow);
      },
      onUserFollowDeclined: (follow) => {
        declineFollow(follow);
      },
    });
  }, [enabled, setFollow, deleteFollow, acceptFollow, declineFollow]);
}
