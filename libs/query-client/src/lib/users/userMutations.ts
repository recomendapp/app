import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersControllerGetMeQueryKey, usersControllerUpdateMeMutation } from '@packages/api-js';

export const useUserMeUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...usersControllerUpdateMeMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(usersControllerGetMeQueryKey(), data);
		}
	});
};
