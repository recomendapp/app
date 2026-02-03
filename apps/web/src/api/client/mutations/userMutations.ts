import { useSupabaseClient } from "@/context/supabase-context";
import { useUserHeartPicksMovieOptions, useUserHeartPicksTvSeriesOptions, useUserMyFeedInfiniteOptions, useUserOptions, useUserWatchlistMoviesOptions, useUserWatchlistOptions, useUserWatchlistTvSeriesOptions } from "../options/userOptions";
import { useAuth } from "@/context/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, UserRecosMovieAggregated, UserRecosTvSeriesAggregated } from "@recomendapp/types";
import { v4 } from "uuid";
import compressPicture from "@/lib/utils/compressPicture";
import { userKeys } from "../keys/userKeys";
import { useApiClient } from "@/context/api-context";
import { mediaKeys } from "../keys/mediaKeys";

export const useUserUpdateMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userOptions = useUserOptions({
		userId: session?.user.id,
	})
	return useMutation({
		mutationFn: async ({
			username,
			full_name,
			bio,
			website,
			private: isPrivate,
			language,
			avatar,
		} : Partial<Pick<Database['public']['Tables']['user']['Row'], 'username' | 'full_name' | 'bio' | 'website' | 'private' | 'language'> & { avatar: File | null }>) => {
			if (!session?.user.id) throw new Error('No user id');

			let avatar_url: string | null | undefined = avatar === null ? null : undefined;
			if (avatar) {
				const fileExt = avatar.name.split('.').pop();
				const filePath = `${session.user.id}.${v4()}.${fileExt}`;
				const avatarCompressed = await compressPicture(avatar, filePath, 400, 400);
				const { data, error } = await supabase.storage
					.from('avatars')
					.upload(filePath, avatarCompressed, {
						upsert: true
					});
				if (error) throw error;
				if (!data) throw new Error('No data returned from upload');
				const { data: { publicUrl } } = supabase.storage
					.from('avatars')
					.getPublicUrl(data.path);
				avatar_url = publicUrl;
			}


			const { data, error } = await supabase
				.from('user')
				.update({
					username,
					full_name,
					bio,
					website,
					private: isPrivate,
					language,
					avatar_url,
				})
				.eq('id', session.user.id)
				.select('*')
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userOptions.queryKey, (oldData) => {
				return {
					...oldData,
					...data,
				};
			});
		},
	})
};

/* --------------------------------- FOLLOWS -------------------------------- */
export const useUserFollowProfileInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userMyFeedOptions = useUserMyFeedInfiniteOptions();
	return useMutation({
		mutationFn: async ({
			userId,
			followeeId,
		} : {
			userId?: string;
			followeeId?: string;
		}) => {
			if (!userId || !followeeId) throw Error('Missing user id or followee id');
			const { data, error } = await supabase
				.from('user_follower')
				.insert({
					user_id: userId,
					followee_id: followeeId,
				})
				.select('*, followee:followee_id(*)')
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.followProfile({
				userId: data.user_id,
				profileId: data.followee_id,
			}), data);
			queryClient.invalidateQueries({
				queryKey: userKeys.followers({
					userId: data.followee_id,
				})
			})
			queryClient.invalidateQueries({
				queryKey: userKeys.followees({
					userId: data.user_id,
				})
			})
			queryClient.invalidateQueries({
				queryKey: userMyFeedOptions.queryKey,
			});
		},
	});
};

export const useUserUnfollowProfileDeleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userMyFeedOptions = useUserMyFeedInfiniteOptions();
	return useMutation({
		mutationFn: async ({
			userId,
			followeeId,
		} : {
			userId?: string;
			followeeId?: string;
		}) => {
			if (!userId || !followeeId) throw Error('Missing user id or followee id');
			const { data, error } = await supabase
				.from('user_follower')
				.delete()
				.eq('user_id', userId)
				.eq('followee_id', followeeId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.followProfile({
				userId: data.user_id,
				profileId: data.followee_id,
			}), null);
			queryClient.invalidateQueries({
				queryKey: userKeys.followers({
					userId: data.followee_id,
				})
			});
			queryClient.invalidateQueries({
				queryKey: userKeys.followees({
					userId: data.user_id,
				})
			});
			queryClient.invalidateQueries({
				queryKey: userMyFeedOptions.queryKey,
			});
		},
	});
};

