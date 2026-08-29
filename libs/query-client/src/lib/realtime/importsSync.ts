import { useEffect } from 'react';
import { realtime } from '@libs/api-js';
import { useImportCacheUpdate } from '../imports';

export function useRealtimeSyncImports(enabled: boolean) {
  const { setJob, addJob, removeJob, invalidateImportedCollections } = useImportCacheUpdate();

  useEffect(() => {
    if (!enabled) return;

    return realtime.onImportEvents({
      onImportCreated: () => addJob(),
      onImportProgress: (job) => setJob(job),
      onImportStaged: (job) => setJob(job),
      onImportValidated: (job) => {
        setJob(job);
        invalidateImportedCollections(job.userId);
      },
      onImportFailed: (job) => setJob(job),
      onImportDeleted: ({ importId }) => removeJob(importId),
    });
  }, [enabled, setJob, addJob, removeJob, invalidateImportedCollections]);
}
