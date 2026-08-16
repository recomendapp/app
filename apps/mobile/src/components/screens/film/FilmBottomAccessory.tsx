import { MovieCompact } from '@libs/api-js';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { FilmActionButtons } from './FilmActionButtons';

interface FilmBottomAccessoryProps {
  movie: MovieCompact;
}

/**
 * Base (non-iOS) fallback. In practice unreachable: the screen only calls
 * setAccessory(FilmBottomAccessory, ...) when isLiquidGlassAvailable is true, which is iOS
 * 26+ only — so Android always uses FloatingBar + FilmActionButtons instead. This still needs
 * to exist and export a valid component so Metro can resolve the import on Android.
 * Only ever mounted inside <NativeTabs.BottomAccessory> — usePlacement() requires that context.
 */
export const FilmBottomAccessory = ({ movie }: FilmBottomAccessoryProps) => {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <FilmActionButtons movie={movie} compact={placement === 'inline'} />;
};
