import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { SharedValue } from 'react-native-reanimated';
import { Text } from 'apps/mobile/src/components/ui/text';
import { Button } from 'apps/mobile/src/components/ui/Button';
import { View } from 'apps/mobile/src/components/ui/view';
import tw from 'apps/mobile/src/lib/tw';
import { BORDER_RADIUS_FULL, GAP, GAP_LG, PADDING_HORIZONTAL, PADDING_VERTICAL } from 'apps/mobile/src/theme/globals';
import { Icons } from 'apps/mobile/src/constants/Icons';
import { ImageWithFallback } from 'apps/mobile/src/components/utils/ImageWithFallback';
import { MovieHeaderInfo } from 'apps/mobile/src/components/screens/film/MovieHeaderInfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale, useTranslations } from 'use-intl';
import { Link } from 'expo-router';
import { Skeleton } from 'apps/mobile/src/components/ui/Skeleton';
import { useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import { upperFirst } from 'lodash';
import ButtonUserLogMovieRating from 'apps/mobile/src/components/buttons/movies/ButtonUserLogMovieRating';
import ButtonUserLogMovieLike from 'apps/mobile/src/components/buttons/movies/ButtonUserLogMovieLike';
import ButtonUserLogMovieWatch from 'apps/mobile/src/components/buttons/movies/ButtonUserLogMovieWatch';
import { useAuth } from 'apps/mobile/src/providers/AuthProvider';
import { ButtonUserBookmark } from 'apps/mobile/src/components/buttons/ButtonUserBookmark';
import { ButtonPlaylistAdd } from 'apps/mobile/src/components/buttons/ButtonPlaylistAdd';
import ButtonUserRecoSend from 'apps/mobile/src/components/buttons/ButtonUserRecoSend';
import { useQuery } from '@tanstack/react-query';
import { movieOptions } from '@libs/query-client';
import { getTmdbImage } from 'apps/mobile/src/lib/tmdb/getTmdbImage';
import { PersonCompact } from '@libs/api-js';

interface LocationDetailsBottomSheetProps {
  index: SharedValue<number>;
  position: SharedValue<number>;
  onClose?: () => Promise<void> | void;
}

export interface LocationDetailsBottomSheetMethods {
  present: (item: ExploreTile['features'][number]['properties']) => void;
}

export const LocationDetailsBottomSheet = forwardRef<
  LocationDetailsBottomSheetMethods,
  LocationDetailsBottomSheetProps
>(({ index, position, onClose }, ref) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations();
  const { user } = useAuth();
  // REFs
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // States
  const [selectedLocation, setSelectedLocation] = useState<ExploreTile['features'][number]['properties']>();

  // Queries
  const {
    data: movie,
  } = useQuery(movieOptions({ movieId: selectedLocation?.movie.id }));

  //#region hooks
  const headerHeight = useHeaderHeight();
  //#endregion

  //#region callbacks
  const handleCloseLocationDetails = async () => {
    bottomSheetRef.current?.dismiss();
  };
  const handleOnDismiss = () => {
    setSelectedLocation(undefined);
    onClose?.();
  };
  //#endregion

  //#region effects
  useImperativeHandle(ref, () => ({
    present: location => {
      setSelectedLocation(location);
    },
  }));

  useEffect(() => {
    if (selectedLocation) {
      bottomSheetRef.current?.present();
    }
  }, [selectedLocation]);

  return (
  <BottomSheetModal
  ref={bottomSheetRef}
  key="PoiDetailsSheet"
  name="PoiDetailsSheet"
  snapPoints={['35%']}
  topInset={headerHeight}
  animatedIndex={index}
  animatedPosition={position}
  handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
  backgroundStyle={{ backgroundColor: colors.muted }}
  onDismiss={handleOnDismiss}
  >
	  <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL, gap: GAP, paddingBottom: insets.bottom }} bounces={false}>
      <View style={[tw`flex-row justify-between items-center`, { gap: GAP }]}>
        {movie ? <MovieHeaderInfo movie={movie} /> : <Skeleton color={colors.background} style={tw`w-32 h-8`}/>}
        <View style={[tw`flex-row items-center`, { gap: GAP }]}>
          <Button onPress={handleCloseLocationDetails} variant='muted' icon={Icons.X} size='icon' style={{ borderRadius: BORDER_RADIUS_FULL, backgroundColor: colors.background }}/>
        </View>
      </View>
      <View style={[tw`flex-row items-center`, { gap: GAP }]}>
        {movie ?  (
          <ImageWithFallback
          alt={movie.title || 'Movie Poster'}
          source={{ uri: getTmdbImage({ path: movie.posterPath, size: 'w92' }) }}
          style={[
            {aspectRatio: 2 / 3},
            tw`w-20 h-auto rounded-md`
          ]}
          type={'movie'}
          />
        ) : <Skeleton color={colors.background} style={[{ aspectRatio: 2 / 3 }, tw`w-20 h-auto rounded-md`]}/>}
        <View>
          {movie ? <Link href={{ pathname: '/film/[film_id]', params: { film_id: movie.slug || movie.id }}}><Text variant='title'>{movie.title}</Text></Link> : <Skeleton color={colors.background} style={tw`w-32 h-8`}/>}
          {movie?.directors && movie.directors.length > 0 && (
            <Text>
              <Directors directors={movie.directors} />
            </Text>
          )}
        </View>
      </View>
      {user && movie && (
        <View style={[tw`flex-row items-center justify-between`, { gap: GAP_LG, paddingVertical: PADDING_VERTICAL }]}>
          <View style={[tw`flex-row items-center`, { gap: GAP_LG }]}>
            <ButtonUserLogMovieRating movie={movie} />
            <ButtonUserLogMovieLike movie={movie} />
            <ButtonUserLogMovieWatch movie={movie} />
            <ButtonUserBookmark mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
          </View>
          <View style={[tw`flex-row items-center`, { gap: GAP_LG }]}>
            <ButtonPlaylistAdd mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
            <ButtonUserRecoSend mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
          </View>
        </View>
      )}
      {movie ? (
        <View style={[{ backgroundColor: colors.background, paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: PADDING_VERTICAL, gap: GAP }, tw`rounded-md`]}>
          <Text variant='caption'>{upperFirst(t('common.messages.overview'))}</Text>
          <Text>{movie.overview || upperFirst(t('common.messages.no_description'))}</Text>
        </View>
      ) : (
        <Skeleton color={colors.background} style={tw`w-full h-32 rounded-md`} />
      )}
	  </BottomSheetScrollView>
  </BottomSheetModal>
  );
});
LocationDetailsBottomSheet.displayName = 'LocationDetailsBottomSheet';

const Directors = ({ directors }: { directors: PersonCompact[] }) => {
  const locale = useLocale();
  const listFormatter = new Intl.ListFormat(locale, {
    style: 'long',
    type: 'conjunction',
  });
  const names = directors.map(d => d.name!);
  const formatted = listFormatter.formatToParts(names);
  if (formatted.length === 0) return null;
  return (
    <>
    {formatted.map((part, i) => {
      const director = directors.find(d => d.name === part.value);
      if (part.type === 'element') {
        return (
          <Link key={i} href={`/person/${director?.slug || director?.id}`}>
          {director?.name}
          </Link>
        );
      }
      return part.value;
    })}
    </>
  );
};
