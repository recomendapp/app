import { TvSeasonCompact } from '@libs/api-js';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { TvSeasonActionButtons } from './TvSeasonActionButtons';

interface TvSeasonBottomAccessoryProps {
  tvSeason: TvSeasonCompact;
}

/**
 * Base (non-iOS) fallback. In practice unreachable: the screen only calls
 * setAccessory(TvSeasonBottomAccessory, ...) when isLiquidGlassAvailable is true, which is iOS
 * 26+ only — so Android always uses FloatingBar + TvSeasonActionButtons instead. This still needs
 * to exist and export a valid component so Metro can resolve the import on Android.
 * Only ever mounted inside <NativeTabs.BottomAccessory> — usePlacement() requires that context.
 */
export const TvSeasonBottomAccessory = ({ tvSeason }: TvSeasonBottomAccessoryProps) => {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <TvSeasonActionButtons tvSeason={tvSeason} compact={placement === 'inline'} />;
};
