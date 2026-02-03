import { useSupabaseClient } from '@/context/supabase-context';
import { Database, Playlist, PlaylistItemMovie, PlaylistItemTvSeries } from '@recomendapp/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserPlaylistsInfiniteOptions } from '../options/userOptions';
import { useAuth } from '@/context/auth-context';
import { mediaKeys } from '../keys/mediaKeys';
import { playlistKeys } from '../keys/playlistKeys';
import { usePlaylistDetailsOptions, usePlaylistGuestsOptions, usePlaylistMovieItemsOptions, usePlaylistTvSeriesItemsOptions } from '../options/playlistOptions';
import { v4 } from 'uuid';
import compressPicture from '@/lib/utils/compressPicture';

export const usePlaylistInsertMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userPlaylistsOptions = useUserPlaylistsInfiniteOptions({
		userId: session?.user.id,
		filters: {
			sortBy: 'updated_at',
			sortOrder: 'desc',
		}
	});
	return useMutation({
		mutationFn: async ({
			title,
			type,
			description,
			private: isPrivate,
			poster,
		} : Pick<Database['public']['Tables']['playlists']['Insert'], 'title' | 'type' | 'description' | 'private'> & { poster?: File | null }) => {
			if (!session) throw Error('No session found');

			let poster_url: string | null | undefined = poster === null ? null : undefined;
			const { data, error } = await supabase
				.from('playlists')
				.insert({
					title,
					type,
					description,
					private: isPrivate,
					poster_url,
					user_id: session.user.id,
				})
				.select('*, user:profile(*)')
				.single();
			if (error) throw error;

			if (poster) {
				const fileExt = poster.name.split('.').pop();
				const filePath = `${data.id}.${v4()}.${fileExt}`;
				const posterCompressed = await compressPicture(poster, filePath, 400, 400);
				const { data: uploadData, error: uploadError } = await supabase.storage
					.from('playlist_posters')
					.upload(filePath, posterCompressed, {
						upsert: true
					});
				if (uploadError) throw uploadError;
				if (!uploadData) throw new Error('No data returned from upload');
				const { data: { publicUrl } } = supabase.storage
					.from('playlist_posters')
					.getPublicUrl(uploadData.path);
				poster_url = publicUrl;

				const { error: updateError } = await supabase
					.from('playlists')
					.update({ poster_url })
					.eq('id', data.id);
				if (updateError) throw updateError;
			}

			return {
				...data,
				poster_url: poster_url ?? data.poster_url,
			};
		},
		onSuccess: (data) => {
			queryClient.setQueryData(playlistKeys.details({ playlistId: data.id }), data);
			queryClient.invalidateQueries({
				queryKey: userPlaylistsOptions.queryKey
			});
		}
	});
};

export const usePlaylistUpdateMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userPlaylistsOptions = useUserPlaylistsInfiniteOptions({
		userId: session?.user.id,
		filters: {
			sortBy: 'updated_at',
			sortOrder: 'desc',
		}
	});
	return useMutation({
		mutationFn: async ({
			id,
			title,
			description,
			private: isPrivate,
			poster,
		} : Partial<Pick<Database['public']['Tables']['playlists']['Row'], 'title' | 'description' | 'private'> & { poster: File | null }> & { id: number }) => {
			let poster_url: string | null | undefined = poster === null ? null : undefined;
			if (poster) {
				const fileExt = poster.name.split('.').pop();
				const filePath = `${id}.${v4()}.${fileExt}`;
				const posterCompressed = await compressPicture(poster, filePath, 400, 400);
				const { data: uploadData, error: uploadError } = await supabase.storage
					.from('playlist_posters')
					.upload(filePath, posterCompressed, {
						upsert: true
					});
				if (uploadError) throw uploadError;
				if (!uploadData) throw new Error('No data returned from upload');
				const { data: { publicUrl } } = supabase.storage
					.from('playlist_posters')
					.getPublicUrl(uploadData.path);
				poster_url = publicUrl;
			}
			const { data, error } = await supabase
				.from('playlists')
				.update({
					title,
					description,
					private: isPrivate,
					poster_url,
				})
				.eq('id', id)
				.select('*, user:profile(*)')
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(playlistKeys.details({ playlistId: data.id }), data);
			queryClient.invalidateQueries({
				queryKey: userPlaylistsOptions.queryKey
			});
		}
	});
};

