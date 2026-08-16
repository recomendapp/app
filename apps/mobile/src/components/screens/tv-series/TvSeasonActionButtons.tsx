import { View } from '../../ui/view';
import tw from '../../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../theme/globals';
import { TvSeasonCompact } from '@libs/api-js';
import ButtonUserLogTvSeason from '../../buttons/tv-series/ButtonUserLogTvSeason';

interface TvSeasonActionButtonsProps {
  tvSeason: TvSeasonCompact;
  compact?: boolean;
}

/**
 * Plain RN button row — used by FloatingBar (Android, iOS < 26) and by the base
 * (non-Liquid-Glass) TvSeasonBottomAccessory. Mirrors TvSeriesActionButtons.tsx, minus
 * bookmark/playlist/reco — seasons aren't a bookmarkable/recommendable media type — so there's
 * just the single consolidated rating/watch button, no horizontal scroll needed.
 */
export const TvSeasonActionButtons = ({
  tvSeason,
  compact = false,
}: TvSeasonActionButtonsProps) => (
  <View
    style={[
      tw`flex-row items-center`,
      {
        gap: GAP,
        paddingHorizontal: PADDING_HORIZONTAL,
        paddingVertical: compact ? 0 : PADDING_VERTICAL,
      },
    ]}
  >
    <ButtonUserLogTvSeason tvSeason={tvSeason} />
  </View>
);
