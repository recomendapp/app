export const playlistKeys = {
	base: ['playlist'] as const,

	details: ({
		playlistId,
	} : {
		playlistId: number;
	}) => [...playlistKeys.base, playlistId] as const,

	members: ({
		playlistId,
	} : {
		playlistId: number;
	}) => [...playlistKeys.details({ playlistId }), 'members'] as const,
	
}