import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SharedValue } from 'react-native-reanimated';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/Button';
import { View } from '../../../components/ui/view';
import tw from '../../../lib/tw';
import { Icons } from '../../../constants/Icons';
import { ImageWithFallback } from '../../../components/utils/ImageWithFallback';
import { MovieHeaderInfo } from '../../../components/screens/film/MovieHeaderInfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale, useTranslations } from 'use-intl';
import { Link } from 'expo-router';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useTheme } from '../../../providers/ThemeProvider';
import { upperFirst } from 'lodash';
import ButtonUserLogMovieRating from '../../../components/buttons/movies/ButtonUserLogMovieRating';
import ButtonUserLogMovieLike from '../../../components/buttons/movies/ButtonUserLogMovieLike';
import ButtonUserLogMovieWatch from '../../../components/buttons/movies/ButtonUserLogMovieWatch';
import { useAuth } from '../../../providers/AuthProvider';
import { ButtonUserBookmark } from '../../../components/buttons/ButtonUserBookmark';
import { ButtonPlaylistAdd } from '../../../components/buttons/ButtonPlaylistAdd';
import ButtonUserRecoSend from '../../../components/buttons/ButtonUserRecoSend';
import { useQuery } from '@tanstack/react-query';
import { movieOptions } from '@libs/query-client';
import { getTmdbImage } from '../../../lib/tmdb/getTmdbImage';
import { PersonCompact } from '@libs/api-js';

interface LocationDetailsBottomSheetProps {
  index: SharedValue<number>;
  position: SharedValue<number>;
  onClose?: () => Promise<void> | void;
}

export interface LocationDetailsBottomSheetMethods {
  present: (item: { movieId: number }) => void;
}

export const LocationDetailsBottomSheet = forwardRef<
  LocationDetailsBottomSheetMethods,
  LocationDetailsBottomSheetProps
>(({ index, position, onClose }, ref) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations();
  const { user } = useAuth();
  // REFs
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // States
  const [selectedLocation, setSelectedLocation] = useState<{ movieId: number }>();

  // Queries
  const { data: movie } = useQuery(movieOptions({ movieId: selectedLocation?.movieId }));

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
    present: (location) => {
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
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spaces.horizontal,
          gap: theme.spaces.md,
          paddingBottom: insets.bottom,
        }}
        bounces={false}
      >
        <View style={[tw`flex-row justify-between items-center`, { gap: theme.spaces.md }]}>
          {movie ? (
            <MovieHeaderInfo movie={movie} />
          ) : (
            <Skeleton color={colors.background} style={tw`w-32 h-8`} />
          )}
          <View style={[tw`flex-row items-center`, { gap: theme.spaces.md }]}>
            <Button
              onPress={handleCloseLocationDetails}
              variant="muted"
              icon={Icons.X}
              size="icon"
              style={{ borderRadius: theme.border.radius.full, backgroundColor: colors.background }}
            />
          </View>
        </View>
        <View style={[tw`flex-row items-center`, { gap: theme.spaces.md }]}>
          {movie ? (
            <ImageWithFallback
              alt={movie.title || 'Movie Poster'}
              source={{ uri: getTmdbImage({ path: movie.posterPath, size: 'w92' }) }}
              style={[{ aspectRatio: 2 / 3 }, tw`w-20 h-auto rounded-md`]}
              type={'movie'}
            />
          ) : (
            <Skeleton
              color={colors.background}
              style={[{ aspectRatio: 2 / 3 }, tw`w-20 h-auto rounded-md`]}
            />
          )}
          <View>
            {movie ? (
              <Link
                href={{ pathname: '/film/[film_id]', params: { film_id: movie.slug || movie.id } }}
              >
                <Text variant="title">{movie.title}</Text>
              </Link>
            ) : (
              <Skeleton color={colors.background} style={tw`w-32 h-8`} />
            )}
            {movie?.directors && movie.directors.length > 0 && (
              <Text>
                <Directors directors={movie.directors} />
              </Text>
            )}
          </View>
        </View>
        {user && movie && (
          <View
            style={[
              tw`flex-row items-center justify-between`,
              { gap: theme.spaces.lg, paddingVertical: theme.spaces.md },
            ]}
          >
            <View style={[tw`flex-row items-center`, { gap: theme.spaces.lg }]}>
              <ButtonUserLogMovieRating movie={movie} />
              <ButtonUserLogMovieLike movie={movie} />
              <ButtonUserLogMovieWatch movie={movie} />
              <ButtonUserBookmark mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
            </View>
            <View style={[tw`flex-row items-center`, { gap: theme.spaces.lg }]}>
              <ButtonPlaylistAdd mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
              <ButtonUserRecoSend mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
            </View>
          </View>
        )}
        {movie ? (
          <View
            style={[
              {
                backgroundColor: colors.background,
                paddingHorizontal: theme.spaces.horizontal,
                paddingVertical: theme.spaces.md,
                gap: theme.spaces.md,
              },
              tw`rounded-md`,
            ]}
          >
            <Text variant="caption">{upperFirst(t('common.messages.overview'))}</Text>
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
  const names = directors.map((d) => d.name!);
  const formatted = listFormatter.formatToParts(names);
  if (formatted.length === 0) return null;
  return (
    <>
      {formatted.map((part, i) => {
        const director = directors.find((d) => d.name === part.value);
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
