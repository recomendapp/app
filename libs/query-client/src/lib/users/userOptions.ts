import { personsControllerGetFollowStatus, userMoviesControllerGet, userMoviesControllerListInfinite, UserMoviesControllerListInfiniteData, UserPlaylistsControllerListInfiniteData, userPlaylistsControllerListInfinite, UserBookmarksControllerListInfiniteData, userBookmarksControllerListInfinite, UserFollowersControllerListInfiniteData, userFollowersControllerListInfinite, UserFollowingControllerListInfiniteData, userFollowingControllerListInfinite, movieWatchedDatesControllerListInfinite, MovieWatchedDatesControllerListInfiniteData, Bookmark, bookmarksControllerGetByMedia, UserBookmarksControllerListAllData, userBookmarksControllerListAll, userBookmarksControllerListPaginated, UserBookmarksControllerListPaginatedData, UserPlaylistsControllerListPaginatedData, userPlaylistsControllerListPaginated, UserFollowersControllerListPaginatedData, UserFollowingControllerListPaginatedData, MovieWatchedDatesControllerListPaginatedData, UserMoviesControllerListPaginatedData, userMoviesControllerListPaginated, movieWatchedDatesControllerListPaginated, userFollowersControllerListPaginated, userFollowingControllerListPaginated, RecoTargetsControllerListPaginatedData, recoTargetsControllerListPaginated, recoTargetsControllerListInfinite, RecoTargetsControllerListInfiniteData, recoTargetsControllerListAll, RecoTargetsControllerListAllData, userFollowControllerGet, UserFollowRequestsControllerListPaginatedData, userFollowRequestsControllerListPaginated, UserFollowRequestsControllerListInfiniteData, userFollowRequestsControllerListInfinite, UserRecosControllerListAllData, userRecosControllerListAll, UserRecosControllerListPaginatedData, userRecosControllerListPaginated, UserRecosControllerListInfiniteData, userRecosControllerListInfinite, playlistLikesControllerGet, playlistSavesControllerGet, usersControllerGet, UserPlaylistsSavedControllerListInfiniteData, userPlaylistsSavedControllerListInfinite, userPlaylistsSavedControllerListPaginated, UserPlaylistsSavedControllerListPaginatedData, UsersControllerListPaginatedData, usersControllerListPaginated, UsersControllerListInfiniteData, usersControllerListInfinite, MePlaylistsFollowingControllerListPaginatedData, mePlaylistsFollowingControllerListPaginated, MePlaylistsFollowingControllerListInfiniteData, mePlaylistsFollowingControllerListInfinite, FeedPersonsControllerListInfiniteData, feedPersonsControllerListInfinite, FeedPersonsControllerListPaginatedData, feedPersonsControllerListPaginated, PlaylistsAddTargetsControllerListAllData, playlistsAddTargetsControllerListAll, PlaylistsAddTargetsControllerListPaginatedData, playlistsAddTargetsControllerListPaginated, PlaylistsAddTargetsControllerListInfiniteData, playlistsAddTargetsControllerListInfinite, userTvSeriesControllerGet, UserTvSeriesControllerListPaginatedData, userTvSeriesControllerListPaginated, UserTvSeriesControllerListInfiniteData, userTvSeriesControllerListInfinite, FeedControllerListPaginatedData, feedControllerListPaginated, FeedControllerListInfiniteData, feedControllerListInfinite, UserFeedControllerListPaginatedData, userFeedControllerListPaginated, UserFeedControllerListInfiniteData, userFeedControllerListInfinite } from "@libs/api-js";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { userKeys } from "./userKeys";

