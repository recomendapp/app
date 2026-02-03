import { useSupabaseClient } from "@/context/supabase-context"
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { playlistKeys } from "../keys/playlistKeys";
import { Database } from "@recomendapp/types";
import { useApiClient } from "@/context/api-context";

export const usePlaylistDetailsOptions = ({
	playlistId,
	initialData,
} : {
	playlistId: number;
	initialData?: Database['public']['Tables']['playlists']['Row'] & { user: Database['public']['Views']['profile']['Row'] };
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: playlistKeys.details({ playlistId: playlistId }),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('playlists')
				.select('*, user:profile(*)')
				.eq('id', playlistId)
				.maybeSingle();
			if (error) throw error;
			return data;
		},
		initialData: initialData,
	});
}

// Items
export const usePlaylistMovieItemsOptions = ({
	playlistId,
} : {
	playlistId?: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: playlistKeys.items({ playlistId: playlistId! }),
		queryFn: async () => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await supabase
				.from('playlist_items_movie')
				.select(`*, movie:media_movie(*)`)
				.eq('playlist_id', playlistId)
				.order('rank', { ascending: true })
			if (error) throw error;
			return data;
		},
		enabled: !!playlistId,
		structuralSharing: false,
	})
}
export const usePlaylistTvSeriesItemsOptions = ({
	playlistId,
} : {
	playlistId?: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: playlistKeys.items({ playlistId: playlistId! }),
		queryFn: async () => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await supabase
				.from('playlist_items_tv_series')
				.select(`*, tv_series:media_tv_series(*)`)
				.eq('playlist_id', playlistId)
				.order('rank', { ascending: true })
			if (error) throw error;
			return data;
		},
		enabled: !!playlistId,
		structuralSharing: false,
	})
}

// Guests
export const usePlaylistGuestsOptions = ({
	playlistId,
} : {
	playlistId?: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: playlistKeys.guests({ playlistId: playlistId! }),
		queryFn: async () => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await supabase
				.from('playlist_guests')
				.select('*, user:profile(*)')
				.eq('playlist_id', playlistId)
			if (error) throw error;
			return data;
		},
		enabled: !!playlistId,
		structuralSharing: false,
	})
}

export const usePlaylistGuestsAddOptions = ({
	playlistId,
	filters,
} : {
	playlistId?: number;
	filters: {
		query: string;
		exclude?: string[];
	};
}) => {
	const PER_PAGE = 20;
	const api = useApiClient();
	return infiniteQueryOptions({
		queryKey: playlistKeys.guestsAdd({
			playlistId: playlistId!,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await api.search.users({
				query: {
					q: filters.query,
					page: pageParam,
					per_page: PER_PAGE,
					exclude_ids: filters.exclude?.join(','),
				}
			});
			if (error || !data) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.current_page < lastPage.pagination.total_pages
				? lastPage.pagination.current_page + 1
				: undefined;
		},
		enabled: !!playlistId && !!filters.query && filters.query.length > 0,
	});
};

// Permissions
export const usePlaylistIsAllowedToEditOptions = ({
	playlistId,
	userId,
} : {
	playlistId: number;
	userId?: string;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: playlistKeys.allowedToEdit({
			playlistId,
			userId: userId!,
		}),
		queryFn: async () => {
			if (!userId) throw Error('Missing user id');
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await supabase
				.from('playlists')
				.select(`
					user_id,
					user:profile(premium),
					playlist_guests(user_id, edit)
				`)
				.eq('id', playlistId)
				.eq('playlist_guests.user_id', userId)
				.eq('playlist_guests.edit', true)
				.maybeSingle();
			if (error) throw error;
			return Boolean(
				data?.user_id === userId || (data?.playlist_guests.length && data.user.premium)
			)
		},
		enabled: !!playlistId && !!userId,
	});
}

