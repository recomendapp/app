import { ScrollView } from 'react-native';
import { View } from '../../ui/view';
import tw from '../../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../theme/globals';
import { TvSeriesCompact } from '@libs/api-js';
import ButtonUserLogTvSeriesRating from '../../buttons/tv-series/ButtonUserLogTvSeriesRating';
import ButtonUserLogTvSeriesLike from '../../buttons/tv-series/ButtonUserLogTvSeriesLike';
import ButtonUserLogTvSeriesWatch from '../../buttons/tv-series/ButtonUserLogTvSeriesWatch';
import { ButtonPlaylistAdd } from '../../buttons/ButtonPlaylistAdd';
import ButtonUserRecoSend from '../../buttons/ButtonUserRecoSend';
import { ButtonUserBookmark } from '../../buttons/ButtonUserBookmark';

interface TvSeriesActionButtonsProps {
  tvSeries: TvSeriesCompact;
  compact?: boolean;
}

/**
 * Plain RN button row — used by FloatingBar (Android, iOS < 26) and by the base
 * (non-Liquid-Glass) TvSeriesBottomAccessory. Platform-agnostic on purpose: keep this file
 * without a .ios/.android suffix so both TvSeriesBottomAccessory.tsx and a future .ios.tsx
 * variant can import it.
 *
 * The left group scrolls horizontally when it doesn't fit so it never pushes the right group
 * (playlist/reco) out of view — mirrors FilmActionButtons.tsx. Padding lives inside the
 * ScrollView's content so the first/last buttons keep breathing room while scrolling instead
 * of sitting flush at the edge.
 */
export const TvSeriesActionButtons = ({
  tvSeries,
  compact = false,
}: TvSeriesActionButtonsProps) => (
  <View
    style={[
      tw`flex-row items-center`,
      {
        gap: GAP,
        paddingRight: PADDING_HORIZONTAL,
        paddingVertical: compact ? 0 : PADDING_VERTICAL,
      },
    ]}
  >
    <View style={{ flex: 1, minWidth: 0 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          tw`flex-row items-center gap-2`,
          { paddingHorizontal: PADDING_HORIZONTAL },
        ]}
      >
        <ButtonUserLogTvSeriesRating tvSeries={tvSeries} />
        <ButtonUserLogTvSeriesLike tvSeries={tvSeries} />
        <ButtonUserLogTvSeriesWatch tvSeries={tvSeries} />
        <ButtonUserBookmark
          mediaId={tvSeries.id}
          mediaType="tv_series"
          mediaTitle={tvSeries.name}
        />
      </ScrollView>
    </View>
    <View style={tw`flex-row items-center gap-2`}>
      <ButtonPlaylistAdd mediaId={tvSeries.id} mediaType="tv_series" mediaTitle={tvSeries.name} />
      <ButtonUserRecoSend mediaId={tvSeries.id} mediaType="tv_series" mediaTitle={tvSeries.name} />
    </View>
  </View>
);
