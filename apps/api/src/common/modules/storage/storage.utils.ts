import { StorageFolder } from './storage.constants';

export function getMediaUrl(filenameOrUrl: string | null | undefined, folder: StorageFolder): string | null {
  if (!filenameOrUrl) return null;

  if (filenameOrUrl.startsWith('http://') || filenameOrUrl.startsWith('https://')) {
    return filenameOrUrl;
  }

  const endpoint = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT;
  const bucketName = process.env.S3_BUCKET || 'medias';

  return `${endpoint}/${bucketName}/${folder}/${filenameOrUrl}`;
}