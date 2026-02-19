import { ListPlaylists, playlistsControllerCreateMutation, playlistsControllerDeleteMutation, playlistsControllerUpdateMembersMutation, playlistsControllerUpdateMutation } from "@packages/api-js";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { userPlaylistsInfiniteOptions } from "../users";
import { playlistMembersOptions, playlistOptions } from "./playlistOptions";

export const usePlaylistInsertMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerCreateMutation(),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: userPlaylistsInfiniteOptions({ userId: data.userId }).queryKey,
			})
		}
	});
};

export const usePlaylistUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerUpdateMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(playlistOptions({ playlistId: data.id }).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					...data,
				}
			});
			queryClient.setQueriesData(
				{ queryKey: userPlaylistsInfiniteOptions({ userId: data.userId }).queryKey },
				(old: InfiniteData<ListPlaylists> | undefined) => {
					if (!old || !old.pages) return old;
					return {
						...old,
						pages: old.pages.map((page) => ({
							...page,
							data: page.data.map((item) => item.id === data.id ? { ...item, ...data } : item),
						}))
					};
				}
			)
		}
	});
};

export const usePlaylistDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(playlistOptions({ playlistId: data.id }).queryKey, undefined);
			queryClient.setQueriesData(
				{ queryKey: userPlaylistsInfiniteOptions({ userId: data.userId }).queryKey },
				(old: InfiniteData<ListPlaylists> | undefined) => {
					if (!old || !old.pages) return old;
					return {
						...old,
						pages: old.pages.map((page) => ({
							...page,
							data: page.data.filter((item) => item.id !== data.id),
						}))
					};
				}
			)
		}
	});
};

// Members
export const usePlaylistMembersUpdateMutation = ({
	playlistId,
}: {
	playlistId?: number;
}) => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerUpdateMembersMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(playlistMembersOptions({ playlistId: playlistId }).queryKey, data);
		}
	});
};