export const useUserFollowPersonInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			personId,
			userId,
		} : {
			personId: number;
			userId: string;
		}) => {
			const { data, error } = await supabase
				.from('user_person_follower')
				.insert({
					person_id: personId,
					user_id: userId,
				})
				.select('*')
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.followPerson({
				userId: data.user_id,
				personId: data.person_id,
			}), data);
			queryClient.invalidateQueries({
				queryKey: userKeys.myFeedCastCrew(),
			});
		},
	});
};

export const useUserUnfollowPersonDeleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			personId,
			userId,
		} : {
			personId: number;
			userId: string;
		}) => {
			if (!userId || !personId) throw new Error('Invalid userId or personId');
			const { data, error } = await supabase
				.from('user_person_follower')
				.delete()
				.eq('person_id', personId)
				.eq('user_id', userId)
				.select('*')
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.followPerson({
				userId: data.user_id,
				personId: data.person_id,
			}), null);
			queryClient.invalidateQueries({
				queryKey: userKeys.myFeedCastCrew(),
			});
		},
	});
};

export const useUserAcceptFollowerRequestMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			requestId,
		} : {
			requestId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_follower')
				.update({
					is_pending: false,
				})
				.eq('id', requestId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: userKeys.followersRequests({
					userId: data.followee_id
				})
			})
			queryClient.invalidateQueries({
				queryKey: userKeys.followees({
					userId: data.user_id,
				})
			})
			queryClient.invalidateQueries({
				queryKey: userKeys.followers({
					userId: data.followee_id,
				})
			});
		},
	});
};

export const useUserDeclineFollowerRequestMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			requestId,
		} : {
			requestId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_follower')
				.delete()
				.eq('id', requestId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: userKeys.followersRequests({
					userId: data.followee_id
				})
			})
		},
	});
};
/* -------------------------------------------------------------------------- */

/* ------------------------------- ACTIVITIES ------------------------------- */
export const useUserActivityMovieInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userMyFeedOptions = useUserMyFeedInfiniteOptions();
	return useMutation({
		mutationFn: async ({
			userId,
			movieId,
			rating,
			isLiked,
		} : {
			userId: string;
			movieId: number;
			rating?: number;
			isLiked?: boolean;
		}) => {
			const { data, error } = await supabase
				.from('user_activities_movie')
				.insert({
					user_id: userId,
					movie_id: movieId,
					rating: rating,
					is_liked: isLiked,
				})
				.select(`*, review:user_reviews_movie(*)`)
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.activity({
				id: data.movie_id,
				type: 'movie',
				userId: data.user_id,
			}), data);

			// Watchlist
			queryClient.setQueryData(userKeys.watchlistItem({
				id: data.movie_id,
				type: 'movie',
				userId: data.user_id,
			}), null);

			// Heart picks
			if (data.is_liked) {
				queryClient.invalidateQueries({
					queryKey: userKeys.heartPicks({
						userId: data.user_id,
						type: 'movie',
					})
				});
			}
			queryClient.invalidateQueries({
				queryKey: userMyFeedOptions.queryKey,
			})
		}
	});
};
export const useUserActivityMovieDeleteMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userMyFeedOptions = useUserMyFeedInfiniteOptions();
	const heartPicksOptions = useUserHeartPicksMovieOptions({
		userId: session?.user.id,
	})
	return useMutation({
		mutationFn: async ({
			activityId,
		} : {
			activityId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_activities_movie')
				.delete()
				.eq('id', activityId)
				.select(`*, review:user_reviews_movie(*)`)
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.activity({
				id: data.movie_id,
				type: 'movie',
				userId: data.user_id,
			}), null);

			if (data.is_liked) {
				queryClient.setQueryData(heartPicksOptions.queryKey, (oldData) => {
					if (!oldData) return oldData;
					return oldData.filter((pick) => pick.id !== data.id);
				})
			}

			queryClient.invalidateQueries({
				queryKey: userMyFeedOptions.queryKey,
			})
		}
	});
};
export const useUserActivityMovieUpdateMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userMyFeedOptions = useUserMyFeedInfiniteOptions();
	const heartPicksOptions = useUserHeartPicksMovieOptions({
		userId: session?.user.id,
	})
	return useMutation({
		mutationFn: async ({
			activityId,
			rating,
			isLiked,
			watchedDate,
		} : {
			activityId: number;
			rating?: number | null;
			isLiked?: boolean;
			watchedDate?: Date;
		}) => {
			const { data, error } = await supabase
				.from('user_activities_movie')
				.update({
					rating: rating,
					is_liked: isLiked,
					watched_date: watchedDate?.toISOString(),
				})
				.eq('id', activityId)
				.select(`*, review:user_reviews_movie(*)`)
				.single()
			if (error) throw error;
			return {
				...data,
				isLikedChange: isLiked,
			};
		},
		onSuccess: ({ isLikedChange, ...data}) => {
			queryClient.setQueryData(userKeys.activity({
				id: data.movie_id,
				type: 'movie',
				userId: data.user_id,
			}), data);
			if (isLikedChange !== undefined) {
				if (isLikedChange) {
					queryClient.invalidateQueries({
						queryKey: userKeys.heartPicks({
							userId: data.user_id,
							type: 'movie',
						})
					})
				} else {
					queryClient.setQueryData(heartPicksOptions.queryKey, (oldData) => {
						if (!oldData) return oldData;
						return oldData.filter((pick) => pick.id !== data.id);
					});
				}
			}
			queryClient.invalidateQueries({
				queryKey: userMyFeedOptions.queryKey,
			})
		}
	});
};

export const useUserActivityTvSeriesInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userMyFeedOptions = useUserMyFeedInfiniteOptions();
	return useMutation({
		mutationFn: async ({
			userId,
			tvSeriesId,
			rating,
			isLiked,
		} : {
			userId: string;
			tvSeriesId: number;
			rating?: number;
			isLiked?: boolean;
		}) => {
			const { data, error } = await supabase
				.from('user_activities_tv_series')
				.insert({
					user_id: userId,
					tv_series_id: tvSeriesId,
					rating: rating,
					is_liked: isLiked,
				})
				.select(`*, review:user_reviews_tv_series(*)`)
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.activity({
				id: data.tv_series_id,
				type: 'tv_series',
				userId: data.user_id,
			}), data);

			// Watchlist
			queryClient.setQueryData(userKeys.watchlistItem({
				id: data.tv_series_id,
				type: 'tv_series',
				userId: data.user_id,
			}), null);

			// Heart picks
			if (data.is_liked) {
				queryClient.invalidateQueries({
					queryKey: userKeys.heartPicks({
						userId: data.user_id,
						type: 'tv_series',
					})
				});
			}

			queryClient.invalidateQueries({
				queryKey: userMyFeedOptions.queryKey,
			})
		}
	});
};
export const useUserActivityTvSeriesDeleteMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userMyFeedOptions = useUserMyFeedInfiniteOptions();
	const heartPicksOptions = useUserHeartPicksTvSeriesOptions({
		userId: session?.user.id,
	});
	return useMutation({
		mutationFn: async ({
			activityId,
		} : {
			activityId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_activities_tv_series')
				.delete()
				.eq('id', activityId)
				.select(`*, review:user_reviews_tv_series(*)`)
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.activity({
				id: data.tv_series_id,
				type: 'tv_series',
				userId: data.user_id,
			}), null);

			if (data.is_liked) {
				queryClient.setQueryData(heartPicksOptions.queryKey, (oldData) => {
					if (!oldData) return oldData;
					return oldData.filter((pick) => pick.id !== data.id);
				})
			}

			queryClient.invalidateQueries({
				queryKey: userMyFeedOptions.queryKey,
			})
		}
	});
};
export const useUserActivityTvSeriesUpdateMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userMyFeedOptions = useUserMyFeedInfiniteOptions();
	const heartPicksOptions = useUserHeartPicksTvSeriesOptions({
		userId: session?.user.id,
	});
	return useMutation({
		mutationFn: async ({
			activityId,
			rating,
			isLiked,
			watchedDate,
		} : {
			activityId: number;
			rating?: number | null;
			isLiked?: boolean;
			watchedDate?: Date;
		}) => {
			const { data, error } = await supabase
				.from('user_activities_tv_series')
				.update({
					rating: rating,
					is_liked: isLiked,
					watched_date: watchedDate?.toISOString(),
				})
				.eq('id', activityId)
				.select(`*, review:user_reviews_tv_series(*)`)
				.single()
			if (error) throw error;
			return {
				...data,
				isLikedChange: isLiked,
			};
		},
		onSuccess: ({ isLikedChange, ...data}) => {
			queryClient.setQueryData(userKeys.activity({
				id: data.tv_series_id,
				type: 'tv_series',
				userId: data.user_id,
			}), data);

			if (isLikedChange !== undefined) {
				if (isLikedChange) {
					queryClient.invalidateQueries({
						queryKey: userKeys.heartPicks({
							userId: data.user_id,
							type: 'tv_series',
						})
					});
				} else {
					queryClient.setQueryData(heartPicksOptions.queryKey, (oldData) => {
						if (!oldData) return oldData;
						return oldData.filter((pick) => pick.id !== data.id);
					});
				}
			}

			queryClient.invalidateQueries({
				queryKey: userMyFeedOptions.queryKey,
			})
		}
	});
};
/* -------------------------------------------------------------------------- */


