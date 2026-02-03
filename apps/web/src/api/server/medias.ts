'use server'

import { createAnonClient } from "@/lib/supabase/anon";
import { cache } from "@/lib/utils/cache";

const MEDIA_REVALIDATE_TIME = 60 * 60 * 24; // 24 hours

export const getMovie = cache(
	async (locale: string, id: number) => {
		const supabase = createAnonClient(locale);
		const { data, error } = await supabase
			.from('media_movie_full')
			.select('*')
			.eq('id', id)
			.single();
		if (error) throw error;
		return data;
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)

export const getTvSeries = cache(
	async (locale: string, id: number) => {
		const supabase = createAnonClient(locale);
		const { data, error } = await supabase
			.from('media_tv_series')
			.select('*')
			.eq('id', id)
			.single();
		if (error) throw error;
		return data;
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)

export const getTvSeason = cache(
	async (locale: string, serieId: number, seasonNumber: number) => {
		const supabase = createAnonClient(locale);
		const { data, error } = await supabase
			.from('media_tv_series_seasons')
			.select(`
				*,
				media_tv_series(
					id,
					name,
					slug
				)
			`)
			.match({
				serie_id: serieId,
				season_number: seasonNumber,
			})
			.single();
		if (error) throw error;
		return data;
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)

export const getPerson = cache(
	async (locale: string, id: number) => {
		const supabase = createAnonClient(locale);
		const { data, error } = await supabase
			.from('media_person')
			.select(`
				*,
				media_person_jobs(*)
			`)
			.eq('id', id)
			.single();
		if (error) throw error;
		return data;
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)

export const getPersonFilmsPagination = cache(
	async (
		personId: number,
		filters: {
			page: number;
			perPage: number;
			department?: string;
			job?: string;
		}
	) => {
		const supabase = createAnonClient();
		let request;
		if (filters.department || filters.job) {
			request = supabase
				.from('tmdb_movie_credits')
				.select(`person_id`, {
					count: 'exact',
					head: true,
				})
				.eq('person_id', personId);
			if (filters.department) {
				request = request.eq('department', filters.department);
			}
			if (filters.job) {
				request = request.eq('job', filters.job);
			}
		} else {
			request = supabase
				.from('media_movie_aggregate_credits')
				.select(`person_id`, {
					count: 'exact',
					head: true,
				})
				.eq('person_id', personId);
		}
		const { error, count } = await request;
		if (error) throw error;
		return {
			totalResults: count ?? 0,
			page: filters.page,
			perPage: filters.perPage,
			totalPages: count ? Math.ceil(count / filters.perPage) : 0,
		};
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)

export const getPersonTvSeriesPagination = cache(
	async (
		personId: number,
		filters: {
			page: number;
			perPage: number;
			department?: string;
			job?: string;
		}
	) => {
		const supabase = createAnonClient();
		let request = supabase
			.from('tmdb_tv_series_credits')
			.select(`person_id`, {
				count: 'exact',
				head: true,
			})
			.eq('person_id', personId);
		if (filters.department) {
			request = request.eq('department', filters.department);
		}
		if (filters.job) {
			request = request.eq('job', filters.job);
		}
		const { error, count } = await request;
		if (error) throw error;
		return {
			totalResults: count ?? 0,
			page: filters.page,
			perPage: filters.perPage,
			totalPages: count ? Math.ceil(count / filters.perPage) : 0,
		};
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)