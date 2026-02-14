'use server'

import { getApi } from "@/lib/api/server";
import { playlistsControllerGet } from "@packages/api-js/src";
import { cache } from "react";

export const getPlaylist = cache(async (id: number) => {
	const client = await getApi();
	return await playlistsControllerGet({
		path: {
			playlist_id: id,
		},
		client,
	});
});