export const StorageFolders = {
  AVATARS: 'avatars',
  USER_BACKGROUNDS: 'backgrounds',
  PLAYLIST_POSTERS: 'playlist-posters',
  REVIEW_ATTACHMENTS: 'review-attachments',
} as const;

export type StorageFolder = typeof StorageFolders[keyof typeof StorageFolders];

export const AllowedMimeTypes: Record<StorageFolder, string[]> = {
  [StorageFolders.AVATARS]: ['image/jpeg', 'image/png', 'image/webp'],
  [StorageFolders.USER_BACKGROUNDS]: ['image/jpeg', 'image/png', 'image/webp'],
  [StorageFolders.PLAYLIST_POSTERS]: ['image/jpeg', 'image/png', 'image/webp'],
  [StorageFolders.REVIEW_ATTACHMENTS]: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};