export const usePlaylistDeleteMutation = () => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const userPlaylistsOptions = useUserPlaylistsInfiniteOptions({
		userId: session?.user.id,
		filters: {
			sortBy: 'updated_at',
			sortOrder: 'desc',
		}
	});
	return useMutation({
		mutationFn: async ({
			playlistId,
			userId,
		} : {
			playlistId: number;
			userId?: string;
		}) => {
			if (!userId) throw Error('User id is missing');
			const { data, error } = await supabase
				.from('playlists')
				.delete()
				.eq('id', playlistId)
				.select()
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(playlistKeys.details({ playlistId: data.id }), null);
			queryClient.invalidateQueries({
				queryKey: userPlaylistsOptions.queryKey
			});
		}
	});
};

// Realtime
export const usePlaylistItemsMovieRealtimeMutation = ({
	playlistId
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const options = usePlaylistMovieItemsOptions({ playlistId });
	return useMutation({
		mutationFn: async ({
			event,
			payload,
		} : {
			event: string;
			payload: {
				old: PlaylistItemMovie;
				new: PlaylistItemMovie;
			}
		}) => {
			const newPlaylistItems = [...queryClient.getQueryData(options.queryKey) || []];
			if (!newPlaylistItems.length) throw new Error('playlist items is undefined');
			switch (event) {
				case 'INSERT':
					if (payload.new.playlist_id !== playlistId) throw new Error('Invalid playlist id');
					const { error: insertError, data: insertData } = await supabase
						.from('playlist_items_movie')
						.select(`*, movie:media_movie(*)`)
						.eq('id', payload.new.id)
						.single();
					if (insertError) throw insertError;
					newPlaylistItems.forEach(item => {
						if (item.rank >= payload.new.rank) {
							item.rank++;
						}
					});
					newPlaylistItems.push({
						...payload.new,
						movie: insertData.movie
					});
					break;
				case 'UPDATE':
					if (!payload.new.playlist_id) throw new Error('Invalid playlist id');
					const itemIndex = newPlaylistItems.findIndex((item) => item.id === payload.new.id);
					if (itemIndex === -1) throw new Error('Missing item');

					if (payload.old.rank !== payload.new.rank) {
						if (payload.old.rank < payload.new.rank) {
							newPlaylistItems.forEach(item => {
							if (item.rank > payload.old.rank && item.rank <= payload.new.rank) {
								item.rank--;
							}
							});
						}
						if (payload.old.rank > payload.new.rank) {
							newPlaylistItems.forEach(item => {
							if (item.rank < payload.old.rank && item.rank >= payload.new.rank) {
								item.rank++;
							}
							});
						}
					}
					newPlaylistItems[itemIndex] = {
						...newPlaylistItems[itemIndex],
						...payload.new
					};
					break;
				case 'DELETE':
					if (!payload.old.playlist_id) throw new Error('Invalid playlist id');
					const deleteIndex = newPlaylistItems.findIndex((item) => item.id === payload.old.id);
					if (deleteIndex === -1) throw new Error('Missing item');
					newPlaylistItems.splice(deleteIndex, 1);

					newPlaylistItems.forEach(item => {
						if (item.rank > payload.old.rank) {
							item.rank--;
						}
					});
					break;
				default:
					break;
			};
			newPlaylistItems.sort((a, b) => a.rank - b.rank);
			return newPlaylistItems;
		},
		onSuccess: (newPlaylistItems) => {
			newPlaylistItems && queryClient.setQueryData(options.queryKey, newPlaylistItems);
		},
		onError: (error) => {
			queryClient.invalidateQueries({
				queryKey: options.queryKey,
			});
		}
	});
};
export const usePlaylistItemsTvSeriesRealtimeMutation = ({
	playlistId
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const options = usePlaylistTvSeriesItemsOptions({ playlistId });
	return useMutation({
		mutationFn: async ({
			event,
			payload,
		} : {
			event: string;
			payload: {
				old: PlaylistItemTvSeries;
				new: PlaylistItemTvSeries;
			}
		}) => {
			const newPlaylistItems = [...queryClient.getQueryData(options.queryKey) || []];
			if (!newPlaylistItems.length) throw new Error('playlist items is undefined');
			switch (event) {
				case 'INSERT':
					if (payload.new.playlist_id !== playlistId) throw new Error('Invalid playlist id');
					const { error: insertError, data: insertData } = await supabase
						.from('playlist_items_tv_series')
						.select(`*, tv_series:media_tv_series(*)`)
						.eq('id', payload.new.id)
						.single();
					if (insertError) throw insertError;
					newPlaylistItems.forEach(item => {
						if (item.rank >= payload.new.rank) {
							item.rank++;
						}
					});
					newPlaylistItems.push({
						...payload.new,
						tv_series: insertData.tv_series
					});
					break;
				case 'UPDATE':
					if (!payload.new.playlist_id) throw new Error('Invalid playlist id');
					const itemIndex = newPlaylistItems.findIndex((item) => item.id === payload.new.id);
					if (itemIndex === -1) throw new Error('Missing item');

					if (payload.old.rank !== payload.new.rank) {
						if (payload.old.rank < payload.new.rank) {
							newPlaylistItems.forEach(item => {
							if (item.rank > payload.old.rank && item.rank <= payload.new.rank) {
								item.rank--;
							}
							});
						}
						if (payload.old.rank > payload.new.rank) {
							newPlaylistItems.forEach(item => {
							if (item.rank < payload.old.rank && item.rank >= payload.new.rank) {
								item.rank++;
							}
							});
						}
					}
					newPlaylistItems[itemIndex] = {
						...newPlaylistItems[itemIndex],
						...payload.new
					};
					break;
				case 'DELETE':
					if (!payload.old.playlist_id) throw new Error('Invalid playlist id');
					const deleteIndex = newPlaylistItems.findIndex((item) => item.id === payload.old.id);
					if (deleteIndex === -1) throw new Error('Missing item');
					newPlaylistItems.splice(deleteIndex, 1);

					newPlaylistItems.forEach(item => {
						if (item.rank > payload.old.rank) {
							item.rank--;
						}
					});
					break;
				default:
					break;
			};
			newPlaylistItems.sort((a, b) => a.rank - b.rank);
			return newPlaylistItems;
		},
		onSuccess: (newPlaylistItems) => {
			newPlaylistItems && queryClient.setQueryData(options.queryKey, newPlaylistItems);
		},
		onError: (error) => {
			queryClient.invalidateQueries({
				queryKey: options.queryKey,
			});
		}
	});
};

/* ---------------------------------- ITEMS --------------------------------- */
// Movie
export const usePlaylistMovieInsertMutation = ({
	movieId
} : {
	movieId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			playlists,
			movieId,
			userId,
			comment,
		} : {
			playlists: Playlist[];
			movieId: number;
			userId: string;
			comment?: string;
		}) => {
			if (!userId) throw Error('User id is missing');
			if (playlists.length === 0) throw Error('You must select at least one playlist');
			const { data, error } = await supabase
				.from('playlist_items_movie')
				.insert(
					playlists.map((playlist) => ({
						playlist_id: playlist.id,
						movie_id: movieId,
						user_id: userId,
						comment: comment,
						rank: 0,
					}))
				);
			if (error) throw error;
			const updatedPlaylists = playlists.map((playlist) => ({
				...playlist,
				items_count: (playlist?.items_count ?? 0) + 1,
			}));
			return updatedPlaylists; // Normalized cache
		},
		onSuccess: (data) => {
			// queryClient.invalidateQueries({
			// 	queryKey: playlistKeys.detail(data.playlist_id),
			// });

			queryClient.invalidateQueries({
				queryKey: mediaKeys.moviePlaylists({
					movieId: movieId,
				}),
			});

			queryClient.invalidateQueries({
				queryKey: playlistKeys.addTo({ itemId: movieId, type: 'movie' }),
			})
		}
	});
};
export const usePlaylistMovieDeleteMutation = ({
	playlistId
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const playlistDetailsOptions = usePlaylistDetailsOptions({ playlistId: playlistId });
	return useMutation({
		mutationFn: async ({
			itemId,
		} : {
			itemId: number;
		}) => {
			const { data, error } = await supabase
				.from('playlist_items_movie')
				.delete()
				.eq('id', itemId)
				.select('*')
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: playlistKeys.addTo({ itemId: data.id, type: 'movie' }),
			});
			queryClient.invalidateQueries({
				queryKey: mediaKeys.moviePlaylists({
					movieId: data.movie_id,
				}),
			});
			queryClient.setQueryData(playlistDetailsOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					items_count: oldData.items_count - 1,
				}
			});
		},
	});
};
export const usePlaylistMovieUpdateMutation = () => {
	const supabase = useSupabaseClient();
	return useMutation({
		mutationFn: async ({
			itemId,
			rank,
			comment,
		} : {
			itemId: number;
			rank?: number;
			comment?: string;
		}) => {
			const { data, error } = await supabase
				.from('playlist_items_movie')
				.update({
					rank,
					comment,
				})
				.eq('id', itemId)
				.select('*')
				.single();
			if (error) throw error;
			return data;
		},
	});
};
// TV Series
export const usePlaylistTvSeriesInsertMutation = ({
	tvSeriesId
} : {
	tvSeriesId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			playlists,
			tvSeriesId,
			userId,
			comment,
		} : {
			playlists: Playlist[];
			tvSeriesId: number;
			userId: string;
			comment?: string;
		}) => {
			if (!userId) throw Error('User id is missing');
			if (playlists.length === 0) throw Error('You must select at least one playlist');
			const { data, error } = await supabase
				.from('playlist_items_tv_series')
				.insert(
					playlists.map((playlist) => ({
						playlist_id: playlist.id,
						tv_series_id: tvSeriesId,
						user_id: userId,
						comment: comment,
						rank: 0,
					}))
				);
			if (error) throw error;
			const updatedPlaylists = playlists.map((playlist) => ({
				...playlist,
				items_count: (playlist?.items_count ?? 0) + 1,
			}));
			return updatedPlaylists; // Normalized cache
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: mediaKeys.tvSeriesPlaylists({
					tvSeriesId: tvSeriesId,
				}),
			});

			queryClient.invalidateQueries({
				queryKey: playlistKeys.addTo({ itemId: tvSeriesId, type: 'tv_series' }),
			})
		}
	});
};
export const usePlaylistTvSeriesDeleteMutation = ({
	playlistId
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const playlistDetailsOptions = usePlaylistDetailsOptions({ playlistId: playlistId });
	return useMutation({
		mutationFn: async ({
			itemId,
		} : {
			itemId: number;
		}) => {
			const { data, error } = await supabase
				.from('playlist_items_tv_series')
				.delete()
				.eq('id', itemId)
				.select('*')
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: playlistKeys.addTo({ itemId: data.id, type: 'tv_series' }),
			});
			queryClient.invalidateQueries({
				queryKey: mediaKeys.tvSeriesPlaylists({
					tvSeriesId: data.tv_series_id,
				}),
			});
			queryClient.setQueryData(playlistDetailsOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					items_count: oldData.items_count - 1,
				}
			});
		},
	});
};
export const usePlaylistTvSeriesUpdateMutation = () => {
	const supabase = useSupabaseClient();
	return useMutation({
		mutationFn: async ({
			itemId,
			rank,
			comment,
		} : {
			itemId: number;
			rank?: number;
			comment?: string;
		}) => {
			const { data, error } = await supabase
				.from('playlist_items_tv_series')
				.update({
					rank,
					comment,
				})
				.eq('id', itemId)
				.select('*')
				.single();
			if (error) throw error;
			return data;
		},
	});
};

