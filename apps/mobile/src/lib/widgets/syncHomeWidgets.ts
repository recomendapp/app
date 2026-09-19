import { Directory, File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';
import type { BookmarkWithMedia, RecoWithMedia } from '@libs/api-js';
import { getTmdbImage } from '../tmdb/getTmdbImage';
import type { WidgetCarouselItem } from '../../widgets/types';
import BookmarksWidget from '../../widgets/BookmarksWidget';
import RecosWidget from '../../widgets/RecosWidget';

const WIDGET_ITEM_LIMIT = 10;

type MediaEntryMeta = {
  id: string;
  title: string;
  backdropPath: string | null;
  mediaType: 'movie' | 'tv_series';
  slug: string | null;
  subtitle?: string;
};

/** Matches the `recomend:///film/{id}` deep links `router.push` already uses in-app (see `getMediaDetails`). */
const getDeepLink = (mediaType: 'movie' | 'tv_series', slug: string | null, id: string) => {
  const prefix = mediaType === 'movie' ? 'film' : 'tv-series';
  return `recomend:///${prefix}/${slug ?? id}`;
};

const getBackdropsDirectory = (): Directory | null => {
  if (!widgetsDirectory) return null;
  const directory = new Directory(widgetsDirectory, 'backdrops');
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
};

const getBackdropFileName = (meta: MediaEntryMeta) => `${meta.mediaType}-${meta.id}.jpg`;

/**
 * A previously interrupted download (app killed mid-write, disk full, ...)
 * can leave a 0-byte file behind. `File.exists` alone can't tell that apart
 * from a real cached image, so callers must check both.
 */
const isValidCachedFile = (file: File): boolean => {
  if (!file.exists) return false;
  try {
    return file.size > 0;
  } catch {
    return false;
  }
};

/** Best-effort cleanup of backdrops no longer referenced by any widget item. */
const pruneStaleBackdrops = (directory: Directory, keepFileNames: Set<string>) => {
  try {
    for (const entry of directory.list()) {
      if (entry instanceof File && !keepFileNames.has(entry.name)) {
        entry.delete();
      }
    }
  } catch {
    // Non-critical, next sync will retry.
  }
};

const toItem = (meta: MediaEntryMeta, backdropUri: string): WidgetCarouselItem => ({
  id: meta.id,
  title: meta.title,
  backdropUri,
  mediaType: meta.mediaType,
  subtitle: meta.subtitle,
  deepLink: getDeepLink(meta.mediaType, meta.slug, meta.id),
});

/**
 * Pushes a snapshot for each entry immediately, using only backdrops already
 * cached on disk (no network). Entries not yet cached render with the
 * widget's built-in placeholder rather than blocking on a download.
 */
const buildQuickItems = (
  directory: Directory | null,
  metas: MediaEntryMeta[],
): WidgetCarouselItem[] =>
  metas.map((meta) => {
    if (!directory || !meta.backdropPath) return toItem(meta, '');
    const destination = new File(directory, getBackdropFileName(meta));
    return toItem(meta, isValidCachedFile(destination) ? destination.uri : '');
  });

/** Downloads any backdrop not already cached, then returns the full item list. */
const buildResolvedItems = async (
  directory: Directory | null,
  metas: MediaEntryMeta[],
): Promise<WidgetCarouselItem[]> => {
  const keepFileNames = new Set<string>();

  const items = await Promise.all(
    metas.map(async (meta): Promise<WidgetCarouselItem> => {
      if (!directory || !meta.backdropPath) return toItem(meta, '');

      const fileName = getBackdropFileName(meta);
      keepFileNames.add(fileName);
      const destination = new File(directory, fileName);
      if (isValidCachedFile(destination)) return toItem(meta, destination.uri);

      try {
        const downloaded = await File.downloadFileAsync(
          getTmdbImage({ path: meta.backdropPath, size: 'w780' }),
          destination,
          { idempotent: true },
        );
        return toItem(meta, downloaded.uri);
      } catch {
        return toItem(meta, '');
      }
    }),
  );

  if (directory) pruneStaleBackdrops(directory, keepFileNames);

  return items;
};

type WidgetLike = {
  updateSnapshot: (props: {
    items: WidgetCarouselItem[];
    label: string;
    accentColor?: string;
  }) => void;
};

/**
 * The data-driven effect and the "app came to foreground" effect in
 * `useHomeWidgetsSync` can both call the same sync function within
 * milliseconds of each other (e.g. on cold launch). Without this, two
 * overlapping runs would both try to `File.downloadFileAsync` the same
 * destination path at once, which is how a backdrop image intermittently
 * ended up missing or corrupt. Keying by widget name serializes calls for
 * the same widget while letting Bookmarks and Recos sync in parallel.
 */
const syncQueues = new Map<string, Promise<void>>();
const runSerialized = (key: string, task: () => Promise<void>): Promise<void> => {
  const next = (syncQueues.get(key) ?? Promise.resolve()).then(task, task);
  syncQueues.set(
    key,
    next.catch(() => undefined),
  );
  return next;
};

const syncWidget = async (
  key: string,
  widget: WidgetLike,
  metas: MediaEntryMeta[],
  label: string,
  accentColor: string,
): Promise<void> =>
  runSerialized(key, async () => {
    const directory = getBackdropsDirectory();
    // Phase 1: instant paint from whatever is already cached on disk.
    widget.updateSnapshot({ items: buildQuickItems(directory, metas), label, accentColor });
    // Phase 2: fill in anything missing, then push again.
    const items = await buildResolvedItems(directory, metas);
    widget.updateSnapshot({ items, label, accentColor });
  });

export const syncBookmarksWidget = async (
  bookmarks: BookmarkWithMedia[],
  label: string,
  accentColor: string,
): Promise<void> => {
  const metas = bookmarks.slice(0, WIDGET_ITEM_LIMIT).map(
    (bookmark): MediaEntryMeta => ({
      id: `${bookmark.mediaId}`,
      title: (bookmark.type === 'movie' ? bookmark.media.title : bookmark.media.name) || '',
      backdropPath: bookmark.media.backdropPath,
      mediaType: bookmark.type,
      slug: bookmark.media.slug,
    }),
  );
  await syncWidget('bookmarks', BookmarksWidget, metas, label, accentColor);
};

export const syncRecosWidget = async (
  recos: RecoWithMedia[],
  label: string,
  accentColor: string,
): Promise<void> => {
  const metas = recos.slice(0, WIDGET_ITEM_LIMIT).map((reco): MediaEntryMeta => {
    const [firstSender, ...otherSenders] = reco.senders;
    return {
      id: `${reco.mediaId}`,
      title: (reco.type === 'movie' ? reco.media.title : reco.media.name) || '',
      backdropPath: reco.media.backdropPath,
      mediaType: reco.type,
      slug: reco.media.slug,
      subtitle: firstSender
        ? otherSenders.length > 0
          ? `${firstSender.user.name} +${otherSenders.length}`
          : firstSender.user.name
        : undefined,
    };
  });
  await syncWidget('recos', RecosWidget, metas, label, accentColor);
};

/** Clears both widgets, called on sign-out so the next account never sees stale data. */
export const clearHomeWidgets = (): void => {
  BookmarksWidget.updateSnapshot({ items: [], label: '' });
  RecosWidget.updateSnapshot({ items: [], label: '' });
};
