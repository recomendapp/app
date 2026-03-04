export const StorageFolders = {
  AVATARS: 'avatars',
  USER_BACKGROUNDS: 'backgrounds',
  PLAYLIST_POSTERS: 'playlist-posters',
} as const;

export type StorageFolder = typeof StorageFolders[keyof typeof StorageFolders];

export const AllowedMimeTypes: Record<StorageFolder, string[]> = {
  [StorageFolders.AVATARS]: ['image/jpeg', 'image/png', 'image/webp'],
  [StorageFolders.USER_BACKGROUNDS]: ['image/jpeg', 'image/png', 'image/webp'],
  [StorageFolders.PLAYLIST_POSTERS]: ['image/jpeg', 'image/png', 'image/webp'],
};