'use server'

import { createServerClient } from "@/lib/supabase/server";
import { SupportedLocale } from "@/translations/locales";
import { cache } from "react";

export const getReviewMovieSeo = cache(async (id: number, lang: SupportedLocale) => {
	const supabase = await createServerClient({ locale: lang });
	const { data: review, error } = await supabase
		.from('user_reviews_movie')
		.select(`
			id,
			title,
			body,
			created_at,
			updated_at,
			user_activities_movie(
				id,
				rating,
				media_movie(
					id,
					title,
					poster_path,
					overview,
					vote_average,
					vote_count,
					slug
				),
				profile(
					username
				)
			)
		`)
		.eq('id', id)
		.single()
	if (error) throw error;
	return review;
});

export const getReviewTvSeriesSeo = cache(async (id: number, lang: SupportedLocale) => {
	const supabase = await createServerClient({ locale: lang });
	const { data: review, error } = await supabase
		.from('user_reviews_tv_series')
		.select(`
			id,
			title,
			body,
			created_at,
			updated_at,
			user_activities_tv_series(
				id,
				rating,
				media_tv_series(
					id,
					name,
					poster_path,
					overview,
					vote_average,
					vote_count,
					slug
				),
				profile(
					username
				)
			)
		`)
		.eq('id', id)
		.single()
	if (error) throw error;
	return review;
});