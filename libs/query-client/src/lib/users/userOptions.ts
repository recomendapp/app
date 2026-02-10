import { usersControllerGetFollowers, UsersControllerGetFollowersData, usersControllerGetFollowing, UsersControllerGetFollowingData, usersControllerGetFollowStatus, usersControllerGetMe, usersControllerGetPlaylists, UsersControllerGetPlaylistsData } from "@packages/api-js";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { userKeys } from "./userKeys";

export const userMeOptions = () => {
	return queryOptions({
		queryKey: userKeys.me(),
		queryFn: async () => {
			const { data, error } = await usersControllerGetMe();
			if (error) throw error;
			return data;
		},
	});
};

/* --------------------------------- Follows -------------------------------- */
export const userFollowersOptions = ({
	profileId,
	filters,
}: {
	profileId?: string;
	filters?: Omit<UsersControllerGetFollowersData['query'], 'page' | 'per_page'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.followers({
			userId: profileId!,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await usersControllerGetFollowers({
				path: {
					user_id: profileId,
				},
				query: {
					page: pageParam,
					...filters,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.meta.current_page < lastPage.meta.total_pages) {
				return lastPage.meta.current_page + 1;
			}
			return undefined;
		},
		enabled: !!profileId,
	})
};

export const userFollowingOptions = ({
	profileId,
	filters,
}: {
	profileId?: string;
	filters?: Omit<UsersControllerGetFollowingData['query'], 'page' | 'per_page'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.following({
			userId: profileId!,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await usersControllerGetFollowing({
				path: {
					user_id: profileId,
				},
				query: {
					page: pageParam,
					...filters,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.meta.current_page < lastPage.meta.total_pages) {
				return lastPage.meta.current_page + 1;
			}
			return undefined;
		},
		enabled: !!profileId,
	})
};

export const userFollowOptions = ({
	userId,
	profileId,
} : {
	userId?: string;
	profileId?: string;
}) => {
	return queryOptions({
		queryKey: userKeys.follow({ userId: userId!, profileId: profileId! }),
		queryFn: async () => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await usersControllerGetFollowStatus({
				path: {
					user_id: profileId,
				}
			});
			if (error) throw error;
			return data;
		},
		enabled: !!userId && !!profileId && userId !== profileId,
	});
};

/* -------------------------------- Playlists ------------------------------- */
export const userPlaylistsInfiniteOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: Omit<UsersControllerGetPlaylistsData['query'], 'page' | 'per_page'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.playlists({
			userId: userId!,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await usersControllerGetPlaylists({
				path: {
					user_id: userId,
				},
				query: {
					page: pageParam,
					...filters,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.meta.current_page < lastPage.meta.total_pages) {
				return lastPage.meta.current_page + 1;
			}
			return undefined;
		},
		enabled: !!userId,
	})
};