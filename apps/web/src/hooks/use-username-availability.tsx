import { authClient } from "@/lib/auth/client";
import { useCallback, useState } from "react";

export const useUsernameAvailability = () => {
	const [isAvailable, setIsAvailable] = useState<boolean | undefined>(undefined);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const reset = useCallback(() => {
		setIsAvailable(undefined);
		setIsLoading(false);
	}, []);

	const check = useCallback(async (username: string) => {
		try {
			setIsAvailable(undefined);
			setIsLoading(true);
			const { data, error } = await authClient.isUsernameAvailable({
				username,
			});
			if (error) throw error;
			if (!data) throw new Error('Invalid response from server');
			setIsAvailable(data.available);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	return { isAvailable, reset, isLoading, check };	
};