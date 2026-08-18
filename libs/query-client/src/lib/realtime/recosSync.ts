import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { realtime } from '@libs/api-js';
import { useRecoCacheUpdate, useRecoTargetCacheUpdate } from '../users';
import { meOptions } from '../me';

export function useRealtimeSyncRecos(enabled: boolean) {
  const { data: me } = useQuery(meOptions());
  const { markSent } = useRecoTargetCacheUpdate();
  const { upsertReceived, removeDeleted } = useRecoCacheUpdate({ userId: me?.id });

  useEffect(() => {
    if (!enabled) return;

    return realtime.onRecoEvents({
      onRecoSent: (response) => {
        markSent(response);
      },
      onRecoReceived: (reco) => {
        upsertReceived(reco);
      },
      onRecoDeleted: (recos) => {
        removeDeleted(recos);
      },
    });
  }, [enabled, markSent, upsertReceived, removeDeleted]);
}
