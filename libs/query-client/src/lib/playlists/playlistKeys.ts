import { PlaylistItemsControllerListAllData, PlaylistItemsControllerListInfiniteData, PlaylistItemsControllerListPaginatedData, PlaylistMembersControllerListAllData, PlaylistMembersControllerListInfiniteData, PlaylistMembersControllerListPaginatedData } from "@packages/api-js";

export const playlistKeys = {
	base: ['playlist'] as const,

	details: ({
		playlistId,
	} : {
		playlistId: number;
	}) => [...playlistKeys.base, playlistId] as const,

	items: ({
		playlistId,
		mode,
		filters,
	} : {
		playlistId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'all'; filters?: NonNullable<PlaylistItemsControllerListAllData['query']> }
		| { mode: 'paginated'; filters?: NonNullable<PlaylistItemsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<PlaylistItemsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...playlistKeys.details({ playlistId }), 'items', ...optionsKey] as const;
	},

	members: ({
		playlistId,
		mode,
		filters,
	}: {
		playlistId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'all'; filters?: NonNullable<PlaylistMembersControllerListAllData['query']> }
		| { mode: 'paginated'; filters?: NonNullable<PlaylistMembersControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<PlaylistMembersControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...playlistKeys.details({ playlistId }), 'members', ...optionsKey] as const;
	},
}