// Add to
export const usePlaylistMovieAddToOptions = ({
	movieId,
	userId,
	source = 'personal',
} : {
	movieId: number;
	userId?: string;
	source: 'personal' | 'shared';
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: playlistKeys.addToSource({
			itemId: movieId,
			type: 'movie',
			source,
		}),
		queryFn: async () => {
			if (!userId) throw Error('Missing user id');
			if (!source) throw Error('Missing source');
			if (source === 'personal') { // personal
				const { data, error } = await supabase
					.from('playlists')
					.select('*, playlist_items_movie(count)')
					.match({
						'user_id': userId,
						'playlist_items_movie.movie_id': movieId,
						'type': 'movie'
					})
					.order('updated_at', { ascending: false })
				if (error) throw error;
				const output = data?.map(({ playlist_items_movie, ...playlist }) => ({
					playlist: playlist,
					already_added: playlist_items_movie[0]?.count > 0,
				}));
				return output;
			} else { // shared
				const { data, error } = await supabase
					.from('playlists_saved')
					.select(`
						id,
						playlist:playlists!inner(
							*,
							playlist_guests!inner(*),
							user:profile!inner(*),
							playlist_items_movie(count)
						)
					`)
					.match({
						'user_id': userId,
						'playlist.playlist_guests.user_id': userId,
						'playlist.playlist_guests.edit': true,
						'playlist.user.premium': true,
						'playlist.playlist_items_movie.movie_id': movieId,
						'playlist.type': 'movie'
					})
					.order('updated_at', {
						referencedTable: 'playlist',
						ascending: false 
					})
				if (error) throw error;
				const output = data?.map(({ playlist: { playlist_items_movie, playlist_guests, user, ...playlist }, ...playlists_saved }) => ({
					playlist: playlist,
					already_added: playlist_items_movie[0]?.count > 0,
				}));
				return output;
			}
		},
		enabled: !!userId,
		structuralSharing: false,
	})
}
export const usePlaylistTvSeriesAddToOptions = ({
	tvSeriesId,
	userId,
	source = 'personal',
} : {
	tvSeriesId: number;
	userId?: string;
	source: 'personal' | 'shared';
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: playlistKeys.addToSource({
			itemId: tvSeriesId,
			type: 'tv_series',
			source,
		}),
		queryFn: async () => {
			if (!userId) throw Error('Missing user id');
			if (!source) throw Error('Missing source');
			if (source === 'personal') { // personal
				const { data, error } = await supabase
					.from('playlists')
					.select('*, playlist_items_tv_series(count)')
					.match({
						'user_id': userId,
						'playlist_items_tv_series.tv_series_id': tvSeriesId,
						'type': 'tv_series'
					})
					.order('updated_at', { ascending: false })
				if (error) throw error;
				const output = data?.map(({ playlist_items_tv_series, ...playlist }) => ({
					playlist: playlist,
					already_added: playlist_items_tv_series[0]?.count > 0,
				}));
				return output;
			} else { // shared
				const { data, error } = await supabase
					.from('playlists_saved')
					.select(`
						id,
						playlist:playlists!inner(
							*,
							playlist_guests!inner(*),
							user:profile!inner(*),
							playlist_items_tv_series(count)
						)
					`)
					.match({
						'user_id': userId,
						'playlist.playlist_guests.user_id': userId,
						'playlist.playlist_guests.edit': true,
						'playlist.user.premium': true,
						'playlist.playlist_items_tv_series.tv_series_id': tvSeriesId,
						'playlist.type': 'tv_series'
					})
					.order('updated_at', {
						referencedTable: 'playlist',
						ascending: false
					})
				if (error) throw error;
				const output = data?.map(({ playlist: { playlist_items_tv_series, playlist_guests, user, ...playlist }, ...playlists_saved }) => ({
					playlist: playlist,
					already_added: playlist_items_tv_series[0]?.count > 0,
				}));
				return output;
			}
		},
		enabled: !!userId,
		structuralSharing: false,
	})
}

export const usePlaylistsFeaturedOptions = ({
	filters,
} : {
	filters: {
		perPage: number;
		sortBy: 'created_at';
		sortOrder: 'asc' | 'desc';
	}
}) => {
	const supabase = useSupabaseClient();
	return infiniteQueryOptions({
		queryKey: playlistKeys.featured({
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			let from = (pageParam - 1) * filters.perPage;
			let request = supabase
				.from('playlists_featured')
				.select('*, playlist:playlists(*, user:profile(*))')
				.range(from, from + filters.perPage - 1);

			if (filters) {
				if (filters.sortBy && filters.sortOrder) {
					switch (filters.sortBy) {
						case 'created_at':
							request = request.order('created_at', { referencedTable: 'playlist', ascending: filters.sortOrder === 'asc' });
							break;
						default:
							break;
					}
				}
			}
			const { data, error } = await request;
			if (error) throw error;
			return data.map(item => item.playlist);
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			return lastPage?.length === filters.perPage ? allPages.length + 1 : undefined;
		},
	})
}