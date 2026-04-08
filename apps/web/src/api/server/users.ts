'use server'

import { getApi } from "@/lib/api/server";
import { SupportedLocale } from "@libs/i18n/src";
import { userMoviesControllerGet, usersControllerGet, userTvSeriesControllerGet } from "@libs/api-js";
import { cache } from "react";

export const getProfile = cache(async (username: string) => {
	const client = await getApi();
	const { data: user, error } = await usersControllerGet({
		path: {
			identifier: `@${username}`,
		},
		client,
	});
	if (error) throw error;
	return user;
});

export const getUserMovie = cache(async ({
	userId,
	movieId,
	locale,
}: {
	userId: string,
	movieId: number;
	locale: SupportedLocale,
}) => {
	const client = await getApi({
		locale,
	});
	const { data, error } = await userMoviesControllerGet({
		path: {
			user_id: userId,
			movie_id: movieId,
		},
		client,
	});
	if (error) throw error;
	if (data === undefined) throw new Error('No data');
	return data;
});

export const getUserTvSeries = cache(async ({
	userId,
	tvSeriesId,
	locale,
}: {
	userId: string,
	tvSeriesId: number;
	locale: SupportedLocale,
}) => {
	const client = await getApi({
		locale,
	});
	const { data, error } = await userTvSeriesControllerGet({
		path: {
			user_id: userId,
			tv_series_id: tvSeriesId,
		},
		client,
	});
	if (error) throw error;
	if (data === undefined) throw new Error('No data');
	return data;
});