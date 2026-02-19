type ReviewType = 'movie' | 'tv-series';

export const reviewKeys = {
	base: ['review'] as const,

	details: ({
		id,
		type,
	}: {
		id: number;
		type: ReviewType;
	}) => [...reviewKeys.base, type, id] as const,

	/* ---------------------------------- Likes --------------------------------- */
	like: ({
		id,
		type,
	}: {
		id: number;
		type: ReviewType;
	}) => [...reviewKeys.details({ id, type }), 'like'] as const,
};