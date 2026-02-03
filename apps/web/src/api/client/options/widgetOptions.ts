import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"
import { widgetKeys } from "../keys/widgetKeys"
import { useSupabaseClient } from "@/context/supabase-context";

export const useWidgetMostRecommendedOptions = ({
	filters,
} : {
	filters: {
		sortBy: 'recommendation_count',
		sortOrder: 'asc' | 'desc',
		limit: number,
	}
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: widgetKeys.mostRecommended({
			filters: filters,
		}),
		queryFn: async () => {
			let request = supabase
				.rpc('get_widget_most_recommended')
				.select('*')
				.limit(filters.limit);
			
			if (filters) {
				if (filters) {
					// switch (filters.sortBy) {
					// 	case 'recommendation_count':
					// 		request = request.order('recommendation_count', { ascending: filters.sortOrder === 'asc' });
					// 		break;
					// 	default:
					// 		break;
					// }
				}
				if (filters.limit) {
					request = request.limit(filters.limit);
				}
			}
			const { data, error } = await request;
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

export const useWidgetUserDiscoveryOptions = ({
	filters,
} : {
	filters: {
		sortBy: 'created_at' | 'followers_count'
		sortOrder: 'asc' | 'desc',
	}
}) => {
	const PER_PAGE = 20;
	const supabase = useSupabaseClient();
	return infiniteQueryOptions({
		queryKey: widgetKeys.userDiscovery({
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			const from =  (pageParam - 1) * PER_PAGE;
			const to = from + PER_PAGE - 1;
			let request = supabase
				.from('profile')
				.select('*')
				.range(from, to);
		
			if (filters) {
				if (filters.sortBy) {
					switch (filters.sortBy) {
						case 'created_at':
							request = request.order('created_at', { ascending: filters.sortOrder === 'asc' });
							break;
						case 'followers_count':
							request = request.order('followers_count', { ascending: filters.sortOrder === 'asc' });
							break;
						default:
							break;
					}
				}
			}
			const { data, error } = await request;
			if (error) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage, pages) => {
			return lastPage?.length == PER_PAGE ? pages.length + 1 : undefined;
		},
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}