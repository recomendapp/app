import { assetUrl, AssetPath } from '@libs/assets';

export function getAssetUrl(assetPath: string | null | undefined): string | null {
  if (!assetPath) return null;

  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  return assetUrl(assetPath as AssetPath, process.env.ASSETS_BASE_URL as string);
}
