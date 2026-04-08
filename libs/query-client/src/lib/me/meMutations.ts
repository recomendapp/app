import { meAvatarControllerDeleteMutation, meAvatarControllerSetMutation, meControllerUpdateMutation, userPushTokensControllerSetMutation } from '@libs/api-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meOptions } from './meOptions';
import { userByIdOptions, userByUsernameOptions } from '../users';

export const useMeUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...meControllerUpdateMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(meOptions().queryKey, data);
			queryClient.setQueryData(userByIdOptions({ userId: data.id }).queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					name: data.name,
					username: data.username,
					bio: data.bio,
					isPrivate: data.isPrivate,
				};
			});
			queryClient.setQueryData(userByUsernameOptions({ username: data.username }).queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					name: data.name,
					username: data.username,
					bio: data.bio,
					isPrivate: data.isPrivate,
				};
			});
		}
	});
};

export const useMeAvatarUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...meAvatarControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(meOptions().queryKey, data);
			queryClient.setQueryData(userByIdOptions({ userId: data.id }).queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					name: data.name,
					username: data.username,
					bio: data.bio,
					isPrivate: data.isPrivate,
				};
			});
			queryClient.setQueryData(userByUsernameOptions({ username: data.username }).queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					name: data.name,
					username: data.username,
					bio: data.bio,
					isPrivate: data.isPrivate,
				};
			});
		}
	});
};

export const useMeAvatarDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...meAvatarControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(meOptions().queryKey, data);
			queryClient.setQueryData(userByIdOptions({ userId: data.id }).queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					name: data.name,
					username: data.username,
					bio: data.bio,
					isPrivate: data.isPrivate,
				};
			});
			queryClient.setQueryData(userByUsernameOptions({ username: data.username }).queryKey, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					name: data.name,
					username: data.username,
					bio: data.bio,
					isPrivate: data.isPrivate,
				};
			});
		}
	});
};

export const usePushTokenUpdateMutation = () => {
	return useMutation({
		...userPushTokensControllerSetMutation(),		
	});
};
