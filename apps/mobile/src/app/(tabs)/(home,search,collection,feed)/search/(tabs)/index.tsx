import { CardMovie } from '../../../../../components/cards/CardMovie';
import { CardPerson } from '../../../../../components/cards/CardPerson';
import { CardPlaylist } from '../../../../../components/cards/CardPlaylist';
import { CardTvSeries } from '../../../../../components/cards/CardTvSeries';
import { CardUser } from '../../../../../components/cards/CardUser';
import FeaturedPlaylists from '../../../../../components/screens/search/FeaturedPlaylists';
import { MultiRowHorizontalList } from '../../../../../components/ui/MultiRowHorizontalList';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import { Icons } from '../../../../../constants/Icons';
import tw from '../../../../../lib/tw';
import { useTheme } from '../../../../../providers/ThemeProvider';
import useSearchStore from '../../../../../stores/useSearchStore';
import { useScrollToTop } from 'expo-router/react-navigation';
import { Link } from 'expo-router';
import { clamp, upperFirst } from 'lodash';
import { useRef } from 'react';
import { useWindowDimensions, ScrollView, RefreshControl } from 'react-native';
import { useTranslations } from 'use-intl';
import ErrorMessage from '../../../../../components/ErrorMessage';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { searchGlobalOptions } from '@libs/query-client';
import {
  MovieCompact,
  PersonCompact,
  PlaylistWithOwner,
  SearchBestResultItem,
  TvSeriesCompact,
  UserSummary,
} from '@libs/api-js';

const SearchScreen = () => {
  const search = useSearchStore((state) => state.search);

  if (search && search.length > 0) {
    return <SearchResults search={search} />;
  }

  return <FeaturedPlaylists />;
};

interface SearchResultsProps extends React.ComponentPropsWithoutRef<typeof ScrollView> {
  search: string;
}

export const SearchResults = ({ search, ...props }: SearchResultsProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations();
  const { isVisible: keyboardVisible, height: keyboardHeight } = useKeyboardState((state) => state);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    searchGlobalOptions({
      filters: {
        q: search,
      },
    }),
  );

  const loading = data === undefined || isLoading;
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{
        gap: theme.spaces.md,
        paddingBottom: keyboardVisible
          ? keyboardHeight + theme.spaces.md
          : insets.bottom + theme.spaces.md,
      }}
      keyboardShouldPersistTaps="handled"
      scrollIndicatorInsets={{
        bottom: keyboardVisible ? keyboardHeight - insets.bottom : 0,
      }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      {...props}
    >
      {isError ? (
        <ErrorMessage />
      ) : loading ? (
        <Icons.Loader />
      ) : (
        <>
          {data.best_result && <SearchBestResult best={data.best_result} />}
          {data.movies.length > 0 && <SearchResultsMovies movies={data.movies} search={search} />}
          {data.tv_series.length > 0 && (
            <SearchResultsTvSeries tvSeries={data.tv_series} search={search} />
          )}
          {data.persons.length > 0 && (
            <SearchResultsPersons persons={data.persons} search={search} />
          )}
          {data.playlists.length > 0 && (
            <SearchResultsPlaylists playlists={data.playlists} search={search} />
          )}
          {data.users.length > 0 && <SearchResultsUsers users={data.users} search={search} />}
          {data.movies.length === 0 &&
            data.tv_series.length === 0 &&
            data.persons.length === 0 &&
            data.playlists.length === 0 &&
            data.users.length === 0 &&
            (isLoading ? (
              <Icons.Loader />
            ) : search ? (
              <View style={tw`flex-1 items-center justify-center`}>
                <Text textColor="muted">{upperFirst(t('common.messages.no_results'))}</Text>
              </View>
            ) : null)}
        </>
      )}
    </ScrollView>
  );
};

