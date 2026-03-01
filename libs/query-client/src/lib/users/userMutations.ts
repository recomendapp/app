import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarksControllerDeleteByMediaMutation, bookmarksControllerSetByMediaMutation, FollowRequest, ListInfiniteBookmarks, ListInfiniteFollowRequests, ListInfiniteRecoTargets, ListInfiniteUsers, ListPaginatedBookmarks, ListPaginatedFollowRequests, ListPaginatedRecoTargets, ListPaginatedUsers, personsControllerFollowMutation, personsControllerUnfollowMutation, playlistsControllerLikeMutation, playlistsControllerSaveMutation, playlistsControllerUnlikeMutation, playlistsControllerUnsaveMutation, recosControllerSendMutation, RecoTarget, userFollowControllerAcceptMutation, userFollowControllerDeclineMutation, userFollowControllerDeleteMutation, userFollowControllerSetMutation, userPushTokensControllerSetMutation, usersControllerUpdateMeMutation, UserSummary } from '@packages/api-js';
import { userBookmarkByMediaOptions, userFollowersInfiniteOptions, userFollowersPaginatedOptions, userFollowingInfiniteOptions, userFollowingPaginatedOptions, userFollowOptions, userFollowRequestsInfiniteOptions, userFollowRequestsPaginatedOptions, userMeOptions, userPersonFollowOptions, userPlaylistLikeOptions, userPlaylistSavedOptions, userRecoSendAllOptions, userRecoSendInfiniteOptions, userRecoSendPaginatedOptions } from './userOptions';
import { removeListItemFromAllCaches, updateListItemInAllCaches } from '../utils';
import { userKeys } from './userKeys';
import { BookmarkWithMedia } from './types';

export const useUserMeUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...usersControllerUpdateMeMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userMeOptions().queryKey, data);
		}
	});
};

export const useUserPushTokenUpdateMutation = () => {
	return useMutation({
		...userPushTokensControllerSetMutation(),		
	});
}

/* ---------------------------------- Recos --------------------------------- */
export const useUserRecoSendMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...recosControllerSendMutation(),
		onSuccess: (data) => {
			updateListItemInAllCaches<
				RecoTarget,
				ListPaginatedRecoTargets,
				ListInfiniteRecoTargets
			>(
				queryClient,
				{
					all: userRecoSendAllOptions({ userId: data.senderId, mediaId: data.mediaId, mediaType: data.type }).queryKey,
					paginated: userRecoSendPaginatedOptions({ userId: data.senderId, mediaId: data.mediaId, mediaType: data.type }).queryKey,
					infinite: userRecoSendInfiniteOptions({ userId: data.senderId, mediaId: data.mediaId, mediaType: data.type }).queryKey,
				},
				{ alreadySent: true },
				(item) => data.sent.includes(item.id)
			);
		}
	});
}

/* -------------------------------- Bookmarks ------------------------------- */
export const useUserBookmarkSetByMediaMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...bookmarksControllerSetByMediaMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userBookmarkByMediaOptions({
				userId: data.userId,
				mediaId: data.mediaId,
				type: data.type,
			}).queryKey, data);

			const isInsert = data.createdAt === data.updatedAt;
			if (isInsert) {
				queryClient.invalidateQueries({
					queryKey: userKeys.bookmarks({
						userId: data.userId,
					}),
				});
			} else {
				updateListItemInAllCaches<
                    BookmarkWithMedia,
                    ListPaginatedBookmarks,
                    ListInfiniteBookmarks
                >(
                    queryClient,
                    {
                        all: userKeys.bookmarks({ userId: data.userId, mode: 'all' }),
                        paginated: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
                        infinite: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
                    },
                    data
                );
			}
		}
	});
}

export const useUserBookmarkDeleteByMediaMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...bookmarksControllerDeleteByMediaMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userBookmarkByMediaOptions({
				userId: data.userId,
				mediaId: data.mediaId,
				type: data.type,
			}).queryKey, null);

			removeListItemFromAllCaches<
                BookmarkWithMedia,
                ListPaginatedBookmarks,
                ListInfiniteBookmarks
            >(
                queryClient,
                {
                    all: userKeys.bookmarks({ userId: data.userId, mode: 'all' }),
                    paginated: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
                    infinite: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
                },
                data.id 
            );
		}
	});
}

/* --------------------------------- Follows -------------------------------- */
export const useUserFollowMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...userFollowControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userFollowOptions({
				userId: data.followerId,
				profileId: data.followingId,
			}).queryKey, data);

			queryClient.invalidateQueries({
				queryKey: userKeys.followers({
					userId: data.followingId,
				}),
			});

			queryClient.invalidateQueries({
				queryKey: userKeys.following({
					userId: data.followerId,
				}),
			});

			// TODO: Invalidate feed queries
		}
	});
}

export const useUserUnfollowMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...userFollowControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(userFollowOptions({
				userId: data.followerId,
				profileId: data.followingId,
			}).queryKey, null);


			if (data.status === 'accepted') {
				removeListItemFromAllCaches<
					UserSummary,
					ListPaginatedUsers,
					ListInfiniteUsers
				>(
					queryClient,
					{
						paginated: userFollowingPaginatedOptions({ profileId: data.followerId }).queryKey,
						infinite: userFollowingInfiniteOptions({ profileId: data.followerId }).queryKey,
					},
					(item) => item.id === data.followingId
				);
				removeListItemFromAllCaches<
					UserSummary,
					ListPaginatedUsers,
					ListInfiniteUsers
				>(
					queryClient,
					{
						paginated: userFollowersPaginatedOptions({ profileId: data.followingId }).queryKey,
						infinite: userFollowersInfiniteOptions({ profileId: data.followingId }).queryKey,
					},
					(item) => item.id === data.followerId
				);
			}

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

export const useUserAcceptFollowMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...userFollowControllerAcceptMutation(),
		onSuccess: (data) => {
			removeListItemFromAllCaches<
				FollowRequest,
				ListPaginatedFollowRequests,
				ListInfiniteFollowRequests
			>(
				queryClient,
				{
					paginated: userFollowRequestsPaginatedOptions({ userId: data.followingId }).queryKey,
					infinite: userFollowRequestsInfiniteOptions({ userId: data.followingId }).queryKey,
				},
				(item) => item.user.id === data.followerId
			);

			queryClient.invalidateQueries({
				queryKey: userKeys.followers({
					userId: data.followingId,
				}),
			});

			queryClient.invalidateQueries({
				queryKey: userKeys.following({
					userId: data.followerId,
				}),
			});
		}
	});
}

export const useUserDeclineFollowMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...userFollowControllerDeclineMutation(),
		onSuccess: (data) => {
			// TODO: invalidate follow requests
			removeListItemFromAllCaches<
				FollowRequest,
				ListPaginatedFollowRequests,
				ListInfiniteFollowRequests
			>(
				queryClient,
				{
					paginated: userFollowRequestsPaginatedOptions({ userId: data.followingId }).queryKey,
					infinite: userFollowRequestsInfiniteOptions({ userId: data.followingId }).queryKey,
				},
				(item) => item.user.id === data.followerId
			);
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
		onSuccess: (data) => {
			queryClient.setQueryData(userPlaylistSavedOptions({
				userId: data.userId,
				playlistId: data.playlistId,
			}).queryKey, false);

			// TODO: Invalidate saved playlists queries
		}
	});
}