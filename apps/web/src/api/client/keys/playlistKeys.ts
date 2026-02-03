export const playlistKeys = {
	base: ['playlist'] as const,

	details: ({
		playlistId,
	} : {
		playlistId: number;
	}) => [...playlistKeys.base, playlistId] as const,

	// Items
	items: ({ playlistId }: { playlistId: number }) => [...playlistKeys.details({ playlistId }), 'items'] as const,
	item: ({playlistId, itemId}: { playlistId: number, itemId: number }) => [...playlistKeys.details({ playlistId }), 'item', itemId] as const,
	
	// Guests
	guests: ({ playlistId }: { playlistId: number }) => [...playlistKeys.details({ playlistId }), 'guests'] as const,
	guestsAdd: ({
		playlistId,
		filters,
	}: {
		playlistId: number;
		filters: {
			query: string;
			exclude?: string[];
		};
	}) => [...playlistKeys.guests({ playlistId }), 'add', filters] as const,
	guest: ({ playlistId, guestId }: { playlistId: number; guestId: number; }) => [...playlistKeys.guests({ playlistId }), guestId] as const,
	
	// Permissions
	allowedToEdit: ({
		playlistId,
		userId
	} : {
		playlistId: number;
		userId: string;
	}) => [...playlistKeys.details({ playlistId }), 'allowedToEdit', userId] as const,

	// Add to
	addTo: ({
		itemId,
		type,
	} : {
		itemId: number;
		type: 'movie' | 'tv_series';
	}) => [...playlistKeys.base, 'add_to', type, itemId] as const,
	addToSource: ({
		itemId,
		type,
		source,
	} : {
		itemId: number;
		type: 'movie' | 'tv_series';
		source: 'personal' | 'shared';
	}) => [...playlistKeys.addTo({ itemId, type }), source] as const,


	featured: ({
		filters,
	} : {
		filters: {
			perPage: number;
			sortBy: 'created_at';
			sortOrder: 'asc' | 'desc';
		}
	}) => [...playlistKeys.base, 'featured', filters] as const,
}