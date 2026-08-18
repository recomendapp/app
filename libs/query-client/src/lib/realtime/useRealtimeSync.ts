import { useEffect } from 'react';
import { realtime } from '@libs/api-js';
import { useRealtimeSyncPlaylists } from './playlistsSync';
import { useRealtimeSyncLogs } from './logsSync';
import { useRealtimeSyncBookmarks } from './bookmarksSync';
import { useRealtimeSyncRecos } from './recosSync';
import { useRealtimeSyncMe } from './meSync';

/**
 * Single entry point for the app's realtime connection: opens the persistent per-user socket
 * and wires every domain's events into the TanStack Query cache (playlists, logs, bookmarks,
 * recos, me — add a `useRealtimeSync*(enabled)` hook per new domain and call it below). Meant to
 * be called exactly once, from each app's RealtimeProvider, gated on `enabled` (only connect
 * while logged in) — not from individual screens.
 */
export function useRealtimeSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    realtime.connect();

    return () => {
      realtime.disconnect();
    };
  }, [enabled]);

  useRealtimeSyncPlaylists(enabled);
  useRealtimeSyncLogs(enabled);
  useRealtimeSyncBookmarks(enabled);
  useRealtimeSyncRecos(enabled);
  useRealtimeSyncMe(enabled);
}
