export const widgetKeys = {
	base: ['widget'] as const,

	mostRecommended: ({
		filters,
	} : {
		filters: {
			sortBy: 'recommendation_count',
			sortOrder: 'asc' | 'desc',
			limit: number,
		}
	}) =>  [...widgetKeys.base, 'most-recommended', filters] as const,

	userDiscovery: ({
		filters,
	} : {
		filters: {
			sortBy: 'created_at' | 'followers_count'
			sortOrder: 'asc' | 'desc',
		}
	}) =>  [...widgetKeys.base, 'user-discovery', filters] as const,
};