/* --------------------------------- REVIEW --------------------------------- */
export const useUserReviewMovieUpsertMutation = ({
	movieId,
} : {
	movieId?: number;
}) => {
	const { session } = useAuth();
	const api = useApiClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			title,
			body,
		} : {
			title?: string | null;
			body: string;
		}) => {
			if (!movieId) throw new Error('Missing movieId');
			const { data, error } = await api.movies.review.upsert(
				movieId,
				{
					title: title,
					body: body,
				}
			);
			if (error || !data) throw error;
			return data;
		},
		onSuccess: (data) => {
			if (!movieId) return;
			queryClient.invalidateQueries({
				queryKey: mediaKeys.movieReviews({ movieId: movieId }),
			});

			session && queryClient.invalidateQueries({
				queryKey: userKeys.activity({ id: movieId, type: 'movie', userId: session.user.id }),
			});
		}
	});
};
export const useUserReviewMovieDeleteMutation = ({
	userId,
	movieId
}: {
	userId?: string;
	movieId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
		} : {
			id: number;
		}) => {
			const { error } = await supabase
				.from('user_reviews_movie')
				.delete()
				.eq('id', id)
			if (error) throw error;
			return {
				id,
				movieId,
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.review({ id: data.id, type: 'movie' }), null);

			queryClient.invalidateQueries({
				queryKey: mediaKeys.movieReviews({ movieId: data.movieId }),
			});

			// Invalidate the review activity
			userId && queryClient.invalidateQueries({
				queryKey: userKeys.activity({ id: data.movieId, type: 'movie', userId: userId }),
			});
		}
	});
};

export const useUserReviewMovieLikeInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
			reviewId,
		} : {
			userId: string;
			reviewId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_review_movie_likes')
				.insert({
					user_id: userId,
					review_id: reviewId,
				})
				.select('*')
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.reviewLike({ reviewId: data.review_id, type: 'movie', userId: data.user_id }), data);
		},
	});
};
export const useUserReviewMovieLikeDeleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			likeId,
		} : {
			likeId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_review_movie_likes')
				.delete()
				.eq('id', likeId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.reviewLike({ reviewId: data.review_id, type: 'movie', userId: data.user_id }), null);
		},
	});
};

