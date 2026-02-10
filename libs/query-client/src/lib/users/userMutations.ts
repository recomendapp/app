import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersControllerFollowUserMutation, usersControllerGetMeQueryKey, usersControllerUnfollowUserMutation, usersControllerUpdateMeMutation } from '@packages/api-js';
import { userFollowersOptions, userFollowingOptions, userFollowOptions } from './userOptions';

export const useUserMeUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...usersControllerUpdateMeMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(usersControllerGetMeQueryKey(), data);
		}
	});
};

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