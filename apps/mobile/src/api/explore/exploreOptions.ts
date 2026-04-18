import { queryOptions } from '@tanstack/react-query'
import { exploreKeys } from './exploreKeys';

export const exploreTileMetaOptions = ({
	supabase,
	locale,
	exploreId,
} : {
	supabase: any;
	locale: string;
	exploreId: number;
}) => {
	return queryOptions({
		queryKey: exploreKeys.tileMeta({
			exploreId: exploreId,
			locale: locale,
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('explore')
				.select('*')
				.eq('id', exploreId)
				.single();
			if (error) throw error;
			return data;
		},
	})
};

export const exploreTileOptions = ({
	supabase,
	locale,
	exploreId,
} : {
	supabase: any;
	locale: string;
	exploreId: number;
}) => {
	return queryOptions({
		queryKey: exploreKeys.tile({
			exploreId: exploreId,
			locale: locale,
		}),
		queryFn: async () => {
			const params = new URLSearchParams({ exploreId: exploreId.toString(), lang: locale });
			const { data, error } = await supabase.functions.invoke(`explore/tile?${params.toString()}`, {
				method: 'GET',
			});
			if (error) throw error;
			return data;
		},
		staleTime: Infinity,
		gcTime: Infinity,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});
};