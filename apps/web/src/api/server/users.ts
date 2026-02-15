'use server'

import { getApi } from "@/lib/api/server";
import { SupportedLocale } from "@libs/i18n/src";
import { usersControllerGetProfile, usersMovieControllerGet } from "@packages/api-js";
import { cache } from "react";

export const getProfile = cache(async (username: string) => {
	const client = await getApi();
	const { data: user, error } = await usersControllerGetProfile({
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
	const { data, error } = await usersMovieControllerGet({
		path: {
			user_id: userId,
			movie_id: movieId,
		},
		client,
	});
	if (error) throw error;
	if (data === undefined) throw new Error('No data');
	return data;
})