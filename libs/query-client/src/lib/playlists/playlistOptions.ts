import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"
import { playlistKeys } from "./playlistKeys"
import { playlistItemsControllerListAll, PlaylistItemsControllerListAllData, playlistItemsControllerListInfinite, PlaylistItemsControllerListInfiniteData, playlistItemsControllerListPaginated, PlaylistItemsControllerListPaginatedData, playlistMembersControllerListAll, PlaylistMembersControllerListAllData, playlistMembersControllerListInfinite, PlaylistMembersControllerListInfiniteData, playlistMembersControllerListPaginated, PlaylistMembersControllerListPaginatedData, playlistsControllerGet } from "@packages/api-js";

export const playlistOptions = ({
	playlistId,
}: {
	playlistId?: number;
}) => {
	return queryOptions({
		queryKey: playlistKeys.details({
			playlistId: playlistId!,
		}),
		queryFn: async () => {
			if (!playlistId) throw new Error('Playlist ID is required');
			const { data, error } = await playlistsControllerGet({
				path: {
					playlist_id: playlistId,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!playlistId,
	});
};

// Items
export const playlistItemsAllOptions = ({
	playlistId,
} : {
	playlistId?: number;
}) => {
	return queryOptions({
		queryKey: playlistKeys.items({
			playlistId: playlistId!,
			mode: 'all',
		}),
		queryFn: async () => {
			if (!playlistId) throw new Error('Playlist ID is required');
			const { data, error } = await playlistItemsControllerListAll({
				path: {
					playlist_id: playlistId,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!playlistId,
	});
};
export const playlistItemsPaginatedOptions = ({
	playlistId,
	filters,
} : {
	playlistId?: number;
	filters?: NonNullable<PlaylistItemsControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: playlistKeys.items({
			playlistId: playlistId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!playlistId) throw new Error('Playlist ID is required');
			const { data, error } = await playlistItemsControllerListPaginated({
				path: {
					playlist_id: playlistId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!playlistId,
	});
};
export const playlistItemsInfiniteOptions = ({
	playlistId,
	filters,
} : {
	playlistId?: number;
	filters?: Omit<NonNullable<PlaylistItemsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: playlistKeys.items({
			playlistId: playlistId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!playlistId) throw new Error('Playlist ID is required');
			const { data, error } = await playlistItemsControllerListInfinite({
				path: {
					playlist_id: playlistId,
				},
				query: {
					...filters,
					cursor: pageParam,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!playlistId,
	});
};

// Members
export const playlistMembersAllOptions = ({
	playlistId,
	filters,
}: {
	playlistId?: number;
	filters?: NonNullable<PlaylistMembersControllerListAllData['query']>;
}) => {
	return queryOptions({
		queryKey: playlistKeys.members({
			playlistId: playlistId!,
			mode: 'all',
			filters,
		}),
		queryFn: async () => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await playlistMembersControllerListAll({
				path: {
					playlist_id: playlistId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!playlistId,
	});
};
export const playlistMembersPaginatedOptions = ({
	playlistId,
	filters,
}: {
	playlistId?: number;
	filters?: NonNullable<PlaylistMembersControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: playlistKeys.members({
			playlistId: playlistId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await playlistMembersControllerListPaginated({
				path: {
					playlist_id: playlistId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!playlistId,
	});
};
export const playlistMembersInfiniteOptions = ({
	playlistId,
	filters,
}: {
	playlistId?: number;
	filters?: Omit<NonNullable<PlaylistMembersControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: playlistKeys.members({
			playlistId: playlistId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await playlistMembersControllerListInfinite({
				path: {
					playlist_id: playlistId,
				},
				query: {
					...filters,
					cursor: pageParam,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!playlistId,
	});
};