export const useUserReviewTvSeriesUpsertMutation = ({
	tvSeriesId
}: {
	tvSeriesId: number;
}) => {
	const { session } = useAuth();
	const api = useApiClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			title,
			body,
		} : {
			title?: string | null;
			body: string;
		}) => {
			if (!tvSeriesId) throw new Error('Missing tvSeriesId');
			const { data, error } = await api.tvSeries.review.upsert(
				tvSeriesId,
				{
					title: title,
					body: body,
				}
			);
			if (error || !data) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: mediaKeys.tvSeriesReviews({ tvSeriesId: tvSeriesId }),
			});

			session && queryClient.invalidateQueries({
				queryKey: userKeys.activity({ id: tvSeriesId, type: 'tv_series', userId: session.user.id }),
			});
		}
	});
};
export const useUserReviewTvSeriesDeleteMutation = ({
	userId,
	tvSeriesId
}: {
	userId?: string;
	tvSeriesId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
		} : {
			id: number;
		}) => {
			const { error } = await supabase
				.from('user_reviews_tv_series')
				.delete()
				.eq('id', id)
			if (error) throw error;
			return {
				id,
				tvSeriesId,
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.review({ id: data.id, type: 'tv_series' }), null);

			queryClient.invalidateQueries({
				queryKey: mediaKeys.tvSeriesReviews({ tvSeriesId: data.tvSeriesId }),
			});

			// Invalidate the review activity
			userId && queryClient.invalidateQueries({
				queryKey: userKeys.activity({ id: data.tvSeriesId, type: 'tv_series', userId: userId }),
			});
		}
	});
};

export const useUserReviewTvSeriesLikeInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
			reviewId,
		} : {
			userId: string;
			reviewId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_review_tv_series_likes')
				.insert({
					user_id: userId,
					review_id: reviewId,
				})
				.select('*')
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.reviewLike({ reviewId: data.review_id, type: 'tv_series', userId: data.user_id }), data);
		},
	});
};
export const useUserReviewTvSeriesLikeDeleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			likeId,
		} : {
			likeId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_review_tv_series_likes')
				.delete()
				.eq('id', likeId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.reviewLike({ reviewId: data.review_id, type: 'tv_series', userId: data.user_id }), null);
		},
	});
};
/* -------------------------------------------------------------------------- */


/* -------------------------------- WATCHLIST ------------------------------- */
export const useUserWatchlistMovieInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
			movieId,
		} : {
			userId: string;
			movieId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_watchlists_movie')
				.insert({
					user_id: userId,
					movie_id: movieId,
				})
				.select()
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.watchlistItem({
				id: data.movie_id,
				type: 'movie',
				userId: data.user_id,
			}), data);

			queryClient.invalidateQueries({
				queryKey: userKeys.watchlist({
					userId: data.user_id,
					type: 'movie',
				})
			});
		}
	});
};
export const useUserWatchlistMovieDeleteMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const watchlistAllOptions = useUserWatchlistOptions({
		userId: session?.user.id,
		filters: {
			sortBy: 'created_at',
			sortOrder: 'random',
			limit: 6,
		}
	});
	const watchlistOptions = useUserWatchlistMoviesOptions({
		userId: session?.user.id,
	});
	return useMutation({
		mutationFn: async ({
			watchlistId,
		} : {
			watchlistId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_watchlists_movie')
				.delete()
				.eq('id', watchlistId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.watchlistItem({
				id: data.movie_id,
				type: 'movie',
				userId: data.user_id,
			}), null);

			// Watchlist
			queryClient.setQueryData(watchlistAllOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.filter(
					(watchlist) => watchlist?.id !== data.id
				);
			});
			queryClient.setQueryData(watchlistOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.filter(
					(watchlist) => watchlist?.id !== data.id
				);
			});
		}
	});
};
export const useUserWatchlistMovieUpdateMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const watchlistAllOptions = useUserWatchlistOptions({
		userId: session?.user.id,
		filters: {
			sortBy: 'created_at',
			sortOrder: 'random',
			limit: 6,
		}
	});
	const watchlistOptions = useUserWatchlistMoviesOptions({
		userId: session?.user.id,
	});
	return useMutation({
		mutationFn: async ({
			watchlistId,
			comment,
		} : {
			watchlistId: number;
			comment: string;
		}) => {
			const { data, error } = await supabase
				.from('user_watchlists_movie')
				.update({
					comment: comment,
				})
				.eq('id', watchlistId)
				.select()
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.watchlistItem({
				id: data.movie_id,
				type: 'movie',
				userId: data.user_id,
			}), data);

			// Watchlist
			queryClient.setQueryData(watchlistAllOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.map((item) => {
					if (item.id === data.id) {
						return {
							...item,
							...data,
						};
					}
					return item;
				});
			});
			queryClient.setQueryData(watchlistOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.map((item) => {
					if (item.id === data.id) {
						return {
							...item,
							...data,
						};
					}
					return item;
				});
			});
		}
	});
};

export const useUserWatchlistTvSeriesInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
			tvSeriesId,
		} : {
			userId: string;
			tvSeriesId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_watchlists_tv_series')
				.insert({
					user_id: userId,
					tv_series_id: tvSeriesId,
				})
				.select()
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.watchlistItem({
				id: data.tv_series_id,
				type: 'tv_series',
				userId: data.user_id,
			}), data);

			queryClient.invalidateQueries({
				queryKey: userKeys.watchlist({
					userId: data.user_id,
					type: 'tv_series',
				})
			});
		}
	});
};
export const useUserWatchlistTvSeriesDeleteMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const watchlistAllOptions = useUserWatchlistOptions({
		userId: session?.user.id,
		filters: {
			sortBy: 'created_at',
			sortOrder: 'random',
			limit: 6,
		}
	});
	const watchlistOptions = useUserWatchlistTvSeriesOptions({
		userId: session?.user.id,
	});
	return useMutation({
		mutationFn: async ({
			watchlistId,
		} : {
			watchlistId: number;
		}) => {
			const { data, error } = await supabase
				.from('user_watchlists_tv_series')
				.delete()
				.eq('id', watchlistId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.watchlistItem({
				id: data.tv_series_id,
				type: 'tv_series',
				userId: data.user_id,
			}), null);

			// Watchlist
			queryClient.setQueryData(watchlistAllOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.filter(
					(watchlist) => watchlist?.id !== data.id
				);
			});
			queryClient.setQueryData(watchlistOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.filter(
					(watchlist) => watchlist?.id !== data.id
				);
			});
		}
	});
};
export const useUserWatchlistTvSeriesUpdateMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const watchlistAllOptions = useUserWatchlistOptions({
		userId: session?.user.id,
		filters: {
			sortBy: 'created_at',
			sortOrder: 'random',
			limit: 6,
		}
	});
	const watchlistOptions = useUserWatchlistTvSeriesOptions({
		userId: session?.user.id,
	});
	return useMutation({
		mutationFn: async ({
			watchlistId,
			comment,
		} : {
			watchlistId: number;
			comment: string;
		}) => {
			const { data, error } = await supabase
				.from('user_watchlists_tv_series')
				.update({
					comment: comment,
				})
				.eq('id', watchlistId)
				.select()
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.watchlistItem({
				id: data.tv_series_id,
				type: 'tv_series',
				userId: data.user_id,
			}), data);

			// Watchlist
			queryClient.setQueryData(watchlistAllOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.map((item) => {
					if (item.id === data.id) {
						return {
							...item,
							...data,
						};
					}
					return item;
				});
			});
			queryClient.setQueryData(watchlistOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.map((item) => {
					if (item.id === data.id) {
						return {
							...item,
							...data,
						};
					}
					return item;
				});
			});
		}
	});
};
/* -------------------------------------------------------------------------- */

