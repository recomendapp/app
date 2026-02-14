'use server'

import { getApi } from "@/lib/api/server";
import { usersControllerGetProfile } from "@packages/api-js/src";
import { cache } from "react";

export const getProfile = cache(async (username: string) => {
	const client = await getApi();
	const { data: user, error } = await usersControllerGetProfile({
		path: {
			identifier: `@${username}`,
		},
		client,
	})
	if (error) throw error;
	return user;
});