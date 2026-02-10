import { queryOptions } from "@tanstack/react-query"
import { playlistKeys } from "./playlistKeys"
import { playlistsControllerGet, playlistsControllerGetMembers } from "@packages/api-js";

export const playlistOptions = ({
	playlistId,
}: {
	playlistId?: number;
}) => {
	return queryOptions({
		queryKey: playlistKeys.details({
			playlistId: playlistId!,
		}),
		queryFn: async () => {
			if (!playlistId) throw new Error('Playlist ID is required');
			const { data, error } = await playlistsControllerGet({
				path: {
					playlist_id: playlistId,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!playlistId,
	});
};

export const playlistMembersOptions = ({
	playlistId
}: {
	playlistId?: number
}) => {
	return queryOptions({
		queryKey: playlistKeys.members({
			playlistId: playlistId!,
		}),
		queryFn: async () => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await playlistsControllerGetMembers({
				path: {
					playlist_id: playlistId,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!playlistId,
	});
};
