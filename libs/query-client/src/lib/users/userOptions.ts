import { personsControllerGetFollowStatus, playlistsControllerGetLikeStatus, playlistsControllerGetSaveStatus, usersControllerGetFollowStatus, usersControllerGetMe, userPlaylistsControllerList, UserPlaylistsControllerListData, userMoviesControllerGet, userMoviesControllerList, UserMoviesControllerListData, userMoviesControllerListInfinite, UserMoviesControllerListInfiniteData, UserPlaylistsControllerListInfiniteData, userPlaylistsControllerListInfinite, UserBookmarksControllerListInfiniteData, userBookmarksControllerListInfinite, UserBookmarksControllerListData, userBookmarksControllerList, UserFollowersControllerListData, userFollowersControllerList, UserFollowersControllerListInfiniteData, userFollowersControllerListInfinite, UserFollowingControllerListData, userFollowingControllerList, UserFollowingControllerListInfiniteData, userFollowingControllerListInfinite } from "@packages/api-js";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { userKeys } from "./userKeys";

export const userMeOptions = () => {
	return queryOptions({
		queryKey: userKeys.me(),
		queryFn: async () => {
			const { data, error } = await usersControllerGetMe();
			if (error) throw error;
			return data;
		},
	});
};

/* ---------------------------------- Logs ---------------------------------- */
export const userMovieLogOptions = ({
	userId,
	movieId,
}: {
	userId?: string;
	movieId?: number;
}) => {
	return queryOptions({
		queryKey: userKeys.log({ userId: userId!, id: movieId!, type: 'movie' }),
		queryFn: async () => {
			if (!userId) throw new Error ('User ID is required');
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await userMoviesControllerGet({
				path: {
					user_id: userId,
					movie_id: movieId,
				},
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!movieId,
	});
};
export const userMovieLogsOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserMoviesControllerListData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.movies({ userId: userId!, infinite: false, filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userMoviesControllerList({
				path: {
					user_id: userId,
				},
				query: filters
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId,
	})
};
export const userMovieLogsInfiniteOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: Omit<NonNullable<UserMoviesControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.movies({ userId: userId!, infinite: true, filters }),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userMoviesControllerListInfinite({
				path: {
					user_id: userId,
				},
				query: {
					...filters,
					cursor: pageParam,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!userId,
	})
};


/* -------------------------------- Bookmark -------------------------------- */
export const userBookmarksOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserBookmarksControllerListData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.bookmarks({ userId: userId!, infinite: false, filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userBookmarksControllerList({
				path: {
					user_id: userId,
				},
				query: filters
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId,
	});
};
export const userBookmarksInfiniteOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: Omit<NonNullable<UserBookmarksControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.bookmarks({ userId: userId!, infinite: true, filters }),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userBookmarksControllerListInfinite({
				path: {
					user_id: userId,
				},
				query: {
					...filters,
					cursor: pageParam,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!userId,
	})
};

/* --------------------------------- Follows -------------------------------- */
export const userFollowersOptions = ({
	profileId,
	filters,
}: {
	profileId?: string;
	filters?: NonNullable<UserFollowersControllerListData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.followers({
			userId: profileId!,
			infinite: false,
			filters: filters,
		}),
		queryFn: async () => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await userFollowersControllerList({
				path: {
					user_id: profileId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!profileId,
	})
};
export const userFollowersInfiniteOptions = ({
	profileId,
	filters,
}: {
	profileId?: string;
	filters?: Omit<NonNullable<UserFollowersControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.followers({
			userId: profileId!,
			infinite: true,
			filters: filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await userFollowersControllerListInfinite({
				path: {
					user_id: profileId,
				},
				query: {
					...filters,
					cursor: pageParam,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!profileId,
	})
};

export const userFollowingOptions = ({
	profileId,
	filters,
}: {
	profileId?: string;
	filters?: NonNullable<UserFollowingControllerListData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.following({
			userId: profileId!,
			infinite: false,
			filters: filters,
		}),
		queryFn: async () => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await userFollowingControllerList({
				path: {
					user_id: profileId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!profileId,
	})
};
export const userFollowingInfiniteOptions = ({
	profileId,
	filters,
}: {
	profileId?: string;
	filters?: Omit<NonNullable<UserFollowingControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.following({
			userId: profileId!,
			infinite: true,
			filters: filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await userFollowingControllerListInfinite({
				path: {
					user_id: profileId,
				},
				query: {
					...filters,
					cursor: pageParam,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!profileId,
	})
};

export const userFollowOptions = ({
	userId,
	profileId,
} : {
	userId?: string;
	profileId?: string;
}) => {
	return queryOptions({
		queryKey: userKeys.follow({ userId: userId!, profileId: profileId! }),
		queryFn: async () => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await usersControllerGetFollowStatus({
				path: {
					user_id: profileId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!profileId && userId !== profileId,
	});
};

export const userPersonFollowOptions = ({
	userId,
	personId,
} : {
	userId?: string;
	personId?: number;
}) => {
	return queryOptions({
		queryKey: userKeys.personFollow({
			userId: userId!,
			personId: personId!,
		}),
		queryFn: async () => {
			if (!personId) throw new Error('Person ID is required');
			const { data, error } = await personsControllerGetFollowStatus({
				path: {
					person_id: personId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!personId,
	});
};

/* -------------------------------- Playlists ------------------------------- */
export const userPlaylistsOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: NonNullable<UserPlaylistsControllerListData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.playlists({ userId: userId!, infinite: false, filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userPlaylistsControllerList({
				path: {
					user_id: userId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId,
	})
};
export const userPlaylistsInfiniteOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: Omit<NonNullable<UserPlaylistsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.playlists({
			userId: userId!,
			infinite: true,
			filters: filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userPlaylistsControllerListInfinite({
				path: {
					user_id: userId,
				},
				query: {
					cursor: pageParam,
					...filters,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!userId,
	})
};

export const userPlaylistLikeOptions = ({
	userId,
	playlistId,
} : {
	userId?: string;
	playlistId?: number;
}) => {
	return queryOptions({
		queryKey: userKeys.playlistLike({
			userId: userId!,
			playlistId: playlistId!,
		}),
		queryFn: async () => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await playlistsControllerGetLikeStatus({
				path: {
					playlist_id: playlistId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!playlistId,
	});
};

export const userPlaylistSavedOptions = ({
	userId,
	playlistId,
} : {
	userId?: string;
	playlistId?: number;
}) => {
	return queryOptions({
		queryKey: userKeys.playlistSaved({
			userId: userId!,
			playlistId: playlistId!,
		}),
		queryFn: async () => {
			if (!playlistId) throw Error('Missing playlist id');
			const { data, error } = await playlistsControllerGetSaveStatus({
				path: {
					playlist_id: playlistId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!playlistId,
	});
};