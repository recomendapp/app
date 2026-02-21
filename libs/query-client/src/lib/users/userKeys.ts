import { UserFollowersControllerListData, UserMoviesControllerListData, UserPlaylistsControllerListData, UserMoviesControllerListInfiniteData, UserPlaylistsControllerListInfiniteData, UserBookmarksControllerListData, UserFollowersControllerListInfiniteData, UserBookmarksControllerListInfiniteData, UserFollowingControllerListData, UserFollowingControllerListInfiniteData } from "@packages/api-js";

export const userKeys = {
	base: ['user'] as const,

	me: () => [...userKeys.base, 'me'] as const,

	details: ({
		userId,
	} : {
		userId: string;
	}) => [...userKeys.base, userId] as const,

	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		id,
		type,
		userId,
	}: {
		id: number;
		type: 'movie' | 'tv_series';
		userId: string;
	}) => [...userKeys.details({ userId }), 'log', type, id] as const,

	/* --------------------------------- Movies --------------------------------- */
	movies: ({
		userId,
		infinite,
		filters,
	}: {
		userId: string;
	} & (
		| { infinite?: never; filters?: never }
		| { infinite: false; filters?: NonNullable<UserMoviesControllerListData['query']> }
		| { infinite: true; filters?: Omit<NonNullable<UserMoviesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(infinite !== undefined ? [infinite] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'movies', ...optionsKey] as const;
	},

	/* --------------------------------- Follows -------------------------------- */
	followers: ({
		userId,
		infinite,
		filters,
	}: {
		userId: string;
	} & (
		| { infinite?: never; filters?: never }
		| { infinite: false; filters?: NonNullable<UserFollowersControllerListData['query']> }
		| { infinite: true; filters?: Omit<NonNullable<UserFollowersControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(infinite !== undefined ? [infinite] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'followers', ...optionsKey] as const;
	},
	following: ({
		userId,
		infinite,
		filters,
	}: {
		userId: string;
	} & (
		| { infinite?: never; filters?: never }
		| { infinite: false; filters?: NonNullable<UserFollowingControllerListData['query']> }
		| { infinite: true; filters?: Omit<NonNullable<UserFollowingControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(infinite !== undefined ? [infinite] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'following', ...optionsKey] as const;
	},
	follow: ({
		userId,
		profileId,
	} : {
		userId: string;
		profileId: string;
	}) => [...userKeys.details({ userId }), 'follow', profileId] as const,

	personFollow: ({
		userId,
		personId,
	} : {
		userId: string;
		personId: number;
	}) => [...userKeys.details({ userId }), 'person_follow', personId] as const,

	/* -------------------------------- Bookmarks ------------------------------- */
	bookmarks: ({
		userId,
		infinite,
		filters,
	}: {
		userId: string;
	} & (
		| { infinite?: never; filters?: never }
		| { infinite: false; filters?: NonNullable<UserBookmarksControllerListData['query']> }
		| { infinite: true; filters?: Omit<NonNullable<UserBookmarksControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(infinite !== undefined ? [infinite] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'bookmarks', ...optionsKey] as const;
	},

	/* -------------------------------- Playlists ------------------------------- */
	playlists: ({
		userId,
		infinite,
		filters,
	}: {
		userId: string;
	} & (
		| { infinite?: never; filters?: never }
		| { infinite: false; filters?: NonNullable<UserPlaylistsControllerListData['query']> }
		| { infinite: true; filters?: Omit<NonNullable<UserPlaylistsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(infinite !== undefined ? [infinite] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'playlists', ...optionsKey] as const;
	},

	playlistLike: ({
		userId,
		playlistId,
	}: {
		userId: string;
		playlistId: number;
	}) => [...userKeys.details({ userId }), 'playlist_like', playlistId] as const,

	playlistSaved: ({
		userId,
		playlistId,
	}: {
		userId: string;
		playlistId: number;
	}) => [...userKeys.details({ userId }), 'playlist_saved', playlistId] as const,
};