/* -------------------------------------------------------------------------- */
export const usePlaylistMovieMultiInsertMutation = ({
	playlistId,
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const playlistDetailsOptions = usePlaylistDetailsOptions({ playlistId: playlistId });
	return useMutation({
		mutationFn: async ({
			userId,
			movieIds,
			comment,
		} : {
			userId: string;
			movieIds: number[];
			comment?: string;
		}) => {
			if (movieIds.length === 0) throw Error('Missing media ids');
			const { data, error } = await supabase
				.from('playlist_items_movie')
				.insert(
					movieIds.map((movieId) => ({
						playlist_id: playlistId,
						movie_id: movieId,
						user_id: userId,
						comment: comment,
						rank: 0,
					}))
				)
				.select('id');
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(playlistDetailsOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					items_count: oldData.items_count + data.length,
				};
			});
		}
	});
};
export const usePlaylistTvSeriesMultiInsertMutation = ({
	playlistId,
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const playlistDetailsOptions = usePlaylistDetailsOptions({ playlistId: playlistId });
	return useMutation({
		mutationFn: async ({
			userId,
			tvSeriesIds,
			comment,
		} : {
			userId: string;
			tvSeriesIds: number[];
			comment?: string;
		}) => {
			if (tvSeriesIds.length === 0) throw Error('Missing media ids');
			const { data, error } = await supabase
				.from('playlist_items_tv_series')
				.insert(
					tvSeriesIds.map((tvSeriesId) => ({
						playlist_id: playlistId,
						tv_series_id: tvSeriesId,
						user_id: userId,
						comment: comment,
						rank: 0,
					}))
				)
				.select('id');
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(playlistDetailsOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					items_count: oldData.items_count + data.length,
				};
			});
		}
	});
};
/* --------------------------------- GUESTS --------------------------------- */
export const usePlaylistGuestUpdateMutation = ({
	playlistId,
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const playlistGuestsOptions = usePlaylistGuestsOptions({ playlistId });
	return useMutation({
		mutationFn: async ({
			guestId,
			edit,
		} : {
			guestId: number;
			edit: boolean;
		}) => {
			const { data, error } = await supabase
				.from('playlist_guests')
				.update({
					edit,
				})
				.eq('id', guestId)
				.select('*')
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(playlistGuestsOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.map((guest) => {
					if (guest?.id === data.id) {
						return {
							...guest,
							edit: data.edit,
						};
					}
					return guest;
				});
			});
		}
	});
};

