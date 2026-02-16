'use server'

import { getAnonApi } from "@/lib/api/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { cache } from "@/lib/utils/cache";
import { SupportedLocale } from "@libs/i18n";
import { moviesControllerGet, personsControllerGet, tvSeasonsControllerGet, tvSeriesControllerGet } from "@packages/api-js";

const MEDIA_REVALIDATE_TIME = 60 * 60 * 24; // 24 hours

export const getMovie = cache(
	async (locale: SupportedLocale, id: number) => {
		const client = await getAnonApi({
			locale,
		});
		return await moviesControllerGet({
			path: {
				movie_id: id
			},
			client,
		});
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)

export const getTvSeries = cache(
	async (locale: SupportedLocale, id: number) => {
		const client = await getAnonApi({
			locale,
		});
		return await tvSeriesControllerGet({
			path: {
				tv_series_id: id
			},
			client,
		});
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)

export const getTvSeason = cache(
	async (locale: SupportedLocale, serieId: number, seasonNumber: number) => {
		const client = await getAnonApi({
			locale,
		});
		return await tvSeasonsControllerGet({
			path: {
				tv_series_id: serieId,
				season_number: seasonNumber,
			},
			client,
		});
	}, {
		revalidate: MEDIA_REVALIDATE_TIME,
	}
)

export const getPerson = cache(
	async (locale: SupportedLocale, id: number) => {
		const client = await getAnonApi({
			locale,
		});
		return await personsControllerGet({
			path: {
				person_id: id
			},
			client,
		});
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