import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'use-intl';
import { exploreTileMetaOptions, exploreTileOptions } from './exploreOptions';

export const useExploreTileMetaQuery = ({
	exploreId,
} : {
	exploreId: number;
}) => {
	const supabase = {} as any;
	const locale = useLocale();
	return useQuery(exploreTileMetaOptions({
		supabase,
		locale,
		exploreId,
	}));
};

export const useExploreTileQuery = ({
	exploreId,
} : {
	exploreId: number;
}) => {
	const supabase = {} as any;
	const locale = useLocale();
	return useQuery(exploreTileOptions({
		supabase,
		locale,
		exploreId,
	}));
};