/* ---------------------------------- RECOS --------------------------------- */
export const useUserRecosMovieInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			senderId,
			movieId,
			receivers,
			comment,
		} : {
			senderId: string;
			movieId: number;
			receivers: Database['public']['Views']['profile']['Row'][];
			comment: string;
		}) => {
			if (receivers.length === 0) throw Error('Missing receivers');
			const { error } = await supabase
				.rpc('user_recos_movie_insert', {
					p_movie_id: movieId,
					receiver_user_ids: receivers.map((user) => String(user?.id)),
					sender_user_id: senderId,
					comment: comment,
				})
			if (error) throw error;
			return {
				senderId,
				movieId,
			}
		},
		onSuccess: ({ movieId }) => {
			queryClient.invalidateQueries({
				queryKey: userKeys.recosSend({ id: movieId, type: 'movie' }),
			});
		}
	});
};
export const useUserRecosMovieDeleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			movieId,
			userId,
		} : {
			movieId: number;
			userId: string;
		}) => {
			const { error } = await supabase
				.from('user_recos_movie')
				.update({
					status: 'deleted',
				})
				.match({
					movie_id: movieId,
					user_id: userId,
					status: 'active',
				})
			if (error) throw error;
			return {
				movieId,
				userId,
			};
		},
		onSuccess: (data) => {
			/* -------------- Delete the item in all the my recos queries -------------- */
			const recosQueries = queryClient.getQueriesData<UserRecosMovieAggregated[]>({
				predicate: (query) => {
					const key = query.queryKey
					return Array.isArray(key) && userKeys.recos({ userId: data.userId, type: 'movie' }).every((v, i) => v === key[i]);
				}
			});
			recosQueries.forEach(([key, oldData]) => {
				if (!oldData) return;
				queryClient.setQueryData(key, (currentData: UserRecosMovieAggregated[] | undefined) => {
					if (!currentData) return currentData;
					return currentData.filter(
						(reco) => reco.movie_id !== data.movieId
					);
				});
			});
			/* -------------------------------------------------------------------------- */
		}
	});
};
export const useUserRecosMovieCompleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			movieId,
			userId,
		} : {
			movieId: number;
			userId: string;
		}) => {
			const { error } = await supabase
				.from('user_recos_movie')
				.update({
					status: 'completed',
				})
				.match({
					movie_id: movieId,
					user_id: userId,
					status: 'active',
				})
				.single();
			if (error) throw error;
			return {
				movieId,
				userId,
			}
		},
		onSuccess: (data) => {
			/* -------------- Delete the item in all the my recos queries -------------- */
			const recosQueries = queryClient.getQueriesData<UserRecosMovieAggregated[]>({
				predicate: (query) => {
					const key = query.queryKey
					return Array.isArray(key) && userKeys.recos({ userId: data.userId, type: 'movie' }).every((v, i) => v === key[i]);
				}
			});

			recosQueries.forEach(([key, oldData]) => {
				if (!oldData) return;
				queryClient.setQueryData(key, (currentData: UserRecosMovieAggregated[] | undefined) => {
					if (!currentData) return currentData;
					return currentData.filter(
						(reco) => reco.movie_id !== data.movieId
					);
				});
			});
			/* -------------------------------------------------------------------------- */
		}
	});
};

export const useUserRecosTvSeriesInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			senderId,
			tvSeriesId,
			receivers,
			comment,
		} : {
			senderId: string;
			tvSeriesId: number;
			receivers: Database['public']['Views']['profile']['Row'][];
			comment: string;
		}) => {
			if (receivers.length === 0) throw Error('Missing receivers');
			const { error } = await supabase
				.rpc('user_recos_tv_series_insert', {
					p_tv_series_id: tvSeriesId,
					receiver_user_ids: receivers.map((user) => String(user?.id)),
					sender_user_id: senderId,
					comment: comment,
				})
			if (error) throw error;
			return {
				senderId,
				tvSeriesId,
			}
		},
		onSuccess: ({ tvSeriesId }) => {
			queryClient.invalidateQueries({
				queryKey: userKeys.recosSend({ id: tvSeriesId, type: 'tv_series' }),
			});
		}
	});
};
export const useUserRecosTvSeriesDeleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			tvSeriesId,
			userId,
		} : {
			tvSeriesId: number;
			userId: string;
		}) => {
			const { error } = await supabase
				.from('user_recos_tv_series')
				.update({
					status: 'deleted',
				})
				.match({
					tv_series_id: tvSeriesId,
					user_id: userId,
					status: 'active',
				})
			if (error) throw error;
			return {
				tvSeriesId,
				userId,
			};
		},
		onSuccess: (data) => {
			/* -------------- Delete the item in all the my recos queries -------------- */
			const recosQueries = queryClient.getQueriesData<UserRecosTvSeriesAggregated[]>({
				predicate: (query) => {
					const key = query.queryKey
					return Array.isArray(key) && userKeys.recos({ userId: data.userId, type: 'tv_series' }).every((v, i) => v === key[i]);
				}
			});

			recosQueries.forEach(([key, oldData]) => {
				if (!oldData) return;
				queryClient.setQueryData(key, (currentData: UserRecosTvSeriesAggregated[] | undefined) => {
					if (!currentData) return currentData;
					return currentData.filter(
						(reco) => reco.tv_series_id !== data.tvSeriesId
					);
				});
			});
			/* -------------------------------------------------------------------------- */
		}
	});
};
export const useUserRecosTvSeriesCompleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			tvSeriesId,
			userId,
		} : {
			tvSeriesId: number;
			userId: string;
		}) => {
			const { error } = await supabase
				.from('user_recos_tv_series')
				.update({
					status: 'completed',
				})
				.match({
					tv_series_id: tvSeriesId,
					user_id: userId,
					status: 'active',
				})
				.single();
			if (error) throw error;
			return {
				tvSeriesId,
				userId,
			}
		},
		onSuccess: (data) => {
			/* -------------- Delete the item in all the my recos queries -------------- */
			const recosQueries = queryClient.getQueriesData<UserRecosTvSeriesAggregated[]>({
				predicate: (query) => {
					const key = query.queryKey
					return Array.isArray(key) && userKeys.recos({ userId: data.userId, type: 'tv_series' }).every((v, i) => v === key[i]);
				}
			});

			recosQueries.forEach(([key, oldData]) => {
				if (!oldData) return;
				queryClient.setQueryData(key, (currentData: UserRecosTvSeriesAggregated[] | undefined) => {
					if (!currentData) return currentData;
					return currentData.filter(
						(reco) => reco.tv_series_id !== data.tvSeriesId
					);
				});
			});
			/* -------------------------------------------------------------------------- */
		}
	});
};
/* -------------------------------------------------------------------------- */

/* -------------------------------- PLAYLISTS ------------------------------- */
export const useUserPlaylistSavedInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
			playlistId,
		} : {
			userId: string;
			playlistId: number;
		}) => {
			const { data, error } = await supabase
				.from('playlists_saved')
				.insert({
					user_id: userId,
					playlist_id: playlistId,
				})
				.select()
				.single()
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.playlistSaved({
				userId: data.user_id,
				playlistId: data.playlist_id,
			}), data);

			queryClient.invalidateQueries({
				queryKey: userKeys.playlistsSaved({
					userId: data.user_id,
				})
			})
		}
	});
};

export const useUserPlaylistSavedDeleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			savedId,
		} : {
			savedId: number;
		}) => {
			const { data, error } = await supabase
				.from('playlists_saved')
				.delete()
				.eq('id', savedId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.playlistSaved({
				userId: data.user_id,
				playlistId: data.playlist_id,
			}), null);

			queryClient.invalidateQueries({
				queryKey: userKeys.playlistsSaved({
					userId: data.user_id,
				})
			})
		}
	});
};
/* -------------------------------------------------------------------------- */


/* --------------------------------- ACCOUNT -------------------------------- */
export const useUserDeleteRequestInsertMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
		} : {
			userId: string;
		}) => {
			const { data, error } = await supabase
				.from('user_deletion_requests')
				.insert({
					user_id: userId,
				})
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.deleteRequest({ userId: data.user_id }), data);
		}
	});
};

export const useUserDeleteRequestDeleteMutation = () => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
		} : {
			userId: string;
		}) => {
			const { data, error } = await supabase
				.from('user_deletion_requests')
				.delete()
				.eq('user_id', userId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(userKeys.deleteRequest({ userId: data.user_id }), null);
		}
	});
};
/* -------------------------------------------------------------------------- */