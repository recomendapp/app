import { ScrollView } from 'react-native';
import { View } from '../../ui/view';
import tw from '../../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../theme/globals';
import { MovieCompact } from '@libs/api-js';
import ButtonUserLogMovieRating from '../../buttons/movies/ButtonUserLogMovieRating';
import ButtonUserLogMovieLike from '../../buttons/movies/ButtonUserLogMovieLike';
import ButtonUserLogMovieWatch from '../../buttons/movies/ButtonUserLogMovieWatch';
import ButtonUserLogMovieWatchDate from '../../buttons/movies/ButtonUserLogMovieWatchDate';
import { ButtonPlaylistAdd } from '../../buttons/ButtonPlaylistAdd';
import ButtonUserRecoSend from '../../buttons/ButtonUserRecoSend';
import { ButtonUserBookmark } from '../../buttons/ButtonUserBookmark';

interface FilmActionButtonsProps {
  movie: MovieCompact;
  compact?: boolean;
}

/**
 * Plain RN button row — used by FloatingBar (Android, iOS < 26) and by the base
 * (non-Liquid-Glass) FilmBottomAccessory. Platform-agnostic on purpose: keep this file
 * without a .ios/.android suffix so both FilmBottomAccessory.tsx and .ios.tsx can import it.
 *
 * The left group scrolls horizontally when it doesn't fit (e.g. watch date button added) so
 * it never pushes the right group (playlist/reco) out of view — mirrors the ScrollView layout
 * used in FilmBottomAccessory.ios.tsx. Padding lives inside the ScrollView's content so the
 * first/last buttons keep breathing room while scrolling instead of sitting flush at the edge.
 */
export const FilmActionButtons = ({ movie, compact = false }: FilmActionButtonsProps) => (
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
        <ButtonUserLogMovieRating movie={movie} />
        <ButtonUserLogMovieLike movie={movie} />
        <ButtonUserLogMovieWatch movie={movie} />
        <ButtonUserBookmark mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
        {!compact && <ButtonUserLogMovieWatchDate movie={movie} />}
      </ScrollView>
    </View>
    <View style={tw`flex-row items-center gap-2`}>
      <ButtonPlaylistAdd mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
      <ButtonUserRecoSend mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
    </View>
  </View>
);
