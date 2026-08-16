import { TvSeriesCompact } from '@libs/api-js';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { TvSeriesActionButtons } from './TvSeriesActionButtons';

interface TvSeriesBottomAccessoryProps {
  tvSeries: TvSeriesCompact;
}

/**
 * Base (non-iOS) fallback. In practice unreachable: the screen only calls
 * setAccessory(TvSeriesBottomAccessory, ...) when isLiquidGlassAvailable is true, which is iOS
 * 26+ only — so Android always uses FloatingBar + TvSeriesActionButtons instead. This still needs
 * to exist and export a valid component so Metro can resolve the import on Android.
 * Only ever mounted inside <NativeTabs.BottomAccessory> — usePlacement() requires that context.
 */
export const TvSeriesBottomAccessory = ({ tvSeries }: TvSeriesBottomAccessoryProps) => {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <TvSeriesActionButtons tvSeries={tvSeries} compact={placement === 'inline'} />;
};
