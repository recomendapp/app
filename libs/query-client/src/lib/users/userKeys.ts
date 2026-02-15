import { UsersControllerGetFollowersData, UsersControllerGetFollowingData, UsersControllerGetPlaylistsData } from "@packages/api-js";

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

	/* --------------------------------- Follows -------------------------------- */
	followers: ({
		userId,
		filters,
	}: {
		userId: string;
		filters?: Omit<NonNullable<UsersControllerGetFollowersData['query']>, 'page' | 'per_page'>;
	}) => filters ? [...userKeys.details({ userId }), 'followers', filters] as const : [...userKeys.details({ userId }), 'followers'] as const,
	following: ({
		userId,
		filters,
	}: {
		userId: string;
		filters?: Omit<NonNullable<UsersControllerGetFollowingData['query']>, 'page' | 'per_page'>;
	}) => filters ? [...userKeys.details({ userId }), 'following', filters] as const : [...userKeys.details({ userId }), 'following'] as const,
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

	/* -------------------------------- Playlists ------------------------------- */
	playlists: ({
		userId,
		filters,
	}: {
		userId: string;
		filters?: Omit<NonNullable<UsersControllerGetPlaylistsData['query']>, 'page' | 'per_page'>;
	}) => filters ? [...userKeys.details({ userId }), 'playlists', filters] as const : [...userKeys.details({ userId }), 'playlists'] as const,

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