export const usersPaginatedOptions = ({
	filters,
} : {
	filters?: NonNullable<UsersControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.list({ mode: 'paginated', filters }),
		queryFn: async () => {
			const { data, error } = await usersControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
	});
};
export const usersInfiniteOptions = ({
	filters,
} : {
	filters?: Omit<NonNullable<UsersControllerListInfiniteData['query']>, 'cursor'>;
} = {}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.list({ mode: 'infinite', filters }),
		queryFn: async ({ pageParam }) => {
			const { data, error } = await usersControllerListInfinite({
				query: {
					...filters,
					cursor: pageParam,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
	});
};

export const userByIdOptions = ({
	userId,
}: {
	userId?: string;
}) => {
	return queryOptions({
		queryKey: userKeys.profile({ userId: userId! }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await usersControllerGet({
				path: {
					identifier: userId,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId,
	});
};
export const userByUsernameOptions = ({
	username,
}: {
	username?: string;
}) => {
	return queryOptions({
		queryKey: userKeys.profile({ username: username! }),
		queryFn: async () => {
			if (!username) throw new Error('Username is required');
			const { data, error } = await usersControllerGet({
				path: {
					identifier: `@${username}`,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!username,
	});
};

/* ---------------------------------- Logs ---------------------------------- */
// Movie
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
export const userMovieLogsPaginatedOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserMoviesControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.movies({ userId: userId!, mode: 'paginated', filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userMoviesControllerListPaginated({
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
		queryKey: userKeys.movies({ userId: userId!, mode: 'infinite', filters }),
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
// Watched dates
export const userMovieWatchedDatesPaginatedOptions = ({
	userId,
	movieId,
	filters,
}: {
	userId?: string;
	movieId?: number;
	filters?: NonNullable<MovieWatchedDatesControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.watchedDates({ userId: userId!, type: 'movie', id: movieId!, mode: 'paginated', filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await movieWatchedDatesControllerListPaginated({
				path: {
					movie_id: movieId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!movieId,
	});
};
export const userMovieWatchedDatesInfiniteOptions = ({
	userId,
	movieId,
	filters,
}: {
	userId?: string;
	movieId?: number;
	filters?: Omit<NonNullable<MovieWatchedDatesControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.watchedDates({ userId: userId!, type: 'movie', id: movieId!, mode: 'infinite', filters }),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await movieWatchedDatesControllerListInfinite({
				path: {
					movie_id: movieId,
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
		enabled: !!userId && !!movieId,
	})
};

// Tv Series
export const userTvSeriesLogOptions = ({
	userId,
	tvSeriesId,
}: {
	userId?: string;
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: userKeys.log({ userId: userId!, id: tvSeriesId!, type: 'tv_series' }),
		queryFn: async () => {
			if (!userId) throw new Error ('User ID is required');
			if (!tvSeriesId) throw new Error('Tv series ID is required');
			const { data, error } = await userTvSeriesControllerGet({
				path: {
					user_id: userId,	
					tv_series_id: tvSeriesId,
				},
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!tvSeriesId,
	});
};
export const userTvSeriesLogsPaginatedOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserTvSeriesControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.tvSeries({ userId: userId!, mode: 'paginated', filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userTvSeriesControllerListPaginated({
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
export const userTvSeriesLogsInfiniteOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: Omit<NonNullable<UserTvSeriesControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.tvSeries({ userId: userId!, mode: 'infinite', filters }),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userTvSeriesControllerListInfinite({
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
/* ---------------------------------- Recos --------------------------------- */
export const userRecoSendAllOptions = ({
	userId,
	mediaId,
	mediaType,
	filters,
}: {
	userId?: string;
	mediaId?: number;
	mediaType?: 'movie' | 'tv_series';
	filters?: NonNullable<RecoTargetsControllerListAllData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.recoTargets({
			userId: userId!,
			mediaId: mediaId!,
			type: mediaType!,
			mode: 'all',
			filters,
		}),
		queryFn: async () => {
			if (!mediaId) throw new Error('Media ID is required');
			if (!mediaType) throw new Error('Media type is required');
			const { data, error } = await recoTargetsControllerListAll({
				path: {
					media_id: mediaId,
					type: mediaType,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!mediaId && !!mediaType,
	});
};
export const userRecoSendPaginatedOptions = ({
	userId,
	mediaId,
	mediaType,
	filters,
}: {
	userId?: string;
	mediaId?: number;
	mediaType?: 'movie' | 'tv_series';
	filters?: NonNullable<RecoTargetsControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.recoTargets({
			userId: userId!,
			mediaId: mediaId!,
			type: mediaType!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!mediaId) throw new Error('Media ID is required');
			if (!mediaType) throw new Error('Media type is required');
			const { data, error } = await recoTargetsControllerListPaginated({
				path: {
					media_id: mediaId,
					type: mediaType,
				},
				query: filters
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!mediaId && !!mediaType,
	});
};
export const userRecoSendInfiniteOptions = ({
	userId,
	mediaId,
	mediaType,
	filters,
}: {
	userId?: string;
	mediaId?: number;
	mediaType?: 'movie' | 'tv_series';
	filters?: Omit<NonNullable<RecoTargetsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.recoTargets({
			userId: userId!,
			mediaId: mediaId!,
			type: mediaType!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!mediaId) throw new Error('Media ID is required');
			if (!mediaType) throw new Error('Media type is required');
			const { data, error } = await recoTargetsControllerListInfinite({
				path: {
					media_id: mediaId,
					type: mediaType,
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
		enabled: !!userId && !!mediaId && !!mediaType,
	})
};

export const userRecosAllOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserRecosControllerListAllData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.recos({ userId: userId!, mode: 'all', filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userRecosControllerListAll({
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
	});
};
export const userRecosPaginatedOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserRecosControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.recos({ userId: userId!, mode: 'paginated', filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userRecosControllerListPaginated({
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
	});
};
export const userRecosInfiniteOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: Omit<NonNullable<UserRecosControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.recos({ userId: userId!, mode: 'infinite', filters }),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userRecosControllerListInfinite({
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
export const userBookmarksAllOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserBookmarksControllerListAllData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.bookmarks({ userId: userId!, mode: 'all', filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userBookmarksControllerListAll({
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
export const userBookmarksPaginatedOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserBookmarksControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.bookmarks({ userId: userId!, mode: 'paginated', filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userBookmarksControllerListPaginated({
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
		queryKey: userKeys.bookmarks({ userId: userId!, mode: 'infinite', filters }),
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

export const userBookmarkByMediaOptions = ({
	userId,
	mediaId,
	type
} : {
	userId?: string
	mediaId?: Bookmark['mediaId'];
	type?: Bookmark['type'];
}) => {
	return queryOptions({
		queryKey: userKeys.bookmark({ userId: userId!, mediaId: mediaId!, type: type! }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			if (!mediaId) throw new Error('Media ID is required');
			if (!type) throw new Error('Bookmark type is required');
			
			const { data, error } = await bookmarksControllerGetByMedia({
				path: {
					type: type,
					media_id: mediaId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!mediaId && !!type,
	});
};

/* --------------------------------- Follows -------------------------------- */
export const userFollowersPaginatedOptions = ({
	profileId,
	filters,
}: {
	profileId?: string;
	filters?: NonNullable<UserFollowersControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.followers({
			userId: profileId!,
			mode: 'paginated',
			filters: filters,
		}),
		queryFn: async () => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await userFollowersControllerListPaginated({
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
			mode: 'infinite',
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

export const userFollowingPaginatedOptions = ({
	profileId,
	filters,
}: {
	profileId?: string;
	filters?: NonNullable<UserFollowingControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.following({
			userId: profileId!,
			mode: 'paginated',
			filters: filters,
		}),
		queryFn: async () => {
			if (!profileId) throw new Error('Profile ID is required');
			const { data, error } = await userFollowingControllerListPaginated({
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
			mode: 'infinite',
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
			const { data, error } = await userFollowControllerGet({
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

export const userFollowRequestsPaginatedOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: NonNullable<UserFollowRequestsControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.followRequests({
			userId: userId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userFollowRequestsControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId,
	})
};
export const userFollowRequestsInfiniteOptions = ({
	userId,
	filters,
}: {
	userId?: string;
	filters?: Omit<NonNullable<UserFollowRequestsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.followRequests({
			userId: userId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userFollowRequestsControllerListInfinite({
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
			return !!data;
		},
		enabled: !!userId && !!personId,
	});
};

/* -------------------------------- Playlists ------------------------------- */
export const userPlaylistsPaginatedOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: NonNullable<UserPlaylistsControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.playlists({ userId: userId!, mode: 'paginated', filters }),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userPlaylistsControllerListPaginated({
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
			mode: 'infinite',
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
			const { data, error } = await playlistLikesControllerGet({
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

export const userPlaylistsSavedPaginatedOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: NonNullable<UserPlaylistsSavedControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.playlistsSaved({
			userId: userId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userPlaylistsSavedControllerListPaginated({
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
export const userPlaylistsSavedInfiniteOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: Omit<NonNullable<UserPlaylistsSavedControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.playlistsSaved({
			userId: userId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userPlaylistsSavedControllerListInfinite({
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
			const { data, error } = await playlistSavesControllerGet({
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

export const userPlaylistsFollowingPaginatedOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: NonNullable<MePlaylistsFollowingControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.playlistsFollowing({
			userId: userId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await mePlaylistsFollowingControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId,
	})
};
export const userPlaylistsFollowingInfiniteOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: Omit<NonNullable<MePlaylistsFollowingControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.playlistsFollowing({
			userId: userId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await mePlaylistsFollowingControllerListInfinite({
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

// Add
export const userPlaylistsAddTargetsAllOptions = ({
	userId,
	type,
	mediaId,
	filters,
} : {
	userId?: string;
	type?: PlaylistsAddTargetsControllerListAllData['path']['type'];
	mediaId?: PlaylistsAddTargetsControllerListAllData['path']['media_id'];
	filters?: NonNullable<PlaylistsAddTargetsControllerListAllData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.playlistsAddTargets({
			userId: userId!,
			type: type!,
			mediaId: mediaId!,
			mode: 'all',
			filters,
		}),
		queryFn: async () => {
			if (!type) throw new Error('Media type is required');
			if (!mediaId) throw new Error('Media ID is required');
			const { data, error } = await playlistsAddTargetsControllerListAll({
				path: {
					type,
					media_id: mediaId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!type && !!mediaId,
	});
};
export const userPlaylistsAddTargetsPaginatedOptions = ({
	userId,
	type,
	mediaId,
	filters,
} : {
	userId?: string;
	type?: PlaylistsAddTargetsControllerListPaginatedData['path']['type'];
	mediaId?: PlaylistsAddTargetsControllerListPaginatedData['path']['media_id'];
	filters?: NonNullable<PlaylistsAddTargetsControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.playlistsAddTargets({
			userId: userId!,
			type: type!,
			mediaId: mediaId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!type) throw new Error('Media type is required');
			if (!mediaId) throw new Error('Media ID is required');
			const { data, error } = await playlistsAddTargetsControllerListPaginated({
				path: {
					type,
					media_id: mediaId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!type && !!mediaId,
	});
};
export const userPlaylistsAddTargetsInfiniteOptions = ({
	userId,
	type,
	mediaId,
	filters,
} : {
	userId?: string;
	type?: PlaylistsAddTargetsControllerListInfiniteData['path']['type'];
	mediaId?: PlaylistsAddTargetsControllerListInfiniteData['path']['media_id'];
	filters?: Omit<NonNullable<PlaylistsAddTargetsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.playlistsAddTargets({
			userId: userId!,
			type: type!,
			mediaId: mediaId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!type) throw new Error('Media type is required');
			if (!mediaId) throw new Error('Media ID is required');
			const { data, error } = await playlistsAddTargetsControllerListInfinite({
				path: {
					type,
					media_id: mediaId,
				},
				query: {
					...filters,
					cursor: pageParam,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!userId && !!type && !!mediaId,
	})
};

/* ---------------------------------- Feed ---------------------------------- */
export const userFeedPaginatedOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: NonNullable<UserFeedControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.feed({
			userId: userId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userFeedControllerListPaginated({
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
export const userFeedInfiniteOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: Omit<NonNullable<UserFeedControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.feed({
			userId: userId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await userFeedControllerListInfinite({
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

// Persons
export const userFeedPersonsPaginatedOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: NonNullable<FeedPersonsControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: userKeys.feedPersons({
			userId: userId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await feedPersonsControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId,
	})
};
export const userFeedPersonsInfiniteOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: Omit<NonNullable<FeedPersonsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: userKeys.feedPersons({
			userId: userId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await feedPersonsControllerListInfinite({
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