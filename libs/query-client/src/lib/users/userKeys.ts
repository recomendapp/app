import { UsersControllerGetFollowersData, UsersControllerGetFollowingData, UsersControllerGetPlaylistsData } from "@packages/api-js";

export const userKeys = {
	base: ['user'] as const,

	me: () => [...userKeys.base, 'me'] as const,

	details: ({
		userId,
	} : {
		userId: string;
	}) => [...userKeys.base, userId] as const,

	/* --------------------------------- Follows -------------------------------- */
	followers: ({
		userId,
		filters,
	}: {
		userId: string;
		filters?: Omit<UsersControllerGetFollowersData['query'], 'page' | 'per_page'>;
	}) => filters ? [...userKeys.details({ userId }), 'followers', filters] as const : [...userKeys.details({ userId }), 'followers'] as const,
	following: ({
		userId,
		filters,
	}: {
		userId: string;
		filters?: Omit<UsersControllerGetFollowingData['query'], 'page' | 'per_page'>;
	}) => filters ? [...userKeys.details({ userId }), 'following', filters] as const : [...userKeys.details({ userId }), 'following'] as const,
	follow: ({
		userId,
		profileId,
	} : {
		userId: string;
		profileId: string;
	}) => [...userKeys.details({ userId }), 'follow', profileId] as const,

	/* -------------------------------- Playlists ------------------------------- */
	playlists: ({
		userId,
		filters,
	}: {
		userId: string;
		filters?: Omit<UsersControllerGetPlaylistsData['query'], 'page' | 'per_page'>;
	}) => filters ? [...userKeys.details({ userId }), 'playlists', filters] as const : [...userKeys.details({ userId }), 'playlists'] as const,
};