/* --------------------------------- WIDGETS -------------------------------- */
const SearchBestResult = ({ best }: { best: SearchBestResultItem | null }) => {
  const { theme } = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        marginLeft: insets.left + theme.spaces.horizontal,
        marginRight: insets.right + theme.spaces.horizontal,
        gap: theme.spaces.md,
      }}
    >
      <Text style={tw`font-semibold text-xl`}>{upperFirst(t('common.messages.top_result'))}</Text>
      {best?.type === 'movie' ? (
        <CardMovie variant="list" movie={best.data} />
      ) : best?.type === 'tv_series' ? (
        <CardTvSeries variant="list" tvSeries={best.data} />
      ) : best?.type === 'person' ? (
        <CardPerson variant="list" person={best.data} />
      ) : best?.type === 'playlist' ? (
        <CardPlaylist variant="list" playlist={best.data} owner={best.data.owner} />
      ) : best?.type === 'user' ? (
        <CardUser variant="list" user={best.data} />
      ) : null}
    </View>
  );
};

const SearchResultSection = <T,>({
  title,
  data,
  search,
  pathname,
  renderItem,
  keyExtractor,
}: {
  title: string;
  data: T[];
  search: string;
  pathname: string;
  renderItem: (item: T) => React.ReactElement;
  keyExtractor: (item: T) => string;
}) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const width = clamp(screenWidth - (theme.spaces.horizontal * 2 + theme.spaces.md * 2), 400);

  return (
    <View style={{ gap: theme.spaces.md }}>
      <Link
        href={{
          pathname: pathname as any,
          params: { query: search },
        }}
        style={{
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
        }}
      >
        <View style={tw`flex-row items-center`}>
          <Text style={tw`font-semibold text-xl`} numberOfLines={1}>
            {title}
          </Text>
          <Icons.ChevronRight color={colors.mutedForeground} />
        </View>
      </Link>
      <MultiRowHorizontalList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          gap: theme.spaces.md,
        }}
        keyboardShouldPersistTaps="handled"
        columnStyle={{ width: width, gap: theme.spaces.md }}
        snapToInterval={width + theme.spaces.md}
        decelerationRate="fast"
      />
    </View>
  );
};

const SearchResultsMovies = ({ movies, search }: { movies: MovieCompact[]; search: string }) => {
  const t = useTranslations();
  return (
    <SearchResultSection<MovieCompact>
      title={upperFirst(t('common.messages.film', { count: 2 }))}
      data={movies}
      search={search}
      pathname="/search/films"
      renderItem={(item) => <CardMovie movie={item} variant="list" />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

const SearchResultsTvSeries = ({
  tvSeries,
  search,
}: {
  tvSeries: TvSeriesCompact[];
  search: string;
}) => {
  const t = useTranslations();
  return (
    <SearchResultSection<TvSeriesCompact>
      title={upperFirst(t('common.messages.tv_series', { count: 2 }))}
      data={tvSeries}
      search={search}
      pathname="/search/tv-series"
      renderItem={(item) => <CardTvSeries tvSeries={item} variant="list" />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

const SearchResultsPersons = ({
  persons,
  search,
}: {
  persons: PersonCompact[];
  search: string;
}) => {
  const t = useTranslations();
  return (
    <SearchResultSection<PersonCompact>
      title={upperFirst(t('common.messages.person', { count: 2 }))}
      data={persons}
      search={search}
      pathname="/search/persons"
      renderItem={(item) => <CardPerson person={item} variant="list" />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

const SearchResultsPlaylists = ({
  playlists,
  search,
}: {
  playlists: PlaylistWithOwner[];
  search: string;
}) => {
  const t = useTranslations();
  return (
    <SearchResultSection
      title={upperFirst(t('common.messages.playlist', { count: 2 }))}
      data={playlists}
      search={search}
      pathname="/search/playlists"
      renderItem={({ owner, ...playlist }) => (
        <CardPlaylist playlist={playlist} owner={owner} variant="list" />
      )}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

const SearchResultsUsers = ({ users, search }: { users: UserSummary[]; search: string }) => {
  const t = useTranslations();
  return (
    <SearchResultSection<UserSummary>
      title={upperFirst(t('common.messages.user', { count: 2 }))}
      data={users}
      search={search}
      pathname="/search/users"
      renderItem={(item) => <CardUser user={item} variant="list" />}
      keyExtractor={(item) => item.id!.toString()}
    />
  );
};
/* -------------------------------------------------------------------------- */

export default SearchScreen;
