import { useSupabaseClient } from "@/context/supabase-context";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { mediaKeys } from "../keys/mediaKeys";

export const useMediaMovieDetailsOptions = ({
	id,
} : {
	id?: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.details({
			type: 'movie',
			id: id!,
		}),
		queryFn: async () => {
			if (!id) throw new Error('No id provided');
			const { data, error } = await supabase
				.from('media_movie_full')
				.select('*')
				.eq('id', id)
				.maybeSingle();
			if (error) throw error;
			return data;
		},
		enabled: !!id,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

export const useMediaTvSeriesDetailsOptions = ({
	id,
} : {
	id?: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.details({
			type: 'tv_series',
			id: id!,
		}),
		queryFn: async () => {
			if (!id) throw new Error('No id provided');
			const { data, error } = await supabase
				.from('media_tv_series_full')
				.select('*')
				.eq('id', id)
				.maybeSingle();
			if (error) throw error;
			return data;
		},
		enabled: !!id,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

/* --------------------------------- MOVIES --------------------------------- */
export const useMediaMovieCastingOptions = ({
	movieId,
} : {
	movieId: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.movieCasting({
			movieId: movieId,
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('media_movie_casting')
				.select(`
					*,
					media_person(*)
				`)
				.eq('movie_id', movieId)
				.order('order', { ascending: true });
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
} 

export const useMediaMovieReviewsOptions = ({
	movieId,
	filters,
} : {
	movieId: number;
	filters: {
		perPage: number;
		sortBy: 'updated_at' | 'created_at';
		sortOrder: 'asc' | 'desc';
	};
}) => {
	const supabase = useSupabaseClient();
	return infiniteQueryOptions({
		queryKey: mediaKeys.movieReviews({
			movieId: movieId,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			let from = (pageParam - 1) * filters.perPage;
	  		let to = from + filters.perPage - 1;
			let request = supabase
				.from('user_reviews_movie')
				.select(`
					*,
					user_activities_movie!inner(*, profile(*))
				`)
				.eq('user_activities_movie.movie_id', movieId)
				.range(from, to)

			if (filters.sortBy && filters.sortOrder) {
				switch (filters.sortBy) {
					case 'updated_at':
						request = request.order('updated_at', { ascending: filters.sortOrder === 'asc' });
						break;
					case 'created_at':
						request = request.order('created_at', { ascending: filters.sortOrder === 'asc' });
						break;
					default:
						break;
				}
			}

			const { data, error } = await request;
			if (error) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage, pages) => {
			return lastPage?.length == filters.perPage ? pages.length + 1 : undefined;
		},
		enabled: !!movieId,
		staleTime: 1000 * 60 * 60 // 1 hour
	})
}

export const useMediaMoviePlaylistsOptions = ({
	movieId,
	filters,
} : {
	movieId: number;
	filters: {
		perPage: number;
		sortBy: 'created_at' | 'updated_at' | 'likes_count';
		sortOrder: 'asc' | 'desc';
	};
}) => {
	const supabase = useSupabaseClient();
	return infiniteQueryOptions({
		queryKey: mediaKeys.moviePlaylists({
			movieId: movieId,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			let from = (pageParam - 1) * filters.perPage;
	  		let to = from + filters.perPage - 1;
			let request = supabase
				.from('playlists')
				.select('*, user:profile(*), playlist_items_movie!inner(*)')
				.match({
					'type': 'movie',
					'playlist_items_movie.movie_id': movieId,
				})
				.range(from, to);

			if (filters.sortBy && filters.sortOrder) {
				switch (filters.sortBy) {
					case 'updated_at':
						request = request.order('updated_at', { ascending: filters.sortOrder === 'asc' });
						break;
					case 'likes_count':
						request = request.order('likes_count', { ascending: filters.sortOrder === 'asc' });
						break;
					default:
						request = request.order('created_at', { ascending: filters.sortOrder === 'asc' });
						break;
				}
			}
			const { data, error } = await request;
			if (error) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage, pages) => {
			return lastPage?.length == filters.perPage ? pages.length + 1 : undefined;
		},
		enabled: !!movieId,
		staleTime: 1000 * 60 * 60 // 1 hour
	})
}
/* -------------------------------------------------------------------------- */

/* -------------------------------- TV SERIES ------------------------------- */

export const useMediaTvSeriesSeasonsOptions = ({
	tvSeriesId,
} : {
	tvSeriesId: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.tvSeriesSeasons({
			tvSeriesId,
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('media_tv_series_seasons')
				.select('*')
				.eq('serie_id', tvSeriesId)
				.order('season_number', { ascending: true });
			if (error) throw error;
			data.sort((a, b) => {
				if (a.season_number === 0) return 1;
				if (b.season_number === 0) return -1;
				return a.season_number - b.season_number;
			});
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

export const useMediaTvSeasonEpisodesOptions = ({
	tvSeriesId,
	seasonNumber,
} : {
	tvSeriesId: number;
	seasonNumber: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.tvSeasonEpisodes({
			tvSeriesId,
			seasonNumber,
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('media_tv_series_episodes')
				.select('*')
				.eq('serie_id', tvSeriesId)
				.eq('season_number', seasonNumber)
				.order('episode_number', { ascending: true });
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

export const useMediaTvSeriesCastingOptions = ({
	tvSeriesId,
} : {
	tvSeriesId: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.tvSeriesCasting({
			tvSeriesId: tvSeriesId,
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('media_tv_series_casting')
				.select(`
					*,
					media_person(*)
				`)
				.eq('serie_id', tvSeriesId)
				.order('order', { ascending: true });
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

export const useMediaTvSeriesReviewsOptions = ({
	tvSeriesId,
	filters,
} : {
	tvSeriesId: number;
	filters: {
		perPage: number;
		sortBy: 'updated_at' | 'created_at';
		sortOrder: 'asc' | 'desc';
	};
}) => {
	const supabase = useSupabaseClient();
	return infiniteQueryOptions({
		queryKey: mediaKeys.tvSeriesReviews({
			tvSeriesId: tvSeriesId,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			let from = (pageParam - 1) * filters.perPage;
	  		let to = from + filters.perPage - 1;
			let request = supabase
				.from('user_reviews_tv_series')
				.select(`
					*,
					user_activities_tv_series!inner(*, profile(*))
				`)
				.eq('user_activities_tv_series.tv_series_id', tvSeriesId)
				.range(from, to)

			if (filters.sortBy && filters.sortOrder) {
				switch (filters.sortBy) {
					case 'updated_at':
						request = request.order('updated_at', { ascending: filters.sortOrder === 'asc' });
						break;
					case 'created_at':
						request = request.order('created_at', { ascending: filters.sortOrder === 'asc' });
						break;
					default:
						break;
				}
			}

			const { data, error } = await request;
			if (error) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage, pages) => {
			return lastPage?.length == filters.perPage ? pages.length + 1 : undefined;
		},
		enabled: !!tvSeriesId,
		staleTime: 1000 * 60 * 60 // 1 hour
	})
}

export const useMediaTvSeriesPlaylistsOptions = ({
	tvSeriesId,
	filters,
} : {
	tvSeriesId: number;
	filters: {
		perPage: number;
		sortBy: 'created_at' | 'updated_at' | 'likes_count';
		sortOrder: 'asc' | 'desc';
	};
}) => {
	const supabase = useSupabaseClient();
	return infiniteQueryOptions({
		queryKey: mediaKeys.tvSeriesPlaylists({
			tvSeriesId: tvSeriesId,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			let from = (pageParam - 1) * filters.perPage;
	  		let to = from + filters.perPage - 1;
			let request = supabase
				.from('playlists')
				.select('*, user:profile(*), playlist_items_tv_series!inner(*)')
				.match({
					'type': 'tv_series',
					'playlist_items_tv_series.tv_series_id': tvSeriesId,
				})
				.range(from, to);

			if (filters.sortBy && filters.sortOrder) {
				switch (filters.sortBy) {
					case 'updated_at':
						request = request.order('updated_at', { ascending: filters.sortOrder === 'asc' });
						break;
					case 'likes_count':
						request = request.order('likes_count', { ascending: filters.sortOrder === 'asc' });
						break;
					default:
						request = request.order('created_at', { ascending: filters.sortOrder === 'asc' });
						break;
				}
			}
			const { data, error } = await request;
			if (error) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage, pages) => {
			return lastPage?.length == filters.perPage ? pages.length + 1 : undefined;
		},
		enabled: !!tvSeriesId,
		staleTime: 1000 * 60 * 60 // 1 hour
	})
}

/* --------------------------------- PERSONS -------------------------------- */
export const useMediaPersonFilmsOptions = ({
	personId,
	filters,
} : {
	personId: number;
	filters: {
		page: number;
		perPage: number;
		sortBy: 'release_date' | 'vote_average';
		sortOrder: 'asc' | 'desc';
		department?: string;
		job?: string;
	}
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.personFilms({
			personId: personId,
			filters: filters,
		}),
		queryFn: async () => {
			let from = (filters.page - 1) * filters.perPage;
			let to = from + filters.perPage - 1;
			let request;
			if (filters.department || filters.job) {
				request = supabase
					.from('tmdb_movie_credits')
					.select(`
						*,
						media_movie!inner(*)
					`)
					.eq('person_id', personId)
					.range(from, to);
			} else {
				request = supabase
					.from('media_movie_aggregate_credits')
					.select(`
						*,
						media_movie!inner(*)
					`)
					.eq('person_id', personId)
					.range(from, to);
			}
			if (filters.sortBy && filters.sortOrder) {
				switch (filters.sortBy) {
					case 'release_date':
						request = request.order(`media_movie(release_date)`, { ascending: filters.sortOrder === 'asc' });
						break;
					case 'vote_average':
						request = request.order(`media_movie(vote_average)`, { ascending: false });
						break;
					default:
						break;
				}
			}
			if (filters.department) {
				request = request.eq('department', filters.department);
			}
			if (filters.job) {
				request = request.eq('job', filters.job);
			}
			const { data, error } = await request
				.filter('media_movie.release_date', 'not.is', null);
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

export const useMediaPersonTvSeriesOptions = ({
	personId,
	filters,
} : {
	personId: number;
	filters: {
		page: number;
		perPage: number;
		sortBy: 'last_appearance_date' | 'first_air_date' | 'vote_average';
		sortOrder: 'asc' | 'desc';
		department?: string;
		job?: string;
	}
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.personTvSeries({
			personId: personId,
			filters: filters,
		}),
		queryFn: async () => {
			let from = (filters.page - 1) * filters.perPage;
			let to = from + filters.perPage - 1;
			let request;
			if (filters.department || filters.job) {
				request = supabase
					.from('tmdb_tv_series_credits')
					.select(`
						*,
						media_tv_series!inner(*)
					`)
					.eq('person_id', personId)
					.range(from, to);
			} else {
				request = supabase
					.from('media_tv_series_aggregate_credits')
					.select(`
						*,
						media_tv_series!inner(*)
					`)
					.eq('person_id', personId)
					.range(from, to);
			}
			if (filters.sortBy && filters.sortOrder) {
				switch (filters.sortBy) {
					case 'first_air_date':
						request = request.order(`media_tv_series(first_air_date)`, { ascending: filters.sortOrder === 'asc' });
						break;
					case 'vote_average':
						request = request.order(`media_tv_series(vote_average)`, { ascending: false });
						break;
					default:
						break;
				}
			}
			if (filters.department) {
				request = request.eq('department', filters.department);
			}
			if (filters.job) {
				request = request.eq('job', filters.job);
			}
			const { data, error } = await request
				.filter('media_tv_series.first_air_date', 'not.is', null);
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}
/* -------------------------------------------------------------------------- */

/* -------------------------- FOLLOWERS AVG RATING -------------------------- */
export const useMediaMovieFollowersAvgRatingsOptions = ({
	movieId,
} : {
	movieId: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.followersAvgRatings({
			id: movieId,
			type: 'movie',
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('user_activities_movie_follower')
				.select('*, user:profile(*)')
				.eq('movie_id', movieId)
				.not('rating', 'is', null)
				.order('created_at', { ascending: false });
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 // 1 hour
	});
};
export const useMediaTvSeriesFollowersRatingOptions = ({
	tvSeriesId,
} : {
	tvSeriesId: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.followersAvgRatings({
			id: tvSeriesId,
			type: 'tv_series',
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('user_activities_tv_series_follower')
				.select('*, user:profile(*)')
				.eq('tv_series_id', tvSeriesId)
				.not('rating', 'is', null)
				.order('created_at', { ascending: false });
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 // 1 hour
	});
};

export const useMediaMovieFollowersAvgRatingOptions = ({
	movieId,
} : {
	movieId: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.followersAvgRating({
			type: 'movie',
			id: movieId,
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('user_activities_movie_follower_average_rating')
				.select('*')
				.eq('movie_id', movieId)
				.maybeSingle();
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 // 1 hour
	})
}

export const useMediaTvSeriesFollowersAvgRatingOptions = ({
	tvSeriesId,
} : {
	tvSeriesId: number;
}) => {
	const supabase = useSupabaseClient();
	return queryOptions({
		queryKey: mediaKeys.followersAvgRating({
			type: 'tv_series',
			id: tvSeriesId,
		}),
		queryFn: async () => {
			const { data, error } = await supabase
				.from('user_activities_tv_series_follower_average_rating')
				.select('*')
				.eq('tv_series_id', tvSeriesId)
				.maybeSingle();
			if (error) throw error;
			return data;
		},
		staleTime: 1000 * 60 * 60 // 1 hour
	})
}
/* -------------------------------------------------------------------------- */