export const usePlaylistGuestsDeleteMutation = ({
	playlistId,
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const playlistGuestsOptions = usePlaylistGuestsOptions({ playlistId });
	return useMutation({
		mutationFn: async ({
			ids,
			playlistId,
		} : {
			ids: number[];
			playlistId: number;
		}) => {
			const { data, error } = await supabase
				.from('playlist_guests')
				.delete()
				.in('id', ids)
				.select('id')
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(playlistGuestsOptions.queryKey, (oldData) => {
				if (!oldData) return oldData;
				return oldData.filter((guest) => !data.find((deleted) => deleted.id === guest?.id));
			});
		}
	});
};

export const usePlaylistGuestsInsertMutation = ({
	playlistId,
} : {
	playlistId: number;
}) => {
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const playlistGuestsOptions = usePlaylistGuestsOptions({ playlistId });
	return useMutation({
		mutationFn: async ({
			playlistId,
			userIds,
		} : {
			playlistId: number;
			userIds: string[];
		}) => {
			const { data, error } = await supabase
				.from('playlist_guests')
				.insert(
					userIds.map((userId) => ({
						playlist_id: playlistId,
						user_id: userId,
					}))
				)
				.select(`
					*,
					user:profile(*)
				`)
			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(playlistGuestsOptions.queryKey, (oldData) => {
				if (!oldData) return data;
				return [...oldData, ...data];
			});
		}
	});
};
/* -------------------------------------------------------------------------- */
