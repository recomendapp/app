import { Button } from "apps/mobile/src/components/ui/Button";
import { SearchBar } from "apps/mobile/src/components/ui/searchbar";
import { View } from "apps/mobile/src/components/ui/view"
import tw from "apps/mobile/src/lib/tw";
import useSearchStore, { SearchType } from "apps/mobile/src/stores/useSearchStore";
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { Href, Stack, usePathname, useRouter } from "expo-router"
import { upperFirst } from "lodash"
import { useEffect, useMemo, useCallback, useState } from "react";
import Animated, { FadeInUp, FadeOutUp, LinearTransition, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";

type TypeItem = { value: SearchType, label: string, href: Href };

const SearchTypeButton = ({ 
	item,
	active,
	onPress 
}: { 
	item: TypeItem;
	active: boolean;
	onPress: (item: TypeItem) => void;
}) => {
	return (
		<Button
			variant={active ? "accent-yellow" : "muted"}
			style={tw`rounded-full`}
			onPress={() => onPress(item)}
		>
			{item.label}
		</Button>
	);
};
SearchTypeButton.displayName = 'SearchTypeButton';

const SearchLayout = () => {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const { search, setSearch, setIsFocused } = useSearchStore(state => state);
	const [type, setType] = useState<SearchType | null>(null);

	const types = useMemo((): TypeItem[] => [
		{ value: 'movies', label: upperFirst(t('common.messages.film', { count: 2 })), href: '/search/films' },
		{ value: 'tv_series', label: upperFirst(t('common.messages.tv_series', { count: 2 })), href: '/search/tv-series' },
		{ value: 'persons', label: upperFirst(t('common.messages.person', { count: 2 })), href: '/search/persons' },
		{ value: 'playlists', label: upperFirst(t('common.messages.playlist', { count: 2 })), href: '/search/playlists' },
		{ value: 'users', label: upperFirst(t('common.messages.user', { count: 2 })), href: '/search/users' },
	], [t]);

	useEffect(() => {
		switch (pathname) {
			case '/search/films':
				return setType('movies');
			case '/search/tv-series':
				return setType('tv_series');
			case '/search/persons':
				return setType('persons');
			case '/search/playlists':
				return setType('playlists');
			case '/search/users':
				return setType('users');
			case '/search':
				return setType(null);
			default:
				return;
		}
	}, [pathname]);

	return (
	<>
		<Stack.Screen
		options={{
			headerTitle: upperFirst(t('common.messages.search')),
			headerTransparent: false,
			headerSearchBarOptions: {
				autoCapitalize: 'none',
				placeholder: type === 'users'
					? upperFirst(t('common.messages.search_user', { count: 1 }))
					: type === 'playlists' ? upperFirst(t('common.messages.search_playlist', { count: 1 }))
					: type === 'movies' ? upperFirst(t('common.messages.search_film', { count: 1 }))
					: type === 'tv_series' ? upperFirst(t('common.messages.search_tv_series', { count: 1 }))
					: type === 'persons' ? upperFirst(t('common.messages.search_person', { count: 1 }))
					: upperFirst(t('pages.search.placeholder')),
				onChangeText: (e) => setSearch(e.nativeEvent.text),
				hideNavigationBar: true,
				hideWhenScrolling: false,
				allowToolbarIntegration: false,
				onFocus: () => setIsFocused(true),
				onBlur: () => setIsFocused(false),
			},
		}}
		/>
		<Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false, animation: 'fade' }}/>
	</>
	)
};

export default SearchLayout;