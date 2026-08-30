import { useEffect } from 'react';
import { realtime } from '@libs/api-js';
import { usePinnedCacheUpdate } from '../users';

export function useRealtimeSyncPinned(enabled: boolean) {
  const { setPinned, reorderPinned, deletePinned } = usePinnedCacheUpdate();

  useEffect(() => {
    if (!enabled) return;

    return realtime.onPinnedEvents({
      onPinnedSet: (item) => {
        setPinned(item);
      },
      onPinnedReordered: (signal) => {
        reorderPinned(signal);
      },
      onPinnedDeleted: (signal) => {
        deletePinned(signal);
      },
    });
  }, [enabled, setPinned, reorderPinned, deletePinned]);
}
