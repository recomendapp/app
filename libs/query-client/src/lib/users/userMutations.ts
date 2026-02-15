import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesLogControllerDeleteMutation, moviesLogControllerSetMutation, personsControllerFollowMutation, personsControllerUnfollowMutation, playlistsControllerLikeMutation, playlistsControllerSaveMutation, playlistsControllerUnlikeMutation, playlistsControllerUnsaveMutation, usersControllerFollowUserMutation, usersControllerUnfollowUserMutation, usersControllerUpdateMeMutation } from '@packages/api-js';
import { userFollowersOptions, userFollowingOptions, userFollowOptions, userMeOptions, userMovieLogOptions, userPersonFollowOptions, userPlaylistLikeOptions, userPlaylistSavedOptions } from './userOptions';

export const useUserMeUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...usersControllerUpdateMeMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userMeOptions().queryKey, data);
		}
	});
};

/* ---------------------------------- Logs ---------------------------------- */
export const useUserMovieLogSetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...moviesLogControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userMovieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, data);

			// TODO: remove from bookmark

			if (data.isLiked) {
				// TODO: invalidate heart picks
			}

			// TODO: invalidate feed
		}
	});
}

export const useUserMovieLogDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...moviesLogControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userMovieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, null);

			if (data.isLiked) {
				// TODO: delete items from heart picks
			}

			// TODO: invalidate feed
		}
	});
}

/* --------------------------------- Follows -------------------------------- */
export const useUserFollowMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...usersControllerFollowUserMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userFollowOptions({
				userId: data.followerId,
				profileId: data.followingId,
			}).queryKey, data);

			queryClient.invalidateQueries({
				queryKey: userFollowersOptions({
					profileId: data.followingId,
				}).queryKey,
			});

			queryClient.invalidateQueries({
				queryKey: userFollowingOptions({
					profileId: data.followerId,
				}).queryKey,
			});

			// TODO: Invalidate feed queries
		}
	});
}

export const useUserUnfollowMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...usersControllerUnfollowUserMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userFollowOptions({
				userId: data.followerId,
				profileId: data.followingId,
			}).queryKey, null);

			queryClient.invalidateQueries({
				queryKey: userFollowersOptions({
					profileId: data.followingId,
				}).queryKey,
			});

			queryClient.invalidateQueries({
				queryKey: userFollowingOptions({
					profileId: data.followerId,
				}).queryKey,
			});

			// TODO: Invalidate feed queries
		}
	});
}

export const useUserPersonFollowMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...personsControllerFollowMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userPersonFollowOptions({
				userId: data.userId,
				personId: data.personId,
			}).queryKey, data);

			// TODO: Invalidate followed persons queries
		}
	});
}

export const useUserPersonUnfollowMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...personsControllerUnfollowMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userPersonFollowOptions({
				userId: data.userId,
				personId: data.personId,
			}).queryKey, null);

			// TODO: Invalidate followed persons queries
		}
	});
}

/* -------------------------------- Playlists ------------------------------- */

// Like
export const useUserPlaylistLikeMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerLikeMutation(),
		onMutate: async ({ path: { playlist_id } }) => {
			const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
			await queryClient.cancelQueries({ queryKey: options.queryKey });
			const previous = queryClient.getQueryData(options.queryKey);
			queryClient.setQueryData(options.queryKey, true);
			return { previous };
		},
		onError: (_err, _variables, context) => {
			if (context?.previous) {
				const { path: { playlist_id } } = _variables;
				const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
				queryClient.setQueryData(options.queryKey, context.previous);
			}
		},
		onSettled: (_data, _error, variables) => {
			const { path: { playlist_id } } = variables;
			const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
			queryClient.invalidateQueries({ queryKey: options.queryKey });
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userPlaylistLikeOptions({
				userId: data.userId,
				playlistId: data.playlistId,
			}).queryKey, true);
		}
	});
}
export const useUserPlaylistUnlikeMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerUnlikeMutation(),
		onMutate: async ({ path: { playlist_id } }) => {
			const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
			await queryClient.cancelQueries({ queryKey: options.queryKey });
			const previous = queryClient.getQueryData(options.queryKey);
			queryClient.setQueryData(options.queryKey, false);
			return { previous };
		},
		onError: (_err, _variables, context) => {
			if (context?.previous) {
				const { path: { playlist_id } } = _variables;
				const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
				queryClient.setQueryData(options.queryKey, context.previous);
			}
		},
		onSettled: (_data, _error, variables) => {
			const { path: { playlist_id } } = variables;
			const options = userPlaylistLikeOptions({ userId, playlistId: playlist_id });
			queryClient.invalidateQueries({ queryKey: options.queryKey });
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userPlaylistLikeOptions({
				userId: data.userId,
				playlistId: data.playlistId,
			}).queryKey, false);
		}
	});
}

// Save
export const useUserPlaylistSaveMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerSaveMutation(),
		onMutate: async ({ path: { playlist_id } }) => {
			const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
			await queryClient.cancelQueries({ queryKey: options.queryKey });
			const previous = queryClient.getQueryData(options.queryKey);
			queryClient.setQueryData(options.queryKey, true);
			return { previous };
		},
		onError: (_err, _variables, context) => {
			if (context?.previous) {
				const { path: { playlist_id } } = _variables;
				const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
				queryClient.setQueryData(options.queryKey, context.previous);
			}
		},
		onSettled: (_data, _error, variables) => {
			const { path: { playlist_id } } = variables;
			const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
			queryClient.invalidateQueries({ queryKey: options.queryKey });
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userPlaylistSavedOptions({
				userId: data.userId,
				playlistId: data.playlistId,
			}).queryKey, true);

			// TODO: Invalidate saved playlists queries
		}
	});
}
export const useUserPlaylistUnsaveMutation = ({
	userId,
}: {
	userId?: string;
}) => {
	const queryClient = useQueryClient();
	return useMutation({
		...playlistsControllerUnsaveMutation(),
		onMutate: async ({ path: { playlist_id } }) => {
			const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
			await queryClient.cancelQueries({ queryKey: options.queryKey });
			const previous = queryClient.getQueryData(options.queryKey);
			queryClient.setQueryData(options.queryKey, false);
			return { previous };
		},
		onError: (_err, _variables, context) => {
			if (context?.previous) {
				const { path: { playlist_id } } = _variables;
				const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
				queryClient.setQueryData(options.queryKey, context.previous);
			}
		},
		onSettled: (_data, _error, variables) => {
			const { path: { playlist_id } } = variables;
			const options = userPlaylistSavedOptions({ userId, playlistId: playlist_id });
			queryClient.invalidateQueries({ queryKey: options.queryKey });
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userPlaylistSavedOptions({
				userId: data.userId,
				playlistId: data.playlistId,
			}).queryKey, false);

			// TODO: Invalidate saved playlists queries
		}
	});
}