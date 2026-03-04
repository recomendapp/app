import { UserFollowersControllerListPaginatedData, UserMoviesControllerListInfiniteData, UserPlaylistsControllerListInfiniteData, UserFollowersControllerListInfiniteData, UserBookmarksControllerListInfiniteData, UserFollowingControllerListPaginatedData, UserFollowingControllerListInfiniteData, MovieWatchedDatesControllerListInfiniteData, Bookmark, UserBookmarksControllerListAllData, UserBookmarksControllerListPaginatedData, UserPlaylistsControllerListPaginatedData, UserMoviesControllerListPaginatedData, MovieWatchedDatesControllerListPaginatedData, RecoTargetsControllerListPaginatedData, RecoTargetsControllerListInfiniteData, RecoTargetsControllerListAllData, UserFollowRequestsControllerListPaginatedData, UserFollowRequestsControllerListInfiniteData, UserRecosControllerListAllData, UserRecosControllerListInfiniteData, UserRecosControllerListPaginatedData } from "@packages/api-js";

export const userKeys = {
	base: ['user'] as const,

	me: () => [...userKeys.base, 'me'] as const,

	details: (
		params: { userId: string, username?: never } | { userId?: never, username: string }
	) => {
		const identifierKey = 'userId' in params ? params.userId : `@${params.username}`;
		return [...userKeys.base, identifierKey] as const;
	},
	
	profile: (
		params: { userId: string, username?: never } | { userId?: never, username: string }
	) => [...userKeys.details(params), 'profile'] as const,

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
	watchedDates: ({
		id,
		type,
		userId,
		mode,
		filters,
	}: {
		id: number;
		type: 'movie' | 'tv_series';
		userId: string;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<MovieWatchedDatesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<MovieWatchedDatesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'watchedDates', type, id, ...optionsKey] as const;
	},

	/* --------------------------------- Movies --------------------------------- */
	movies: ({
		userId,
		mode,
		filters,
	}: {
		userId: string;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<UserMoviesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<UserMoviesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'movies', ...optionsKey] as const;
	},

	/* --------------------------------- Follows -------------------------------- */
	followers: ({
		userId,
		mode,
		filters,
	}: {
		userId: string;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<UserFollowersControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<UserFollowersControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'followers', ...optionsKey] as const;
	},
	following: ({
		userId,
		mode,
		filters,
	}: {
		userId: string;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<UserFollowingControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<UserFollowingControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'following', ...optionsKey] as const;
	},
	follow: ({
		userId,
		profileId,
	} : {
		userId: string;
		profileId: string;
	}) => [...userKeys.details({ userId }), 'follow', profileId] as const,

	followRequests: ({
		userId,
		mode,
		filters,
	}: {
		userId: string;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<UserFollowRequestsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<UserFollowRequestsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'follow_requests', ...optionsKey] as const;
	},

	personFollow: ({
		userId,
		personId,
	} : {
		userId: string;
		personId: number;
	}) => [...userKeys.details({ userId }), 'person_follow', personId] as const,

	/* ---------------------------------- Recos --------------------------------- */
	recos: ({
		userId,
		mode,
		filters,
	}: {
		userId: string;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'all'; filters?: NonNullable<UserRecosControllerListAllData['query']> }
		| { mode: 'paginated'; filters?: NonNullable<UserRecosControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<UserRecosControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'recos', ...optionsKey] as const;
	},
	recoTargets: ({
		userId,
		mediaId,
		type,
		mode,
		filters,
	}: {
		userId: string;
		mediaId: number;
		type: 'movie' | 'tv_series';
	} & (
		| { mode?: never, filters?: never }
		| { mode: 'all'; filters?: NonNullable<RecoTargetsControllerListAllData['query']> }
		| { mode: 'paginated'; filters?: NonNullable<RecoTargetsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<RecoTargetsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...userKeys.details({ userId }), 'reco_targets', type, mediaId, ...optionsKey] as const;
	},

	/* -------------------------------- Bookmarks ------------------------------- */
	bookmarks: ({
        userId,
        mode,
        filters,
    }: {
        userId: string;
    } & (
        | { mode?: never; filters?: never }
        | { mode: 'all'; filters?: NonNullable<UserBookmarksControllerListAllData['query']> }
        | { mode: 'paginated'; filters?: NonNullable<UserBookmarksControllerListPaginatedData['query']> }
        | { mode: 'infinite'; filters?: Omit<NonNullable<UserBookmarksControllerListInfiniteData['query']>, 'cursor'> }
    )) => {
        const optionsKey = [
            ...(mode !== undefined ? [mode] : []), 
            ...(filters ? [filters] : [])
        ];
        
        return [...userKeys.details({ userId }), 'bookmarks', ...optionsKey] as const;
    },

	bookmark: ({
		userId,
		mediaId,
		type,
		id,
	}: {
		userId: string;
	} & (
		| { mediaId?: never; type?: never, id: Bookmark['id'] }
		| { mediaId: Bookmark['mediaId']; type: Bookmark['type']; id?: never }
	)) => {
		const optionsKey = mediaId && type ? [type, mediaId] : [id];
		return [...userKeys.details({ userId }), 'bookmark', ...optionsKey] as const;
	},

	/* -------------------------------- Playlists ------------------------------- */
	playlists: ({
		userId,
		mode,
		filters,
	}: {
		userId: string;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<UserPlaylistsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<UserPlaylistsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
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